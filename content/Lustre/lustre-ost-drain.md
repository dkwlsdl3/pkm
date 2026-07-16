---
tags:
  - tech
created: 2026-07-06 (월)
---

# Lustre OST 드레인 (제거 전 데이터 비우기)

> **TL;DR**: OST를 클러스터에서 빼려면 먼저 **드레인**해야 한다. ①MDS에서 그 OST를 비활성화(신규 쓰기 차단) → ②클라이언트에서 기존 데이터를 다른 OST로 이주(`lfs migrate`) → ③비었는지 검증. 비활성화를 먼저 하면 migrate가 알아서 그 OST를 피해 재배치한다.

---

## 개요

- **무엇인가**: 특정 OST(Object Storage Target)를 안전하게 제거 가능한 상태로 만드는 절차
- **왜 쓰는가**: OST를 그냥 제거하면 그 위에 스트라이프된 파일 조각이 사라져 파일이 깨진다. 데이터를 살아있는 다른 OST로 옮긴 뒤 제거해야 한다
- **언제 쓰는가**: OSS 노드 축소/교체, 용량 재분배, 고장 OST 은퇴

---

## 핵심 개념

### 3단계

**1. 비활성화 (MDS에서)** — 신규 파일 할당이 이 OST를 피하게 한다.
```bash
# MDS에서 실행. index는 4자리 0패딩(OST0002)
lctl set_param osp.<fsname>-OST<idx4>-osc-MDT0000.active=0
# 되돌리기(재활성화)
lctl set_param osp.<fsname>-OST<idx4>-osc-MDT0000.active=1
# 파라미터 경로 실존 확인
lctl get_param -N osp.*.active
```
- 이건 **런타임 설정**이라 재부팅 시 리셋된다. 임시 드레인 목적엔 오히려 안전(문제 생기면 remount로 원복). 영구 제거는 MGS의 `conf_param`을 별도로 쓴다.

**2. 데이터 이주 (클라이언트 마운트에서)**
```bash
# 이 OST에 조각이 있는 파일 찾기
lfs find /mnt/lustre --ost <fsname>-OST<idx>_UUID
# 각 파일을 재배치(스트라이프 다시 할당 → 비활성 OST는 자동 제외)
lfs migrate <file>
```

**3. 비움 검증**
```bash
lfs find /mnt/lustre --ost <fsname>-OST<idx>_UUID   # 0건이면 완료
```

### 왜 deactivate가 먼저인가 (핵심)
`lfs migrate`는 파일을 새 스트라이프로 다시 쓰는데, **MDS에서 해당 OST가 active=0이면 새 할당 대상에서 빠진다.** 그래서 목적지 OST를 명시하지 않아도 migrate가 자동으로 비활성 OST를 피해 살아있는 OST로만 재배치한다. deactivate를 건너뛰고 migrate하면 방금 옮긴 데이터가 다시 그 OST로 돌아올 수 있다.

### 자동화 시 주의
- migrate는 **열려있는 파일**이나 이미 다른 OST에만 있는 파일에서 스킵/실패할 수 있다 → 개별 실패는 로그만 남기고 계속, **최종 비움 검증에서만 성공/실패 판정**.
- deactivate 성공 후 이후 단계가 실패하면 **반드시 reactivate로 원복**(안 그러면 그 OST가 쓰기 불가인 채 방치).
- migrate/find는 파일 소유자 권한이 필요 — 자동화 데몬은 적절한 권한(또는 sudo 화이트리스트)으로 실행돼야 전체 트리를 순회한다.

### 영구 제거와 등록 이력

Lustre에서 OST 축소는 일반 데이터베이스 행 삭제처럼 "이름을 완전히 없애는 작업"이 아니다. 운영상 안전한 기본값은 다음과 같다.

1. 데이터를 다른 OST로 드레인한다.
2. MGS `conf_param`으로 대상 OST를 영구 비활성화한다.
3. OST 등록 이력과 사용한 인덱스는 유지한다.
4. 새 OST 생성 시 현재 인벤토리뿐 아니라 과거 등록 이력까지 합쳐 다음 인덱스를 선택한다.

`writeconf`는 전체 설정 로그를 다시 쓰는 고위험 유지보수 작업이지, 실행 중인 파일시스템에서 OST 하나를 간단히 삭제하는 API가 아니다. 비활성 엔트리를 완전히 제거하려고 전체 파일시스템을 중단하는 것보다, 비활성 상태를 정상 운영 상태로 취급하는 편이 안전하다.

등록 이력 소스를 자동화할 때는 클라이언트의 OSC 목록만 믿으면 안 된다. 클라이언트 전파가 늦으면 방금 사용한 인덱스가 아직 보이지 않아 재사용할 수 있다. 생성 직후에도 일관된 MGS 설정 로그를 기준으로 확인하고, 조회 실패 시에는 새 OST 생성을 중단하는 fail-closed가 적합하다.

---

## 코드 / 사용 예시

```text
드레인 오케스트레이션(비동기 작업):
  deactivate(MDS) → lfs find(대상 수집) → lfs migrate 루프(진행률) → 비움검증 → 완료
  실패 시: reactivate(MDS) → 실패 마감
```

---

## 주의사항

> [!WARNING]
> 드레인이 끝난 OST는 active=0 상태로 남는다(그게 "제거 준비 완료"의 정상 상태). 재사용하려면 reactivate해야 한다. 클러스터를 테스트로 드레인했다면 반드시 재활성화해 원복할 것.

---

## 관련

- [[lustre-overview]]
- [[lustre-node-topology]] — 스케일아웃/축소 시 논리 노드 구성
- [[lustre-troubleshooting]] — 마운트·부팅 레이스

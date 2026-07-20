---
title: Lustre OST failover 노드 사후 주입 (servicenode)
tags:
  - tech
  - lustre
  - ha
created: 2026-07-20 (월)
---

# Lustre OST failover 노드 사후 주입 (servicenode)

> 초기 `mkfs.lustre`에 HA(failover)가 안 들어간 타겟에 **데이터 손실 없이** failover 노드를 사후 주입하는 표준 패턴.

---

## 배경

- Lustre의 OST/MDT는 `failover.node`(= servicenode) 파라미터로 "이 타겟을 인수할 수 있는 백업 서버 NID"를 갖는다.
- 초기 포맷 시 `--servicenode`를 안 주면 HA가 아니라 단일 서버 전용으로 만들어진다. 많은 설치 자동화 도구가 기본을 이렇게 만든다.
- 이미 데이터가 들어간 타겟에도 **재포맷 없이** servicenode를 주입할 수 있다 → `tunefs.lustre`.

## 주입 절차

```bash
# 타겟(OST/MDT) 언마운트 상태에서 수행
# 주 서버 NID + 백업 서버 NID 둘 다 --servicenode로 지정
tunefs.lustre \
  --servicenode=<primary_nid> \
  --servicenode=<backup_nid> \
  --writeconf /dev/<target_dev>

# 검증: failover.node가 2개 찍혔는지 확인
tunefs.lustre --dryrun /dev/<target_dev> | grep -i Parameters
```

- `--writeconf`는 config log를 재생성한다. **파일시스템 전체 타겟에 일관되게** 적용해야 하며(MGS부터), 클라이언트는 재마운트해야 새 config를 받는다.
- `--dryrun`은 아무것도 쓰지 않고 현재 파라미터만 덤프 → 주입 전/후 비교에 사용.
- 개조 자체는 보통 수십 분 이내. 데이터 블록은 건드리지 않아 무손실.

## failover 드릴 (검증)

1. 주 서버(또는 그 VM) 강제 종료로 급작 장애 시뮬레이션.
2. 클라이언트 I/O가 실패 0으로 견디는지 관찰(Lustre 클라이언트는 타임아웃 후 백업으로 재연결).
3. 백업 서버에서 타겟을 마운트해 인수 → 클라이언트 I/O 재개.
4. 무손실 + 복구 시간(수 분) 측정.

## 함정 / 주의

- **servicenode ≠ 자동 failover.** Lustre 레벨에서 "인수 가능"하게만 만든다. 실제 자동 마운트 전환은 별도 HA 리소스 매니저(Pacemaker 등)나 수동 절차가 필요하다. 앱/도구 레벨 자동 failover가 없다면 "절차 기반 시연"으로 정직하게 소구할 것.
- 논리 노드(역할 VM)를 죽이는 시연은 물리 이중화가 아니다. 진짜 물리 2대 HA는 두 서버가 같은 타겟 디스크를 볼 수 있는 **공유 스토리지**가 전제. → [[lustre-node-topology]]

## 관련

- [[lustre-server-setup]] — 초기 포맷(mkfs.lustre) 시점의 servicenode 지정
- [[lustre-troubleshooting]] — writeconf 후 재마운트·config log 이슈
- [[lustre-node-topology]] — 스케일아웃(용량) vs HA(이중화), 공유 스토리지 전제

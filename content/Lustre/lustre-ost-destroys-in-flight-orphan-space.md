---
title: 파일은 0 개인데 OST 용량이 남는다 — destroy 큐 정체
tags:
  - tech
  - troubleshooting
created: 2026-08-24 (월)
---

# 파일은 0 개인데 OST 용량이 남는다 — destroy 큐 정체

> **TL;DR**: Lustre 에서 파일을 지우면 MDT 가 이름을 지우고 OST 의 객체 삭제는 **비동기 RPC(destroy)** 로 보낸다. 이 큐가 막히면 `lfs find --ost N` 이 0 건이어도 OST 에 객체와 용량이 남는다. MDT 의 `osp.*.destroys_in_flight` 가 시간이 지나도 줄지 않으면 정체다. `force_sync` 가 `ETIMEDOUT` 이면 큐가 실제로 막힌 것이고, 그 OST 는 비우고 재생성하는 편이 빠르다.

## 용어

| 표기 | 원어 | 뜻 |
|---|---|---|
| MDT | Metadata Target | 파일 이름·디렉터리·어느 OST 에 조각이 있는지를 저장하는 Lustre 메타데이터 저장 단위 |
| OST | Object Storage Target | 실제 파일 데이터(객체)가 저장되는 Lustre 저장 단위 |
| OSP | Object Storage Proxy | MDT 안에서 각 OST 를 대리하는 장치. MDT→OST 방향 RPC(객체 생성·삭제)를 여기서 관리한다 |
| RPC | Remote Procedure Call | 노드 간 요청. destroy RPC = "이 객체를 지워라" |
| unlink | — | 파일 이름을 지우는 시스템 호출. Lustre 에서는 이름 삭제와 데이터 삭제가 분리된다 |

## 증상

- 클라이언트에서 보이는 파일 0 개, `lfs find --ost <idx> /mnt` 0 건
- 그런데 `lfs df` 에서 그 OST 만 수십 GB 사용 중, 객체 수가 다른 OST 의 **수백 배**(실측 92,432 vs 298~412)
- MDT 의 `destroys_in_flight` 가 며칠 사이 오히려 늘었다(38,317 → 83,934)

## 원인

Lustre 의 삭제는 두 단계다. ① MDT 가 이름을 지우고 응답한다(클라이언트는 여기서 끝난 것으로 본다) ② MDT 의 OSP 가 OST 에 destroy RPC 를 보내 객체를 지운다. ②가 밀리면 "이름은 없는데 객체는 있는" 상태가 쌓인다. 벤치마크처럼 **대량 생성·삭제를 반복**하면 큐가 처리량을 못 따라가고, OST 재시작·네트워크 단절이 겹치면 정체된다.

## 해결

```bash
# MDT 에서 — 어느 OSP 의 큐가 쌓였나
lctl get_param osp.*.destroys_in_flight
lctl get_param osp.*.sync_in_flight osp.*.sync_changes

# 강제 동기화 시도 (쓰기 전용 파라미터 — 값을 쓰면 트리거된다)
lctl set_param osp.<fsname>-OST000c-osc-MDT0000.force_sync=1
#   → 잠시 뒤 destroys_in_flight 가 줄면 회복 중.
#   → ETIMEDOUT 이면 큐가 실제로 막혔다. 기다려도 안 풀린다.

# 막혔고 그 OST 에 살아 있는 파일이 없다면 — 비우고 재생성이 빠르다
lfs find --ost <idx> /mnt | head      # 0 건 재확인
#   OST 비활성 → 제거 → 새 인덱스로 재생성 (인덱스는 영구 보존되므로 재사용 불가)
#   재생성 후 작은 파일 쓰기/읽기/삭제로 정상 확인
```

- **판정 순서**: 파일 존재 여부(`lfs find`) → 객체 수·용량(`lfs df`, OST 측 통계) → MDT `destroys_in_flight` 추이 → `force_sync` 반응. 앞 단계만 보고 "용량 계산 버그" 로 오판하기 쉽다.
- OST 를 새로 만들면 **인덱스가 영구 보존**된다(비활성 인덱스가 목록에 남는다) — [[lustre-ost-permanent-removal]].
- 큐 정체를 만든 부하(대량 생성·삭제 벤치)를 다시 돌리기 전에 `destroys_in_flight` 기준선을 적어 둔다. 늘어나는지 보는 것이 가장 빠른 조기 경보다.

---

## 관련

- [[lustre-ost-drain]] — OST 비우기 절차
- [[lustre-ost-permanent-removal]] — OST 영구 제거와 인덱스 재사용 불가
- [[lustre-performance-metrics]] — proc/sysfs 지표 위치
- [[lustre-troubleshooting]] — 이슈 인덱스
- [[lustre-overview]]

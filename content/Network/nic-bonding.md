---
title: NIC 본딩 — active-backup vs LACP
tags:
  - tech
created: 2026-06-12 (금)
---

# NIC 본딩 — active-backup vs LACP

> **TL;DR**: 랜선 2개를 그냥 꽂으면 아무 효과 없다. 본딩 설정이 필요하고, 모드에 따라 "장애 대비"인지 "대역폭 합산"인지가 갈린다.

---

## 개요

- **무엇인가**: NIC 여러 포트를 하나의 논리 인터페이스로 묶는 것 (Linux bonding / NetworkManager team)
- **왜 쓰는가**: 링크 장애 대비(이중화) 또는 합산 처리량 확보
- **언제 쓰는가**: 서버에 RJ45 포트가 2개 이상이고 스위치 포트에 여유가 있을 때

---

## 핵심 개념

### active-backup (mode 1)

- 한 포트만 활성, 나머지는 대기 → 활성 링크가 죽으면 자동 전환
- **스위치 설정 불필요** — 아무 스위치에서나 동작
- 대역폭은 그대로 1포트분

### LACP / 802.3ad (mode 4)

- 두 포트를 동시에 사용해 **합산 대역폭** 확보
- **스위치에 LAG(Link Aggregation) 설정 필수** — 관리형 스위치만 가능
- 함정: 해시 분배 방식이라 **단일 TCP 연결(플로우)은 여전히 1포트 속도가 상한**. 1G×2 LACP에서 단일 파일 전송은 1G. 클라이언트/연결이 여러 개일 때만 합산 효과

---

## 사용 예시

```bash
# NetworkManager로 active-backup 본딩
nmcli con add type bond ifname bond0 bond.options "mode=active-backup,miimon=100"
nmcli con add type ethernet ifname enp5s0f0 master bond0
nmcli con add type ethernet ifname enp5s0f1 master bond0
```

---

## 주의사항

> [!WARNING]
> 본딩 없이 두 포트에 각각 IP를 주면 비대칭 라우팅 등 오히려 문제가 생길 수 있다. 단일 용도 서버는 1포트로 충분한지 먼저 판단할 것.

---

## 관련

- [[network-overview]]
- [[link-layer-debugging]]

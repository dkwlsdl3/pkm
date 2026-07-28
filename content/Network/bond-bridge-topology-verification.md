---
title: 본딩/브리지 토폴로지는 문서가 아니라 실측이 정본
tags:
  - tech
  - troubleshooting
  - network
created: 2026-07-29 (수)
---

# 본딩/브리지 토폴로지는 문서가 아니라 실측이 정본

> **TL;DR**: "bond0 → 브리지 → 스토리지망"처럼 문서에 적힌 토폴로지는 계획일 뿐, 실제 구성과 다를 수 있다. 4종 명령으로 교차 확인하고 어긋나면 **문서를 정정**한다. 토폴로지를 잘못 알면 위험 모델(무엇이 끊기는가)이 통째로 틀린다.

## 증상

설계 근거로 쓰던 운영 노트에 "물리 NIC 4개 → 본딩 → 브리지, 스토리지망 IP와 관리 IP가 모두 그 브리지 위"라고 적혀 있었으나, 실측 결과:

- 본딩 인터페이스는 **standalone** — 브리지 멤버가 아니고, 관리/외부망 IP와 default route를 직접 갖고 있음
- 브리지는 스토리지망 전용 **내부 브리지**로, 멤버가 **VM tap 인터페이스뿐 물리 uplink 없음**
- BMC(iDRAC 등)는 공유 포트가 아니라 **dedicated OOB 포트**

## 원인

문서는 "그렇게 하려고 했던 구성"이 남고, 실제 장비는 이후 재구성·롤백을 거치며 갈라진다. 계획서·설계문서·과거 운영노트는 **정본이 아니다**.

## 해결

토폴로지 4종 교차 확인 — 하나만 보면 오해한다.

```bash
# 1) 주소·상태: 어느 인터페이스가 IP와 default route를 갖나
ip -br link
ip -br addr
ip route show default

# 2) 본딩 실체: 모드(802.3ad/active-backup)와 실제 슬레이브 목록
cat /proc/net/bonding/bond0

# 3) 브리지 멤버: 물리 uplink가 있나, VM tap(vnetN)뿐인가
ls /sys/class/net/<bridge>/brif
bridge link show

# 4) 상위 스택이 어느 인터페이스에 붙어 있나 (예: Lustre LNet)
lnetctl net show
nmcli con show          # NetworkManager가 관리하는 논리 구성과 대조
```

**해석 규칙**

- IP·default route가 붙은 인터페이스 = **끊기면 관리/SSH가 죽는** 대상
- 물리 uplink 없는 내부 브리지 = 호스트 밖으로 나가지 않음 → 물리 NIC 변경으로는 직접 끊기지 않는다
- 보호 대상은 "물리 NIC"이 아니라 **실제로 트래픽이 지나는 경로 전체**(브리지 + tap + 상위 스택 NI)로 재정의해야 한다

> [!WARNING]
> 단일노드·데모 장비 실측 결과를 멀티호스트 실배포 구성으로 일반화하지 말 것. 실측 기록에는 **어느 장비·어느 시점 한정인지**를 함께 남기고, 실배포 전 재검증 항목으로 표시한다.

---

## 관련

- [[nic-bonding]] — active-backup vs LACP 모드 차이
- [[link-layer-debugging]] — 안 될 때의 L1→L2→L3 단계 진단
- [[network-bridge]] — 가상 브리지 구성
- [[network-overview]]

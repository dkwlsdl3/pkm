---
title: ZFS RAID-Z 레벨
tags:
  - tech
  - storage
  - zfs
created: 2026-05-18 (월)
---

# ZFS RAID-Z 레벨

> **TL;DR**: RAID-Z1/Z2/Z3은 패리티 디스크 개수만 다른 ZFS 소프트웨어 RAID다. 운영 환경에서는 RAID-Z2를 권장한다.

---

## 레벨 비교

| 레벨 | 패리티 | 최소 디스크 | 특징 |
|------|--------|------------|------|
| RAID-Z1 | 1 | 3 | 디스크 1개 장애 허용 |
| RAID-Z2 | 2 | 4 | 디스크 2개 장애 허용 — 운영 권장 |
| RAID-Z3 | 3 | 5 | 디스크 3개 장애 허용 |

RAID-Z는 ZFS가 소프트웨어로 패리티를 계산하는 방식이므로, 하드웨어 RAID 컨트롤러를 거치지 않고 디스크를 직접 제어해야 정상 동작한다. 자세한 이유는 [[zfs-hba-vs-hwraid]] 참고.

---

## 관련

- [[zfs]]
- [[zfs-hba-vs-hwraid]]

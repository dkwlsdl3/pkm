---
title: ZFS ARC 캐시 착시와 Direct IO 측정
tags:
  - tech
created: 2026-06-18 (목)
---

# ZFS ARC 캐시 착시와 Direct IO 측정

> **TL;DR**: ZFS ARC 때문에 read가 디스크가 아닌 메모리 성능으로 보이는 착시와, ZFS 2.2+ Direct IO로 이를 분리 측정하는 법.

---

## ARC 캐시 착시

- ZFS ARC = RAM 캐시. **측정 데이터셋이 ARC보다 작으면 read가 메모리 성능으로 나옴**
- 예: ARC 최대 **31GB**인 환경에서 `FIO_SIZE=4G` → 통째로 캐시 → read 대역폭이 디스크가 아닌 메모리 속도로 착시
- 차단법(안전순): **데이터셋을 ARC보다 크게** (예: 16G/job × 4 = 64G > 31G) > direct=1 > cold/warm 분리
- **ARC 강제 flush는 금지** — drop_caches처럼 안전한 표준이 없고, 31GB evict는 운영 영향

## Direct IO (ZFS 2.2+)

- OpenZFS **2.2부터 O_DIRECT 정식 지원** → `direct=1`이 실제로 ARC 우회
- `direct=0`(buffered)은 ARC 경유 → 둘을 분리 측정해 캐시 영향 해석

## 확인 명령

```bash
# ARC 상태 (read가 ARC에서 처리되는지)
arcstat 1
awk '/^(size|c_max|hits|misses)/' /proc/spl/kstat/zfs/arcstats
```

---

## 주의사항

> [!WARNING]
> - read가 너무 빠르면 디스크가 아니라 ARC일 수 있다 — 반드시 arcstat 병행.
> - ARC를 강제로 비우거나 튜닝하지 말 것(운영 영향). 데이터셋 크기·direct·cold/warm으로 해석.

---

## 관련

- [[zfs-arc-and-lustre-overhead]] — ZFS ARC 캐시 착시와 Lustre+ZFS 계층 오버헤드(원본)
- [[zfs-overview]] — ZFS 개요(COW·snapshot·RAID-Z)

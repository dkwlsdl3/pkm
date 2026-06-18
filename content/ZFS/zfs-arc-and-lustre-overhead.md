---
tags:
  - tech
created: 2026-06-18 (목)
---

# ZFS ARC 캐시 착시와 Lustre+ZFS 계층 오버헤드

> **TL;DR**: ZFS ARC 때문에 read가 디스크가 아닌 메모리 성능으로 보이는 착시, 그리고 Lustre+VM+zvol+ZFS+HDD 다층 스택의 오버헤드·tail latency.

---

## 개요

- **무엇인가**: ZFS를 Lustre OSD 백엔드로 쓸 때의 캐시 착시·계층 오버헤드 해석법
- **왜 쓰는가**: read 대역폭이 비정상적으로 높거나 tail latency가 튈 때 원인을 ZFS/계층으로 귀속하기 위함
- **언제 쓰는가**: ZFS 위 zvol → VM → Lustre OST 구조의 성능 측정·해석

---

## 핵심 개념

### 1. ARC 캐시 착시
- ZFS ARC = RAM 캐시. **측정 데이터셋이 ARC보다 작으면 read가 메모리 성능으로 나옴**
- 예: R740 ARC 최대 **31GB**인데 `FIO_SIZE=4G` → 통째로 캐시 → read 1~2GB/s 착시
- 차단법(안전순): **데이터셋을 ARC보다 크게** (예: 16G/job × 4 = 64G > 31G) > direct=1 > cold/warm 분리
- **ARC 강제 flush는 금지** — drop_caches처럼 안전한 표준이 없고, 31GB evict는 운영 영향

### 2. Direct IO (ZFS 2.2+)
- OpenZFS **2.2부터 O_DIRECT 정식 지원** → `direct=1`이 실제로 ARC 우회
- `direct=0`(buffered)은 ARC 경유 → 둘을 분리 측정해 캐시 영향 해석

### 3. 다층 스택 오버헤드
```
Lustre client → LNet → OSS VM → virtio → /dev/zvol/ostN → ZFS raidz1 → PERC → HDD
                                          (+ VM 안에서 zvol을 또 OST로 포맷 = COW 한 겹 더)
```
- zvol 자체가 ZFS COW인데 그 위 VM이 또 파일시스템 → **COW/저널 이중** 가능 → tail latency 구조적 후보

### 4. ZFS sync write 약점
- ZFS는 동기 쓰기(sync/O_DIRECT)에서 트랜잭션 커밋이 느림 → `direct=1` + HDD random + raidz = worst-case (max latency 폭발)
- 강점은 buffered·large I/O. 워크로드를 ZFS 강점에 맞춰야 함

---

## 코드 / 사용 예시

```bash
# ARC 상태 (read가 ARC에서 처리되는지)
arcstat 1
awk '/^(size|c_max|hits|misses)/' /proc/spl/kstat/zfs/arcstats

# vdev 단위 실제 디스크 I/O (tail 터질 때 디스크도 바쁜지)
zpool iostat -v 1
```

---

## 주의사항

> [!WARNING]
> - read가 너무 빠르면 디스크가 아니라 ARC일 수 있다 — 반드시 arcstat 병행.
> - ARC를 강제로 비우거나 튜닝하지 말 것(운영 영향). 데이터셋 크기·direct·cold/warm으로 해석.
> - mixed/random이 나빠도 "Lustre 탓"이 아니라 HDD raidz + ZFS + zvol + VM 복합 결과.

---

## 관련

- [[zfs-overview]] — ZFS 개요(COW·snapshot·RAID-Z)
- [[lustre-single-node-benchmark]] — 단일노드 Lustre 벤치 방법론
- [[storage-performance-testing]] — 성능테스트 지표·정직성

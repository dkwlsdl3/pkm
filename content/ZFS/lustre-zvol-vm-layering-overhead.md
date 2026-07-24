---
title: Lustre+zvol+VM 다층 스택 오버헤드
tags:
  - tech
created: 2026-06-18 (목)
---

# Lustre+zvol+VM 다층 스택 오버헤드

> **TL;DR**: Lustre client → OSS VM → zvol → ZFS → HBA → HDD로 이어지는 다층 스택은 COW·저널이 이중으로 겹쳐 tail latency의 구조적 원인이 된다.

---

## 다층 스택 구조

```
Lustre client → LNet → OSS VM → virtio → /dev/zvol/ostN → ZFS raidz1 → RAID 컨트롤러(HBA) → HDD
                                          (+ VM 안에서 zvol을 또 OST로 포맷 = COW 한 겹 더)
```

- zvol 자체가 ZFS COW인데 그 위 VM이 또 파일시스템 → **COW/저널 이중** 가능 → tail latency 구조적 후보

## 확인 명령

```bash
# vdev 단위 실제 디스크 I/O (tail 터질 때 디스크도 바쁜지)
zpool iostat -v 1
```

---

## 주의사항

> [!WARNING]
> - mixed/random이 나빠도 "Lustre 탓"이 아니라 HDD raidz + ZFS + zvol + VM 복합 결과.

---

## 관련

- [[zfs-arc-and-lustre-overhead]] — ZFS ARC 캐시 착시와 Lustre+ZFS 계층 오버헤드(원본)
- [[zfs-overview]] — ZFS 개요(COW·snapshot·RAID-Z)
- [[lustre-single-node-benchmark]] — 단일노드 Lustre 벤치 방법론

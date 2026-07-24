---
title: ZFS Sync Write 성능 약점
tags:
  - tech
created: 2026-06-18 (목)
---

# ZFS Sync Write 성능 약점

> **TL;DR**: ZFS는 동기 쓰기(sync/O_DIRECT)의 트랜잭션 커밋이 느려 direct+HDD random+raidz 조합이 worst-case가 된다. buffered·large I/O에 워크로드를 맞춰야 강점을 살릴 수 있다.

---

## Sync Write 약점

- ZFS는 동기 쓰기(sync/O_DIRECT)에서 트랜잭션 커밋이 느림 → `direct=1` + HDD random + raidz = worst-case (max latency 폭발)
- 강점은 buffered·large I/O. 워크로드를 ZFS 강점에 맞춰야 함

---

## 관련

- [[zfs-arc-and-lustre-overhead]] — ZFS ARC 캐시 착시와 Lustre+ZFS 계층 오버헤드(원본)
- [[zfs-overview]] — ZFS 개요(COW·snapshot·RAID-Z)

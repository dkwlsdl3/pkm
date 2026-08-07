---
title: ZFS Sync Write 성능 약점
tags:
  - tech
created: 2026-06-18 (목)
---

# ZFS Sync Write 성능 약점

> **TL;DR**: ZFS는 동기 쓰기(sync/O_DIRECT)의 트랜잭션 커밋이 느려 direct+HDD random+raidz 조합이 worst-case가 된다. buffered·large I/O에 워크로드를 맞춰야 강점을 살릴 수 있다.

---

## 용어

- **동기 쓰기(sync write)**: 디스크에 실제로 기록됐다는 확인을 받고서야 완료로 처리하는 쓰기. 반대는 buffered write로, 메모리에 담아두고 먼저 완료로 응답한다.
- **`O_DIRECT`**: 페이지 캐시를 우회해 디스크에 직접 읽고 쓰라는 파일 열기 옵션. fio에서는 `direct=1`로 켠다.
- **raidz**: RAID-Z. ZFS가 소프트웨어로 패리티를 계산하는 방식 → [[zfs-raidz-levels]]

## Sync Write 약점

- ZFS는 동기 쓰기(sync/O_DIRECT)에서 트랜잭션 커밋이 느림 → `direct=1` + HDD random + raidz = worst-case (max latency 폭발)
- 강점은 buffered·large I/O. 워크로드를 ZFS 강점에 맞춰야 함

---

## 관련

- [[zfs-arc-and-lustre-overhead]] — ZFS ARC 캐시 착시와 Lustre+ZFS 계층 오버헤드(원본)
- [[zfs-overview]] — ZFS 개요(COW·snapshot·RAID-Z)

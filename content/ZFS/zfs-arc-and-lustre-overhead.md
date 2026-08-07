---
title: ZFS ARC 캐시 착시와 Lustre+ZFS 계층 오버헤드
tags:
  - tech
created: 2026-06-18 (목)
---

# ZFS ARC 캐시 착시와 Lustre+ZFS 계층 오버헤드

> **TL;DR**: ZFS ARC(Adaptive Replacement Cache, 메모리 읽기 캐시) 때문에 read가 디스크가 아닌 메모리 성능으로 보이는 착시, 그리고 Lustre+VM+zvol(ZFS가 블록 장치로 노출하는 볼륨)+ZFS+HDD 다층 스택의 오버헤드·tail latency(꼬리 지연).

> 약어는 [[zfs-overview]]·[[lustre-overview]]의 용어 표 참고.

---

## 개요

- **무엇인가**: ZFS를 Lustre OSD(Object Storage Device, OST 아래에서 실제 파일시스템에 쓰는 백엔드 계층) 백엔드로 쓸 때의 캐시 착시·계층 오버헤드 해석법
- **왜 쓰는가**: read 대역폭이 비정상적으로 높거나 tail latency가 튈 때 원인을 ZFS/계층으로 귀속하기 위함
- **언제 쓰는가**: ZFS 위 zvol → VM → Lustre OST 구조의 성능 측정·해석

---

## 핵심 개념

이 주제는 세 갈래로 나뉘어 각각 별도 노트에 정리했다.

### 1. ARC 캐시 착시 · Direct IO
ARC 캐시로 인해 read가 디스크가 아닌 메모리 성능으로 보이는 착시와, ZFS 2.2+ Direct IO로 이를 분리 측정하는 법 → [[zfs-arc-cache-illusion]]

### 2. 다층 스택 오버헤드
Lustre client → OSS VM → zvol → ZFS → HBA → HDD로 이어지는 다층 스택의 COW/저널 이중과 tail latency → [[lustre-zvol-vm-layering-overhead]]

### 3. ZFS sync write 약점
동기 쓰기(sync/O_DIRECT)에서 트랜잭션 커밋이 느려 direct+HDD random+raidz가 worst-case가 되는 이유 → [[zfs-sync-write-weakness]]

---

## 관련

- [[zfs-arc-cache-illusion]] — ARC 캐시 착시와 Direct IO 측정
- [[lustre-zvol-vm-layering-overhead]] — Lustre+zvol+VM 다층 스택 오버헤드
- [[zfs-sync-write-weakness]] — ZFS sync write 성능 약점
- [[zfs-overview]] — ZFS 개요(COW·snapshot·RAID-Z)
- [[lustre-single-node-benchmark]] — 단일노드 Lustre 벤치 방법론
- [[storage-performance-testing]] — 성능테스트 지표·정직성

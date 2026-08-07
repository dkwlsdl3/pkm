---
title: VM 기반 Lustre HA (Pacemaker VirtualDomain)
tags:
  - lustre
  - ha
  - drbd
  - zfs
created: 2026-07-24 (금)
---

# VM 기반 Lustre HA (Pacemaker VirtualDomain)

> **TL;DR**: Lustre 타깃을 VM 안에 두고 VM 백킹디스크를 호스트 DRBD로 복제, 호스트 Pacemaker가 `ocf:heartbeat:VirtualDomain`으로 VM 자체를 failover하는 변형 구성.

Lustre 타깃을 베어메탈에 직접 두는 대신 **VM 안에 두고, VM 백킹디스크를 호스트 DRBD로 복제**하는 구성. 호스트 Pacemaker가 `ocf:heartbeat:VirtualDomain`으로 VM을 failover.
```
호스트 raw ─DRBD─▶ 상대 호스트 → /dev/drbdX 를 VM에 virtio 디스크로 제시
   → VM 내부: 그 디스크에 OSD(ldiskfs/zfs) → Lustre 타깃
[Pacemaker(호스트)] DRBD promotable(Master=Primary) → VirtualDomain, colocation+order
```
- **급소: VM 백킹 "전체"를 복제해야 한다.** OST 데이터디스크만 DRBD하고 **VM OS 루트디스크를 로컬(비복제)로 두면 상대 호스트에서 VM이 못 뜬다 = failover 실패.** OS 루트도 DRBD(또는 공유스토리지)에 둘 것. (클론 VM은 디스크 파일명 충돌도 주의.)
- **single-primary DRBD는 라이브 마이그레이션 불가**(양쪽 동시 Primary 필요) → VirtualDomain `allow-migrate=false`, 장애 시 **cold stop/start 재배치**. 자동 failover도 0초 아님.
- **실행 중인 DRBD/VM을 무중단으로 Pacemaker에 인수(adopt)**: 리소스를 `target-role=Stopped`로 만들고 colocation/order 제약을 건 뒤 `enable` → 오배치(엉뚱 노드 start) 방지하며 현 상태 채택. (단, RA start가 실패하면 [[selinux-confined-daemon-ocf-ra]] 의심.)
- 재부팅 후 **DRBD 커널모듈 자동로드**(modules-load.d) 안 하면 Pacemaker가 "not installed"로 본다.
- **펜싱은 반드시 실검증**(`pcs stonith fence <peer>`): status=ON은 검증 아님. 실검증이 "이중화했지만 실제론 안 뜨는" 구멍을 드러낸다.

## 관련
- [[lustre-ha-drbd-zfs]]

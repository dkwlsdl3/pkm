---
title: 공유스토리지 없는 2노드 Lustre HA (DRBD + ZFS OSD)
tags:
  - lustre
  - ha
  - drbd
  - zfs
---

# 공유스토리지 없는 2노드 Lustre HA (DRBD + ZFS OSD)

Lustre HA 정석은 **공유 스토리지**(SAN/dual-port SAS/JBOD)에 두 서버가 접근하고 Pacemaker가 타깃을 failover하는 것이다. 공유 스토리지가 없는 2노드에서는 **DRBD 블록 복제**로 "공유 디스크"를 흉내 내야 한다.

## 계층
```
raw 디스크/파티션 ─DRBD(protocol C, 노드간 복제)─▶ 반대 노드
        └ /dev/drbdX 위에 zpool(단일 vdev) → lustre-osd-zfs (MGT/MDT/OST)
```
- DRBD는 **single-primary**: 리소스별로 한 노드만 Primary. active/active는 "리소스마다 Primary가 다른" 구성(예: MDT+OST0 노드A, OST1 노드B)이지 dual-primary가 아니다.
- Primary 쪽에서만 zpool import + Lustre mount. Pacemaker가 강제.
- `mkfs.lustre --servicenode=<A@tcp>,<B@tcp>` 로 양 NID 등록 → failover 시 클라 재접속.

## OSD 백엔드: ldiskfs vs ZFS
- **ldiskfs**: 벤더 **패치커널** 필요(+ kernel-modules + initramfs 드라이버). 계층 단순(2계층)하나 커널 마찰 큼 → [[el-kernel-swap-safety]].
- **ZFS OSD**: **patchless**(stock 커널). 프리빌트 `kmod-lustre-osd-zfs`는 빌드된 zfs 버전에 락(ksym 불일치로 로드 실패) → **`lustre-zfs-dkms`로 설치된 zfs 버전에 DKMS 빌드**하면 임의 zfs에 맞춰 osd_zfs 생성. ZFS 스택을 이미 쓰면 정합.

## 급소 (안 지키면 HA 아님, 데이터 손상)
1. **네트워크**: corosync 하트비트 + DRBD 복제 + 클라 데이터(LNet)를 **한 링크에 몰면** 혼잡 시 오펜싱, 링크 장애 시 전부 동시 상실. 가능하면 경로 분리, 최소 corosync 토큰 타임아웃 상향.
2. **2노드 split-brain**: 망 단절 시 양쪽이 서로 펜싱하다 둘 다 죽을 수 있음 → **제3 tiebreaker(qdevice / DRBD diskless)** + `priority-fencing-delay`. 클러스터 노드 위의 VM은 중재자 자격 없음(독립 장비).
3. **DRBD 펜싱 정책**: `fencing resource-and-stonith` + `crm-fence-peer`/unfence 연동 → **Outdated 복제본 승격 금지**. STONITH만으론 불충분.
4. **ZFS-on-DRBD 규칙**: `auto-promote no`, DRBD `Primary/UpToDate` 확인 후에만 import, `cachefile=none`, `multihost=on` + 노드별 고유 `hostid`(이중 import→복구불가 손상 방지), 종료는 **umount→zpool export→DRBD demote 역순**. `zpool import -f` 금지.
5. **리소스별 독립 최신성**: 여러 DRBD 리소스가 따로 갈리면 MDT와 OST가 서로 다른 시점으로 살아나 파일시스템 정합성이 깨질 수 있음(ZFS 체크섬으로도 못 잡음). 펜싱·승격 정책으로 방지.

## 성능
- DRBD 동기복제(protocol C)는 네트워크 지연=쓰기 지연. 1GbE 복제망은 병목. 자동 failover도 0초 아님(실측 ~1~2분).

## 변형: VM 기반 Lustre HA (Pacemaker VirtualDomain)
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
- [[ha-cluster-fundamentals]] · [[lustre-servicenode-failover]] · [[lustre-server-setup]] · [[el-kernel-swap-safety]] · [[selinux-confined-daemon-ocf-ra]] · [[lustre-overview]]

---
title: Lustre 파일시스템 개요 (MOC)
tags:
  - tech
  - moc
created: 2026-05-12 (화)
---

# Lustre 파일시스템 개요 (MOC)

> HPC 환경의 고성능 분산 파일시스템 — 대용량 병렬 I/O 특화

---

## 아키텍처

```
클라이언트
    │  mount -t lustre <MGS_IP>@tcp:/<fsname> /mnt/lustre
    ▼
MGS (Management Server)  ← 파일시스템 설정 정보 저장
MDS (Metadata Server)    ← 파일명, 디렉토리, 권한 관리
OSS (Object Storage Server) × N  ← 실제 데이터 저장
```

### 핵심 구성요소

| 구성요소 | 역할 | 타겟 디스크 타입 |
|---------|------|----------------|
| MGS | 파일시스템 전체 설정 관리 | MGT |
| MDS | 메타데이터 (파일명·권한·위치) | MDT |
| OSS | 실제 데이터 블록 저장 | OST (여러 개) |
| 클라이언트 | 마운트해서 파일시스템으로 사용 | — |

> MGS + MDS는 같은 서버에 함께 구성 가능 (`mkfs.lustre --mgs --mdt`)

---

## 노트

- [[lustre-server-setup]] — EL8 기준 서버 설치 및 포맷 (MGS/MDT/OST)
- [[lustre-client-setup]] — Ubuntu 클라이언트 설치 및 커널 버전 제약
- [[lustre-troubleshooting]] — 서버 fstab nofail·MDT recovery·OBD 잔존·노드 식별 등 이슈 인덱스
- [[lustre-identity-upcall]] — 비root 클라이언트 Permission denied(MDT identity_upcall)
- [[lustre-client-automount-systemd]] — 재부팅 자동 마운트·부팅 레이스 rc=-16/-5 판별
- [[lustre-lnet-nic-misdetection]] — LNET NIC 오설정·lnet.service 부팅 실패
- [[project-quota-semantics]] — 프로젝트 쿼터 inode 집계(루트 포함)·mv 후 project ID 잔류·setquota 단위 함정
- [[lustre-single-node-benchmark]] — 단일노드 Lustre 벤치 방법론 개요
- [[lustre-ior-measurement-pitfalls]] — IOR 측정 3대 함정(O_DIRECT·write/read·ZFS)
- [[lustre-benchmark-cache-artifact]] — drop_caches·ZFS ARC/txg가 만드는 CoV 아티팩트·sar 판별
- [[lustre-node-topology]] — 논리 노드(역할 VM) vs 물리 노드, 스케일아웃(용량)≠HA(이중화) 구분
- [[lustre-ost-drain]] — OST 제거 전 데이터 비우기(deactivate → lfs migrate → 비움검증)
- [[lustre-ost-permanent-removal]] — OST 영구 제거(conf_param vs writeconf)·인덱스 재사용
- [[lustre-performance-metrics]] — proc/sysfs 기반 성능 지표 수집(누적 카운터·delta rate·소스 맵)
- [[lustre-servicenode-failover]] — tunefs.lustre --servicenode로 OST failover 노드 사후 주입(무손실)·failover 드릴
- [[lustre-ha-drbd-zfs]] — 공유스토리지 없는 2노드 베어메탈 HA: DRBD + Pacemaker + ZFS OSD
- [[lustre-ha-vm-virtualdomain]] — VM 기반 Lustre HA(Pacemaker VirtualDomain) 변형
- [[el-kernel-swap-safety]] — 벤더 패치커널(ldiskfs 등) 스왑 함정: kernel-modules·initramfs·fallback 확인(안 하면 dracut emergency)
- [[lfs-dstate-circuit-breaker]] — hang나는 lfs 호출을 백그라운드 게이트+서킷브레이커로 격리

---

## 관련

- [[kvm-libvirt]] — KVM VM 기반 Lustre 테스트 환경 구성

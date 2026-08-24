---
title: Lustre 파일시스템 개요 (MOC)
tags:
  - tech
  - moc
created: 2026-05-12 (화)
---

# Lustre 파일시스템 개요 (MOC)

> HPC(High Performance Computing, 고성능 컴퓨팅) 환경의 분산 파일시스템 — 대용량 병렬 I/O 특화

---

## 용어

Lustre 노트 전반에서 반복되는 약어. 개별 노트에서 처음 만나면 여기로 돌아온다.

| 표기 | 원어 | 뜻 |
|---|---|---|
| MGS | Management Server | 파일시스템 전체 설정을 관리하는 **서버** |
| MGT | Management Target | MGS가 설정을 저장하는 **디스크** |
| MDS | Metadata Server | 파일명·디렉토리·권한을 관리하는 **서버** |
| MDT | Metadata Target | MDS가 메타데이터를 저장하는 **디스크** |
| OSS | Object Storage Server | 실제 파일 데이터를 저장하는 **서버** |
| OST | Object Storage Target | OSS가 데이터를 저장하는 **디스크** (여러 개를 묶어 용량을 늘림) |
| OSD | Object Storage Device | OST 아래에서 실제 파일시스템(ldiskfs/ZFS)에 쓰는 백엔드 계층 |
| LNET | Lustre Networking | Lustre 전용 네트워크 계층. `tcp0`, `o2ib` 같은 이름으로 인터페이스를 지정 |
| HA | High Availability | 고가용성. 한 노드가 죽어도 서비스가 이어지는 이중화 구성 |
| DoM | Data on MDT | 작은 파일은 OST로 가지 않고 MDT에 바로 담는 기능 |
| OBD | Object-Based Device | Lustre 내부 장치 추상화. `lctl dl`로 보이는 항목들 |
| NID | Network Identifier | LNET에서 노드를 가리키는 주소 표기(`<IP>@tcp0` 형태) |
| MGC / MDC / OSC | Management / Metadata / Object Storage Client | 클라이언트 쪽에서 각각 MGS·MDT·OST와 통신하는 장치. 끝의 `C`가 Client다 → [[lustre-troubleshooting]] |
| UID / GID | User / Group Identifier | 사용자·그룹 번호. 클라이언트와 서버의 번호가 어긋나면 권한 거부가 난다 → [[lustre-identity-upcall]] |
| MMP | Multiple Mount Protection | 같은 타겟을 두 노드가 동시에 마운트하는 것을 막는 ldiskfs 기능. 주기적 쓰기 때문에 지연 꼬리를 키울 수 있다 |
| IOR | Interleaved Or Random | HPC 병렬 I/O 벤치마크 도구 이름 |
| NIC | Network Interface Card | 네트워크 인터페이스(랜카드) |
| ARC | Adaptive Replacement Cache | ZFS의 메모리 읽기 캐시 |
| txg | transaction group | ZFS가 쓰기를 묶어 주기적으로 디스크에 반영하는 단위 |
| CoV | Coefficient of Variation | 변동계수(표준편차/평균) → [[storage-perf-latency-percentiles]] |
| EL8 / EL9 | Enterprise Linux 8 / 9 | RHEL 및 그 호환 배포판(Rocky, Alma) 계열 버전 |

> **서버(S)와 타겟(T)의 구분**이 핵심이다. MGS·MDS·OSS는 프로세스가 도는 **서버**, MGT·MDT·OST는 데이터가 놓이는 **디스크**다. `mkfs.lustre`로 포맷하는 대상은 항상 타겟 쪽이다.

제품·모듈 이름은 풀이 대상이 아니다: `ldiskfs`(ext4를 Lustre용으로 확장한 백엔드 파일시스템), `DRBD`(Distributed Replicated Block Device, 노드 간 블록 장치를 실시간 복제하는 소프트웨어), `Pacemaker`(HA 클러스터 자원 관리자), `KVM`(Kernel-based Virtual Machine, 리눅스 커널 하이퍼바이저), `DKMS`(Dynamic Kernel Module Support, 커널 교체 시 모듈 자동 재빌드), `ZFS`(OSD 백엔드로 쓰는 파일시스템 → [[zfs-overview]]).

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
- [[lustre-ost-add-no-rebalance]] — OST 추가 시 기존 데이터는 이동하지 않는다(증설 소요의 실체는 타겟 포맷)·DoM
- [[lustre-ost-drain]] — OST 제거 전 데이터 비우기(deactivate → lfs migrate → 비움검증)
- [[lustre-ost-permanent-removal]] — OST 영구 제거(conf_param vs writeconf)·인덱스 재사용
- [[lustre-performance-metrics]] — proc/sysfs 기반 성능 지표 수집(누적 카운터·delta rate·소스 맵)
- [[lustre-servicenode-failover]] — tunefs.lustre --servicenode로 OST failover 노드 사후 주입(무손실)·failover 드릴
- [[lustre-ha-drbd-zfs]] — 공유스토리지 없는 2노드 베어메탈 HA: DRBD + Pacemaker + ZFS OSD
- [[lustre-ha-vm-virtualdomain]] — VM 기반 Lustre HA(Pacemaker VirtualDomain) 변형
- [[el-kernel-swap-safety]] — 벤더 패치커널(ldiskfs 등) 스왑 함정: kernel-modules·initramfs·fallback 확인(안 하면 dracut emergency)
- [[lfs-dstate-circuit-breaker]] — hang나는 lfs 호출을 백그라운드 게이트+서킷브레이커로 격리
- [[lfs-df-exit-code-partial-failure]] — lfs df 비영 종료코드는 개별 타깃 실패의 합, 종료코드 단독 판정 금지
- [[lustre-ost-destroys-in-flight-orphan-space]] — 파일 0개인데 OST 용량 잔존: unlink 후 destroy RPC 큐(`destroys_in_flight`) 정체, `force_sync` 타임아웃이면 실제 막힘
- [[lustre-client-eviction-under-load]] — 클라이언트 축출로 EIO 중단, 원인은 클라이언트 방화벽이 막은 서버→클라이언트 역방향 연결(한 방향만 열려도 마운트는 된다)

---

## 관련

- [[kvm-libvirt]] — KVM VM 기반 Lustre 테스트 환경 구성

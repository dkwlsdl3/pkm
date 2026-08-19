---
title: ZFS 개요 (MOC)
tags:
  - tech
  - moc
created: 2026-05-18 (월)
---

# ZFS 개요 (MOC)

> COW(Copy-On-Write, 쓰기 시 복사) 기반 고신뢰성 파일시스템 — 스냅샷·RAID-Z·무결성 검증 내장

---

## 용어

ZFS 노트 전반에서 반복되는 약어·고유 용어. 개별 노트에서 처음 만나면 여기로 돌아온다.

| 표기 | 원어 | 뜻 |
|---|---|---|
| COW | Copy-On-Write | 원본을 덮어쓰지 않고 새 위치에 쓴 뒤 포인터를 바꾼다. 스냅샷이 공짜인 이유 |
| ARC | Adaptive Replacement Cache | ZFS가 메모리에 두는 읽기 캐시. 벤치마크 착시의 주범 → [[zfs-arc-cache-illusion]] |
| txg | transaction group | 쓰기를 묶어 주기적으로 디스크에 반영하는 단위 |
| zpool | ZFS pool | 물리 디스크를 묶은 저장 풀. ZFS의 최상위 그릇 |
| vdev | virtual device | zpool을 구성하는 가상 장치 단위(디스크 하나, 미러 한 쌍, RAID-Z 묶음 등) |
| zvol | ZFS volume | ZFS가 파일시스템이 아니라 **블록 장치**로 노출하는 볼륨. VM 디스크로 쓰임 |
| RAID-Z1 / Z2 / Z3 | — | 패리티를 각각 1·2·3개 두는 ZFS의 패리티 RAID → [[zfs-raidz-levels]] |
| scrub | — | 풀 전체를 읽어 체크섬을 재검증하고 조용한 손상을 고치는 작업 |
| resilver | — | 디스크 교체 후 패리티/미러로 데이터를 다시 채우는 작업 |
| dedup | deduplication | 중복 블록 제거. 메모리를 크게 먹어 일반적으로 권장되지 않는다 |
| HBA | Host Bus Adapter | RAID 로직 없이 디스크를 호스트에 연결만 하는 컨트롤러 → [[zfs-hba-vs-hwraid]] |
| JBOD | Just a Bunch Of Disks | 묶지 않고 낱개 원본 그대로 OS에 노출하는 구성 |
| HW RAID | hardware RAID | 하드웨어 RAID. ZFS와 함께 쓰면 안티패턴 |
| ECC | Error-Correcting Code | 오류를 스스로 정정하는 메모리. ZFS 운영 권장 사항 |
| SMART | Self-Monitoring, Analysis and Reporting Technology | 디스크 자기진단 기능 |
| BBU | Battery Backup Unit | RAID 컨트롤러 캐시를 정전으로부터 보호하는 배터리 |

> ZFS 자체는 Zettabyte File System에서 온 이름이지만 지금은 고유명사로 쓴다.

---

## 핵심 개념

- [[zfs]] — COW·체크섬 핵심 원리
- [[zfs-snapshot-basics]] — 스냅샷 생성·롤백·삭제 명령
- [[zfs-snapshot-clone-dependency]] — 스냅샷 삭제 전 종속 클론 확인 패턴
- [[zfs-raidz-levels]] — RAID-Z1/Z2/Z3 비교(운영 권장 Z2)
- [[zfs-operational-checklist]] — HW RAID 금지·ECC·scrub·80% 룰 4대 수칙
- [[zfs-commands-cheatsheet]] — 자주 쓰는 ZFS 명령어 모음
- [[zfs-arc-and-lustre-overhead]] — ARC 착시·계층 오버헤드·sync write 약점 인덱스
- [[zfs-arc-cache-illusion]] — ZFS ARC read 성능 착시와 Direct IO 분리 측정
- [[zfs-sync-write-weakness]] — ZFS 동기 쓰기 성능 약점(worst-case 조건)
- [[lustre-zvol-vm-layering-overhead]] — Lustre+zvol+VM 다층 스택 오버헤드·tail latency
- [[zvol-blocksize-filesystem-mismatch]] — zvol 블록 크기와 그 위 파일시스템 블록 크기가 어긋나면 쓰기 증폭이 생긴다(volblocksize는 사후 변경 불가)
- [[zfs-file-vdev-recovery]] — 파일/loop vdev zpool 재부팅 복구 (losetup 재연결 필수)
- [[zfs-hba-vs-hwraid]] — 하드웨어 RAID vs HBA/JBOD 패스스루, ZFS가 패스스루여야 하는 이유
- [[zpool-vs-zfs-capacity-basis]] — `zpool list`(패리티 포함·예약 미반영)와 `zfs list`(차감 후) 용량 기준 차이, 섞으면 화면끼리 모순

---

## 관련

- [[lustre-overview]] — Lustre 하부 저장소로 ZFS 사용 시 궁합 최상
- [[data-storage]]

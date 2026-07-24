---
title: ZFS
tags:
  - tech
  - storage
  - zfs
created: 2026-05-18 (월)
---

# ZFS

> **TL;DR**: Copy-On-Write + 무결성 체크섬 내장 파일시스템 — 데이터 부패 자동 감지·복구, 즉시 스냅샷

---

## 핵심 원리

### COW (Copy-On-Write)

기존 데이터 블록을 절대 덮어쓰지 않음. 새 데이터는 항상 빈 공간에 먼저 기록 → 포인터 교체 → 완료.

- **장점**: 쓰기 도중 전원 차단돼도 이전 상태 완전 보존 (트랜잭션 안전성)
- **부작용**: 단편화 발생 → 주기적 점검 필요 (자세히: [[zfs-operational-checklist]])

### 체크섬 (Checksum)

모든 블록에 체크섬을 기록. 읽을 때마다 검증 → 조용한 데이터 부패(Silent Corruption) 자동 탐지.

스냅샷 생성·목록·롤백·삭제 명령은 [[zfs-snapshot-basics]] 참고.

---

## RAID-Z / 운영 수칙 / 명령어

- RAID-Z1·Z2·Z3 레벨 비교: [[zfs-raidz-levels]]
- HW RAID 금지·ECC 메모리·주기적 Scrub·80% 용량 룰 등 운영 수칙: [[zfs-operational-checklist]]
- 디스크 건강 점검(SMART)·풀 상태·압축/중복제거 등 자주 쓰는 명령어: [[zfs-commands-cheatsheet]]
- HW RAID 컨트롤러 대신 HBA/JBOD 패스스루를 써야 하는 이유: [[zfs-hba-vs-hwraid]]

---

## ZFS + Lustre 연계

Lustre OSS의 OST를 ZFS로 구성하면 최상의 궁합:
- ZFS RAID-Z2가 디스크 장애 복구
- ZFS 스냅샷으로 Lustre 데이터 백업
- ZFS 체크섬으로 HPC 데이터 무결성 보장

---

## 관련

- [[zfs-overview]]
- [[zfs-snapshot-basics]]
- [[zfs-raidz-levels]]
- [[zfs-operational-checklist]]
- [[zfs-commands-cheatsheet]]
- [[zfs-hba-vs-hwraid]]
- [[zfs-snapshot-clone-dependency]]
- [[lustre-overview]]
- [[lustre-server-setup]]

---
title: ZFS 개요 (MOC)
tags:
  - tech
  - moc
created: 2026-05-18 (월)
---

# ZFS 개요 (MOC)

> Copy-On-Write 기반 고신뢰성 파일시스템 — 스냅샷·RAID-Z·무결성 검증 내장

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
- [[zfs-file-vdev-recovery]] — 파일/loop vdev zpool 재부팅 복구 (losetup 재연결 필수)
- [[zfs-hba-vs-hwraid]] — 하드웨어 RAID vs HBA/JBOD 패스스루, ZFS가 패스스루여야 하는 이유

---

## 관련

- [[lustre-overview]] — Lustre 하부 저장소로 ZFS 사용 시 궁합 최상
- [[data-storage]]

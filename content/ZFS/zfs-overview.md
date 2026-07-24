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

- [[zfs]] — COW 원리, Snapshot, RAID-Z, 4대 운영 수칙
- [[zfs-snapshot-clone-dependency]] — 스냅샷 삭제 전 종속 클론 확인 패턴
- [[zfs-arc-and-lustre-overhead]] — ARC 캐시 착시·Lustre+VM+zvol 계층 오버헤드·sync write 약점
- [[zfs-file-vdev-recovery]] — 파일/loop vdev zpool 재부팅 복구 (losetup 재연결 필수)
- [[zfs-hba-vs-hwraid]] — 하드웨어 RAID vs HBA/JBOD 패스스루, ZFS가 패스스루여야 하는 이유

---

## 관련

- [[lustre-overview]] — Lustre 하부 저장소로 ZFS 사용 시 궁합 최상
- [[data-storage]]

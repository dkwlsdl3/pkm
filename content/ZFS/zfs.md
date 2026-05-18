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
- **부작용**: 단편화 발생 → `zpool scrub`으로 주기 점검 필요

### 체크섬 (Checksum)

모든 블록에 체크섬을 기록. 읽을 때마다 검증 → 조용한 데이터 부패(Silent Corruption) 자동 탐지.

### Snapshot

```bash
# 스냅샷 생성 (거의 즉시, 용량 차이만큼만 점유)
zfs snapshot tank/data@2026-05-18

# 목록
zfs list -t snapshot

# 롤백
zfs rollback tank/data@2026-05-18

# 삭제
zfs destroy tank/data@2026-05-18
```

---

## RAID-Z (소프트웨어 RAID)

| 레벨 | 패리티 | 최소 디스크 | 특징 |
|------|--------|------------|------|
| RAID-Z1 | 1 | 3 | 디스크 1개 장애 허용 |
| RAID-Z2 | 2 | 4 | 디스크 2개 장애 허용 — 운영 권장 |
| RAID-Z3 | 3 | 5 | 디스크 3개 장애 허용 |

---

## 4대 운영 수칙

### 1. HW RAID 컨트롤러 금지 — JBOD(Pass-through) 모드 사용

ZFS는 디스크를 직접 제어해야 체크섬·RAID-Z가 정상 동작. HW RAID가 끼어들면 ZFS가 오류를 감지 못함.

### 2. ECC 메모리 사용

ZFS는 데이터를 메모리에서 처리하므로 RAM 비트 오류 → 디스크에 잘못된 데이터 기록 위험. ECC로 RAM 무결성 보장.

### 3. 주기적 Scrub (주 1회 권장)

```bash
# Scrub 시작
zpool scrub tank

# 상태 확인
zpool status tank
```

모든 블록 체크섬 재검증 → 조용한 오류 조기 발견.

### 4. 80% 룰

ZFS는 가용 용량의 80%를 초과하면 성능이 급격히 저하됨 (COW 특성상 연속 공간 부족).

```bash
# 사용량 확인
zpool list
zfs list
```

---

## 디스크 건강 점검

```bash
# 일반 SATA/SAS 디스크
smartctl -H /dev/sda

# RAID 컨트롤러(MegaRAID) 뒤에 있는 물리 디스크
smartctl -d megaraid,0 -H /dev/sda
smartctl -d megaraid,1 -H /dev/sda
# → SMART overall-health self-assessment test result: PASSED
```

---

## 주요 명령어

```bash
# 풀 상태 전체 확인
zpool status -v tank

# I/O 통계 실시간
zpool iostat tank 2

# 데이터셋 목록
zfs list -r tank

# 압축 활성화
zfs set compression=lz4 tank/data

# 중복 제거 (주의: 메모리 많이 씀)
zfs set dedup=on tank/data
```

---

## ZFS + Lustre 연계

Lustre OSS의 OST를 ZFS로 구성하면 최상의 궁합:
- ZFS RAID-Z2가 디스크 장애 복구
- ZFS 스냅샷으로 Lustre 데이터 백업
- ZFS 체크섬으로 HPC 데이터 무결성 보장

---

## 관련

- [[zfs-overview]]
- [[lustre-overview]]
- [[lustre-server-setup]]

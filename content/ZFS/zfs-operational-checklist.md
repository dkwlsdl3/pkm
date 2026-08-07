---
title: ZFS 운영 체크리스트
tags:
  - tech
  - storage
  - zfs
created: 2026-05-18 (월)
---

# ZFS 운영 체크리스트

> **TL;DR**: ZFS를 안정적으로 운영하려면 HW RAID(hardware RAID, 하드웨어 RAID) 금지, ECC(Error-Correcting Code, 오류 정정) 메모리, 주기적 Scrub, 80% 용량 룰 네 가지를 지켜야 한다.

> 약어는 [[zfs-overview]]의 용어 표 참고.

---

## 1. HW RAID 컨트롤러 금지 — JBOD(Just a Bunch Of Disks, 낱개 원본 노출) 모드 사용

ZFS는 디스크를 직접 제어해야 체크섬·RAID-Z가 정상 동작한다. HW RAID가 끼어들면 ZFS가 오류를 감지 못한다. → 자세히: [[zfs-hba-vs-hwraid]]

## 2. ECC 메모리 사용

ZFS는 데이터를 메모리에서 처리하므로 RAM 비트 오류가 디스크에 잘못된 데이터를 기록할 위험이 있다. ECC로 RAM 무결성을 보장한다.

## 3. 주기적 Scrub (주 1회 권장)

```bash
# Scrub 시작
zpool scrub tank

# 상태 확인
zpool status tank
```

모든 블록 체크섬을 재검증해 조용한 오류를 조기에 발견한다.

## 4. 80% 룰

ZFS는 가용 용량의 80%를 초과하면 성능이 급격히 저하된다 (COW 특성상 연속 공간 부족).

```bash
# 사용량 확인
zpool list
zfs list
```

---

## 관련

- [[zfs]]
- [[zfs-hba-vs-hwraid]]
- [[zfs-commands-cheatsheet]]

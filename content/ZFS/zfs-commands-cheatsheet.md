---
title: ZFS 명령어 치트시트
tags:
  - tech
  - storage
  - zfs
created: 2026-05-18 (월)
---

# ZFS 명령어 치트시트

> **TL;DR**: 디스크 건강 점검, 풀 상태 확인, 압축·중복제거 설정 등 자주 쓰는 ZFS/디스크 명령어 모음.

---

## 디스크 건강 점검

```bash
# 일반 SATA/SAS 디스크
smartctl -H /dev/sda
```

RAID 컨트롤러(MegaRAID 계열) 뒤 물리 디스크의 SMART 조회는 컨트롤러별 `-d` 옵션이 필요하다. 자세한 명령과 배경은 [[zfs-hba-vs-hwraid]] 참고.

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

## 관련

- [[zfs]]
- [[zfs-operational-checklist]]
- [[zfs-hba-vs-hwraid]]

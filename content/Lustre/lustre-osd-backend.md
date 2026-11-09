---
title: Lustre OSD 백엔드 — ldiskfs 와 ZFS
tags:
  - tech
created: 2026-11-09 (월)
---

# Lustre OSD 백엔드 — ldiskfs 와 ZFS

> **TL;DR**: OSD(Object Storage Device, 타깃 아래에서 실제 디스크에 쓰는 계층)는 타깃마다 `ldiskfs` 나 `ZFS` 중 하나로 포맷한다. 이 선택이 쓸 수 있는 기능을 가른다. 특히 **Lustre 스냅샷은 각 타깃의 ZFS 스냅샷을 묶는 기능이라 MGT·MDT·OST 전부가 ZFS 여야 한다.** ldiskfs 나 혼합 구성이면 그 아래 볼륨 계층에서 스냅샷을 따로 다룬다.

| 표기 | 원어 | 뜻 |
|---|---|---|
| OSD | Object Storage Device | 타깃(MGT·MDT·OST)이 데이터를 실제로 쓰는 백엔드 계층 |
| MGS | Management Server | 파일시스템 설정을 관리하는 서버 |
| MGT / MDT / OST | Management Target / Metadata Target / Object Storage Target | 설정 저장 단위 / 메타데이터 저장 단위 / 파일 데이터 저장 단위 |
| zvol | ZFS volume | ZFS 풀에서 잘라 낸 블록 장치 |

## 개요

- **무엇**: `mkfs.lustre --backfstype=ldiskfs|zfs` 로 타깃마다 정한다
  - `ldiskfs` — ext4 를 Lustre 용으로 확장한 파일시스템. 서버 커널에 맞춘 ldiskfs 모듈이 필요해, 보통 Lustre 서버용 커널·모듈 패키지와 묶여 온다
  - `zfs` — 타깃이 ZFS 데이터셋 위에 놓인다. 체크섬·압축·스냅샷·RAID-Z 를 ZFS 가 맡는다
- **왜 / 언제**: 기능 요구(스냅샷, 데이터 무결성 검사)와 운영 부담(커널 의존, 메모리) 사이에서 고른다

## 동작 / 예시

**Lustre 스냅샷**(`lctl snapshot_create`, MGS 에서 실행)은 쓰기를 잠깐 멈춘 뒤 **각 타깃의 ZFS 스냅샷**을 찍고, 그것들을 읽기 전용 Lustre 파일시스템 하나로 묶는다. 그래서 타깃 하나라도 ldiskfs 면 쓸 수 없다.

**ZFS zvol 위에 ldiskfs** 를 얹는 구성도 있다. ZFS 는 볼륨 관리자로만 쓰고 OSD 는 ldiskfs 인 형태다.

- OSD 가 ldiskfs 이므로 Lustre 스냅샷은 쓸 수 없다
- 대신 zvol 단위 ZFS 스냅샷은 찍을 수 있다. 다만 **타깃마다 따로** 찍히므로, 여러 타깃을 같은 시점으로 맞추는 일은 직접 해야 한다

```bash
# 타깃이 어떤 백엔드로 포맷됐는지 확인 (서버에서)
tunefs.lustre --dryrun <TARGET_DEVICE_OR_POOL/DATASET>   # 출력의 Mount type: 줄 (ldiskfs / zfs)
```

## 주의

> [!WARNING]
> 「ZFS 를 쓴다」는 말이 「OSD 가 ZFS 다」를 뜻하지 않는다. zvol 위 ldiskfs 라면 ZFS 기능 중 Lustre 수준 스냅샷은 빠진다. 스냅샷 요구가 있으면 OSD 백엔드를 먼저 확인한다.

---

## 관련

- [[lustre-overview]]
- [[lustre-node-topology]] — 노드·역할 구성
- [[lustre-ha-drbd-zfs]] — ZFS OSD 를 쓰는 HA 구성
- [[zfs-overview]]

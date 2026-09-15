---
title: 디스크 식별은 이름·전역 스위치가 아니라 동일성 키(WWID)로
tags:
  - tech
created: 2026-09-15 (화)
---

# 디스크 식별은 이름·전역 스위치가 아니라 동일성 키(WWID)로

> **TL;DR**: 같은 물리 디스크가 커널에게는 `/dev/sda` 로, RAID 컨트롤러 도구에게는 슬롯 번호로, SMART 도구에게는 또 다른 경로로 보인다. 이것들을 **"이 시스템은 MegaRAID 다"** 같은 전역 스위치로 묶으면 혼합 구성에서 무너진다. **WWID(World Wide Identifier, 장치 제조 시 부여돼 경로·이름과 무관하게 따라다니는 고유 식별자)** 로 묶어야 한다.

## 개요

- **무엇**: 여러 경로에서 관측한 장치 정보를 하나의 물리 디스크로 합칠 때 쓰는 키. SCSI/SAS 는 WWN(World Wide Name), NVMe 는 EUI-64/NGUID 계열이 같은 역할을 한다.
- **왜 / 언제**: 디스크 목록·SMART 상태·용량·슬롯 위치가 각기 다른 도구에서 오고, 이를 합쳐 한 행으로 보여줘야 할 때. 전역 스위치 방식은 **한 서버에 HBA 와 RAID 컨트롤러가 섞여 있으면** 곧바로 틀린다.

## 동작 / 예시

값을 직접 파싱해 만들지 말고, **이미 해석해 둔 곳에서 받아 온다.**

```bash
# 커널이 유지하는 값 (udev)
lsblk -o NAME,WWN,SERIAL,MODEL
udevadm info --query=property /dev/sda | grep -E 'ID_WWN|ID_SERIAL'

# 컨트롤러 뒤에 있는 물리 디스크 — smartctl 이 해석한 라벨
smartctl -d cciss,0 -i /dev/sda | grep -i 'LU WWN Device Id'
```

## 주의

> [!WARNING]
> **동일성 키를 직접 바이트에서 파싱하지 않는다.** VPD 페이지 0x83 의 designator 는 종류(NAA/EUI/T10)·길이·연관성(association)별로 형식이 갈리고 벤더 예외가 붙는다. 커널(`ID_WWN`)이나 `smartctl` 이 이미 해석한 값을 쓰고, 부득이하게 직접 읽어야 하면 **실장비 실측 바이트**로 시험을 고정한다.

> [!WARNING]
> `smartctl` 의 JSON 출력과 텍스트 라벨이 항상 같은 값을 주지 않는다. 장비·버전에 따라 JSON 쪽에 필드가 비어 오는 경우가 있으므로, **어느 쪽을 왜 읽는지 코드에 근거를 남긴다.**

> [!WARNING]
> WWID 가 없는 장치(일부 가상 디스크·구형 USB)는 반드시 존재한다. 키가 없을 때의 **대체 식별과 그 한계**를 정해 두지 않으면 목록에서 통째로 사라진다.

---

## 관련

- [[disk-by-id-canonicalize-pitfall]] — 안정 식별자를 `/dev/sdX` 로 풀어 저장하면 안정성이 사라진다
- [[smartctl-device-type-sat-cciss]] — 컨트롤러 뒤 디스크를 읽는 `-d` 지정
- [[zpool-identity-guid-not-label]] — 같은 원칙을 ZFS 풀에 적용한 경우
- [[zfs-hba-vs-hwraid]] — HBA / 하드웨어 RAID 구성 차이

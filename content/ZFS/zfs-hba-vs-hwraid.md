---
tags:
  - zfs
  - storage
  - hardware
---

# 하드웨어 RAID vs HBA/JBOD 패스스루 (ZFS 스토리지)

ZFS(및 소프트웨어 RAID 일반)에서 스토리지 컨트롤러는 **디스크를 낱개 원본 그대로 넘겨주는 패스스루(HBA/JBOD) 모드**로 써야 한다. 하드웨어 RAID 모드로 ZFS를 올리는 건 **안티패턴**.

## 약자 사전

| 약자 | 원말 | 뜻 |
|---|---|---|
| **PERC** | PowerEdge RAID Controller | Dell 서버의 RAID 컨트롤러 카드 브랜드(예: H755 = PERC 11세대). 디스크와 OS 사이에 끼는 물리 부품(카드) |
| **RAID** | Redundant Array of Independent Disks | 여러 디스크를 묶어 이중화/성능을 냄 |
| **HBA** | Host Bus Adapter | RAID 로직 없이 디스크를 호스트에 **연결만** |
| **eHBA** | enhanced HBA | RAID 컨트롤러를 HBA(패스스루)처럼 동작시키되 SMART/enclosure 관리 기능은 살려주는 **동작 모드** |
| **JBOD** | Just a Bunch Of Disks | 묶지 않고 **낱개 원본 그대로** OS에 노출 |

> eHBA 모드 = 컨트롤러를 JBOD(패스스루)로 동작시키는 스위치. JBOD가 목표 상태, eHBA가 그걸 켜는 모드.

## RAID 모드 vs HBA/JBOD 모드 — 멘탈모델

**하드웨어 컨트롤러가 관리 vs 소프트웨어(ZFS)가 관리.**

- **RAID 모드**: 컨트롤러가 디스크를 직접 관리. 가상 디스크로 묶어 OS에 제시. OS/ZFS는 **개별 물리 디스크를 못 봄**(컨트롤러가 가림).
- **HBA/JBOD 모드**: 컨트롤러는 길만 터줌. 개별 물리 디스크를 원본 그대로 OS에 넘김. 이중화/패리티는 **ZFS가 소프트웨어로** 처리.

## 장단점

**RAID 모드 (하드웨어가 관리)**
- 장점: 전용 하드웨어 패리티, 배터리백업 쓰기캐시로 쓰기 빠름, 구성 단순(볼륨 하나).
- 단점(★ZFS와 함께면 치명): ZFS가 개별 디스크·SMART를 못 봐 자가치유/체크섬 무력화, 하드웨어 캐시와 ZFS 쓰기순서 충돌.

**HBA/JBOD 모드 (ZFS가 관리)**
- 장점: ZFS가 원본 디스크 직접 → 체크섬·자가치유·RAID-Z·SMART 모니터링 전부 가능, 디스크 교체 깔끔.
- 단점: 하드웨어 쓰기캐시(BBU) 없음 → 동기 쓰기 가속은 SLOG용 SSD로 따로, 패리티는 CPU 계산(현대 CPU엔 사실상 무시).

## 왜 ZFS는 패스스루여야 하나

1. ZFS의 존재 이유(체크섬으로 조용한 손상 감지 + 자가치유)는 **원본 디스크 직접 접근**이 전제. 밑에 하드웨어 RAID가 있으면 ZFS는 "가상 디스크 하나"만 봐서 어느 물리 디스크가 썩는지 모른다.
2. 디스크 **SMART**(온도·재할당 섹터·수명) 모니터링도 개별 디스크가 보여야 가능 → 패스스루에서만.

**결론**: ZFS 스토리지엔 HBA/JBOD(eHBA)가 정답. 하드웨어 RAID가 맞는 경우는 **ZFS를 안 쓰고** 전통 파일시스템(ext4/xfs)을 하드웨어 RAID 볼륨 위에 얹을 때뿐.

## 함정

- **모드 전환 시 기존 데이터 삭제**(RAID 메타데이터 구조가 바뀜). 신규 세팅 순서 = **컨트롤러 패스스루 먼저 → 그 다음 ZFS 풀 생성**.
- 일부 컨트롤러는 순수 HBA 미지원 → "디스크마다 RAID0 가상디스크" 우회는 SMART 직접조회 불가·핫스왑 불편. **진짜 패스스루(eHBA) 모드가 있으면 그걸 사용**.
- RAID 컨트롤러(MegaRAID 계열) 뒤 물리 디스크 SMART: `smartctl -d megaraid,N -H /dev/sdX`.

## 관련
- [[zfs]] · [[zfs-overview]] · [[zfs-arc-and-lustre-overhead]] · [[lustre-ha-drbd-zfs]]

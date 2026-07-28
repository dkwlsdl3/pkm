---
title: storcli eall/sall 일괄 범위가 부팅 디스크까지 바꾸는 함정
tags:
  - tech
  - troubleshooting
  - storage
  - hardware
created: 2026-07-29 (수)
---

# storcli eall/sall 일괄 범위가 부팅 디스크까지 바꾸는 함정

> **TL;DR**: `storcli` 류의 컨트롤러 명령을 `eall`(전체 인클로저)·`sall`(전체 슬롯) 범위로 실행하면 **데이터 디스크뿐 아니라 OS 부팅 디스크까지** 상태가 전환돼 부팅/OS 접근이 깨진다. 파괴적 디스크 작업 전에 부팅 디스크를 식별해 **명시적으로 제외**할 것.

## 증상

- 장비 원복(반납 준비) 목적으로 데이터 디스크만 초기화하려 했는데, 명령 실행 후 **OS에 접근 불가**
- 부팅 디스크가 컨트롤러상에서 `UGood`(Unconfigured Good) 상태로 전환되어, 기존 구성/부팅 경로가 사라짐

## 원인

`eall`/`sall`은 "전체 인클로저의 전체 슬롯"을 뜻하는 **와일드카드 범위 지정자**다. 컨트롤러는 그 슬롯에 꽂힌 디스크가 데이터용인지 OS용인지 구분하지 않는다.

```bash
# 위험 — 이 컨트롤러에 붙은 모든 디스크가 대상
storcli /c0/eall/sall set good force
```

- OS 디스크가 같은 컨트롤러에 물려 있으면 함께 휩쓸린다
- `set good` / JBOD 전환 / 구성 삭제 계열은 **되돌려도 부팅 구성이 그대로 복원되지 않는다**

## 해결

**1) 사전에 부팅 디스크의 컨트롤러 좌표(EID:Slot)를 확정한다**

```bash
lsblk -o NAME,SIZE,TYPE,MOUNTPOINT      # 어느 블록 장치가 / 를 갖고 있나
findmnt -no SOURCE /                     # 루트 소스 장치
storcli /c0 show all                     # EID:Slt ↔ DID ↔ 용량/모델 대조
```

**2) 와일드카드 대신 슬롯을 열거해 대상만 지정한다**

```bash
# 데이터 디스크 슬롯만 명시 (부팅 디스크 슬롯은 목록에서 제외)
storcli /c0/e252/s2,3,4,5 set good force
```

**3) OS 디스크를 지워야 한다면 그 OS로 부팅한 상태에서 하지 않는다**

- 라이브 USB(원격이면 iDRAC vKVM 가상 미디어)로 부팅 → `blkdiscard` / `nvme format` 등으로 소거
- 이미 사고가 났을 때의 우회 경로도 동일하다: 라이브 부팅으로 들어가 처리

> [!WARNING]
> 반납·재설치 전 wipe는 **되돌릴 수 없는 작업**이다. 실행 전에 백업 대상(러너 등록정보·라이선스·키 등) 체크리스트를 먼저 만들고, 컨트롤러 명령은 슬롯 열거로만 실행한다.

---

## 관련

- [[idrac-virtual-media-install-pitfalls]] — 라이브 부팅 우회 시 가상 미디어 함정
- [[zfs-hba-vs-hwraid]] — eHBA/JBOD vs RAID 모드, 원복 시 공장 기본값
- [[smartctl-device-type-sat-cciss]] — RAID 컨트롤러 뒤 개별 디스크 조회
- [[disk-by-id-canonicalize-pitfall]]
- [[os-overview]]

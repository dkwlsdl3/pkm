---
title: zpool list와 zfs list의 용량 기준은 다르다
tags:
  - tech
  - troubleshooting
created: 2026-08-03 (월)
---

# zpool list와 zfs list의 용량 기준은 다르다

> 용어: RAIDZ(ZFS의 패리티 RAID) · zvol(ZFS가 블록 장치로 노출하는 볼륨) · refreservation(그 볼륨이 미리 확보해 두는 예약 용량) → [[zfs-overview]]

> **TL;DR**: `zpool list`의 SIZE는 RAIDZ 패리티를 **포함**하고 ALLOC은 zvol 예약을 **세지 않는다**. `zfs list`의 AVAIL은 패리티·예약을 **차감**한 실사용 가능량이다. 두 출처를 한 응답에 섞으면 `capacity − allocated ≠ available`이 되어 **각 값은 맞는데 화면끼리 정반대로 보인다**. 용량은 한 기준으로 통일하고 `전체 = 사용 + 여유` 항등식으로 검산한다.

## 증상

같은 풀을 두 화면이 정반대로 보여줬다.

| 화면 | 사용률 | 여유 |
|---|---|---|
| 저장 공간 구성 | **0.00%** (텅 빈 것처럼) | 13.3TB |
| 디스크 용량 할당 | **91%** (빨간 막대) | 308GB |

두 화면 모두 같은 API를 호출한다. 어느 쪽 계산식도 틀리지 않았다.

같은 풀을 CLI로 봐도 값이 3배 차이 났다 — `zpool list` ALLOC은 15MB인데 `zfs list` USED는 1.80T.

## 원인

응답 안에서 값의 **출처가 갈렸다**.

| 필드 | 출처 | 기준 |
|---|---|---|
| `capacity` / `allocated` | `zpool` 속성(raw) | SIZE는 RAIDZ **패리티 포함**, ALLOC은 **기록된 데이터만**(zvol refreservation 제외) |
| `available` | `zfs list` | 패리티·예약 **차감** 후 실사용 가능량 |

예약만 잡히고 아직 쓰지 않은 상태에서는

- `alloc / size` → **0%** (기록된 데이터가 없으니까)
- `(size − available) / size` → **91%** (예약이 available을 이미 깎았으니까)

즉 `capacity − allocated ≠ available`. 각 화면은 자기 식으로 정직하게 계산했지만 **기준이 두 개라서 서로 모순**된다.

## 해결

세 값을 **모두 zfs 기준으로 통일**한다.

- 사용량 = `used` (자식 zvol 예약 포함)
- 여유 = `available`
- 전체 = 사용량 + 여유

이제 `전체 − 사용 = 여유`가 성립해 어느 식으로 계산해도 같은 값이 나온다.

```bash
# 기준이 다르다는 것을 먼저 눈으로 확인한다
zpool list -o name,size,alloc,free tank     # raw — 패리티 포함, 예약 미반영
zfs list -o name,used,avail,refreservation tank   # 실사용 가능 기준

# 자식 zvol 예약이 available을 깎는 양
zfs list -r -o name,used,usedbyrefreservation tank
```

체크리스트:

- 목록 조회와 상세 조회 **두 경로 모두** 적용한다. 한쪽만 고치면 화면 간 모순이 남는다.
- `free`도 같은 기준으로 바꾼다. raw free를 남겨두면 그 값으로 다시 모순이 만들어진다.
- `zfs` 조회 실패 시에는 raw 값으로 폴백해도 된다. 값이 사라지는 것보다 낫고, 그 경우도 **기준이 하나**라 자기모순은 없다.

> [!WARNING]
> 기준을 통일하면 **표시되는 전체 용량이 작아진다**(패리티 제외 실사용 가능 총량이 되므로). 운영 중 화면이라면 사전에 알리고 승인받아야 한다.

> [!NOTE]
> 증설 계획을 raw 수치로 세우면 안 된다. ALLOC이 15MB라 "거의 빈 풀"로 보였지만 실제 AVAIL은 318G였고, 1.79T 타깃을 넣을 여유가 없었다.

---

## 관련

- [[zfs-raidz-levels]] — 패리티가 SIZE에 포함되는 이유
- [[zfs-commands-cheatsheet]] — 조회 명령
- [[zfs-operational-checklist]] — 운영 점검 항목
- [[zfs-snapshot-clone-dependency]] — 예약·참조가 여유를 잡는 다른 사례
- [[unknown-is-not-absent]] — 값의 의미를 확인하지 않고 그대로 쓰는 결함군

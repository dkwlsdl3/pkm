---
title: 풀 식별은 레이블 이름이 아니라 GUID 로 — 남의 풀을 파괴하지 않으려면
tags:
  - tech
  - troubleshooting
created: 2026-09-15 (화)
---

# 풀 식별은 레이블 이름이 아니라 GUID 로 — 남의 풀을 파괴하지 않으려면

> **TL;DR**: `zpool import` 후보 목록의 **풀 이름은 고유하지 않다.** 다른 장비에서 뽑아 꽂은 디스크, 이전 설치의 잔재가 같은 이름(`tank`)으로 올라온다. 이름으로 고르면 **남의 풀을 파괴 대상으로 내준다.** 식별은 `guid` 로 하고, 승인 기록에도 GUID 를 남긴다.

## 증상

- 설치 도구가 "기존 `tank` 풀을 재사용할까요?" 라고 묻는데, 그 풀이 **다른 서버에서 옮겨온 데이터 디스크**다.
- 구형 장비에서 레이블 이름만 읽어 후보를 만든 탓에 관계없는 풀이 목록에 올라온다.
- purge 후 재설치가 "이미 풀이 있다"며 막히는데, 실제 풀은 없고 **디스크에 레이블만 남아 있다.**
- 파괴 승인은 받았는데 GUID 를 기록하지 않아, 나중에 **그 기록을 닫을 대상을 못 찾는다.**

## 원인

- 풀 이름은 사람이 붙이는 라벨이고 시스템 간 유일성이 없다. 유일한 것은 풀 GUID(와 vdev GUID)다.
- `zpool labelclear` 없이 풀만 파괴하면 **디스크에 ZFS 레이블이 남는다.** 다음 설치가 이를 "쓰던 풀"로 읽는다.
- `blkid` 같은 도구는 **읽기 실패와 "레이블 없음"을 같은 결과로** 돌려주기도 한다. 조회가 실패했는데 "깨끗한 디스크"로 판정하면 그대로 파괴 대상이 된다.

## 해결

```bash
# 후보를 GUID 와 함께 본다 (이름만 보지 않는다)
zpool import                      # pool: tank   id: 12345678901234567890
zpool import -o readonly=on 12345678901234567890 tank_check

# 파괴 후에는 레이블까지 지운다 — 안 지우면 재설치가 막힌다
zpool destroy tank
zpool labelclear -f /dev/disk/by-id/<device>

# 남은 레이블 확인
blkid -p /dev/disk/by-id/<device>
zdb -l /dev/disk/by-id/<device>
```

- 파괴 승인 요청·기록에 **풀 GUID 와 구성 장치 목록**을 함께 남긴다. 이름만 남기면 기록을 닫을 수 없다.
- **장치 목록 조회에 실패하면 파괴를 진행하지 않는다.** 무엇을 지웠는지 나중에 확인할 근거가 사라진다.
- 설치 도구의 `status` 에 "정리되지 않은 레이블"을 노출해, 재설치가 막히기 전에 보이게 한다.

## 역할·종류도 이름으로 짐작하지 않는다 (2026-10-23 추가)

같은 원칙은 "어떤 풀인가"뿐 아니라 **"무슨 용도인가"** 에도 적용된다. 실제로 겪은 사례는 둘이다.

- **용도 짐작**: 볼륨 생성 API에 종류 인자가 빠지자 풀 이름에 `meta`·`mdt`·`ost`가 들어 있는지로 용도를 짐작했다. 그 결과 **일반 볼륨이 Lustre 메타데이터 타겟으로 포맷될 수 있었다.**
- **끝부분 일치**: 디스크 시리얼을 끝부분만 비교했더니 `pool0_…`과 `zpool0_…`이 같은 디스크로 잡혔다.

메타데이터는 이름에 숨기지 말고, 명시 인자나 **ZFS 사용자 속성**(`모듈:속성` 형식으로 사용자가 붙이는 키)으로 받는다. 값이 없으면 짐작하지 말고 요청을 거부한다.

```bash
zfs set com.example:role=ost tank/vol0          # 용도를 속성으로 기록
zfs get -H -o value com.example:role tank/vol0  # 읽을 때는 속성만 신뢰, '-' 면 모름 → 거부
lsblk -dn -o NAME,SERIAL | awk -v s="$SERIAL" '$2==s'   # 시리얼은 정확 일치로만
```

## 주의

> [!WARNING]
> `blkid` 의 읽기 실패를 "레이블 없음"으로 합치면 안 된다. **실패와 부재는 다른 상태**이고, 파괴 작업은 실패 쪽에서 멈춰야(fail-closed) 한다. → [[query-failure-vs-empty-state]]

---

## 관련

- [[zfs-commands-cheatsheet]] — import / labelclear / zdb
- [[zfs-multihost-mmp-suspend]] — 다른 호스트가 쓰던 풀을 붙잡을 때의 보호 장치
- [[device-identity-key-wwid]] — 같은 원칙을 디스크에 적용한 경우
- [[query-failure-vs-empty-state]] — 조회 실패와 빈 결과를 구별하기
- [[install-rerun-idempotency]] — 설치 재실행이 잔재를 만나는 문제

---
title: multihost=on 은 디스크가 멀쩡해도 풀을 SUSPENDED 로 만든다
tags:
  - tech
  - troubleshooting
created: 2026-08-24 (월)
---

# multihost=on 은 디스크가 멀쩡해도 풀을 SUSPENDED 로 만든다

> **TL;DR**: `zpool` 속성 `multihost=on` 은 **공유 저장장치를 두 호스트가 동시에 import 하는 것을 막는 장치**(MMP)다. 켜면 1초마다 하트비트를 디스크에 쓰고, `zfs_multihost_fail_intervals`(기본 10)회 연속 실패하면 풀을 **스스로 정지**시킨다. 그래서 디스크 오류 0·전 디스크 ONLINE 인데 풀만 SUSPENDED 인 장애가 난다. ZFS 기본값은 `off` 다 — **단일 호스트에서는 켜지 말고**, HA 라면 `cachefile=none` 과 짝으로 켠다.

## 용어

| 표기 | 원어 | 뜻 |
|---|---|---|
| MMP | Multi-Modifier Protection | `multihost` 속성이 켜는 기능의 이름. 풀 레이블에 하트비트(호스트 ID·시각)를 주기적으로 써서 다른 호스트의 동시 import 를 감지한다 |
| SUSPENDED | — | ZFS 가 I/O 를 전부 멈춘 풀 상태. `zpool status` 에 `state: SUSPENDED` 로 보인다. `zpool clear` 로 재개를 시도한다 |
| HA | High Availability | 한 노드가 죽으면 다른 노드가 같은 저장장치를 이어받는 구성. MMP 는 이 구성에서 이중 import 를 막기 위한 것이다 |
| hostid | — | 호스트 식별자(`/etc/hostid`). MMP 는 이 값으로 "다른 호스트" 를 구분하므로 HA 노드마다 달라야 한다 |

## 증상

- 무거운 쓰기 중 풀이 `SUSPENDED` — 커널 로그에 `MMP writes to pool '<pool>' have not succeeded in over 10175 ms` 류
- `zpool status` 는 모든 vdev `ONLINE`, 오류 카운트 0. 디스크 고장으로 의심해 진단에 시간을 쓰게 된다(실측 이틀)
- 시험 장비에서 두 번 났다면 고객 환경에서도 난다

## 원인

```
man zpoolprops — multihost=on|off
  "... intended to be used in failover configurations where multiple hosts
   have access to a pool on shared storage."   기본값: off
```

켜면 1초(`zfs_multihost_interval=1000`)마다 하트비트를 써야 한다. 디스크가 무거운 I/O 로 하트비트 쓰기를 `fail_intervals × interval`(기본 10초) 동안 밀어내면, ZFS 는 그것을 "다른 호스트가 가져갔을지 모른다" 로 해석해 데이터 보호를 위해 풀을 정지한다. **보호 대상(두 번째 호스트)이 없는 단일 호스트에서는 대가만 남는다.**

풀 생성 자동화가 `zpool create -o multihost=on` 을 **모든 풀에 고정**해 두면 이 함정이 제품 전체에 박힌다. "Lustre 최적화 옵션" 같은 이름으로 문서화돼 있으면 더 오래 산다.

## 해결

```bash
# 판별 — 풀만 SUSPENDED 이고 디스크는 정상인가, MMP 로그가 있는가
zpool status <pool>
dmesg | grep -i mmp
cat /sys/module/zfs/parameters/zfs_multihost_interval        # 1000
cat /sys/module/zfs/parameters/zfs_multihost_fail_intervals  # 10

# 복구 + 재발 차단 (단일 호스트)
zpool clear <pool>
zpool set multihost=off <pool>
zpool get multihost            # 전 풀 확인
```

**정책으로 정할 것**
- 단일 호스트 → `off`(ZFS 기본값). 자동화가 켜고 있다면 조건부로 바꾼다.
- HA → `on` **그리고** `cachefile=none`. Lustre HA 문서는 둘을 함께 요구한다 — 한쪽만 따르면 짝이 안 맞는다([[lustre-ha-drbd-zfs]]). 노드마다 `hostid` 가 달라야 한다.
- 정지 시 **원인을 화면에 드러낸다**. 진단 시간이 문제의 절반이었다.

> [!WARNING]
> 이 해결은 한 번 찾아 놓고 **잃은 적이 있다.** 첫 해결 기록이 롤링(계속 덮어쓰는) 작업 메모에만 있어 10일 뒤 덮였고, 두 달 뒤 같은 장애를 처음부터 재진단했다. 해결 기록은 반영구 문서(운영 노트·이 노트 같은 지식 노트)에 두라 — [[agent-brief-scope-management]].

---

## 관련

- [[lustre-ha-drbd-zfs]] — HA 에서 `multihost=on` + `cachefile=none` 을 함께 쓰는 쪽
- [[zfs-operational-checklist]] — 운영 수칙
- [[zfs-sync-write-weakness]] — 무거운 동기 쓰기가 하트비트를 밀어내는 배경
- [[agent-brief-scope-management]] — 롤링 문서에 둔 기록은 소실된다
- [[zfs-overview]]

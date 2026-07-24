---
title: ZFS Snapshot Clone Dependency
tags:
  - tech
  - zfs
  - storage
created: 2026-05-28 (목)
---

# ZFS Snapshot Clone Dependency

> **TL;DR**: ZFS 스냅샷에 종속 클론이 남아 있으면 `zfs destroy`가 실패한다. 삭제 전에 `clones` 속성을 확인하고, 필요한 경우 종속 볼륨을 먼저 정리한다.

---

## 개요

- **무엇인가**: 스냅샷에서 만들어진 clone이 해당 스냅샷에 의존하는 상태.
- **왜 중요한가**: 종속 클론이 있는 스냅샷은 바로 삭제할 수 없다.
- **언제 보나**: snapshot clone, promote, rollback 흐름이 있는 스토리지 관리 UI나 API.

---

## 확인 방법

스냅샷 삭제 전에 clones 값을 확인한다.

```bash
zfs list -H -o clones <pool>/<dataset>@<snapshot>
```

결과가 비어 있거나 `-`이면 종속 클론이 없는 상태다. 값이 있으면 해당 볼륨이 스냅샷에 의존하고 있으므로 스냅샷 삭제보다 종속 볼륨 정리가 먼저다.

---

## API 처리 패턴

스토리지 API에서는 `zfs destroy` 실패 메시지를 그대로 500으로 노출하기보다, 삭제 전에 의존성을 확인하는 편이 낫다.

권장 흐름:

1. 삭제 대상 스냅샷의 `clones` 속성을 조회한다.
2. 종속 클론이 있으면 409 Conflict를 반환한다.
3. 응답 메시지에는 먼저 삭제해야 할 종속 볼륨을 포함한다.
4. `clones` 조회 자체가 실패하면 destroy로 넘어가지 않고 검사 실패로 처리한다.

이렇게 하면 사용자는 "스냅샷 삭제 실패"가 아니라 "먼저 어떤 볼륨을 정리해야 하는지"를 알 수 있다.

---

## 주의사항

> [!WARNING]
> `zfs list` 명령이 실패했는데도 빈 clones로 취급하면 안 된다. 권한, dataset 이름, ZFS 상태 문제를 숨긴 채 destroy로 넘어가면 더 모호한 실패가 된다.

---

## 관련

- [[zfs]]
- [[zfs-overview]]

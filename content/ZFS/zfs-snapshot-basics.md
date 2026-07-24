---
title: ZFS 스냅샷 기본 명령어
tags:
  - tech
  - storage
  - zfs
created: 2026-05-18 (월)
---

# ZFS 스냅샷 기본 명령어

> **TL;DR**: ZFS 스냅샷은 COW 구조 덕분에 거의 즉시 생성되며 변경분만큼만 용량을 차지한다. 생성·목록·롤백·삭제 명령은 다음과 같다.

---

## 명령어

```bash
# 스냅샷 생성 (거의 즉시, 용량 차이만큼만 점유)
zfs snapshot tank/data@2026-05-18

# 목록
zfs list -t snapshot

# 롤백
zfs rollback tank/data@2026-05-18

# 삭제
zfs destroy tank/data@2026-05-18
```

---

## 주의

스냅샷에서 만든 clone이 남아 있으면 `zfs destroy`가 실패한다. 삭제 전 종속 클론 확인은 [[zfs-snapshot-clone-dependency]] 참고.

---

## 관련

- [[zfs]]
- [[zfs-snapshot-clone-dependency]]

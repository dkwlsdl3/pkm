---
title: by-id 심링크를 canonicalize하면 안정성이 사라지는 함정
tags:
  - tech
created: 2026-06-01 (월)
---

# by-id 심링크를 canonicalize하면 안정성이 사라지는 함정

> **TL;DR**: `/dev/disk/by-id/`는 UUID와 함께 쓸 수 있는 안정 식별자지만, 코드에서 `canonicalize()`로 실디바이스 노드(`/dev/sdX`)까지 풀어버린 뒤 그 값을 저장하면 재부팅 시 디바이스 번호가 뒤섞이는 문제에 그대로 노출된다.

---

## 안티패턴

디스크 시리얼로 장치를 찾는 코드에서 흔한 함정:

```rust
// 안티패턴: by-id 심링크를 찾아놓고 canonicalize로 /dev/sdX까지 풀어버림
let real = std::fs::canonicalize("/dev/disk/by-id/scsi-...")?; // → "/dev/sda"
// 이 /dev/sda를 fstab에 기록하면 재부팅 시 sda↔sdb 뒤섞임에 그대로 노출
```

## 핵심

- 장치를 **찾을 때** by-id를 쓰는 것과, fstab(또는 설정 파일)에 **기록할 때** 무엇을 쓰는지는 별개다. 안정 심링크를 손에 쥐고도 실디바이스 노드로 풀어서 저장하면 안정성이 사라진다.
- 런타임 `mount`는 `/dev/sdX`든 by-id든 UUID든 다 동작하므로, **저장(fstab 등)에는 안정 식별자(by-id 심링크 경로 또는 `UUID=`) 원본을 그대로** 남겨야 한다.

---

## 관련

- [[fstab-uuid-mount]] — fstab에서 UUID를 써야 하는 이유

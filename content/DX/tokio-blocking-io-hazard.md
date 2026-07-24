---
title: Tokio Blocking I/O 위험
tags:
  - tech
  - dx
  - rust
  - troubleshooting
created: 2026-05-21 (목)
---

# Tokio Blocking I/O 위험

> **TL;DR**: Tokio 비동기 런타임에서 `std::fs` 같은 동기 파일시스템 호출은 네트워크 파일시스템에서 worker thread를 막을 수 있으므로 `spawn_blocking`으로 격리해야 한다.

---

`std::path::Path::exists()` 같은 동기 파일시스템 호출은 Lustre/NFS 같은 네트워크 파일시스템에서 위험할 수 있다. 다만 실제 원인인지 확인하려면 로그, task 구조, 호출 빈도, worker 점유 범위를 같이 봐야 한다.

```rust
let path_owned = path.to_string();
let exists = tokio::task::spawn_blocking(move || {
    std::path::Path::new(&path_owned).exists()
})
.await
.unwrap_or(false);
```

---

## 관련

- [[rust-backend-troubleshooting]]

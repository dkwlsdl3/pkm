---
title: utoipa-swagger-ui vendored로 빌드 시 다운로드 제거
tags:
  - tech
created: 2026-06-01 (월)
---

# utoipa-swagger-ui vendored로 빌드 시 다운로드 제거

> **TL;DR**: `utoipa-swagger-ui`의 `build.rs`는 Swagger UI zip을 빌드 시점에 다운로드한다 — `vendored` feature를 켜면 정적 자산을 번들해 네트워크 의존을 없앨 수 있다.

---

## 문제

- `utoipa-swagger-ui`의 `build.rs`는 Swagger UI zip을 **다운로드**한다. 이미지의 `curl-minimal`은 기능이 부족해 `curl: (4)`로 실패.
- `features = ["vendored"]`를 켜면 정적 자산을 번들해 **다운로드 자체가 사라진다**. (openssl의 vendored와는 무관한 별개 feature — 이름만 같다.)

## 해결

```toml
utoipa-swagger-ui = { version = "...", features = ["vendored"] }
```

---

## 관련

- [[rust-build-system-deps]]

---
title: openssl vendored 빌드와 시스템 링크
tags:
  - tech
created: 2026-06-01 (월)
---

# openssl vendored 빌드와 시스템 링크

> **TL;DR**: `openssl`의 `vendored` feature는 OpenSSL을 소스에서 컴파일하므로 perl 등이 없는 슬림 이미지에서 실패한다 — 전이 의존일 뿐이라면 제거하고 시스템 openssl에 링크하는 편이 가볍고 안전하다.

---

## 문제

- `openssl = { features = ["vendored"] }`는 OpenSSL을 **소스에서 컴파일**한다 → perl(`IPC::Cmd` 등)이 없는 이미지에서 실패.
- 코드가 openssl을 직접 안 쓰고 전이 의존(예: `webauthn-rs`)일 뿐이고, 이미지에 `openssl-devel` + `pkg-config`가 있으면 **`vendored`를 제거**해 시스템 openssl에 링크하는 편이 가볍고 안전하다.

## 해결

```toml
# Before
openssl = { version = "0.10", features = ["vendored"] }
# After: 줄 제거 → 시스템 openssl-devel 링크 (pkg-config 필요)
```

---

## 관련

- [[rust-build-system-deps]]

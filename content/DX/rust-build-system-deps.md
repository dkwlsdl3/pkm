---
title: Rust 빌드의 시스템·네트워크 의존
tags:
  - tech
created: 2026-06-01 (월)
---

# Rust 빌드의 시스템·네트워크 의존

> **TL;DR**: Rust 빌드는 순수해 보여도 일부 크레이트가 **빌드 시점에 시스템 라이브러리를 링크하거나 외부 파일을 다운로드**한다. 빌더 이미지처럼 최소 환경에서 깨지기 쉽다. 가능한 한 시스템 라이브러리에 링크하거나 자산을 번들(vendored)해 외부 의존을 없앤다.

---

## 개요

- **무엇인가**: Rust 크레이트의 빌드타임 외부 의존(시스템 lib 링크, 네트워크 다운로드, 소스 컴파일)을 진단·제거하는 패턴
- **왜 쓰는가**: 로컬에선 빌드되는데 슬림한 CI 빌더 이미지에선 perl/curl/devel 패키지 부재로 실패하는 일이 잦다
- **언제 쓰는가**: 백엔드를 컨테이너 이미지에서 빌드할 때, 빌드 실패가 코드가 아니라 환경에서 날 때

---

## 핵심 개념

### 1. openssl — `vendored`는 소스 컴파일, 시스템 링크가 가볍다

- `openssl = { features = ["vendored"] }`는 OpenSSL을 **소스에서 컴파일**한다 → perl(`IPC::Cmd` 등)이 없는 이미지에서 실패.
- 코드가 openssl을 직접 안 쓰고 전이 의존(예: `webauthn-rs`)일 뿐이고, 이미지에 `openssl-devel` + `pkg-config`가 있으면 **`vendored`를 제거**해 시스템 openssl에 링크하는 편이 가볍고 안전하다.

```toml
# Before
openssl = { version = "0.10", features = ["vendored"] }
# After: 줄 제거 → 시스템 openssl-devel 링크 (pkg-config 필요)
```

### 2. utoipa-swagger-ui — 빌드 시 다운로드 → `vendored`로 제거

- `utoipa-swagger-ui`의 `build.rs`는 Swagger UI zip을 **다운로드**한다. 이미지의 `curl-minimal`은 기능이 부족해 `curl: (4)`로 실패.
- `features = ["vendored"]`를 켜면 정적 자산을 번들해 **다운로드 자체가 사라진다**. (openssl의 vendored와는 무관한 별개 feature — 이름만 같다.)

```toml
utoipa-swagger-ui = { version = "...", features = ["vendored"] }
```

### 3. exacl → `-lacl` (libacl)

- `exacl` 크레이트는 `-lacl`로 링크된다. 이미지에 `libacl-devel`이 없으면 링크 단계에서 실패.
- 해결: 빌더 이미지에 `libacl-devel` 추가 → [[dockerfile-dnf-before-conda]] (dnf는 conda 이전 블록에).

### 진단 팁

- 링크 실패 시 링크 커맨드의 **비표준 라이브러리 플래그**(`-lacl -lssl -lcrypto` 등)를 보면 어떤 `*-devel`이 필요한지 역추적할 수 있다.
- 로컬에서 `cargo check --release`로 (소스 컴파일/다운로드형) 의존은 미리 잡고, 링크형(시스템 lib) 의존은 실제 빌더 이미지에서 확인한다.

---

## 주의사항

> [!WARNING]
> "openssl vendored"와 "swagger-ui vendored"는 **같은 단어, 다른 의미**다. 전자는 소스 컴파일(보통 끄는 게 이득), 후자는 자산 번들(보통 켜는 게 이득). 무지성으로 모든 `vendored`를 켜거나 끄지 말 것.

---

## 관련

- [[rust-cargo]] — Cargo 기본·크로스 컴파일
- [[rust-backend-troubleshooting]] — 런타임 hang 진단
- [[dockerfile-dnf-before-conda]] — 시스템 lib을 이미지에 추가하는 순서
- [[dx-overview]]

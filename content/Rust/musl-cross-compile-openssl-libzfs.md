---
title: Rust musl 크로스빌드 — openssl vendored / libzfs 한계
tags:
  - tech
created: 2026-06-18 (목)
---

# Rust musl 크로스빌드 — openssl vendored / libzfs 한계

> **TL;DR**: Rust 바이너리를 musl 정적빌드할 때 `openssl-sys`는 vendored feature로 해결되지만, `libzfs-sys`는 사실상 불가 → CI 빌드서버 필요.

---

## 개요

- **무엇인가**: glibc 호스트(Ubuntu)에서 Rocky 배포용 musl 정적 바이너리를 빌드할 때 C 라이브러리 의존(`*-sys` crate) 문제
- **왜 쓰는가**: Rust 컴포넌트를 musl static으로 빌드해 glibc 버전 불일치 없이 배포
- **언제 쓰는가**: `cargo build --release --target x86_64-unknown-linux-musl`이 `*-sys`에서 실패할 때

---

## 핵심 개념

### 1. openssl-sys → vendored로 해결 가능
- 증상: musl 타겟 빌드 시 `openssl-sys`가 시스템 openssl을 pkg-config로 못 찾아 실패
- 원인: 로컬에 musl용 openssl 크로스 환경이 없음 (간접 의존 — 예: `webauthn-rs`가 openssl을 끌어옴)
- 해결: **openssl `vendored` feature**로 소스에서 정적 빌드
```toml
# Cargo.toml [dependencies] — 코드에서 직접 안 써도 feature unification으로 적용
openssl = { version = "0.10", features = ["vendored"] }
```
- 단, vendored는 OpenSSL을 소스에서 컴파일하므로 빌드머신에 perl·make가 필요 — RHEL/Rocky 최소 이미지에서는 perl 모듈 누락으로 실패할 수 있다. 자세한 증상/해결은 [[openssl-sys-vendored-perl-deps]] 참고.

### 2. libzfs-sys → 로컬 musl 빌드 사실상 불가
- `libzfs-sys`/`libzetta-zfs-core-sys`/`nvpair-sys`(ZFS 라이브러리 바인딩)는 **시스템 libzfs를 링크**
- ZFS는 glibc 의존이 깊어 **musl 정적 크로스빌드가 사실상 불가**
- → ZFS 라이브러리에 의존하는 컴포넌트는 **CI 빌드서버(전용 musl+ZFS 환경)에서 빌드**해야 함

### 3. 진단 순서
```bash
cargo tree -i openssl-sys        # 어느 crate가 끌어오는지
which perl make musl-gcc          # vendored 빌드 도구
rustup target list --installed | grep musl
```

---

## 주의사항

> [!WARNING]
> - vendored openssl은 빌드에 perl·make가 필요하고 빌드 시간이 늘어난다.
> - libzfs를 musl로 억지로 빌드하려 시간 쓰지 말 것 — CI 환경이 정답.
> - 빌드 직후 산출물 mtime을 확인해 "실제 재빌드됐는지" 검증(캐시로 옛 바이너리가 남을 수 있음).

---

## 관련

- [[rust-overview]] — Rust 언어 함정·패턴
- [[zfs-overview]] — ZFS(libzfs 의존 배경)
- [[openssl-sys-vendored-perl-deps]] — vendored openssl 소스빌드 시 perl 모듈 의존성

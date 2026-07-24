---
title: Rust / Cargo
tags:
  - tech
created: 2026-05-14 (목)
---

# Rust / Cargo

> **TL;DR**: Rust는 메모리 안전성을 컴파일 타임에 보장하는 시스템 언어 — Cargo는 빌드/패키지 매니저

---

## Cargo 핵심 명령어

```bash
cargo build              # 디버그 빌드 (target/debug/)
cargo build --release    # 최적화 빌드 (target/release/)
cargo run                # 빌드 + 실행
cargo test               # 테스트 실행
cargo add <크레이트>       # 의존성 추가 (Cargo.toml 자동 업데이트)
cargo update             # 의존성 업데이트
```

---

## 크로스 컴파일

```bash
# 타겟 추가
rustup target add x86_64-unknown-linux-musl

# 타겟 지정 빌드
cargo build --release --target x86_64-unknown-linux-musl
```

주요 타겟:
- `x86_64-unknown-linux-gnu` — 기본 Linux (glibc)
- `x86_64-unknown-linux-musl` — musl 정적 링크
- `aarch64-unknown-linux-gnu` — ARM64

---

## Cargo.toml 구조

```toml
[package]
name = "my-app"
version = "0.1.0"
edition = "2021"

[dependencies]
tokio = { version = "1", features = ["full"] }
serde = { version = "1", features = ["derive"] }

[profile.release]
opt-level = 3
strip = true   # 디버그 심볼 제거 → 바이너리 크기 축소
```

---

## 왜 Rust인가

언어 특징 비교는 [[rust-language-features]] 참고.

---

## 관련

- [[rust-language-features]]
- [[musl-static-binary]]
- [[dx-overview]]

---

## rustfmt.toml — 포맷 설정

```toml
# rustfmt.toml (프로젝트 루트)
edition = "2024"
max_width = 100
```

```bash
# 전체 적용
cargo fmt

# 확인만 (변경 없음)
cargo fmt --check
```

> `edition = "2024"` 지정 시 최신 Rust edition 포맷 규칙 적용. `max_width = 100`은 기본값(80)보다 넓어 긴 타입 체인에 유리.

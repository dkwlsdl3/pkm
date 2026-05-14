---
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

| 특징 | 설명 |
|---|---|
| 메모리 안전성 | GC 없이 컴파일러가 메모리 버그 방지 |
| 성능 | C/C++ 수준 |
| 동시성 | data race를 컴파일 타임에 차단 |
| 에러 처리 | `Result<T, E>` 타입으로 명시적 처리 |

---

## 관련

- [[musl-static-binary]]
- [[dx-overview]]

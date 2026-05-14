---
tags:
  - tech
created: 2026-05-14 (목)
---

# musl / Static Binary

> **TL;DR**: glibc 버전 불일치 문제를 musl 정적 빌드로 해결 — 어떤 Linux에서나 실행되는 단일 바이너리

---

## 문제: glibc 버전 불일치

C 표준 라이브러리(glibc)는 버전 하위 호환성이 있지만 상위 호환은 없음.

```
빌드 환경: Ubuntu 22.04 → glibc 2.35
실행 환경: Rocky Linux 8 → glibc 2.28

→ 빌드한 바이너리가 Rocky에서 실행 안 됨
  "version 'GLIBC_2.33' not found"
```

---

## 해결: musl + 정적 링크

**musl** — glibc 대체 경량 C 표준 라이브러리. 정적 링크에 적합.

정적 바이너리 = 모든 라이브러리를 바이너리 안에 포함 → glibc 의존성 없음.

```bash
# Rust에서 musl 타겟 추가
rustup target add x86_64-unknown-linux-musl

# musl 크로스컴파일러 설치
sudo apt install -y musl-tools

# 정적 바이너리 빌드
cargo build --release --target x86_64-unknown-linux-musl
```

결과물: `target/x86_64-unknown-linux-musl/release/binary`
→ Rocky Linux 8, Alpine Linux, 어디서든 실행 가능.

---

## 동적 vs 정적 링크

| | 동적 링크 | 정적 링크 |
|---|---|---|
| 파일 크기 | 작음 | 큼 (라이브러리 포함) |
| 의존성 | 실행 환경에 라이브러리 필요 | 없음 |
| 이식성 | 낮음 | **높음** |
| 빌드 시간 | 빠름 | 느림 |

---

## 관련

- [[os-overview]]
- [[rust-cargo]]

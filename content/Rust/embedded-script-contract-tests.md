---
title: Embedded Script Contract Tests
tags:
  - tech
created: 2026-06-05 (금)
---

# Embedded Script Contract Tests

> **TL;DR**: Rust 코드가 셸 스크립트나 systemd unit 문자열을 생성한다면, 문자열을 const로 분리하고 핵심 운영 계약을 단위테스트로 고정한다.

---

## 개요

- **무엇인가**: 코드 안에 포함된 스크립트/unit 텍스트의 중요한 옵션, timeout, 명령 순서를 테스트로 확인하는 패턴
- **왜 쓰는가**: 배포 스크립트는 컴파일러가 의미를 검증하지 못하므로, 작은 문자열 수정이 운영 복구 동작을 망가뜨릴 수 있다
- **언제 쓰는가**: Rust 설정 도구가 `/usr/local/sbin/*.sh`, systemd service/timer, sudoers, fstab 같은 운영 파일을 생성할 때

---

## 핵심 개념

### 문자열을 함수 내부에 묻지 않기

테스트하려면 생성 텍스트를 재사용 가능한 상수나 helper로 끌어올린다.

```rust
const WATCHDOG_SCRIPT: &str = r#"#!/usr/bin/env bash
set -euo pipefail

if mountpoint -q "$MOUNTPOINT" && timeout 5 stat "$MOUNTPOINT" >/dev/null; then
  exit 0
fi

timeout 30 umount -l "$MOUNTPOINT" || true
systemctl restart "$AUTOMOUNT_UNIT"
"#;

const WATCHDOG_SERVICE: &str = r#"[Service]
Type=oneshot
ExecStart=/usr/local/sbin/mnt-data-watchdog.sh
TimeoutStartSec=180
"#;
```

### 운영 계약만 테스트하기

문자열 전체 snapshot보다 "깨지면 운영 장애가 되는 조건"을 직접 단언한다.

```rust
#[test]
fn watchdog_script_checks_io_with_timeout() {
    assert!(WATCHDOG_SCRIPT.contains("timeout 5 stat"));
}

#[test]
fn watchdog_script_bounds_lazy_unmount() {
    assert!(WATCHDOG_SCRIPT.contains("timeout 30 umount -l"));
}

#[test]
fn watchdog_service_has_outer_timeout() {
    assert!(WATCHDOG_SERVICE.contains("TimeoutStartSec=180"));
}
```

---

## 코드 / 사용 예시

```rust
fn write_watchdog_files(root: &Path) -> std::io::Result<()> {
    std::fs::write(root.join("mnt-data-watchdog.sh"), WATCHDOG_SCRIPT)?;
    std::fs::write(root.join("mnt-data-watchdog.service"), WATCHDOG_SERVICE)?;
    Ok(())
}
```

---

## 주의사항

> [!WARNING]
> 테스트가 구현 문자열 전체에 과하게 붙으면 리팩토링 때 소음이 커진다. timeout, 위험 명령 순서, 실행 유저, unit dependency처럼 운영 의미가 있는 계약만 고정한다.

---

## 관련

- [[rust-overview]]
- [[systemd-automount-watchdog]]

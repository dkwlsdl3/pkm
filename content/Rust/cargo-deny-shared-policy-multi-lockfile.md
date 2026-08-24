---
title: cargo-deny 정책 하나를 여러 Cargo.lock 그래프가 공유하기
tags:
  - tech
created: 2026-08-24 (월)
---

# cargo-deny 정책 하나를 여러 Cargo.lock 그래프가 공유하기

> **TL;DR**: 루트 워크스페이스 없이 `Cargo.lock` 이 여러 개인 레포에서 cargo-deny 정책을 한 파일로 두려면 **크레이트마다 `--config` 로 넘겨 따로 호출**해야 한다. 함정 다섯: ① 매니페스트 디렉터리 밖의 `deny.toml` 은 자동으로 안 읽힌다 ② `unmaintained` 를 경고로 두는 것은 설정이 아니라 호출 인자(`-W unmaintained`)다 ③ 공유 파일의 `ignore` 는 **모든 그래프**에서 면제된다 ④ 자체 크레이트의 `license = "Proprietary"` 는 SPDX 가 아니라 파싱 실패 — `publish = false` + `[licenses.private]` 로 뺀다 ⑤ `licenses.clarify` 테이블은 검사가 아니라 **영구 우회**다.

## 용어

| 표기 | 원어 | 뜻 |
|---|---|---|
| cargo-deny | — | Rust 의존성 그래프에서 취약점(advisory)·라이선스·중복·출처를 검사하는 도구. 정책은 `deny.toml` |
| SPDX | Software Package Data Exchange | 라이선스 식별자 표준(`MIT`, `Apache-2.0`). cargo-deny 는 이 표현식만 해석한다 |
| advisory | — | RustSec 데이터베이스에 등재된 취약점·미유지·yanked 알림. ID 는 `RUSTSEC-YYYY-NNNN` |
| permissive | — | 고지 정도만 요구하는 라이선스(MIT·BSD·Apache 등). 카피레프트(GPL 계열)의 반대 |

## 개요

- **무엇**: 서로 독립인 Rust 그래프 N 개(예: 백엔드·데몬·CLI·공용 크레이트)에 같은 정책을 적용하는 구성.
- **왜 / 언제**: 크레이트별로 `deny.toml` 을 두면 N 벌이 서로 다르게 드리프트한다([[code-fork-drift]]). 그 대가로 그래프 구분이 사라지는 자리가 생기니 그것을 알고 써야 한다.

## 동작 / 예시

```bash
# 매니페스트 디렉터리에서, 루트의 공유 정책을 명시적으로 넘긴다
cd service/backend && cargo deny --locked --config ../../deny.toml check -W unmaintained advisories licenses
cd monitoring-daemon && cargo deny --locked --config ../deny.toml  check -W unmaintained advisories licenses
# 기능 플래그가 있는 크레이트는 CI 가 빌드하는 조건과 같게
cd durable-file     && cargo deny --locked --all-features --config ../deny.toml check -W unmaintained advisories licenses
```

세 인자가 모두 정책의 일부다.
- `--locked` 를 빼면 커밋된 lock 과 다른 그래프를 조용히 해석할 수 있다.
- `-W unmaintained` 를 빼면 정책보다 **강하게** 막힌다. `[advisories] unmaintained` 필드는 심각도가 아니라 **범위**(`all`/`workspace`/`transitive`/`none`)라 파일에서는 경고로 만들 수 없다. `none` 으로 끄면 "알고는 있다" 조차 사라진다.
- `-D warnings` 를 붙이면 unmaintained 가 다시 실패로 올라간다.

⇒ 정책 일부가 호출 인자에 살기 때문에 CI 는 이 명령을 직접 쓰지 말고 **한 곳에 고정한 래퍼**를 부른다.

```toml
[graph]
# 고정하지 않으면 windows·wasm 전용 크레이트가 판정 대상에 들어온다
# (실측: 라이선스 거부 5건 중 4건이 배포하지 않는 타깃의 것이었다)
targets = ["x86_64-unknown-linux-gnu", "x86_64-unknown-linux-musl"]

[advisories]
yanked = "deny"
unused-ignored-advisory = "warn"   # 낡은 면제가 조용히 남는 것을 드러낸다
ignore = []                        # 🔴 공유 파일에서는 비워 둔다 (아래 주의)

[licenses]
allow = ["MIT", "Apache-2.0", "BSD-3-Clause", "..."]   # 열거된 것만 통과. 없는 것은 자동 거부

[licenses.private]
ignore = true      # publish = false 인 크레이트는 라이선스 검사에서 뺀다
```

```toml
# 자체 크레이트 N 개의 Cargo.toml 모두에
[package]
publish = false
```

## 주의

> [!WARNING]
> **공유 `ignore` 는 그래프를 구분하지 못한다.** 한 그래프에서만 무해한 RUSTSEC ID 를 넣으면 다른 그래프의 같은 취약점이 조용히 통과한다. `unused-ignored-advisory` 는 이 오면제를 못 잡는다 — 그 advisory 가 아예 없는 그래프에서만 경고한다. 특정 그래프에만 예외가 필요하면 **그 크레이트용 별도 config** 를 만들어 그쪽에만 넘긴다.

> [!WARNING]
> **`license = "Proprietary"` 는 SPDX 표현식이 아니다.** 파싱 실패로 `unlicensed` 가 뜬다. 이것을 `licenses.clarify` 테이블 + `license-files = []` 로 덮으면 매니페스트보다 먼저 평가돼 **영구 우회**가 된다(적대검증에서 "검사 우회" 판정). 올바른 길은 `publish = false` + `[licenses.private] ignore = true` 이고, 이 둘은 **한 쌍**이다 — 어느 매니페스트에서 `publish = false` 를 지우면 그 크레이트가 되살아난다.

> [!WARNING]
> **allowlist 를 넓히는 것은 정책 변경이다.** "실측하다 permissive 를 발견했다" 는 근거가 아니다. 정책 소유자 결정을 받고, 넓힌 라이선스의 **조건(고지 동봉·변경 표시)** 을 후속 작업으로 등재한다. 스캔이 초록인 것과 배포 의무를 지킨 것은 다르다.

처음 켤 때는 **비차단(allow_failure) 파일럿 잡**으로 몇 회 관측한 뒤 게이트로 올린다. 켜는 순간 여러 그래프가 동시에 실패하는 것이 정상이다(실측 5그래프 중 3그래프).

---

## 관련

- [[code-fork-drift]] — 정책 파일을 N 벌 두면 드리프트한다(공유 파일을 택한 이유)
- [[allow-failure-hides-fail-fast-skip]] — 파일럿 잡을 게이트로 착각하지 말 것
- [[rust-cargo]] — cargo 기본
- [[rust-overview]]

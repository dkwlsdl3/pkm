---
title: cargo mutants --lib 는 통합시험을 안 돌려 잠긴 자리도 MISSED 로 보고한다
tags:
  - tech
  - troubleshooting
created: 2026-08-24 (월)
---

# cargo mutants --lib 는 통합시험을 안 돌려 잠긴 자리도 MISSED 로 보고한다

> **TL;DR**: `cargo mutants --lib` 는 각 변이마다 **라이브러리 단위시험만** 돌린다. `tests/*.rs` 통합시험이 이미 잡는 자리도 MISSED 로 나오므로, MISSED 를 "시험 공백" 으로 읽으면 **불필요한 시험을 쓰게 된다**. MISSED 는 통합시험 포함으로 재판정한 뒤에만 실공백이다. `--re` 로 변이를 고르는 필터는 구조체 필드 삭제 변이를 걸러내지 않는다.

## 용어

| 표기 | 원어 | 뜻 |
|---|---|---|
| 뮤테이션 시험 | mutation testing | 코드를 일부러 망가뜨린 변이(mutant)를 만들고 시험이 그것을 잡는지(CAUGHT) 놓치는지(MISSED) 보는 시험 실효성 측정 |
| cargo-mutants | — | Rust 용 뮤테이션 도구. 함수 반환값 치환·연산자 교체·필드 삭제 등을 자동 생성 |
| `--lib` | — | 변이마다 `cargo test --lib`(라이브러리 타깃의 단위시험)만 실행하는 옵션. 통합시험·doctest 를 건너뛰어 빠르다 |

## 증상

- 16변이 중 5 MISSED. 그런데 그 자리들은 **방금 통합시험으로 잠근 곳**이다
- 재판정하면 5건 중 3건은 통합시험이 잡는다 — 실공백은 2건뿐

## 원인

`--lib` 는 속도를 위해 통합시험을 제외한다. 보호 장치의 fail-closed 처럼 **DB 나 HTTP 경계에서만 드러나는 동작**은 대개 통합시험(`tests/*.rs`)에 있으므로, 이 옵션으로는 구조적으로 못 잡는다. MISSED 가 도구의 시야 밖에서 온 것인지 진짜 공백인지 결과만으로는 구분되지 않는다.

`--re '<정규식>'` 으로 변이를 함수 이름으로 좁혀도, **구조체 필드 삭제 변이**(`delete field x`)는 그 필터와 무관하게 포함된다. 대상 함수 개수보다 변이가 많으면 이것이다.

## 해결

```bash
# 1) 빠른 1차 — --lib 로 훑고 MISSED 목록만 얻는다
cargo mutants --lib --re 'login|lockout' -j 4

# 2) MISSED 재판정 — 일회용 워크트리에서 통합시험 포함으로 그 변이만 다시
git worktree add ../mut-recheck HEAD
cd ../mut-recheck
cargo mutants --re 'login::otp_required' --test-tool cargo -- --test login_protection_fail_closed
#   (또는 --lib 를 빼고 전체 시험을 돌린다. 느리지만 변이 수가 적으면 견딜 만하다)

# 3) 그래도 MISSED 인 것만 시험을 추가한다
```

- MISSED 를 **바로 시험 공백으로 등재하지 않는다.** "통합시험 포함 재판정" 을 거친 뒤에만 공백이다.
- 필드 삭제 변이가 섞이면 `--re` 만 믿지 말고 결과의 변이 종류를 확인한다.
- DB 시험이 필요한 변이 재판정은 시험용 DB 접속이 워크트리에도 보여야 한다(`.env` 심링크 등) — 없으면 통합시험이 전부 실패해 **모든 변이가 CAUGHT 로 보이는 반대 착시**가 난다.

---

## 관련

- [[mutation-check-test-effectiveness]] — 뮤테이션 확인의 원칙(green 은 주장일 뿐)
- [[sqlx-fetch-optional-ok-flatten-fail-open]] — 이 재판정에서 실공백 2건이 나온 결함 계열
- [[test-selection-zero-match]] — "시험을 골랐는데 0건" 도 같은 착시 계열
- [[testing-overview]]

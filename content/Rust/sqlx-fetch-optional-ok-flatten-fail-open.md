---
title: fetch_optional 뒤의 .ok().flatten() 은 DB 오류를 기본값으로 바꾼다
tags:
  - tech
  - troubleshooting
created: 2026-08-24 (월)
---

# fetch_optional 뒤의 .ok().flatten() 은 DB 오류를 기본값으로 바꾼다

> **TL;DR**: `query.fetch_optional(&pool).await` 는 `Result<Option<T>>` 를 돌려준다. 여기에 `.ok().flatten().unwrap_or(default)` 를 붙이면 **DB 오류(`Err`)와 행 없음(`None`)이 같은 기본값**이 된다. 보호 장치(OTP 필수·잠금 임계·리더 보호)의 입력이 이 꼴이면 **DB 가 삐끗한 순간 보호가 꺼진다**(fail-open). `Err` 는 500 으로 올리고 `None` 만 기본값으로 갈라라.

## 용어

| 표기 | 원어 | 뜻 |
|---|---|---|
| fail-open / fail-closed | — | 판정 근거를 못 얻었을 때 통과시키는가(open) 막는가(closed). 보호 장치는 closed 여야 한다 |
| OTP | One-Time Password | 일회용 비밀번호. 여기서는 "로그인에 OTP 를 요구하는가" 설정 |
| sqlx | — | Rust 의 컴파일 타임 검증 SQL 라이브러리. `fetch_one`·`fetch_optional`·`fetch_all` 이 결과 개수 계약을 정한다 |

## 증상

- 설정 화면에서 OTP 필수를 켰는데, DB 연결이 잠깐 끊긴 사이 들어온 로그인이 OTP 없이 통과한다
- 로그인 실패 횟수 조회가 실패하면 잠금 임계에 절대 도달하지 않는다 — **비밀번호 무제한 대입**이 열린다
- 오류 로그가 없다. 요청은 정상 응답이고, 관리자 화면은 "OTP 꺼짐"을 **사실처럼** 표시한다

같은 결함이 한 코드베이스에서 **9자리**, 그중 같은 조회의 복제가 3벌이었다. 하나 찾으면 같은 모양을 전수 검색해야 한다.

## 원인

```rust
// fail-open — Err 와 None 이 모두 false 가 된다
let otp_required: bool = sqlx::query_scalar("SELECT value FROM settings WHERE key = $1")
    .bind("otp_required")
    .fetch_optional(&pool).await
    .ok()          // Err → None
    .flatten()     // Option<Option<bool>> → Option<bool>
    .unwrap_or(false);
```

`.ok()` 가 오류를 `None` 으로 접고, `.flatten()` 이 그것을 "행 없음" 과 합친다. 이 체인은 짧고 그럴듯해서 리뷰에서 지나간다.

**COUNT 는 더 나쁘다.** `SELECT COUNT(*)` 는 행이 항상 하나이므로 `Ok(None)` 이 나올 수 없다. 즉 아래 `unwrap_or` 가 삼키는 것은 **순수하게 오류만**이다.

```rust
// "행 없음 대비" 로 보이지만 실제로는 오류만 삼킨다
let (failed,): (i64,) = sqlx::query_as("SELECT COUNT(*) FROM login_attempts WHERE ...")
    .fetch_one(&pool).await
    .unwrap_or((0,));   // DB 오류 → 실패 0회 → 잠금 안 걸림
```

## 해결

`Err` 와 `None` 을 **다른 분기**로 다룬다. 보호 장치는 `Err` 에서 요청을 거절한다.

```rust
let otp_required = match sqlx::query_scalar::<_, bool>(SQL)
    .bind("otp_required")
    .fetch_optional(&pool).await
{
    Ok(Some(v)) => v,
    Ok(None)    => false,                       // 설정 행이 없다 = 기본값. 이것만 기본값이다
    Err(e) => {
        tracing::error!("otp_required 조회 실패: {e}");
        return Err(ApiError::Internal);         // 500. 보호 여부를 모르면 진행하지 않는다
    }
};
```

**시험은 조회를 실패시켜 잠근다.** 닫힌 커넥션 풀(`PgPoolOptions::new().max_connections(1)` 로 만들고 `pool.close().await`)로 핸들러를 부르면 모든 조회가 `Err` 가 된다 — 그때 500 이 나와야 한다. 이 시험은 **배선 하나만 끊어도 통과하는 시험**이 되기 쉬우니, 고친 자리마다 각각 실패시켜 본다(실측에서 그 결함이 시험 쪽에 있었다).

같은 함수 안의 **비대칭이 단서**다. 한 조회는 `.map_err(|e| { error!(..); e }).unwrap_or(0)` 로 로그라도 남기고, 바로 옆 조회는 `.unwrap_or(None)` 이면 뒤쪽이 놓친 자리다.

> [!WARNING]
> 실패를 "기본값" 으로 접는 것이 안전한 경우는 **기본값이 더 엄격한 쪽**일 때만이다(예: 조회 실패 → "권한 없음"). 그런데 `unwrap_or(false)` 는 "OTP 불필요", `unwrap_or(0)` 은 "실패 0회" 라 둘 다 **느슨한 쪽**이다. 기본값의 방향을 먼저 물어라.

---

## 관련

- [[unknown-is-not-absent]] — 이 결함군의 일반형("모름"을 "없음"으로 접지 말라)
- [[verdict-missing-value-fail-open]] — 판정 값이 비면 통과시키는 같은 계열
- [[sqlx-integer-i64-decode-mismatch]] — 디코딩 실패를 `unwrap_or(0)` 이 삼키는 사례
- [[path-exists-conflates-stat-failure]] — `exists()` 가 stat 실패를 "없음" 으로 접는 파일시스템 판
- [[mutation-check-test-effectiveness]] — 고친 시험이 실제로 잡는지 되돌려 확인
- [[rust-overview]]

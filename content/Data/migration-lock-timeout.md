---
title: 마이그레이션에는 lock_timeout 을 건다
tags:
  - tech
  - troubleshooting
created: 2026-08-18 (화)
---

# 마이그레이션에는 lock_timeout 을 건다

> **TL;DR**: 스키마 변경이 잠금을 못 얻으면 **오류가 나지 않고 그냥 기다린다.** 기다림은 실패가 아니라서 복구 경로도 열리지 않는다 — 결과는 "영원히 안 끝나는 설치 + 멈춰 있는 서비스". `lock_timeout` 을 걸면 막혔을 때 **빠르게 실패하고, 그 실패가 복구를 부른다.** 실행 시간 상한(`statement_timeout`)과 혼동하면 안 된다.

---

## 증상

설치·업그레이드 도구가 서비스를 세우고 스키마를 적용하는 단계에서 **끝나지 않는다.**
로그는 마지막 줄에서 멈춰 있고, 오류도 없고, 서비스는 세워진 채다.

## 원인

`ALTER TABLE` 같은 DDL(Data Definition Language, 스키마 정의문)은 강한 잠금을 요구한다.
다른 연결이 그 테이블에 잠금을 쥐고 있으면 **무기한 대기**한다.
대기는 오류가 아니므로 `psql` 은 0 을 돌려주지도, 실패하지도 않는다.
바깥의 오류 처리("실패하면 서비스를 되살린다")가 **영원히 발동하지 않는다.**

## 해결

```sql
-- 잠금을 얻는 데 드는 시간의 상한. 트랜잭션 "바깥"에 둔다
SET lock_timeout = '15s';
BEGIN;
  ALTER TABLE ...;
COMMIT;
```

```rust
fn wrap_migration_sql(sql: &str) -> String {
    let body = if sql.trim_start().to_uppercase().starts_with("BEGIN") {
        sql.to_string()
    } else {
        format!("BEGIN;\n{}\nCOMMIT;\n", sql)
    };
    format!("SET lock_timeout = '15s';\n{}", body)
}
```

**값의 근거**: 이 단계에서는 주된 경합자(서비스)가 이미 멈춰 있으므로 잠금은 즉시 얻는 것이 정상이다.
그런데도 못 얻는다면 짧은 질의가 아니라 **오래 붙잡고 있는 무언가**이고, 더 기다린다고 풀리지 않는다.
다만 너무 짧으면 정상 상황의 순간 경합에서 헛되이 실패하므로 여유를 둔다.

## 주의

> [!WARNING]
> **`lock_timeout` 은 트랜잭션 바깥에 둬야 한다.** `BEGIN` 안에 두면 그 트랜잭션에서만 살아 있고,
> 정작 **트랜잭션을 여는 순간의 잠금 획득**에는 적용되지 않는다.

> [!WARNING]
> **`statement_timeout` 과 다르다.** `lock_timeout` = 잠금을 **얻는** 데 드는 시간의 상한,
> `statement_timeout` = 문장이 **도는** 시간의 상한. 마이그레이션에 후자를 걸면 큰 인덱스 생성 같은
> **정당한 장기 작업을 죽인다.**

> [!WARNING]
> **최악의 누적 대기는 `마이그레이션 개수 × 상한` 이다.** 전량이 순서대로 도는 구조라면
> 개별 상한이 짧아도 총 대기가 길어질 수 있다 — 전체 상한을 따로 두는 편이 안전하다.

---

## 관련

- [[migrations-replayed-in-full]]
- [[online-migration-competing-writers]]
- [[psql-exit-code-zero-on-partial-restore]]
- [[timeout-is-unknown-not-failure]]

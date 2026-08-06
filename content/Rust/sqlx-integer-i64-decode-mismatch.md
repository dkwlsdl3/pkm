---
title: sqlx 는 integer 를 i64 로 디코딩하지 않는다
tags:
  - tech
  - troubleshooting
created: 2026-08-04 (화)
---

# sqlx 는 integer 를 i64 로 디코딩하지 않는다

> **TL;DR**: PostgreSQL `integer`(int4) 컬럼을 Rust `i64` 로 받으면 sqlx 가 **항상** 디코딩에 실패한다. 실패가 `.unwrap_or(0)` 같은 기본값으로 접히면 **쿼리는 도는데 값만 늘 기본값**인 조용한 결함이 된다. SQL 에 `::bigint` 를 붙이거나 Rust 타입을 `i32` 로 맞춰라.

## 증상

- 계산으로 얻어야 할 값이 **매번 같은 값**(대개 기본값 0 또는 그것으로 계산된 시작값)이다
- 그래서 **첫 건만 성공하고 이후 전부 유니크 제약에 걸린다**
- DB 에서 같은 SQL 을 직접 돌리면 **정상 값이 나온다** → "SQL 은 맞는데 앱만 틀리다"
- 오류 로그가 없다

## 원인

sqlx 의 `Decode` 는 **PostgreSQL 타입 OID 와 Rust 타입이 정확히 일치할 때만** 성공한다. 암묵 확장이 없다.

| PostgreSQL | 대응 Rust |
|---|---|
| `smallint` (int2) | `i16` |
| `integer` (int4) | `i32` |
| `bigint` (int8) | `i64` |

`MAX(int4_col)`·`COUNT(*)` 같은 집계의 반환 타입을 착각하기 쉽다. **`MAX()` 는 인자 타입을 그대로 돌려준다**
(int4 → int4). 반면 `COUNT(*)` 는 bigint 다. 그래서 `COUNT` 는 `i64` 로 잘 받아지는데 `MAX` 는 안 되는
비대칭이 생긴다.

```sql
-- 실측으로 가른다
SELECT pg_typeof(MAX(project_id))            FROM t;  -- integer
SELECT pg_typeof(MAX(project_id)::bigint)    FROM t;  -- bigint
SELECT pg_typeof(COUNT(*))                   FROM t;  -- bigint
```

**진짜 문제는 디코딩 실패 자체가 아니라 그것을 삼키는 호출부다.**

```rust
// 디코딩이 100% 실패하고, 그 사실이 0 으로 덮인다
let next = sqlx::query_scalar::<_, i64>("SELECT MAX(project_id) FROM t")
    .fetch_one(pool).await
    .unwrap_or(0);              // ← 여기서 결함이 조용해진다
```

**확증 방법 3중** — 하나만으로는 다른 원인과 구분되지 않는다.

1. 실패 사례의 값이 **전부 동일**한가(정상이면 증가해야 하는데 고정값이면 계산이 안 된 것)
2. **형제 쿼리와 비교** — 같은 패턴인데 동작하는 쿼리가 있으면 그쪽 SQL 에 캐스팅이 있는지 본다
3. `pg_typeof` 로 실제 반환 타입 확인

## 해결

**SQL 쪽에서 캐스팅한다.** 컬럼 타입은 정상이므로 마이그레이션은 필요 없다.

```sql
-- query/next_project_id.sql
SELECT COALESCE(MAX(project_id), 0)::bigint AS next FROM storage_projects;
```

또는 Rust 타입을 실제 컬럼 타입에 맞춘다.

```rust
let next = sqlx::query_scalar::<_, i32>("SELECT MAX(project_id) FROM t")
    .fetch_one(pool).await? as i64;
```

**그리고 기본값으로 접지 마라.** 이 결함이 몇 달 숨어 있던 이유는 캐스팅 누락이 아니라 `.unwrap_or(0)` 이다.

```rust
let next: i64 = sqlx::query_scalar(SQL).fetch_one(pool).await?;   // 실패는 오류로 올린다
```

> [!NOTE]
> `sqlx::query!` 매크로(컴파일 타임 검증)를 쓰면 이 부류는 빌드에서 걸린다. 런타임 쿼리(`query_scalar`,
> 파일에서 읽은 SQL)를 쓰는 코드베이스라면 **`::bigint` 를 관례로 못박고** 리뷰 체크리스트에 넣어라.

> [!WARNING]
> SQL 을 **공용 상수 하나로 여러 곳이 참조**하는 구조라면 한 줄 수정으로 전부 고쳐지는 대신, 한 줄 실수로
> 전부 깨진다. 고칠 때 참조 지점을 세어 보고 커밋 메시지에 남겨라.

---

## 관련

- [[sqlx-timestamptz-string-decode]] — 같은 계열: 타입 불일치로 디코딩이 실패하는 다른 사례
- [[unknown-is-not-absent]] — 실패를 기본값으로 접는 결함군
- [[rust-overview]]
- [[migrations-replayed-in-full]]

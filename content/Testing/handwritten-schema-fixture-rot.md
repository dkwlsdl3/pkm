---
title: 손으로 쓴 축소 스키마 픽스처는 조용히 썩는다
tags:
  - tech
  - troubleshooting
created: 2026-08-05 (수)
---

# 손으로 쓴 축소 스키마 픽스처는 조용히 썩는다

> **TL;DR**: 테스트를 빠르게 하려고 `CREATE TABLE` 을 손으로 줄여 쓰면, 이후 마이그레이션으로 늘어난 컬럼이 픽스처에 반영되지 않는다. 그 컬럼을 참조하는 코드는 **테스트에서만** 죽는다. 더 나쁜 것은 그 테스트가 `#[ignore]`·조건부 스킵이라 **기본 실행에서 조용히 건너뛰어 아무도 모르는** 경우다. 픽스처는 **실제 마이그레이션으로 만들고**, 스킵되는 테스트는 목록화해 별도 명령으로 반드시 돌려라.

## 증상

- CI 는 초록인데 로컬에서 `--include-ignored` 로 돌리면 **몇 개월치 실패가 한꺼번에** 나온다
- 실패 메시지가 도메인과 무관하다: `column "status" does not exist`, `no such column: updated_at`
- 프로덕션 코드는 멀쩡하다 — **테스트 스키마만 과거에 멈춰 있다**

## 원인

축소 픽스처는 작성 시점의 스냅샷이고, **마이그레이션과 연결된 곳이 없다.**

```rust
// tests/fixtures.rs — 2026-03 에 쓴 뒤로 손대지 않았다
sqlx::query(r#"
    CREATE TABLE storage_volumes_info (
        id BIGSERIAL PRIMARY KEY,
        volume_id BIGINT,
        pool TEXT
        -- status, vm_device, name, updated_at 이 그 뒤 마이그레이션으로 추가됨
    )"#).execute(&pool).await?;
```

여기에 **스킵 메커니즘**이 겹치면 발견이 무한정 미뤄진다.

| 메커니즘 | 조용한 이유 |
|---|---|
| `#[ignore]` (Rust) | `cargo test` 기본 실행에서 "ignored" 한 줄로 지나간다 |
| `DATABASE_URL` 없으면 early return | **통과로 집계**된다 — 실행 안 된 것과 구분 안 됨 |
| `@pytest.mark.skipif` | 요약 줄의 `s` 를 아무도 안 본다 |
| `test.skip()` (JS) | 동일 |

★결정적 신호: **테스트를 되돌려도(로직을 지워도) 통과한다.** 그 테스트는 아무것도 검증하지 않고 있다.

## 해결

**1) 픽스처를 실제 마이그레이션으로 만든다.** 이게 근본 해법이다.

```rust
async fn test_pool() -> PgPool {
    let pool = PgPool::connect(&std::env::var("DATABASE_URL").unwrap()).await.unwrap();
    sqlx::migrate!("./migrations").run(&pool).await.unwrap();   // 실제 스키마
    pool
}
```

컨테이너 기동 비용이 걱정이면 **스키마 템플릿 DB 를 한 번 만들고 테스트마다 복제**한다
(`CREATE DATABASE t_x TEMPLATE schema_tpl`) — 마이그레이션은 스위트당 한 번만 돈다.

**2) 손으로 쓸 수밖에 없다면 계약을 잠근다.** 최소한 실제 스키마와 컬럼 집합을 대조하는 테스트를 하나 둔다.

```sql
-- 픽스처와 실제 스키마의 컬럼 차이가 0 이어야 한다
SELECT column_name FROM information_schema.columns
WHERE table_name = 'storage_volumes_info'
EXCEPT SELECT unnest($1::text[]);
```

**3) 스킵되는 테스트를 목록화하고 전량 실행 명령을 문서에 적는다.**

```bash
# 문서(테스트 지도)에 이 줄이 있어야 한다
DATABASE_URL=postgres://… cargo test --lib -- --include-ignored
cargo test -- --list | grep -c ': test$'      # 총 개수와 실행 개수를 대조
```

**4) 뮤테이션으로 유효성을 확인한다.** 검증하려는 로직을 일부러 지웠을 때 **그 테스트가 실패해야** 한다.
통과하면 그 테스트는 장식이다 → [[mutation-check-test-effectiveness]]

> [!WARNING]
> **"환경변수가 없으면 통과"는 최악의 스킵**이다. 실행되지 않은 것과 성공한 것이 같은 색으로 보인다.
> 최소한 경고를 표준 출력에 남기고, CI 에서는 **환경변수 부재 자체를 실패**로 만들어라.

> [!NOTE]
> 픽스처가 썩는 사례를 발견하면 **그 사례 자체를 테스트 지도 문서에 남겨라.** "축소 스키마는 조용히
> 썩는다"는 한 줄이, 다음 사람이 빠른 픽스처를 새로 만들려 할 때 판단 근거가 된다.

---

## 관련

- [[mutation-check-test-effectiveness]] — 테스트가 실제로 무언가를 잡는지 확인하는 방법
- [[migrations-replayed-in-full]] — 마이그레이션 적용 상태를 판단하는 기준
- [[testing-overview]]
- [[playwright-shared-account-hazards]]

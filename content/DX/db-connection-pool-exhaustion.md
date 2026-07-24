---
title: DB 커넥션 풀 고갈
tags:
  - tech
  - dx
  - rust
  - troubleshooting
created: 2026-05-21 (목)
---

# DB 커넥션 풀 고갈

> **TL;DR**: API 핸들러, scheduler, cleanup task가 같은 DB 커넥션 풀을 공유하면 백그라운드 작업이 순간적으로 풀을 잠식해 health check까지 timeout될 수 있다.

---

API 핸들러, scheduler, WebSocket handler, cleanup task가 같은 pool을 공유하면 주기 작업이 순간적으로 풀을 잠식할 수 있다. 특히 대량 DELETE, N+1 쿼리, 외부 명령을 포함한 점검 task가 같은 시간대에 몰리면 health check까지 timeout될 수 있다.

```rust
PgPoolOptions::new()
    .max_connections(50)
    .acquire_timeout(Duration::from_secs(30))
    .connect(database_url)
    .await?;
```

풀 크기를 늘리는 것은 완화책이다. 근본적으로는 무거운 작업을 분리하고, 오래 잡는 트랜잭션과 N+1 쿼리를 줄여야 한다.

## Cleanup task 분리

인증 토큰 정리, quota alert, storage capacity 점검, time-series DELETE를 한 루프에 몰아넣으면 장애 시 영향 범위가 커진다. 무거운 time-series 정리는 별도 task로 분리한다.

```rust
let ts_cleanup_pool = pool.clone();
tokio::spawn(async move {
    let mut interval = tokio::time::interval(tokio::time::Duration::from_secs(3600));
    interval.tick().await;

    loop {
        interval.tick().await;

        if let Err(error) = sqlx::query(
            "DELETE FROM system_cpu_data WHERE collected_at < NOW() - INTERVAL '30 days'",
        )
        .execute(&ts_cleanup_pool)
        .await
        {
            tracing::warn!("Failed to cleanup old cpu data: {}", error);
        }
    }
});
```

---

## 주의사항

> [!WARNING]
> `max_connections`만 늘리면 증상이 잠시 줄어들 수 있지만, 느린 쿼리와 장시간 트랜잭션이 그대로라면 DB 부하만 커질 수 있다.

---

## 관련

- [[rust-backend-troubleshooting]]

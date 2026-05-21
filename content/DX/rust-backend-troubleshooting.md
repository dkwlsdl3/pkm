---
tags:
  - tech
  - dx
  - rust
  - troubleshooting
created: 2026-05-21 (목)
---

# Rust 백엔드 트러블슈팅

> **TL;DR**: Rust/Tokio 백엔드가 죽지 않고 멈춘 것처럼 보일 때는 blocking I/O뿐 아니라 DB 커넥션 풀, cleanup task, scheduler 경쟁을 함께 확인한다.

---

## 개요

- **무엇인가**: Rust/Tokio 기반 백엔드에서 hung, 응답 지연, 커넥션 풀 고갈을 진단하는 체크리스트
- **왜 쓰는가**: panic 없이 TCP 연결은 열리지만 HTTP 응답이 오지 않는 상태는 단일 원인으로 단정하기 쉽다.
- **언제 쓰는가**: health check가 timeout되고 로그에는 `pool timed out while waiting for an open connection` 같은 리소스 대기 에러가 남을 때

---

## 핵심 개념

### Hung과 crash 구분

프로세스가 죽은 crash와 이벤트 루프 또는 공유 리소스가 막힌 hung은 다르게 접근해야 한다.

| 증상 | 해석 |
|---|---|
| 프로세스 종료, panic 로그 | crash 가능성 |
| 포트 연결은 되지만 응답 없음 | worker, DB pool, lock, 외부 명령 대기 가능성 |
| `pool timed out while waiting for an open connection` | DB 커넥션 풀 고갈 가능성 |

### DB 커넥션 풀 고갈

API 핸들러, scheduler, WebSocket handler, cleanup task가 같은 pool을 공유하면 주기 작업이 순간적으로 풀을 잠식할 수 있다. 특히 대량 DELETE, N+1 쿼리, 외부 명령을 포함한 점검 task가 같은 시간대에 몰리면 health check까지 timeout될 수 있다.

```rust
PgPoolOptions::new()
    .max_connections(50)
    .acquire_timeout(Duration::from_secs(30))
    .connect(database_url)
    .await?;
```

풀 크기를 늘리는 것은 완화책이다. 근본적으로는 무거운 작업을 분리하고, 오래 잡는 트랜잭션과 N+1 쿼리를 줄여야 한다.

### Cleanup task 분리

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

### Blocking I/O 가설 검증

`std::path::Path::exists()` 같은 동기 파일시스템 호출은 Lustre/NFS 같은 네트워크 파일시스템에서 위험할 수 있다. 다만 실제 원인인지 확인하려면 로그, task 구조, 호출 빈도, worker 점유 범위를 같이 봐야 한다.

```rust
let path_owned = path.to_string();
let exists = tokio::task::spawn_blocking(move || {
    std::path::Path::new(&path_owned).exists()
})
.await
.unwrap_or(false);
```

---

## 진단 순서

1. `health` API를 timeout 포함해서 호출한다.
2. 백엔드 로그에서 panic, timeout, pool error, 외부 명령 지연을 찾는다.
3. scheduler와 cleanup task가 같은 pool을 공유하는지 확인한다.
4. 대량 DELETE/UPDATE에 인덱스가 있는지 확인한다.
5. Tokio task 안의 동기 I/O와 외부 명령 실행 경로를 확인한다.
6. 풀 크기 조정은 임시 완화로 보고, 무거운 작업 분리와 쿼리 개선을 우선한다.

---

## 주의사항

> [!WARNING]
> `max_connections`만 늘리면 증상이 잠시 줄어들 수 있지만, 느린 쿼리와 장시간 트랜잭션이 그대로라면 DB 부하만 커질 수 있다.

> [!NOTE]
> 이전 가설이 그럴듯해 보여도 실제 로그의 1차 에러가 무엇인지 먼저 고정해야 한다. `pool timed out while waiting for an open connection`이 반복된다면 DB pool 경합을 우선 검증한다.

---

## 관련

- [[rust-cargo]]
- [[systemd-service]]
- [[playwright-e2e]]
- [[dx-overview]]

---
title: Rust 백엔드 트러블슈팅
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

API 핸들러, scheduler, cleanup task가 같은 DB 커넥션 풀을 공유하면 주기 작업이 순간적으로 풀을 잠식해 health check까지 timeout될 수 있다. 원인, 완화 코드, cleanup task 분리 방법은 [[db-connection-pool-exhaustion]] 참고.

### Blocking I/O 가설

동기 파일시스템 호출이 Lustre/NFS 같은 네트워크 파일시스템에서 Tokio worker를 막아 hung을 유발할 수 있다. 위험 조건과 `spawn_blocking` 격리 예시는 [[tokio-blocking-io-hazard]] 참고.

---

## 진단 순서

1. `health` API를 timeout 포함해서 호출한다.
2. 백엔드 로그에서 panic, timeout, pool error, 외부 명령 지연을 찾는다.
3. scheduler와 cleanup task가 같은 pool을 공유하는지 확인한다 ([[db-connection-pool-exhaustion]]).
4. 대량 DELETE/UPDATE에 인덱스가 있는지 확인한다.
5. Tokio task 안의 동기 I/O와 외부 명령 실행 경로를 확인한다 ([[tokio-blocking-io-hazard]]).
6. 풀 크기 조정은 임시 완화로 보고, 무거운 작업 분리와 쿼리 개선을 우선한다.

---

## 주의사항

> [!NOTE]
> 이전 가설이 그럴듯해 보여도 실제 로그의 1차 에러가 무엇인지 먼저 고정해야 한다. `pool timed out while waiting for an open connection`이 반복된다면 DB pool 경합을 우선 검증한다.

---

## 관련

- [[db-connection-pool-exhaustion]]
- [[tokio-blocking-io-hazard]]
- [[rust-cargo]]
- [[systemd-service]]
- [[playwright-e2e]]
- [[dx-overview]]

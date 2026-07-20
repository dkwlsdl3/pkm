---
title: lfs 호출 D-state 서킷브레이커
tags:
  - tech
  - lustre
  - resilience
created: 2026-07-20 (월)
---

# lfs 호출 D-state 서킷브레이커

> 느리거나 hang나는 `lfs` 계열 호출이 UI·헬스체크 요청 스레드를 블로킹하지 않도록 격리하는 패턴.

---

## 문제

- `lfs df`, `lfs quota`, `lfs migrate` 등 Lustre CLI는 서버/네트워크 상태에 따라 오래 걸리거나 **hang**날 수 있다.
- hang난 프로세스는 커널에서 **D-state(uninterruptible sleep)** 로 남아 `kill`도 안 먹는다. 이런 호출을 요청 경로(모니터링 API·헬스체크)에서 직접 하면 스레드가 물려 UI 전체가 멈춘다.

## 패턴

1. **주기 백그라운드 게이트**: `lfs` 호출을 요청 경로가 아니라 백그라운드 워커가 주기적으로 실행하고 결과를 캐시. 요청은 캐시만 읽는다(항상 즉답).
2. **서킷브레이커**: 백그라운드 호출이 타임아웃/D-state로 실패하면 회로를 open → 일정 시간 새 호출을 막고 "stale/unavailable" 상태를 반환. 서버가 회복되면 half-open으로 탐침 후 close.
3. **타임아웃 + 프로세스 격리**: 각 호출에 하드 타임아웃. D-state는 죽일 수 없으므로 재시도 폭주를 막는 게 핵심(브레이커가 그 역할).

## 효과

- 스토리지 백엔드가 느려도 UI/헬스체크는 즉답(캐시된 마지막 값 + stale 표시).
- hang 프로세스 누적으로 인한 자원 고갈 방지.

## 일반화

- Lustre `lfs`뿐 아니라 **hang 가능성이 있는 모든 외부 blocking 호출**(NFS stat, 원격 마운트, 느린 DB)에 동일 적용. 요청 경로에서 분리 → 캐시 → 브레이커.

## 관련

- [[lustre-performance-metrics]] — proc/sysfs 기반 비블로킹 지표 수집
- [[lustre-troubleshooting]] — 마운트/네트워크 이슈로 인한 hang 원인

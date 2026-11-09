---
title: 정리 작업을 한 트랜잭션으로 묶으면 NO ACTION 참조 하나에 전체가 롤백된다
tags:
  - tech
  - troubleshooting
created: 2026-11-09 (월)
---

# 정리 작업을 한 트랜잭션으로 묶으면 NO ACTION 참조 하나에 전체가 롤백된다

> **TL;DR**: 보존기간 정리에서 「보존기간 안쪽의 최근 행이 보존기간 밖의 오래된 행을 외래키로 가리키는」 배치는 흔하다. 테이블별로 오류를 삼키던 정리를 한 트랜잭션으로 묶으면 그 참조 하나에 **전체가 롤백**되고, 주기 작업은 매번 같은 데이터로 같은 실패를 해 **정리가 영영 돌지 않는다.** 아직 참조되는 행은 이번 주기에 남기고 다음 주기에 지운다.

## 증상

- 정리 작업이 매 주기 실패하고, 테이블 크기가 계속 늘어난다
- 오류는 `violates foreign key constraint` 하나인데 **다른 테이블도 한 건도 안 지워졌다**
- 고치기 전(테이블별 개별 처리)에는 일부라도 지워졌다 — 원자성을 넣은 수정이 회귀를 만든 경우

## 원인

PostgreSQL 외래키의 기본 동작 `NO ACTION` 은 참조되는 행의 삭제를 거부한다(검사 시점이 문장 끝일 뿐 `RESTRICT` 와 결과는 같다). 예:

- `error_logs.related_job_id → jobs.id`
- `jobs.parent_job_id → jobs.id` (자기 참조)

최근 에러 로그(보존)가 오래된 잡(삭제 대상)을 가리키면 그 잡의 `DELETE` 가 실패하고, 트랜잭션 전체가 되돌아간다.

## 해결

```sql
DELETE FROM jobs j
WHERE j.created_at < now() - make_interval(days => $1)
  AND NOT EXISTS (SELECT 1 FROM error_logs e WHERE e.related_job_id = j.id)
  AND NOT EXISTS (SELECT 1 FROM jobs c WHERE c.parent_job_id = j.id);
-- 참조하던 행이 보존기간 밖으로 나가 지워진 다음 주기에 이 잡도 지워진다
```

- 「전량 삭제」 경로는 참조하는 쪽 테이블을 먼저 비우므로 이 조건이 필요 없다
- 잠금 대기 상한(`lock_timeout`, 예: 30초)은 걸되 **문장 시간 제한(`statement_timeout`)은 걸지 않는다** — 첫 정리는 쌓인 분량을 지우느라 오래 걸리고, 거기 상한을 걸면 같은 지점에서 영구 실패한다
- 전부-아니면-전무 구조에서는 실패하면 한 건도 안 지워진다. 실패를 서버 로그 한 줄이 아니라 **운영자가 보는 화면**에도 남긴다

> [!NOTE]
> 재현은 실제 DB 에 「최근 자식 → 오래된 부모」 행을 한 쌍 넣고 정리를 한 번 돌리면 된다. 빈 시험 DB 에서는 이 배치가 없어 초록이 나온다.

---

## 관련

- [[retention-zero-means-delete-all]] — 이 트랜잭션화를 부른 앞선 수정
- [[migration-lock-timeout]] — `lock_timeout` 을 거는 위치
- [[data-engineering-overview]]

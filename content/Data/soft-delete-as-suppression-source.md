---
title: 중복 억제의 근거인 행은 물리 삭제하면 안 된다
tags:
  - tech
  - troubleshooting
created: 2026-11-09 (월)
---

# 중복 억제의 근거인 행은 물리 삭제하면 안 된다

> **TL;DR**: 「같은 경고는 24시간에 한 번」을 **기존 행이 있는지로** 판단하면, 사용자가 치운 알림을 물리 삭제하는 순간 억제 근거가 사라져 **다음 점검에서 같은 경고가 되살아난다.** 삭제는 `deleted_at` 소프트 삭제로 하고, 억제 쿼리는 삭제분까지 센다. 행이 무한히 쌓이지 않게, 보존기간이 지나고 억제 창 밖으로 나간 행만 물리 삭제한다.

## 증상

- 사용자가 X 로 지운 용량 경고가 몇 분 뒤 다시 뜬다
- 「지우기」 기능을 만들자마자 알림이 더 시끄러워진다

## 원인

알림 테이블이 **표시 목록**이면서 **중복 억제 장부** 역할도 한다. 억제는 보통 이렇게 생겼다.

```sql
INSERT INTO alerts (alert_type, target_id, message)
SELECT $1, $2, $3
WHERE NOT EXISTS (
  SELECT 1 FROM alerts
  WHERE alert_type = $1 AND target_id = $2
    AND created_at > now() - interval '24 hours'
);
```

행을 지우면 `NOT EXISTS` 가 참이 되어 다음 주기 점검이 같은 알림을 새로 만든다.

## 해결

```sql
-- 1) 사용자 삭제 = 소프트 삭제
UPDATE alerts SET deleted_at = now() WHERE id = $1 AND user_id = $2;

-- 2) 목록은 삭제분 제외
SELECT * FROM alerts WHERE user_id = $1 AND deleted_at IS NULL
ORDER BY is_read, created_at DESC LIMIT 50;

-- 3) 억제 쿼리는 그대로 — deleted_at 조건을 넣지 않는다 (삭제분도 억제 근거)

-- 4) 주기 정리: 보존기간이 지난 행만 물리 삭제 (억제 창보다 길게 잡는다)
DELETE FROM alerts WHERE created_at < now() - make_interval(days => $1);
```

> [!WARNING]
> 소프트 삭제로 바꾸고 보존기간 설정만 만든 채 **실제로 지우는 곳을 안 만들면** 행이 끝없이 쌓인다. 정리 작업까지 한 묶음으로 넣는다. 보존기간이 억제 창(24시간)보다 짧아지지 않게 하한도 둔다.

---

## 관련

- [[idempotent-seed-resurrects-deletion]] — 삭제가 되살아나는 다른 경로(시드 재실행)
- [[retention-zero-means-delete-all]] — 보존기간 정리 함수의 함정
- [[data-engineering-overview]]

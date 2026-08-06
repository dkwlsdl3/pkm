---
title: IS NOT DISTINCT FROM 은 인덱스를 조건에서 밀어낸다
tags:
  - tech
  - troubleshooting
created: 2026-08-05 (수)
---

# IS NOT DISTINCT FROM 은 인덱스를 조건에서 밀어낸다

> **TL;DR**: `a = b` 는 어느 쪽이 NULL 이면 NULL(=거짓 취급)이라, NULL 이 들어갈 수 있는 컬럼 비교에는 `IS NOT DISTINCT FROM` 이 의미상 맞다. **그런데 PostgreSQL 은 이 연산자를 인덱스 검색 조건(index cond)으로 쓰지 못하고 필터로 밀어낸다** — 순차 스캔이 되고, 대상마다 도는 검사라면 O(n²) 가 된다(2만 행 실측 **1.357ms → 0.013ms** 차이). NULL 자리를 센티넬로 바꾸거나 `(col = $1 OR (col IS NULL AND $1 IS NULL))` 로 풀어 써라.

## 증상

- 의미를 고치려고 `=` → `IS NOT DISTINCT FROM` 으로 바꿨더니 **응답이 느려졌다**
- 행이 적을 때는 안 보이다가 수만 건에서 갑자기 드러난다
- `EXPLAIN` 에 `Index Cond` 가 사라지고 `Filter` 로 내려가 있다

## 원인

`IS NOT DISTINCT FROM` 은 B-tree 연산자 클래스의 검색 가능 연산자가 아니다. 플래너가 인덱스 진입 조건으로
쓰지 못하고, 인덱스를 타더라도 **전 행을 읽어 필터**한다.

```sql
EXPLAIN ANALYZE
SELECT 1 FROM notifications
WHERE target_type = 'quota'
  AND target_id IS NOT DISTINCT FROM $1
  AND threshold IS NOT DISTINCT FROM $2
  AND created_at > now() - interval '24 hours';
```

```
Seq Scan on notifications  (cost=… rows=… )
  Filter: ((target_id IS NOT DISTINCT FROM $1) AND …)
  Rows Removed by Filter: 19,984
Execution Time: 1.357 ms
```

`=` 로 바꾸면:

```
Index Scan using ix_notifications_target on notifications
  Index Cond: ((target_type = 'quota') AND (target_id = $1))
Execution Time: 0.013 ms
```

★**이 검사가 "대상마다 한 번" 돈다면 곱해진다.** 대상 2만 개를 순회하며 각각 억제 검사를 하면
1.357ms × 20,000 ≈ 27초다.

## 해결

**방법 1 — NULL 을 안 쓴다(가장 깨끗하다).** 컬럼에 NOT NULL + 센티넬 값(`0`, `''`, `-1`)을 두면 `=` 로
비교되고 인덱스도 그대로 탄다. 새로 설계하는 스키마라면 이쪽.

**방법 2 — 인덱스가 타는 부분과 NULL 처리를 분리한다.**

```sql
WHERE target_type = $1                       -- ← 인덱스 진입
  AND (target_id = $2 OR (target_id IS NULL AND $2::bigint IS NULL))
  AND created_at > now() - interval '24 hours'
```

선택도가 높은 컬럼(`target_type`·`user_id`)을 `=` 로 남겨 두면 인덱스가 후보를 좁힌 뒤 NULL 갈래는
소수 행에만 적용된다.

**방법 3 — 부분 인덱스.** NULL 조합이 몇 가지로 정해져 있다면 각각에 부분 인덱스를 준다.

```sql
CREATE INDEX ix_notif_no_target ON notifications (target_type, created_at)
  WHERE target_id IS NULL;
```

> [!NOTE]
> **검사와 삽입을 한 문장으로 합치면 이 고민의 절반이 사라진다.** "중복이면 안 넣는다"를 SELECT + INSERT
> 두 문장으로 하면 "검사가 실패했을 때 어떻게 할지"라는 갈래가 생기고, 그 갈래에서 잘못된 기본값을 고르는
> 결함이 흔하다. `INSERT … WHERE NOT EXISTS (…)` 나 부분 유니크 인덱스 + `ON CONFLICT DO NOTHING` 이면
> 갈래 자체가 없다 — 실패는 삽입 실패로 드러나고 다음 주기에 재시도된다.

> [!WARNING]
> 의미를 먼저 확인하라. 억제·중복 검사에서 **`=` 를 그냥 쓰면 NULL 인 행이 영원히 미매칭**이라 같은 알림이
> 주기마다 쌓인다. "느려서 `=` 로 되돌린다"가 아니라 **NULL 갈래를 명시적으로 처리한 `=`** 로 가야 한다.

---

## 관련

- [[sql-view-silent-column-absence-trap]]
- [[postgres-write-skew-serialization-row]]
- [[db-oltp]]
- [[acid]]

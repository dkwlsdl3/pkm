---
title: 유니크 인덱스에서 NULL 은 서로 다른 값이다
tags:
  - tech
  - troubleshooting
created: 2026-07-31 (금)
---

# 유니크 인덱스에서 NULL 은 서로 다른 값이다

> **TL;DR**: SQL 표준상 유니크 제약은 **NULL끼리 같다고 보지 않는다.** 널 허용 컬럼이 낀 유니크 인덱스는 `(1, 'x', NULL)` 행을 **몇 개든 허용**하고, 그 위에서 `ON CONFLICT DO UPDATE`는 영원히 충돌하지 않아 **매번 새 행이 삽입된다.** 수집기처럼 주기적으로 쓰는 코드에서는 하루에 수만~수십만 행이 쌓인다. PostgreSQL 15+는 `NULLS NOT DISTINCT`로 고칠 수 있다.

## 증상

- 유니크 제약이 있는데 **중복이 계속 쌓인다**
- 중복 행들의 고유 조합을 세어 보면 **1~2개뿐**인 순수 중복이다
- 오류도 경고도 없다. 그냥 테이블이 커진다

```sql
SELECT count(*) FROM infra_dns_network_info;           -- 122,497
SELECT count(*) FROM (
  SELECT DISTINCT owner_id, dns_address, interface_id
  FROM infra_dns_network_info) t;                      -- 1
```

## 원인

세 가지가 사슬로 이어진다.

1. **참조 컬럼이 NULL이 되는 정상 경로가 있다** — 예: DNS 수집기가 인터페이스 이름을 못 찾으면(설정 파일에 그 정보가 없는 경우) 참조를 비운다. 버그가 아니라 정상 동작이다
2. **유니크 인덱스가 NULL을 서로 다르게 본다** — `(owner, addr, NULL)`이 몇 개든 제약에 안 걸린다
3. **쓰기 코드는 매 주기 INSERT를 낸다** — 값이 같아도 관측 시각 같은 메타데이터를 갱신하려고 `ON CONFLICT DO UPDATE`를 기대하는데, ②때문에 충돌이 안 나 **매번 INSERT가 성공**한다

> 🔴 **`ON CONFLICT`는 옳다. 무력화한 것은 NULL 의미론이다.** 그래서 고칠 자리는 쓰기 코드가 아니라 제약이다 — 그래야 지금의 writer 전부와 앞으로 추가될 writer에도 적용된다.

## 해결

### PostgreSQL 15 이상 — `NULLS NOT DISTINCT`

```sql
BEGIN;
LOCK TABLE infra_dns_network_info IN EXCLUSIVE MODE;   -- 경쟁 writer 차단

-- 중복 정리 (윈도 함수 — 자기조인은 O(n²)가 된다)
DELETE FROM infra_dns_network_info t
USING (
  SELECT id, row_number() OVER (
           PARTITION BY owner_id, dns_address, interface_id
           ORDER BY id DESC) AS rn
  FROM infra_dns_network_info
) d
WHERE t.id = d.id AND d.rn > 1;

DROP INDEX IF EXISTS infra_dns_unique_idx;
CREATE UNIQUE INDEX infra_dns_unique_idx
  ON infra_dns_network_info (owner_id, dns_address, interface_id)
  NULLS NOT DISTINCT;                                   -- ★ NULL 을 같은 값으로
COMMIT;
```

### 15 미만 — 센티넬 또는 부분 인덱스

```sql
-- ① NULL 대신 센티넬(0, -1, '')을 쓰고 NOT NULL 로 둔다 — 새 설계라면 이쪽이 깨끗하다
-- ② 부분 유니크 인덱스 두 벌
CREATE UNIQUE INDEX ... ON t (owner_id, dns_address, interface_id)
  WHERE interface_id IS NOT NULL;
CREATE UNIQUE INDEX ... ON t (owner_id, dns_address)
  WHERE interface_id IS NULL;
```

## 점검

**널 허용 컬럼이 든 유니크 인덱스를 전수로 찾아 한 번에 본다.** 하나가 그랬다면 같은 스키마의 다른 인덱스도 그럴 확률이 높다.

```sql
SELECT i.indexrelid::regclass AS index_name, a.attname
FROM pg_index i
JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
WHERE i.indisunique AND NOT a.attnotnull;
```

## 주의

> [!WARNING]
> 중복 정리에 `IS NOT DISTINCT FROM` 자기조인을 쓰면 **인덱스를 못 타 O(n²)** 가 된다 → [[is-not-distinct-from-index-pushout]]. 윈도 함수로 쓴다.

> [!WARNING]
> 이 테이블을 쓰는 writer가 마이그레이션 중에도 계속 돈다면, 정리와 인덱스 생성 사이에 **새 중복이 들어온다** → [[online-migration-competing-writers]]

---

## 관련

- [[online-migration-competing-writers]] — 정리 중에도 쓰는 writer 때문에 마이그레이션이 실패한다
- [[is-not-distinct-from-index-pushout]] — NULL 안전 비교가 인덱스를 밀어낸다
- [[dual-writer-no-owner-of-record]] — 두 writer가 같은 테이블을 쓸 때의 정본 문제
- [[collector-orphan-cleanup]]

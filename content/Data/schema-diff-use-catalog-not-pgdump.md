---
title: 환경 간 스키마 비교는 pg_dump 텍스트 diff 로 하지 않는다
tags:
  - tech
  - troubleshooting
created: 2026-11-09 (월)
---

# 환경 간 스키마 비교는 pg_dump 텍스트 diff 로 하지 않는다

> **TL;DR**: `pg_dump` 출력 형식은 **덤프를 뜬 클라이언트 버전**을 따른다. 버전이 다른 `pg_dump` 로 뜬 두 덤프를 diff 하면 형식 차이가 실제 차이를 덮는다. 카탈로그를 직접 조회해 테이블·컬럼·제약·인덱스·뷰를 정렬해 뽑아 비교한다. 그래도 남는 CHECK 제약 **표기 차이는 의미가 같을 수 있으니** 드리프트로 단정하지 않는다.

## 증상

- 환경 셋의 스키마 덤프를 비교했더니 차이가 수십 줄이다
- 차이를 하나씩 보면 대부분 같은 제약을 다르게 쓴 것이다

## 원인

1. **클라이언트 버전** — 로컬 `pg_dump` 가 18 이고 서버가 16 이면, 출력은 18 의 형식을 따른다. 다른 환경을 다른 버전 클라이언트로 뜨면 형식부터 갈린다
2. **제약 정의 렌더링** — 카탈로그에서 `pg_get_constraintdef()` 로 꺼내도, 의미가 같은 CHECK 가 다르게 찍힐 수 있다. 실측에서 같은 16.14 서버끼리도 갈렸다(객체가 만들어진 시점의 저장 형태 차이로 보이나 확인하지 못했다)

```
A: CHECK (role = ANY (ARRAY[('leader'::character varying)::text, ...]))
B: CHECK (role = ANY ((ARRAY['leader'::character varying, ...])::text[]))
```

## 해결

각 환경에서 같은 조회를 돌려 정렬된 텍스트로 뽑고 diff 한다.

```sql
-- psql -At -f schema-snapshot.sql > env-a.txt
SELECT table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns WHERE table_schema = 'public' ORDER BY 1, 2;

SELECT conrelid::regclass, conname, contype, pg_get_constraintdef(oid)
FROM pg_constraint WHERE connamespace = 'public'::regnamespace ORDER BY 1, 2;

SELECT tablename, indexname, indexdef
FROM pg_indexes WHERE schemaname = 'public' ORDER BY 1, 2;

SELECT viewname, definition FROM pg_views WHERE schemaname = 'public' ORDER BY 1;
```

- 비교 기준은 **빈 DB 에 마이그레이션 전량을 적용한 결과**로 잡는다(정본 파일 기준)
- 차이가 CHECK 정의 표기뿐이면 의미를 직접 대조해 노이즈로 분류하고, 분류 근거를 함께 적는다
- 실측에서 진짜 드리프트는 한 환경의 **기본키 누락 1건**뿐이었다 — 원인은 [[migrations-replayed-in-full]] 의 `CREATE TABLE IF NOT EXISTS` 절

---

## 관련

- [[migrations-replayed-in-full]] — 드리프트가 생기는 원인과 기준선 통합의 전제
- [[psql-exit-code-zero-on-partial-restore]] — `pg_dump` 덤프를 되돌릴 때의 함정(문장 실패에도 exit 0)
- [[runtime-sql-schema-drift]] — 코드와 스키마 사이의 드리프트
- [[data-engineering-overview]]

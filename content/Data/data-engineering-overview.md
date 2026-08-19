---
title: 데이터 엔지니어링 기초 (MOC)
tags:
  - tech
  - moc
created: 2026-05-13 (수)
---

# 데이터 엔지니어링 기초 (MOC)

> 데이터 엔지니어링 핵심 개념과 최신 기술 스택 지도

---

## 용어

| 표기 | 원어 | 뜻 |
|---|---|---|
| OLTP | Online Transaction Processing | 서비스가 쓰는 트랜잭션 처리용 DB. 짧은 읽기·쓰기가 많다 → [[db-oltp]] |
| OLAP | Online Analytical Processing | 분석용 처리. 대량 집계 쿼리에 맞춰져 있다 → [[data-warehouse]] |
| DW | Data Warehouse | 정제된 데이터를 분석용으로 모아둔 창고(OLAP용) |
| DL | Data Lake | 원시 데이터를 형식 그대로 쌓아두는 저장소 |
| ETL / ELT | Extract, Transform, Load / Extract, Load, Transform | 추출·변환·적재의 순서 차이. 변환을 적재 전에 하느냐 후에 하느냐 → [[etl-elt]] |
| ACID | Atomicity, Consistency, Isolation, Durability | 원자성·일관성·격리성·지속성. 트랜잭션 안전 보장 4원칙 → [[acid]] |
| NULL | — | "값이 없음"을 나타내는 SQL의 특수 표기. 같은지 비교하면 참이 아니라 NULL이 나온다 |
| CDC | Change Data Capture | 원본 DB의 변경분만 뽑아 하류로 전달하는 방식 |
| S3 | Simple Storage Service | AWS의 오브젝트 스토리지. 그 API가 사실상 표준이 되어 호환 제품이 많다 → [[minio]] |
| ECM | Enterprise Content Management | 기업 문서를 중앙에서 관리하는 체계 → [[ecm]] |
| dbt | data build tool | SQL로 데이터 변환을 관리하는 도구 (제품명) |

---

## 핵심 개념

- [[etl-elt]] — 데이터 파이프라인의 두 가지 패턴
- [[data-storage]] — DB / DW / DL / Lakehouse 진화 타임라인 허브
- [[db-oltp]] — OLTP 서비스 데이터베이스
- [[data-warehouse]] — DW(OLAP 분석용 창고)
- [[data-lake]] — DL(원시 데이터 저장)
- [[lakehouse]] — 레이크하우스(DL 유연성 + DW 쿼리)
- [[acid]] — 데이터 안전 보장 4원칙
- [[sql-view-silent-column-absence-trap]] — 뷰 경유 조회의 silent 컬럼 부재 함정 (실증)
- [[postgres-write-skew-serialization-row]] — `NOT EXISTS`로는 write skew를 못 막는다, guard 행 `FOR UPDATE` 직렬화 (실증)
- [[sql-like-wildcard-unescaped-user-input]] — 바인딩해도 `LIKE` 메타문자(`_`·`%`)는 값 안에서 해석돼 남의 행이 매칭된다 (실증)
- [[dual-writer-no-owner-of-record]] — 두 서비스가 같은 테이블에 upsert하는데 정본이 없으면 유령 행·상호 덮어쓰기 (실증)
- [[unique-index-null-semantics]] — 유니크 인덱스에서 NULL은 서로 다른 값이라 `ON CONFLICT`가 무력화된다(하루 15만 행 실증)
- [[collector-orphan-cleanup]] — upsert만 하는 수집기는 사라진 자원을 영원히 쌓는다, 삭제를 넣을 때의 안전 조건 2가지

---

## 스키마 마이그레이션

- [[migrations-replayed-in-full]] — 전량 재실행 모델에서 앞 파일이 뒤 파일 효과를 조용히 되돌리는 함정 (실증)
- [[psql-exit-code-zero-on-partial-restore]] — `psql -f`는 문장 실패에도 exit 0, 반쪽 복원이 "성공"으로 보고된다
- [[is-not-distinct-from-index-pushout]] — NULL 안전 비교가 인덱스를 필터로 밀어내 순차 스캔이 된다(실측 1.357ms→0.013ms)
- [[idempotent-seed-resurrects-deletion]] — `ON CONFLICT DO NOTHING` 시드는 관리자의 삭제를 매 배포마다 되살린다 (실증)
- [[online-migration-competing-writers]] — CI는 앱만 멈춘다, 데몬·에이전트가 정리 중에도 써서 인덱스 생성이 실패 (실증)
- [[migration-lock-timeout]] — 잠금 대기는 오류가 아니라 무기한 대기, `lock_timeout`은 트랜잭션 바깥에 (실증)

---

## 기술 스택

### 개방형 테이블 포맷
- [[open-table-format]] — Apache Iceberg, Delta Lake

### 스트리밍 & 분산 처리
- [[streaming-processing]] — Apache Kafka, Flink, Spark

### 데이터베이스
- [[duckdb]] — 로컬 환경 경량 분석 엔진
- [[vector-db]] — LLM/AI용 벡터 데이터베이스
- [[postgres-logical-backup]] — `pg_dump`, `psql` 기반 PostgreSQL 백업/복원 패턴

### 변환 & 오케스트레이션
- [[dbt]] — SQL 기반 데이터 변환 표준 툴
- [[workflow-orchestration]] — Airflow, Dagster, Prefect

---

## 저장소 & 거버넌스

- [[minio]] — S3 호환 온프레미스 오브젝트 스토리지, AI 학습 데이터 특화
- [[data-governance]] — 데이터 품질·보안·권한 체계 + 저장 3단 레이어(Landing/Staging/Curated)
- [[ecm]] — ECM 기업 문서 중앙화 관리 체계

---

## 주변 개념

- [[finops]] — 클라우드 비용 최적화
- [[data-observability]] — 파이프라인 품질 모니터링

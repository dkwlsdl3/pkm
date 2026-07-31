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

---

## 스키마 마이그레이션

- [[migrations-replayed-in-full]] — 전량 재실행 모델에서 앞 파일이 뒤 파일 효과를 조용히 되돌리는 함정 (실증)

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

---
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
- [[data-storage]] — DB / DW / DL / Lakehouse 비교
- [[acid]] — 데이터 안전 보장 4원칙

---

## 기술 스택

### 개방형 테이블 포맷
- [[open-table-format]] — Apache Iceberg, Delta Lake

### 스트리밍 & 분산 처리
- [[streaming-processing]] — Apache Kafka, Flink, Spark

### 데이터베이스
- [[duckdb]] — 로컬 환경 경량 분석 엔진
- [[vector-db]] — LLM/AI용 벡터 데이터베이스

### 변환 & 오케스트레이션
- [[dbt]] — SQL 기반 데이터 변환 표준 툴
- [[workflow-orchestration]] — Airflow, Dagster, Prefect

---

## 주변 개념

- [[finops]] — 클라우드 비용 최적화
- [[data-observability]] — 파이프라인 품질 모니터링

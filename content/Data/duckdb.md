---
title: DuckDB
tags:
  - tech
created: 2026-05-13 (수)
---

# DuckDB

> **TL;DR**: "로컬 환경의 데이터 분석 혁명"이라 불리는 경량 분석 엔진

---

## 특징

- 설치 없이 인메모리로 동작하는 OLAP 데이터베이스
- 로컬에서 CSV, Parquet, JSON 파일을 SQL로 바로 쿼리 가능
- 가볍고 빠름 → 데이터 엔지니어들의 개인 분석·테스트용으로 폭발적 인기

## 사용 예시

```sql
-- 로컬 Parquet 파일 바로 쿼리
SELECT * FROM 'data.parquet' LIMIT 10;

-- CSV 파일
SELECT COUNT(*) FROM read_csv_auto('logs.csv');
```

## 언제 쓰나?

- 클라우드 DW 비용 없이 로컬에서 빠르게 데이터 탐색할 때
- Python/Jupyter 환경에서 pandas 대체로 쓸 때
- 파이프라인 개발 중 샘플 데이터 테스트할 때

---

## 관련

- [[data-storage]]
- [[etl-elt]]

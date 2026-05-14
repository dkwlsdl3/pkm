---
title: 오픈 테이블 포맷 (Open Table Formats)
tags:
  - tech
created: 2026-05-13 (수)
---

# 오픈 테이블 포맷 (Open Table Formats)

> **TL;DR**: Lakehouse 구조를 가능하게 만드는 기술. 파일 저장소를 RDB처럼 다룰 수 있게 해줌.

---

## Apache Iceberg

- 현재 업계에서 가장 빠르게 주류로 급부상
- AI 분석 및 대규모 데이터 처리에 최적화
- AWS, Apple, Netflix 등 빅테크에서 표준으로 채택

## Delta Lake

- Databricks 생태계 중심
- [[acid]] 트랜잭션 강력 지원
- Spark와의 통합이 뛰어남 → [[streaming-processing]]

## 공통 기반 기술

> 두 포맷 모두 실제 데이터는 **Parquet(파케이)** 형식으로 저장됨
> Parquet: 열(Column) 기반 저장 방식으로 분석 쿼리에 최적화된 빅데이터 표준 파일 형식

---

## 관련

- [[data-storage]]
- [[acid]]
- [[streaming-processing]]

---
title: dbt (Data Build Tool)
tags:
  - tech
created: 2026-05-13 (수)
---

# dbt (Data Build Tool)

> **TL;DR**: SQL 기반 데이터 변환의 현재 표준 툴

---

## 개념

- Data Warehouse 안에서 SQL로 데이터를 변환(Transform)하는 도구
- [[etl-elt|ELT 패턴]]에서 마지막 T(Transform)를 담당

## 주요 기능

- **변환:** SQL 모델 작성 → DW 안에서 실행
- **문서화:** 각 모델에 설명 추가, 자동으로 문서 사이트 생성
- **테스트:** 데이터 품질 검증 (null 체크, 유니크 체크 등) 자동화
- **계보(Lineage):** 데이터가 어디서 와서 어디로 가는지 시각화

## 왜 인기 있나?

- SQL만 알면 됨 → 데이터 분석가도 파이프라인 관리 가능
- Git으로 버전 관리 가능
- Snowflake, BigQuery, Redshift 등 주요 DW와 모두 호환

---

## 관련

- [[etl-elt]]
- [[data-storage]]
- [[workflow-orchestration]]

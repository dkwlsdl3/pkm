---
title: Data Observability (데이터 가시성)
tags:
  - tech
created: 2026-05-13 (수)
---

# Data Observability (데이터 가시성)

> **TL;DR**: 데이터 파이프라인의 품질을 실시간으로 모니터링하는 기술

---

## 개념

- 데이터가 망가진 후 발견하는 게 아니라, **망가지기 전에 이상 징후를 감지**하는 것
- 소프트웨어의 Observability(로그·메트릭·트레이싱)와 같은 개념을 데이터에 적용

## 모니터링 대상

- **Freshness:** 데이터가 제때 업데이트 되고 있는가?
- **Volume:** 갑자기 데이터 양이 줄거나 늘지 않았는가?
- **Schema:** 컬럼이 갑자기 사라지거나 타입이 바뀌지 않았는가?
- **Null / 이상값:** 특정 필드에 null이 급증하지 않았는가?

## 주요 도구

- **Monte Carlo** — 상용, 자동 이상 탐지
- **Great Expectations** — 오픈소스, 규칙 기반 데이터 테스트
- **dbt tests** — [[dbt]] 내장 기능으로 기본 품질 체크

---

## 관련

- [[finops]]
- [[dbt]]
- [[etl-elt]]

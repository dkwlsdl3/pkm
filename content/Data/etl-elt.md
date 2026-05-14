---
tags:
  - tech
created: 2026-05-13 (수)
---

# ETL vs ELT

> **TL;DR**: 데이터를 A에서 B로 옮기는 두 가지 파이프라인 패턴

---

## ETL (Extract → Transform → Load)

1. **Extract:** 원본 소스(서비스 DB 등)에서 데이터 추출
2. **Transform:** 목적지에 맞게 가공 (마스킹, 형식 통일, 필터링)
3. **Load:** 가공된 깨끗한 데이터를 저장소에 적재

## ELT (Extract → Load → Transform)

1. **Extract:** 원본 소스에서 데이터 추출
2. **Load:** 날것 그대로 저장소에 먼저 적재
3. **Transform:** 저장소 안에서 필요할 때 변환

## 왜 ELT가 최신 트렌드인가?

- 클라우드 저장 비용 하락 → 날것 데이터 쌓아두는 게 저렴해짐
- 클라우드 연산 성능 향상 → 저장소 내부에서 직접 변환이 빠르고 저렴해짐

---

## 관련

- [[data-storage]]
- [[dbt]]

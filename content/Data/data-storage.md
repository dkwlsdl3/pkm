---
title: 데이터 저장소 종류
tags:
  - tech
created: 2026-05-13 (수)
---

# 데이터 저장소 종류

> **TL;DR**: DB → DW → DL → Lakehouse 로 이어지는 데이터 저장소 발전 타임라인

---

## 발전 타임라인

1. **DB (Database)** — 실시간 거래 처리(OLTP) 중심의 서비스용 저장소, 자세히: [[db-oltp]]
2. **DW (Data Warehouse)** — 분석 전용으로 정돈한 창고, OLAP 가능, 자세히: [[data-warehouse]]
3. **DL (Data Lake)** — 형태 불문 원시 데이터를 저렴하게 저장, 자세히: [[data-lake]]
4. **Lakehouse** — DL의 유연성과 DW의 쿼리 기능을 합친 최신 아키텍처, 자세히: [[lakehouse]]

각 단계는 앞 단계의 한계(성능 영향, 비정형 데이터 처리, 쿼리 편의성)를 보완하며 등장했다.

---

## 관련

- [[db-oltp]]
- [[data-warehouse]]
- [[data-lake]]
- [[lakehouse]]
- [[etl-elt]]
- [[acid]]
- [[open-table-format]]

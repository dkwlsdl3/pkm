---
title: 데이터 저장소 종류
tags:
  - tech
created: 2026-05-13 (수)
---

# 데이터 저장소 종류

> **TL;DR**: DB → DW → DL → Lakehouse 로 이어지는 발전 과정

---

## DB (Database)

- 실시간 거래 처리 목적 (**OLTP** - Online Transaction Processing)
- 대규모 분석 쿼리를 돌리면 서비스 마비 위험
- **RDB:** 행/열 표 형태 (MySQL, PostgreSQL, Oracle)

## DW (Data Warehouse)

- 서비스 DB에서 복사해 분석용으로 정돈한 창고
- 대규모 통계 분석(**OLAP**) 가능, 서비스에 영향 없음
- 🛠️ Snowflake, Google BigQuery

## DL (Data Lake)

- 날것(Raw) 데이터를 형태 불문하고 저렴하게 저장
- 텍스트, 이미지, 오디오, JSON 등 비정형 데이터 포함

## Lakehouse

- DL의 저렴함·유연성 + DW의 관리·쿼리 기능을 합친 최신 아키텍처
- 데이터는 레이크에 저장, SQL로 안전하게 조회 가능
- 기반 기술: [[open-table-format]]

---

## 관련

- [[etl-elt]]
- [[acid]]
- [[open-table-format]]

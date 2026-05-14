---
tags:
  - tech
created: 2026-05-13 (수)
---

# 스트리밍 & 분산 처리

> **TL;DR**: 배치(모아서 처리) → 스트리밍(실시간 처리)으로 패러다임 변화 중

---

## Apache Kafka

- 실시간 이벤트 스트리밍 파이프라인의 글로벌 표준
- 데이터를 생산자(Producer)가 토픽에 쏘면, 소비자(Consumer)가 가져가는 구조
- 높은 처리량, 내구성, 확장성

## Apache Flink

- 실시간 스트림 처리의 현재 대세
- 매우 빠르고 정교한 실시간 데이터 처리
- Kafka와 함께 쓰는 경우가 많음

## Apache Spark / PySpark

- 대용량 **배치** 처리의 절대 강자
- 스트리밍도 지원하지만 주력은 배치
- Python API인 PySpark로 많이 사용됨
- [[open-table-format|Delta Lake]]와 궁합이 좋음

---

## 관련

- [[etl-elt]]
- [[open-table-format]]

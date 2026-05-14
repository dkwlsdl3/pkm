---
title: FinOps (Financial Operations)
tags:
  - tech
created: 2026-05-13 (수)
---

# FinOps (Financial Operations)

> **TL;DR**: 클라우드 비용 최적화 활동

---

## 개념

- Financial + Operations의 합성어
- 클라우드는 데이터가 많아질수록 비용이 폭발적으로 증가하므로, 엔지니어가 적극적으로 비용을 관리하는 문화·활동

## 데이터 엔지니어링에서의 FinOps

- **쿼리 최적화:** 불필요하게 전체 테이블을 스캔하는 쿼리 개선
- **파티셔닝:** 날짜·카테고리별로 데이터를 나눠 필요한 부분만 읽도록
- **압축 포맷 사용:** Parquet 같은 컬럼형 포맷으로 저장 용량·조회 비용 절감
- **TTL 설정:** 오래된 로그 데이터 자동 삭제

---

## 관련

- [[data-storage]]
- [[data-observability]]

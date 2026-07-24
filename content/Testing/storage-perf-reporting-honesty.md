---
title: 스토리지 성능 결과서 정직성 가드 (cherry-pick 금지)
tags:
  - tech
created: 2026-06-18 (목)
---

# 스토리지 성능 결과서 정직성 가드 (cherry-pick 금지)

> **TL;DR**: 조건을 섞지 말고, worst-case를 숨기지 말고, 실제 배포 조건과 같은 조건에서만 대표값을 고른다 — 조건 변경 자체가 아니라 숨기거나 골라쓰는 것이 조작이다.

---

## 가드 원칙

- **조건을 섞지 말 것**: direct=0/1, stripe=1/4, cold/warm, 내부/외부/다중외부는 각각 별도 표기
- **worst-case를 숨기지 말 것**: mixed FAIL·max latency·tail outlier 명시
- **대표값 = 실제 제품 배포 조건**과 같은 조건에서만 선택 (좋은 조건 cherry-pick 금지)
- 조건 변경 자체는 조작이 아님 — **숨기거나 골라쓰는 게** 조작

> [!WARNING]
> - 평균 대역폭만 결과서에 쓰면 안 된다 — max latency·p99.9를 반드시 병기.
> - 좋은 조건만 남기면 당장은 편하지만 도입 후 장애·불신으로 돌아온다. 나쁜 결과도 조건이 명확하면 자산.

---

## 관련

- [[storage-performance-testing]] — 스토리지 성능 테스트 개요

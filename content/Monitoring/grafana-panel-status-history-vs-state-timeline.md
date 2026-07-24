---
title: "Grafana status-history vs state timeline"
tags:
  - tech
created: 2026-06-25 (목)
---

# Grafana status-history vs state timeline

> **TL;DR**: 상태(up/down) 시계열은 status-history가 아니라 state timeline으로. 데이터 포인트가 많으면 status-history는 "Too many points to visualize" 에러가 난다.

---

## status-history vs state timeline

| | status-history | state timeline |
|---|---|---|
| 그리는 방식 | 모든 데이터 포인트를 칸으로 | 상태가 바뀌는 구간만 막대로 |
| 포인트 많을 때 | "Too many points to visualize" 에러 | 정상 (구간만 그림) |
| 적합 | 짧은 범위 이산 상태 | up/down 등 상태 타임라인 (시간범위 무관) |

예: scrape 15초 × 3시간 = 720 포인트 → status-history는 한계 초과로 에러. state timeline은 무관.

---

## 관련

- [[grafana-panels-and-storage]]
- [[monitoring-overview]]

---
title: Testing 개요 (MOC)
tags:
  - tech
  - moc
created: 2026-06-08 (월)
---

# Testing 개요 (MOC)

> 테스트 격리, E2E 안정화, 실패 진단 패턴

---

## 테스트 실효성

- [[mutation-check-test-effectiveness]] — 구현을 되돌려 테스트가 실제로 FAIL하는지 확인(green은 주장일 뿐)

---

## Playwright / E2E

- [[playwright-shared-account-hazards]] — 공유 계정을 변경하는 E2E가 dev/test 환경을 오염시키는 패턴과 복구 전략
- [[playwright-error-context-snapshot]] — Playwright `error-context.md` 접근성 스냅샷으로 실제 DOM과 셀렉터 드리프트를 대조하는 방법

---

## 스토리지 / 성능

- [[storage-performance-testing]] — 스토리지 성능 측정 개요(세 축 인덱스)
- [[storage-perf-latency-percentiles]] — 레이턴시 avg/p95/p99/max·CoV 읽는 순서
- [[storage-perf-tool-roles]] — fio/ior/mdtest/iperf3 도구별 역할 분리
- [[storage-perf-reporting-honesty]] — 결과서 정직성 가드(cherry-pick 금지)

---

## 관련

- [[dx-overview]]

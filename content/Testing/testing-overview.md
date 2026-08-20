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
- [[handwritten-schema-fixture-rot]] — 손으로 쓴 축소 스키마 픽스처는 조용히 썩고 `#[ignore]`가 그것을 감춘다
- [[verdict-pipeline-layer-gap]] — 계층마다 시험이 있어도 계층 사이의 전달은 아무도 고정하지 않는다
- [[verdict-missing-value-fail-open]] — "이상이면 막는다"는 판정이 아예 없는 경우를 통과시킨다
- [[runtime-sql-schema-drift]] — 시험이 안 태우는 경로는 컴파일러도 안 본다(종단점이 죽은 채 green)

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
- [[benchmark-baseline-drift-within-run]] — 조건 간 배수는 같은 실행 창 안에서만 말할 수 있다(3시간에 20% 하락 실측)
- [[concurrent-benchmark-overlap-check]] — min·max 구간은 동시성의 증거가 아니다, 교집합 겹침률로 검증
- [[benchmark-invalid-value-quarantine]] — 무효값에 표시만 달면 인용될 때 표시가 떨어져 나간다
- [[benchmark-harness-run-isolation]] — 라벨 재사용·측정 겹침이 회차를 섞는다(오류 없이 틀린 값이 나온다)
- [[unattended-benchmark-runner]] — 무인 장시간 측정: 중단 조건·회차 판정·산출물 정리를 코드로 옮긴다
- [[verify-criteria-before-seeing-values]] — 값 보기 전에 판정 기준을 확정하고, 재는 쪽과 해석하는 쪽을 나눈다
- [[ratio-of-mismatched-windows]] — 서로 다른 구간을 잰 두 값의 비율은 구간 길이를 잰다(누적량으로 대조)
- [[outlier-discard-survivor-bias]] — 느린 회차를 이상치로 버리면 성능 문제를 표본에서 지운다

---

## 관련

- [[dx-overview]]

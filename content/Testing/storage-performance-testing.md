---
title: 스토리지 성능 테스트 — 지표·도구·정직성
tags:
  - tech
created: 2026-06-18 (목)
---

# 스토리지 성능 테스트 — 지표·도구·정직성

> **TL;DR**: 평균 대역폭만 보지 말고 tail latency(p99/max)·조건 분리·정직성 가드를 지켜야 제품 판단에 쓸 수 있는 결과가 나온다.

---

## 개요

- **무엇인가**: 파일시스템/스토리지 성능·안정성을 측정하고 결과서로 정리하는 방법
- **왜 쓰는가**: "몇 MB/s"가 아니라 "어느 계층이 병목인지 + 꼬리 지연이 안전한지"를 판단하기 위함
- **언제 쓰는가**: 제품 방향·도입 판단에 쓸 성능 결과서를 만들 때

---

## 핵심 개념

측정 지표는 Bandwidth(MiB/s, 대용량 순차— read가 높으면 캐시 의심)와 IOPS(작은 block·random, HDD는 구조적으로 낮음)를 우선 확인하고, 아래 세 축으로 세분화해 판단한다.

- **지표(레이턴시 백분위·CoV)**: [[storage-perf-latency-percentiles]] — avg/p95/p99/CoV 읽는 순서와 함정
- **도구 역할 분리**: [[storage-perf-tool-roles]] — fio/ior/mdtest/iperf3 역할표
- **결과서 정직성 가드**: [[storage-perf-reporting-honesty]] — cherry-pick 금지·worst-case 명시

---

## 코드 / 사용 예시

```bash
# 캐시 통제: page cache만 안전하게 (ARC 강제 flush는 금지)
sync; echo 3 > /proc/sys/vm/drop_caches
# 데이터셋 > ARC 로 read 캐시 착시 차단 + 모니터링 동시 수집
```

---

## 주의사항

> [!WARNING]
> 결과서 조작 방지 가드(조건 분리·worst-case 명시·cherry-pick 금지)는 [[storage-perf-reporting-honesty]] 참고.

---

## 관련

- [[testing-overview]] — 테스트 도메인 개요
- [[storage-perf-latency-percentiles]] — 레이턴시 백분위수·CoV
- [[storage-perf-tool-roles]] — 도구 역할 분리
- [[storage-perf-reporting-honesty]] — 결과서 정직성 가드
- [[lustre-single-node-benchmark]] — 단일노드 Lustre 측정 함정
- [[zfs-arc-and-lustre-overhead]] — ARC 착시·계층 오버헤드

---
title: 스토리지 성능 테스트 도구 역할 분리 (fio/ior/mdtest/iperf3)
tags:
  - tech
created: 2026-06-18 (목)
---

# 스토리지 성능 테스트 도구 역할 분리 (fio/ior/mdtest/iperf3)

> **TL;DR**: 도구마다 검증 대상이 다르다 — fio는 본판정, ior/mdtest는 Lustre 구조 검증, iperf3는 네트워크 천장 확인용이다.

---

## 역할표

| 도구 | 용도 |
|---|---|
| fio | 운영형 안정성·latency percentile **본판정** |
| ior | Lustre 구조·stripe·OST aggregate 검증 |
| mdtest | 메타데이터·작은 파일 다수 |
| iperf3 | 네트워크 천장(1GbE≈112MiB/s) |
| zpool iostat / iostat -x / sar / arcstat | 병목 계층 원인 추적 |

---

## 관련

- [[storage-performance-testing]] — 스토리지 성능 테스트 개요

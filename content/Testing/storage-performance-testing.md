---
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

### 1. 지표 읽는 순서
- **Bandwidth**(MiB/s): 대용량 순차. read가 높으면 캐시 의심
- **IOPS**: 작은 block·random. HDD는 구조적으로 낮음
- **Latency**: avg → p95 → p99 → p99.9 → **max**. 평균은 문제를 숨김
  - 예: 999회 1ms + 1회 235초 → 평균은 괜찮아 보여도 사용자 1명은 235초 hang
  - **avg > p99 역전** = 단발성 극단 이상치 신호 (max만 봐선 놓침)
- **CoV**(표준편차/평균): 반복 흔들림. 단 측정조건이 작거나 캐시/drop 타이밍이 과격해도 커짐 → CoV만으로 "불안정" 단정 금지

### 2. 도구 역할 분리
| 도구 | 용도 |
|---|---|
| fio | 운영형 안정성·latency percentile **본판정** |
| ior | Lustre 구조·stripe·OST aggregate 검증 |
| mdtest | 메타데이터·작은 파일 다수 |
| iperf3 | 네트워크 천장(1GbE≈112MiB/s) |
| zpool iostat / iostat -x / sar / arcstat | 병목 계층 원인 추적 |

### 3. 정직성 가드 (결과서 조작 방지)
- **조건을 섞지 말 것**: direct=0/1, stripe=1/4, cold/warm, 내부/외부/다중외부는 각각 별도 표기
- **worst-case를 숨기지 말 것**: mixed FAIL·max latency·tail outlier 명시
- **대표값 = 실제 제품 배포 조건**과 같은 조건에서만 선택 (좋은 조건 cherry-pick 금지)
- 조건 변경 자체는 조작이 아님 — **숨기거나 골라쓰는 게** 조작

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
> - 평균 대역폭만 결과서에 쓰면 안 된다 — max latency·p99.9를 반드시 병기.
> - 좋은 조건만 남기면 당장은 편하지만 도입 후 장애·불신으로 돌아온다. 나쁜 결과도 조건이 명확하면 자산.

---

## 관련

- [[testing-overview]] — 테스트 도메인 개요
- [[lustre-single-node-benchmark]] — 단일노드 Lustre 측정 함정
- [[zfs-arc-and-lustre-overhead]] — ARC 착시·계층 오버헤드

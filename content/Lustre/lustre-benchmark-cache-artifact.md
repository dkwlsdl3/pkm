---
title: 벤치마크 캐시 아티팩트 (drop_caches·ZFS ARC/txg)
tags:
  - tech
created: 2026-06-18 (목)
---

# 벤치마크 캐시 아티팩트 (drop_caches·ZFS ARC/txg)

> **TL;DR**: 매 iteration `drop_caches` + ZFS ARC/txg flush 타이밍이 IOR 대역폭 타이머를 오염시켜 CoV가 폭발하는 현상과, `sar`로 실제 디스크 활동을 교차검증해 시스템 결함이 아님을 판별하는 방법. MMP가 tail을 키우는 부가 요인도 포함.

---

## 핵심 개념

- 증상: 3 iteration 중 일부가 0.0001~0.99 MB/s로 폭락 (CoV 86~172%)
- 원인: **매 iter `drop_caches` + ZFS ARC/txg flush 타이밍**이 ior 대역폭 타이머를 오염
- 판별: **`sar`로 "보고값 vs 실제 디스크 활동" 교차검증** — 깨진 구간도 실제 디스크는 정상(약 2초)이면 측정 아티팩트로 확정 (시스템 무죄)
- **MMP(Multiple Mount Protection)**: MMP의 주기적 디스크 쓰기가 tail/CV를 키울 수 있음 — 단일노드(공유 스토리지·페일오버 불필요)에선 비활성 검토 시 tail 안정화 관찰됨

---

## 코드 / 사용 예시

```bash
# 측정 아티팩트 판별: 깨진 구간 시각의 실제 디스크 활동 확인
sar -f <monitor>.sa -b
```

---

## 관련

- [[lustre-single-node-benchmark]] — 단일노드 Lustre 벤치마크 방법론

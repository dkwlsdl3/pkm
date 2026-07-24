---
title: IOR 측정 3대 함정 (Lustre)
tags:
  - tech
created: 2026-06-18 (목)
---

# IOR 측정 3대 함정 (Lustre)

> **TL;DR**: IOR로 Lustre 대역폭을 측정할 때 결과를 착시로 만드는 3가지 함정 — `-B`(O_DIRECT) 미지원, write/read 미분리, ZFS와 O_DIRECT 부적합.

---

## 핵심 개념

- **`-B`(O_DIRECT) 미지원**: 설치된 ior 버전에서 미지원 → 제외
- **read open이 직전 write flush를 대기**: `write+read`를 한 실행에 묶으면 read가 ~1000배 느린 착시 → **write/read 단계 분리**
- **`O_DIRECT`가 ZFS에 부적합** → direct 기본 비활성

---

## 관련

- [[lustre-single-node-benchmark]] — 단일노드 Lustre 벤치마크 방법론

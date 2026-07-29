---
title: Nuxt 번들 최적화
tags:
  - tech
created: 2026-05-27 (수)
---

# Nuxt 번들 최적화

> **TL;DR**: xlsx 라이브러리 지연 로딩과 미사용 차트 라이브러리 제거로 초기 번들 크기를 줄인다.

---

## xlsx 지연 로딩

```js
// 변경 전
import * as XLSX from 'xlsx'

// 변경 후
const XLSX = await import('xlsx')
```

## 미사용 차트 라이브러리 제거

ApexCharts 등 사용처 없는 패키지 제거 후 `app/plugins/` 파일도 함께 삭제.

---

## 관련

- [[nuxt-tooling]]

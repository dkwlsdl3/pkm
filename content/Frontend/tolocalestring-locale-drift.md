---
title: 로케일 인자 없는 toLocaleString 은 사용자 환경을 따라간다
tags:
  - tech
  - troubleshooting
created: 2026-11-09 (월)
---

# 로케일 인자 없는 toLocaleString 은 사용자 환경을 따라간다

> **TL;DR**: `(1234.5).toLocaleString()` 은 실행 환경의 기본 로케일로 찍는다. 독일어 환경이면 `1.234,5` — 천 단위 구분과 소수점이 뒤바뀐다. 숫자 표기는 로케일을 고정한 유틸 한 곳으로 모으고, 값을 모를 때는 `0` 이 아니라 모른다고 표시한다.

## 증상

- 개발자 화면에서는 `1,234` 인데 일부 사용자 화면에서만 `1.234` 로 보인다
- 숫자를 다시 읽는 코드(복사·내보내기)가 있으면 값 자체가 틀어진다

## 원인

`Number.prototype.toLocaleString()` 과 `Date.prototype.toLocaleString()` 은 첫 인자가 없으면 **실행 환경 기본 로케일**(브라우저 언어 설정, Node 는 시스템 로케일)을 쓴다.

```js
// Node 24.15 실측
(1234.5).toLocaleString('de-DE') // "1.234,5"
(1234.5).toLocaleString('ko-KR') // "1,234.5"
```

## 해결

```js
// utils/number.js — 이 파일만 toLocale* 금지 규칙의 예외
const nf = new Intl.NumberFormat('ko-KR')

export function formatCount(value) {
  return Number.isFinite(value) ? nf.format(value) : '-'
}
```

- 로케일을 고정한 포맷터를 모듈에 한 번 만든다
- `null`·`undefined` 를 `0` 으로 바꾸지 않는다. 조회 실패와 실제 0 은 다른 사실이다
- 날짜 포맷 금지 규칙이 이 메서드 이름을 함께 잡으므로, 숫자 포맷을 이 유틸로 걷어내야 금지 규칙을 전면으로 걸 수 있다

---

## 관련

- [[ko-kr-hour12-default]] — 같은 메서드의 날짜 쪽 함정
- [[narrow-lint-rule-false-negative]] — 숫자 포맷 오탐 때문에 금지 규칙을 좁혔다가 생긴 미탐
- [[query-failure-vs-empty-state]] — 모르는 값을 0·빈 목록으로 그리는 문제
- [[frontend-overview]]

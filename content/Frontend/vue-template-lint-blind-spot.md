---
title: ESLint no-restricted-syntax 는 Vue 템플릿을 보지 않는다
tags:
  - tech
  - troubleshooting
created: 2026-11-09 (월)
---

# ESLint no-restricted-syntax 는 Vue 템플릿을 보지 않는다

> **TL;DR**: ESLint 기본 규칙 `no-restricted-syntax` 는 `.vue` 파일의 `<script>` 만 검사한다. `{{ new Date(x).toLocaleString('ko-KR') }}` 같은 **템플릿 인라인 식은 그대로 통과**한다. eslint-plugin-vue 의 `vue/no-restricted-syntax` 를 **같은 selector 로 함께** 건다.

## 증상

- 금지 규칙을 넣고 위반을 전부 고쳤는데, 화면에는 금지한 표기가 계속 보인다
- 남은 위반이 모두 `<template>` 안의 `{{ }}` 나 바인딩 식이다

## 원인

ESLint 기본 규칙은 JavaScript AST(Abstract Syntax Tree, 구문 트리)만 본다. `.vue` 의 템플릿은 vue-eslint-parser 가 따로 만든 템플릿 트리에 있고, 그 트리를 보는 것은 eslint-plugin-vue 의 `vue/` 규칙들이다.

## 해결

```js
// eslint.config.mjs
const SELECTOR = 'CallExpression[callee.property.name=/^toLocale(String|DateString|TimeString)$/]'
const MESSAGE = '날짜·시각은 utils/dates, 숫자는 utils/number 를 쓴다'

export default [
  {
    rules: {
      'no-restricted-syntax': ['warn', { selector: SELECTOR, message: MESSAGE }],     // <script>
      'vue/no-restricted-syntax': ['warn', { selector: SELECTOR, message: MESSAGE }], // <template>
    },
  },
]
```

- selector 를 상수 하나로 두고 두 규칙이 같이 쓴다 — 한쪽만 고치는 갈라짐을 막는다
- 규칙을 넣은 뒤 **실제 템플릿 위반 사례 하나로 걸리는지** 확인한다. 위반 0건은 규칙이 아무것도 안 본다는 뜻일 수도 있다

---

## 관련

- [[narrow-lint-rule-false-negative]] — 같은 규칙의 또 다른 구멍(좁힌 selector)
- [[ko-kr-hour12-default]] — 이 규칙이 막으려던 결함
- [[nuxt-tooling]] — Nuxt 타입체크·ESLint CI 게이트
- [[frontend-overview]]

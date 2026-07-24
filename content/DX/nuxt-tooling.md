---
title: Nuxt Tooling
tags:
  - tech
created: 2026-05-27 (화)
---

# Nuxt Tooling

> Nuxt 프로젝트 타입체크 · ESLint · 번들 최적화 설정

---

## 타입체크

```bash
pnpm add -D typescript
```

```json
// package.json scripts
{
  "typecheck": "nuxi typecheck",
  "check": "eslint . --quiet && nuxi typecheck && nuxt build"
}
```

```json
// tsconfig.json
{
  "extends": "./.nuxt/tsconfig.json",
  "compilerOptions": { "strict": true }
}
```

---

## ESLint (`@nuxt/eslint`)

```bash
pnpm add -D @nuxt/eslint eslint
```

```ts
// nuxt.config.ts
modules: ['@nuxt/eslint']
```

```js
// eslint.config.mjs
import withNuxt from './.nuxt/eslint.config.mjs'
export default withNuxt({
  rules: {
    'vue/html-self-closing': 'off',
  }
})
```

> 포맷팅 규칙은 기존 코드베이스 위반 규모가 클 경우 초기 게이트에서 제외하고, 별도 커밋으로 베이스라인 정리 후 추가.

---

## 번들 최적화

xlsx 지연 로딩, 미사용 차트 라이브러리 제거는 [[nuxt-bundle-optimization]] 참고.

---

## Nuxt 버전 업그레이드 주의

`modulepreload polyfill` 활성화 시 Nuxt 4.4+ 빌드에서 sourcemap 경고 재발 여부 확인 필요.

---

## 관련

- [[nuxt-bundle-optimization]]
- [[gitlab-cicd]]
- [[dx-overview]]

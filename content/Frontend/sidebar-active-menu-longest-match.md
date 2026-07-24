---
title: 사이드바 활성 메뉴 — 최장 경로 매칭
tags:
  - tech
created: 2026-07-13 (월)
---
# 사이드바 활성 메뉴 — 최장 경로 매칭

## 문제

활성 메뉴 판정을 `route.path.startsWith(item.path)`로 하면, 메뉴 경로끼리 접두어 관계일 때(`/files` vs `/files/trash`) 하위 페이지에서 **두 메뉴가 동시에 활성**된다.

## 해법

전체 메뉴 경로 중 현재 라우트와 매칭되는 것들에서 **가장 긴 경로 하나만** 활성으로 판정한다.

```js
const activeItemPath = computed(() => {
  const paths = menus.value.flatMap(g => g.children.map(i => i.path)).filter(Boolean)
  const matches = paths.filter(p => current === p || current.startsWith(p + '/'))
  return matches.sort((a, b) => b.length - a.length)[0] || null
})
// 각 항목: item.path === activeItemPath
```

## 포인트

- `path + '/'` 경계 매칭으로 `/files2` 같은 유사 접두어 오매칭도 함께 제거
- 상세 하위 라우트(`/items/123`)에서 상위 메뉴 유지라는 startsWith의 원래 의도는 보존됨
- 데스크톱/모바일 등 판정이 여러 곳이면 computed 하나로 통일

## 관련

- [[frontend-overview]]

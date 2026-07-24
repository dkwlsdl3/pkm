---
title: Playwright 셀렉터와 초기 로딩 대기 전략
tags:
  - tech
  - dx
  - testing
created: 2026-05-18 (일)
---

# Playwright 셀렉터와 초기 로딩 대기 전략

> **TL;DR**: role이 없는 컴포넌트는 클래스 기반 locator로 대체하고, SPA 초기화는 고정 sleep 대신 실제 표시 조건(body display, URL, 요소 visible)으로 대기한다.

---

## Dialog 셀렉터

Playwright의 `getByRole()`은 실제 DOM에 해당 ARIA role이 있어야 안정적으로 동작한다. 컴포넌트가 `role="dialog"`를 제공하지 않고 `.dialog-overlay` 클래스만 렌더링한다면 role 기반 셀렉터는 매칭되지 않는다.

```typescript
// Dialog.vue에 role="dialog"가 없으면 실패
const dialog = page.getByRole('dialog');

// 실제 렌더링 구조에 맞춘 locator
const dialog = page.locator('.dialog-overlay');
```

## 앱 초기화 대기

SPA가 초기화 전 `body`를 `display:none`으로 유지한다면 `waitForLoadState('load')`만으로는 버튼이나 입력 필드가 보장되지 않는다. 고정 sleep 대신 실제 표시 조건을 기다린다.

```typescript
await page.goto('/nas/storage/personal');
await page.waitForLoadState('load');
await page.waitForFunction(
  () => document.body.style.display !== 'none',
  { timeout: 30_000 },
);
await expect(page).not.toHaveURL(/\/(auth|server-unavailable)/);
await expect(page.getByRole('button', { name: '업로드' })).toBeVisible({
  timeout: 30_000,
});
```

> [!NOTE]
> E2E 대기는 시간 자체가 아니라 사용자가 실제로 조작 가능한 상태를 기준으로 잡는 편이 안정적이다.

---

## 관련

- [[playwright-e2e]]

---
tags:
  - tech
created: 2026-06-08 (월)
---

# Playwright Error Context Snapshot

> **TL;DR**: Playwright의 `error-context.md`는 실패 순간의 접근성 트리라서, 셀렉터 드리프트를 추측하지 않고 실제 DOM 구조 기준으로 고칠 수 있다.

---

## 개요

- **무엇인가**: Playwright 실패 결과에 남는 `error-context.md` 접근성 스냅샷을 읽어 role/name/입력 구조를 확인하는 진단 방식.
- **왜 쓰는가**: Vue/React 컴포넌트가 native control처럼 보이지만 실제 DOM은 button/listbox/div 구조일 때 셀렉터 추측이 쉽게 틀리기 때문.
- **언제 쓰는가**: `strict mode violation`, role 미탐색, modal/dialog 미탐색, custom select 클릭 실패, 같은 이름 버튼 충돌이 날 때.

---

## 핵심 개념

### 스냅샷을 DOM 진실로 둔다

실패한 테스트 코드가 기대한 role보다 Playwright가 남긴 접근성 트리가 우선이다. `getByRole('dialog')`가 실패하고 스냅샷에는 `.dialog-overlay`만 보이면, 테스트는 role 기반 전제를 버리고 실제 컨테이너에 맞춰야 한다.

### 스코프를 먼저 좁힌다

페이지 전체에서 `getByPlaceholder()`나 `getByRole('button', { name })`을 찾으면 검색창/모달/툴바가 충돌할 수 있다. 다이얼로그나 특정 row 안으로 locator scope를 좁히면 strict-mode 충돌을 줄일 수 있다.

### Custom Select는 native select가 아니다

UI가 select처럼 보여도 실제 구현이 button trigger와 dropdown item이면 `selectOption()`이 아니라 trigger 클릭 후 option text/role/item selector를 사용해야 한다.

---

## 코드 / 사용 예시

```bash
# 실패한 테스트 결과에서 접근성 스냅샷 확인
sed -n '1,220p' test-results/<failed-test>/error-context.md
```

```ts
const dialog = page.locator('.dialog-overlay').last();
await dialog.getByPlaceholder('디렉토리 이름').fill('quota-test');
await dialog.getByRole('button', { name: '확인' }).click();
```

```ts
await page.getByRole('button', { name: '새 링크', exact: true }).click();
```

---

## 주의사항

> [!WARNING]
> 테스트 셀렉터를 고칠 때 접근성 role을 임의로 단정하지 않는다. 컴포넌트 구현이 접근성 role을 제공하지 않으면 제품 코드에 role을 추가할지, 테스트에서 안정적인 class/test id를 쓸지 별도로 판단한다.

- `waitForTimeout()`으로 증상을 덮기 전에 스냅샷의 실제 구조를 본다.
- 같은 이름의 버튼이 여러 개면 `exact: true` 또는 locator scope를 사용한다.
- modal/dialog가 semantic role을 제공하지 않는다면 제품 접근성 개선 후보로도 기록한다.

---

## 관련

- [[playwright-shared-account-hazards]]
- [[testing-overview]]
- [[playwright-e2e]]

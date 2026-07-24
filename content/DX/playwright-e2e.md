---
title: Playwright E2E 테스트
tags:
  - tech
  - dx
  - testing
created: 2026-05-18 (일)
---

# Playwright E2E 테스트

> **TL;DR**: Playwright로 E2E 테스트 환경 구성 — 인증 상태 재사용(storageState), 인증/비인증 project 분리

---

## 설치

```bash
mkdir -p e2e && cd e2e
npm install @playwright/test dotenv typescript @types/node --save-dev
npx playwright install chromium
```

### 디렉토리 구조

```
e2e/
├── package.json
├── tsconfig.json
├── playwright.config.ts
├── global-setup.ts         # 인증 상태 저장
├── .env.test               # 환경변수 (gitignore)
├── .env.test.example
└── tests/
    ├── auth/login.spec.ts
    ├── nas/file-browse.spec.ts
    └── admin/users.spec.ts
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "strict": true,
    "types": ["node", "@playwright/test"]
  }
}
```

---

## playwright.config.ts — 핵심 설정

```typescript
import { defineConfig } from '@playwright/test';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.test' });

export default defineConfig({
  globalSetup: './global-setup.ts',
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:3000',
  },
  projects: [
    {
      name: 'authenticated',
      use: { storageState: '.auth/admin.json' },
      testIgnore: ['**/auth/**'],  // 로그인 테스트 제외
    },
    {
      name: 'unauthenticated',
      testMatch: ['**/auth/**'],   // 로그인 테스트만
    },
  ],
});
```

---

## 인증 구조 — global-setup.ts

### 핵심 개념

- **access token**: Vue 메모리(ref)에만 저장 — Playwright가 직접 접근 불가
- **refresh token**: httpOnly 쿠키 — Playwright `storageState`가 캡처함
- 앱 로드 시 `/api/auth/token/refresh` 자동 호출 → access token 재발급

→ httpOnly 쿠키만 저장해두면 앱이 알아서 access token을 복원함

### 흐름

```
POST /api/auth/login
  ↓ OTP 필요 시
DB에서 최신 OTP code 조회 (auth_otp_codes 테이블)
  ↓
POST /api/auth/login/verify-otp
  ↓
/ 로 이동 → 앱 초기화 완료 대기
  ↓
context.storageState({ path: '.auth/admin.json' }) 저장
```

### OTP 조회 (psql)

```typescript
import { execSync } from 'child_process';

const result = execSync(
  `psql "${process.env.DB_URL}" -t -c "SELECT code FROM auth_otp_codes WHERE id = '${otpId}' LIMIT 1;"`
).toString().trim();
```

---

## 환경변수 (.env.test)

```bash
ADMIN_EMAIL=<ADMIN_EMAIL>
ADMIN_PASSWORD=<ADMIN_PASSWORD>
BASE_URL=http://localhost:3000
DB_URL=postgres://<DB_USER>:<DB_PASSWORD>@localhost:5432/<DB_NAME>
```

---

## 테스트 실행

```bash
cd e2e

npm test                 # 전체 실행 (headless)
npm run test:headed      # 브라우저 UI 표시
npm run test:ui          # Playwright UI 모드
npm run test:report      # HTML 리포트 열기
```

---

## 자주 겪는 오류

| 오류 | 원인 | 해결 |
|---|---|---|
| `Cannot find name 'process'` | `@types/node` 미설치 | `npm i -D @types/node` + tsconfig에 `"types": ["node", ...]` |
| `storageState` 인증 만료 | refresh token 만료 | global-setup 재실행 (`npx playwright test --global-setup`) |
| OTP 조회 실패 | DB URL 잘못됨 | `.env.test`의 `DB_URL` 확인 |

---

## 셀렉터와 초기 로딩 대기

### Dialog 셀렉터

Playwright의 `getByRole()`은 실제 DOM에 해당 ARIA role이 있어야 안정적으로 동작한다. 컴포넌트가 `role="dialog"`를 제공하지 않고 `.dialog-overlay` 클래스만 렌더링한다면 role 기반 셀렉터는 매칭되지 않는다.

```typescript
// Dialog.vue에 role="dialog"가 없으면 실패
const dialog = page.getByRole('dialog');

// 실제 렌더링 구조에 맞춘 locator
const dialog = page.locator('.dialog-overlay');
```

### 앱 초기화 대기

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

- [[github-actions]]
- [[dx-overview]]

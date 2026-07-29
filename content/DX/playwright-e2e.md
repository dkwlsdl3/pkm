---
title: Playwright E2E 테스트
tags:
  - tech
  - dx
  - testing
created: 2026-05-18 (월)
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

storageState로 refresh token 쿠키만 저장해두면 앱이 access token을 자동 복원하는 구조와 OTP 조회 흐름은 [[playwright-auth-storagestate]] 참고.

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

role이 없는 컴포넌트의 클래스 기반 locator 대체, SPA 초기화 완료를 기다리는 전략은 [[playwright-selector-wait-strategy]] 참고.

---

## 관련

- [[github-actions]]
- [[playwright-auth-storagestate]]
- [[playwright-selector-wait-strategy]]
- [[dx-overview]]

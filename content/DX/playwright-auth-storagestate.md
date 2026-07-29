---
title: Playwright storageState 인증 아키텍처
tags:
  - tech
  - dx
  - testing
created: 2026-05-18 (월)
---

# Playwright storageState 인증 아키텍처

> **TL;DR**: access token은 앱 메모리에만 있어 캡처 불가 — httpOnly refresh token 쿠키만 storageState로 저장해두면 앱이 알아서 access token을 복원한다.

---

## 핵심 개념

- **access token**: Vue 메모리(ref)에만 저장 — Playwright가 직접 접근 불가
- **refresh token**: httpOnly 쿠키 — Playwright `storageState`가 캡처함
- 앱 로드 시 `/api/auth/token/refresh` 자동 호출 → access token 재발급

→ httpOnly 쿠키만 저장해두면 앱이 알아서 access token을 복원함

## 흐름

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

## OTP 조회 (psql)

```typescript
import { execSync } from 'child_process';

const result = execSync(
  `psql "${process.env.DB_URL}" -t -c "SELECT code FROM auth_otp_codes WHERE id = '${otpId}' LIMIT 1;"`
).toString().trim();
```

---

## 관련

- [[playwright-e2e]]

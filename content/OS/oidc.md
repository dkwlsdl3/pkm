---
title: OIDC ID Token 흐름
tags:
  - tech
  - security
  - auth
created: 2026-05-18 (월)
---

# OIDC ID Token 흐름

> **TL;DR**: OAuth 2.0 위에 인증 레이어를 얹어 IdP가 ID Token(JWT)을 발급, 앱이 이를 검증해 로그인 처리. 현대 앱의 사실상 표준.

---

## 흐름

```
사용자 → "Google로 로그인" 클릭
            │
            ▼
   Google(IdP) → 인증 → ID Token(JWT) 발급
            │
            ▼
   앱 → JWT 검증 → 사용자 정보 확인 → 접속 허용
```

OAuth 2.0 위에 **인증 레이어**를 추가한 것. 현대 앱의 사실상 표준.

---

## 관련

- [[sso]]
- [[oauth2]]

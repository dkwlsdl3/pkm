---
title: OAuth2 Access Token 위임
tags:
  - tech
  - security
  - auth
created: 2026-05-18 (월)
---

# OAuth2 Access Token 위임

> **TL;DR**: 인증이 아닌 권한 위임 목적 — 사용자가 제3자 앱에 자기 리소스 접근을 허용하면, 서비스가 제한된 Access Token을 발급하고 앱은 이 토큰으로 API를 호출한다.

---

## 흐름

인증이 아닌 **권한 위임** 목적. "이 앱이 내 구글 드라이브에 접근해도 됨"

```
사용자 → 앱에 구글 드라이브 접근 허용
            │
            ▼
  구글 → Access Token 발급 (제한된 권한)
            │
            ▼
   앱 → Access Token으로 구글 API 호출
```

---

## 관련

- [[sso]]
- [[oidc]]

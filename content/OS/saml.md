---
title: SAML Assertion 흐름
tags:
  - tech
  - security
  - auth
created: 2026-05-18 (월)
---

# SAML Assertion 흐름

> **TL;DR**: SP가 IdP로 리다이렉트 → IdP가 XML 형식 SAML Assertion 발급 → SP가 검증 후 접속 허용. 엔터프라이즈 20년 표준.

---

## 흐름

```
사용자 → SP 접근
            │ "이 사람 누구야?"
            ▼
          IdP로 리다이렉트
            │ 로그인
            ▼
   IdP → SAML Assertion(XML) 발급
            │
            ▼
   SP → Assertion 검증 → 접속 허용
```

엔터프라이즈 환경(Active Directory, LDAP 연동)에 20년간 표준.

---

## 관련

- [[sso]]

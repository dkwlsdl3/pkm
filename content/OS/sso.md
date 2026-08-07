---
title: SSO (Single Sign-On)
tags:
  - tech
  - security
  - auth
created: 2026-05-18 (월)
---

# SSO (Single Sign-On)

> **TL;DR**: 한 번 로그인으로 사내 모든 서비스 접속 — SAML(기업), OIDC(현대 앱), OAuth(API 권한 위임)

> 용어: **SSO**(Single Sign-On) · **SAML**(Security Assertion Markup Language, XML 기반 SSO 표준) · **OIDC**(OpenID Connect) · **LDAP**(Lightweight Directory Access Protocol, 사용자·조직 정보 디렉터리 조회 프로토콜) → [[auth-overview]] 용어 표

---

## 개념

SSO는 **사용자 경험**. SAML / OAuth / OIDC는 SSO를 구현하는 **기술 프로토콜**.

```
사용자 → 회사 포털 로그인 (1회)
              │
              ├→ 그룹웨어 ✓ (자동)
              ├→ ERP ✓ (자동)
              ├→ GitLab ✓ (자동)
              └→ 사내 서비스 ✓ (자동)
```

### 핵심 플레이어

- **IdP (Identity Provider)**: 인증 담당 — "이 사람이 누군지 내가 보증" (Google, Okta, Keycloak)
- **SP (Service Provider)**: 실제 서비스 — "IdP가 확인해준 사람이면 접속 허용"

---

## 3가지 프로토콜 비교

| 항목 | SAML | OAuth 2.0 | OIDC |
|------|------|-----------|------|
| **목적** | 인증 + 인가 | 인가(권한 위임)만 | 인증 + 인가 |
| **형식** | XML | JSON/JWT | JSON/JWT |
| **주 사용처** | 기업 내부 시스템, 레거시 | API, 마이크로서비스 | 현대 웹·모바일 앱 |
| **구현 복잡도** | 높음 | 중간 | 중간 |
| **예시** | Active Directory → 사내 시스템 | "Google로 접근 허용" | "Google로 로그인" |

---

## SAML 흐름

XML 기반 Assertion으로 SP가 IdP 인증 결과를 검증하는 엔터프라이즈 표준 흐름 — [[saml]] 참고.

---

## OIDC 흐름

OAuth 2.0 위에 인증 레이어를 얹어 ID Token(JWT)으로 로그인 처리하는 흐름 — [[oidc]] 참고.

---

## OAuth 2.0 — 인가(Authorization)

인증이 아닌 권한 위임 목적으로 Access Token을 발급·사용하는 흐름 — [[oauth2]] 참고.

---

## 선택 기준

| 상황 | 권장 |
|------|------|
| 사내 기존 시스템 연동 (AD, LDAP) | SAML |
| 현대 웹/모바일 앱 로그인 | OIDC |
| 외부 API 접근 권한 위임 | OAuth 2.0 |
| B2C 서비스 소셜 로그인 | OIDC |

---

## SSO의 이점

- **사용자 편의성**: 계정 피로 감소, 비밀번호 수 최소화
- **보안 중앙화**: IdP 한 곳에서 MFA·비밀번호 정책 적용
- **접근 이력 관리**: 누가 언제 어떤 서비스에 접속했는지 단일 감사 로그
- **계정 관리 효율**: 퇴사 처리 시 IdP에서 한 번만 비활성화

---

## 관련

- [[saml]]
- [[oidc]]
- [[oauth2]]
- [[linux-permissions]]
- [[os-overview]]

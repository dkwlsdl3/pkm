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

## OIDC 흐름

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

## OAuth 2.0 — 인가(Authorization)

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

- [[linux-permissions]]
- [[os-overview]]

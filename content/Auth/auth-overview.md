---
title: Auth 개요 (MOC)
tags:
  - tech
  - moc
created: 2026-06-08 (월)
---

# Auth 개요 (MOC)

> 인증, 비밀번호 해시, 계정 복구와 테스트 격리

---

## 용어

| 표기 | 원어 | 뜻 |
|---|---|---|
| RBAC | Role-Based Access Control | 역할 기반 접근 제어. 사용자에게 권한을 직접 주지 않고 역할을 통해 준다 |
| SSO | Single Sign-On | 한 번 로그인하면 연결된 여러 서비스에 다시 로그인하지 않는 방식 |
| OIDC | OpenID Connect | OAuth 2.0 위에 "누구인지"(인증)를 얹은 표준 |
| JWT | JSON Web Token | 서명된 JSON 토큰. 서버가 상태를 저장하지 않고 검증할 수 있다 |
| OTP | One-Time Password | 일회용 비밀번호 |
| CSRF | Cross-Site Request Forgery | 로그인된 사용자의 브라우저를 이용해 의도하지 않은 요청을 보내게 하는 공격 |
| XSS | Cross-Site Scripting | 페이지에 악성 스크립트를 심어 실행시키는 공격 |
| SPA | Single Page Application | 페이지 전환 없이 한 문서에서 동작하는 프런트엔드 구조 |
| PHC | Password Hashing Competition | 해시 문자열 표준 형식(`$argon2id$v=19$m=...$salt$hash`). 알고리즘·파라미터·솔트가 한 문자열에 다 들어간다 |
| eTLD | effective Top-Level Domain | 쿠키 공유 경계를 정하는 실질 최상위 도메인(`co.kr` 같은 것도 포함) |
| AST | Abstract Syntax Tree | 추상 구문 트리. 코드를 파싱한 구조체 — 라우트 목록을 소스에서 추출할 때 쓴다 |

---

## 비밀번호 / 계정 복구

- [[argon2id-password-reset]] — argon2id PHC 문자열을 생성해 dev/test 계정 비밀번호와 로그인 잠금 상태를 복구하는 패턴
- [[credential-update-backup-first]] — 자격증명 UPDATE는 원본 파괴 — 변경 전 대상 확인+기존 해시 SELECT 백업

## 인가 / RBAC

- [[rbac-category-menu-source-of-truth]] — 권한 카테고리 정본은 백엔드 모듈 경로가 아니라 사용자에게 보이는 메뉴 구조
- [[authz-cutover-observe-rehearse-enforce]] — 인가 전환은 관찰 → 리허설 → 강제 3단, 리허설과 강제가 같은 판정 함수를 공유
- [[central-route-table-as-policy-source]] — 중앙 라우트표은 배선이 아니라 정책을 적는 문서 + 정책 축의 런타임 소비자 확인

## 토큰 / 세션

- [[api-key-derived-token-scope]] — API 키 파생 토큰에 스코프 강제(전권 발급 = 권한 상승)
- [[session-keepalive-refresh-vs-relogin]] — authToken은 refresh, refreshToken은 재로그인으로 리셋
- [[http-200-fake-write-failure]] — write 인증실패가 HTTP 200+success:false로 위장되는 함정
- [[csrf-double-submit-sibling-subdomain]] — OAuth `state`의 double-submit 쿠키를 형제 서브도메인이 우회, `__Host-` 접두사로 차단

---

## 관련

- [[testing-overview]]
- [[os-overview]]

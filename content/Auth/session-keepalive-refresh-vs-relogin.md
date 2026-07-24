---
title: 쿠키 세션 무인 유지 — refresh vs 재로그인
tags:
  - auth
created: 2026-07-01 (수)
---

# 쿠키 세션 무인 유지 — refresh vs 재로그인

> 짧은 authToken + 긴 refreshToken 구조의 SPA 세션을, 스크립트/자동화에서 사람 개입 없이 유지하는 패턴.

## 전형적 구조

- `authToken`: 짧은 수명(예: 30분), 모든 요청 인증에 사용.
- `refreshToken`: 긴 수명(예: 7일, "로그인 유지" 체크 시), authToken 재발급에만 사용.
- 서버가 로그인 시점에 refreshToken 수명을 **고정** 발급한다(클라이언트가 못 늘림).

## 핵심 함정 — refresh는 refreshToken을 연장하지 않는다

`POST /auth/refresh`는 보통 **authToken(+부속 토큰)만 새로 발급**하고 refreshToken은 그대로 둔다. 따라서:

- authToken 만료 → refresh로 무한 갱신 가능(**refreshToken이 살아있는 동안만**).
- refreshToken 만료 → refresh도 실패 → **결국 재로그인이 유일한 리셋 수단**.

→ 진짜 "무인 무한 유지"는 refresh만으론 불가능. **refreshToken 만료 전에 주기적으로 재로그인**해 refreshToken 자체를 새로 받아야 한다(예: 매일 1회, id/pw를 로컬 secret 파일에서 읽어 로그인 API 호출 → 새 쿠키 저장).

## 자동화 레시피

1. **on-demand refresh**: API 호출 직전/인증실패 시 refresh 1회 후 재시도(authToken 신선도 유지).
2. **주기 재로그인**: 스케줄러로 refreshToken 만료 전 재로그인(→ [[systemd-user-timer]]).
3. 자격증명은 `chmod 600` secret 파일에서 런타임에만 읽고 값은 로그에 남기지 않는다. 로그인 실패(401)는 **재시도 금지**(계정 잠금 방지).

## 관련
- [[auth-overview]]
- [[http-200-fake-write-failure]] — write 인증실패가 200+success:false로 위장되는 함정
- [[playwright-mcp-session-persistence]] — 저장된 storageState로 브라우저 세션 재주입
- [[systemd-user-timer]]

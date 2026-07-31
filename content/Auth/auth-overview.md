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

---

## 관련

- [[testing-overview]]
- [[os-overview]]

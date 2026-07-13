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

## 세션 유지

- [[session-keepalive-refresh-vs-relogin]] — authToken은 refresh, refreshToken은 재로그인으로 리셋; write 인증실패가 200+success:false로 위장되는 함정

---

## 관련

- [[testing-overview]]
- [[os-overview]]

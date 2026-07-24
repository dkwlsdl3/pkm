---
title: write 인증실패가 HTTP 200으로 위장
tags:
  - auth
created: 2026-07-01 (수)
---

# write 인증실패가 HTTP 200으로 위장

> **TL;DR**: 일부 API는 인증 만료 시 GET은 관대(200)하지만 write(POST/PUT)는 401이 아니라 `HTTP 200 + {success:false}`로 위장한다. 401만 감지하면 write 자동복구를 놓친다.

---

## 개요

- **무엇**: 인증 만료를 401이 아닌 200+실패바디로 응답하는 API의 감지 함정
- **왜 / 언제**: 세션 자동 갱신/재시도 로직을 짤 때, write 실패를 인증신호로 잡아야 할 때

## 핵심

일부 API는 인증 만료 시 **GET은 200으로 관대**하지만 **write(POST/PUT)는 `HTTP 200 + {success:false}`("수정 중 오류" 등)로 위장**한다. HTTP 상태코드 401만 감지하는 복구 로직은 이 경우를 놓친다.

→ write 응답의 `success:false`(또는 상응하는 실패 필드)도 **인증신호 후보**로 보고 refresh + 재시도한다.

---

## 관련

- [[session-keepalive-refresh-vs-relogin]]
- [[auth-overview]]

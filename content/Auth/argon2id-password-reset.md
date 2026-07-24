---
title: Argon2id Password Reset
tags:
  - tech
created: 2026-06-08 (월)
---

# Argon2id Password Reset

> **TL;DR**: dev/test 계정이 API 원복 경로로 복구되지 않을 때는 argon2id PHC 문자열을 생성해 DB의 `password_hash`를 교체하고 로그인 실패 카운터를 함께 정리한다.

---

## 개요

- **무엇인가**: argon2id 해시 문자열을 직접 생성해 dev/test 계정 비밀번호를 DB 레벨에서 복구하는 절차.
- **왜 쓰는가**: 비밀번호 변경 테스트가 공유 계정을 오염시켰거나, 현재 비밀번호 정책 때문에 원래 비밀번호로 API 변경이 거부될 수 있기 때문.
- **언제 쓰는가**: 로컬/개발/test 환경에서 계정 비밀번호와 로그인 잠금 상태를 복구해야 하며, 운영 사용자 데이터에는 적용하지 않을 때.

---

## 핵심 개념

### PHC 문자열 전체를 저장한다

argon2id는 salt와 cost parameter가 포함된 PHC 문자열을 저장한다. DB에는 raw password가 아니라 생성된 PHC 문자열 전체를 넣는다.

### 비밀번호와 잠금 상태는 함께 본다

비밀번호를 정상 해시로 되돌려도 로그인 실패 테이블이 잠금 상태를 유지하면 로그인은 계속 실패할 수 있다. 복구 절차에는 실패 카운터 삭제가 포함되어야 한다.

### 정책 우회는 dev/test 복구용이다

시드 데이터나 DB 직접 교체는 서비스의 현재 비밀번호 정책을 우회할 수 있다. 이 방식은 개발/테스트 환경 복구용으로만 사용하고, 운영에서는 감사 가능한 관리자 절차를 따른다.

---

## 코드 / 사용 예시

```bash
python3 - <<'PY'
import os
from argon2 import PasswordHasher

password = os.environ['RESET_PASSWORD']
email = os.environ['RESET_EMAIL']
phc = PasswordHasher().hash(password)

print(f\"UPDATE auth_users SET password_hash = '{phc}' WHERE email = '{email}';\")
print(f\"DELETE FROM auth_login_attempts WHERE email = '{email}';\")
PY
```

```bash
# 생성한 SQL은 dev/test DB에만 적용
psql \"$DATABASE_URL\" -f /tmp/reset-password.sql
```

---

## 주의사항

> [!WARNING]
> 실제 비밀번호, 토큰, DB URL, 내부 계정 이메일은 노트나 커밋에 남기지 않는다. 복구 SQL도 임시 파일로 만들고 적용 후 삭제한다.

- 운영 DB에 직접 적용하지 않는다.
- 해시 생성 알고리즘이 서비스와 같은지 확인한다.
- 비밀번호 정책과 시드 데이터가 서로 어긋나면 테스트 설계 자체를 수정한다.

---

## 관련

- [[playwright-shared-account-hazards]]
- [[auth-overview]]
- [[testing-overview]]

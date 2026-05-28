---
title: PostgreSQL 논리 백업
tags:
  - tech
  - data
  - postgresql
  - backup
created: 2026-05-28 (목)
---

# PostgreSQL 논리 백업

> **TL;DR**: 애플리케이션에서 PostgreSQL 백업을 실행할 때는 OS 유저 sudo보다 DB 접속 정보 기반 `pg_dump`, `psql` 실행이 더 이식성 있다.

---

## 개요

- **무엇인가**: `pg_dump`와 `psql`을 사용해 데이터베이스를 파일로 내보내고 다시 복원하는 방식.
- **왜 쓰는가**: 물리 백업보다 다루기 쉽고, 애플리케이션 백업 기능에 넣기 좋다.
- **언제 쓰는가**: 단일 서비스 DB 백업, 개발/운영 점검용 백업, 기능 단위 수동 백업.

---

## 실행 패턴

서비스 프로세스가 DB OS 유저로 sudo할 수 있다는 가정은 환경마다 깨지기 쉽다. 대신 `DATABASE_URL`을 파싱해 접속 정보를 만들고, password는 환경변수로 전달한다.

```bash
PGPASSWORD="<DB_PASSWORD>" pg_dump \
  -h "<DB_HOST>" \
  -p "<DB_PORT>" \
  -U "<DB_USER>" \
  -d "<DB_NAME>" \
  --clean \
  --if-exists
```

복원도 같은 접속 정보로 실행한다.

```bash
PGPASSWORD="<DB_PASSWORD>" psql \
  -h "<DB_HOST>" \
  -p "<DB_PORT>" \
  -U "<DB_USER>" \
  -d "<DB_NAME>" \
  -f "<BACKUP_FILE>"
```

---

## 애플리케이션 구현 시 주의

- 명령 인자는 shell string 조립보다 `Command` 인자 배열로 넘긴다.
- password는 명령줄 인자로 넣지 말고 환경변수로 전달한다.
- 백업 실패는 단순 로그만 남기지 말고 시스템 로그나 알림으로 운영자가 볼 수 있게 한다.
- 복원 API에는 확인 문자열 같은 안전장치를 둔다.

---

## 주의사항

> [!WARNING]
> 공개 문서에는 실제 DB host, user, password, backup path를 쓰지 않는다. 예시는 `<DB_HOST>`, `<DB_PASSWORD>` 같은 플레이스홀더로 남긴다.

---

## 관련

- [[data-engineering-overview]]
- [[data-storage]]
- [[keeper-snapshot-backup-fixes-2026-05-28]]

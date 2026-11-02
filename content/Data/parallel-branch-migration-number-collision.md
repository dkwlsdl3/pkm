---
title: 병렬 브랜치의 마이그레이션 번호 충돌
tags:
  - tech
  - troubleshooting
created: 2026-11-02 (월)
---

# 병렬 브랜치의 마이그레이션 번호 충돌

> **TL;DR**: 순번형 마이그레이션(`029_…`, `030_…`)은 두 브랜치가 동시에 같은 번호를 쓰면, 합친 뒤 **이미 다른 029를 적용한 DB가 체크섬 오류로 멈춘다.** 나중 브랜치의 번호를 옮겨서 해결한다. 이미 꼬인 DB를 정리할 때는 이름이 아니라 **체크섬과 적용 시각**으로 어느 행이 어느 파일인지 가린다.

## 증상

- develop을 받은 뒤 로컬 백엔드가 기동 중 마이그레이션 단계에서 멈춘다.
  - 예: sqlx 기준 `migration 29 was previously applied but has been modified`
- 두 이슈(#28, #57)가 각자 브랜치에서 `029`번 마이그레이션을 만들었고, 둘 다 머지됐다.

## 원인

- 마이그레이션 도구는 번호(version)를 키로 "적용됨" 기록과 파일 체크섬을 저장한다(sqlx는 `_sqlx_migrations` 표).
- A 브랜치의 029를 먼저 적용한 DB는 B 브랜치의 029 파일과 체크섬이 다르다. 그래서 "적용된 마이그레이션이 바뀌었다"로 판정하고 멈춘다.
- 브랜치마다 CI는 통과한다. 각자 안에서는 번호가 하나뿐이라서다. **합친 결과**에서만 드러난다.

## 해결

```sql
-- 어느 029가 적용됐는지: 이름이 아니라 체크섬·적용 시각으로
SELECT version, description, encode(checksum,'hex') AS sum, installed_on
FROM _sqlx_migrations WHERE version >= 29 ORDER BY version;
```

```bash
# 파일 쪽 체크섬과 대조 (sqlx는 SHA-384)
sha384sum migrations/029_*.sql
```

1. 나중에 들어온 브랜치의 파일을 다음 번호(030)로 옮긴다. 남은 번호와 겹치지 않는지도 확인한다.
2. 이미 꼬인 DB만 고친다. 체크섬이 일치하는 행이 어느 파일인지 확인한 뒤 행을 고치거나 다시 적용한다.
3. **이름(description)만 보고 행을 지우지 말 것.** 실제로 그렇게 했다가 다른 행을 지웠고, 체크섬과 적용 시각을 대조해 백업에서 복원했다.

재발 방지:

- 순번 대신 **타임스탬프 번호**를 쓴다. `sqlx migrate add`는 타임스탬프(`-t`)와 순번(`-s`)을 고를 수 있다. 기본값은 판과 기존 파일에 따라 다를 수 있으니 플래그로 명시한다.
- sqlx 0.8.6 소스 기준으로 확인한 것: 오류 문구는 `error.rs`, 체크섬이 SQL 본문의 SHA-384라는 것은 `migration.rs`에 있다.
- 머지 대상 브랜치 기준으로 번호 중복을 검사하는 CI 단계를 둔다.

---

## 관련

- [[migrations-replayed-in-full]]
- [[migration-baseline-squash]]
- [[online-migration-competing-writers]]
- [[integrator-session-worktree-fanout]] — 병렬 세션 작업을 합칠 때 생기는 다른 충돌
- [[data-engineering-overview]]

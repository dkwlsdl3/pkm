---
tags:
  - tech
created: 2026-05-29 (금)
---

# Git 워크플로우

> **TL;DR**: `git mv`/`git rm`은 자동 staging되므로, 한 커밋에 한 관심사만 담으려면 명시적으로 unstage하거나 경로를 한정해 커밋해야 한다.

---

## 개요

- **무엇인가**: 변경을 의미 있는 단위로 나눠 커밋하기 위한 staging/commit 습관
- **왜 쓰는가**: 도메인이 섞인 커밋은 리뷰·되돌리기·history 추적이 어렵다. 한 커밋 = 한 관심사가 원칙
- **언제 쓰는가**: 한 작업 세션에서 문서·설정·코드 등 여러 관심사를 동시에 건드렸을 때

---

## 핵심 개념

### `git mv` / `git rm`은 자동 staging된다

- `git mv a b`, `git rm c`는 일반 파일 수정과 달리 **즉시 index에 반영**된다. `git add` 없이도 staged 상태.
- 그래서 도메인별로 나눠 커밋하려다 무심코 파일 이동·삭제까지 첫 커밋에 섞여 들어가기 쉽다.

### 도메인 분리 커밋

- 한 커밋은 한 가지 관심사(문서 / 기능 / 리팩터링 …)만 담는다.
- 원하는 것만 명시적으로 `git add <path>` 후 커밋하거나, 경로를 한정해 `git commit -- <path>`.
- 원치 않는 것은 `git reset HEAD <path>`로 unstage.

### 잘못 섞인 커밋 풀기 (soft reset)

- `git reset --soft HEAD~1` — 마지막 커밋만 취소하되 변경 내용은 staged로 보존.
- `git reset HEAD` — index를 비워 전부 unstage (working tree 변경은 그대로).
- 이후 도메인별로 다시 add/commit.

---

## 코드 / 사용 예시

```bash
# git mv/rm으로 이미 staged된 상태에서 도메인을 분리하고 싶을 때
git reset --soft HEAD~1    # 마지막 커밋만 되돌리기 (변경은 보존)
git reset HEAD             # index 비우기 (전부 unstage)

# 도메인 A: 문서만 커밋
git add docs/
git commit -m "[DOCS] ..."

# 도메인 B: 경로를 한정해 그 파일만 커밋
git commit -- src/feature.rs -m "[ADD] ..."

# 커밋 직전, 의도치 않은 파일이 섞였는지 항상 확인
git status
```

---

## 주의사항

> [!WARNING]
> `git mv`/`git rm`은 `git add` 없이도 staged 상태가 된다. 도메인 분리 커밋 중이라면 커밋 전 반드시 `git status`로 의도치 않은 파일이 섞였는지 확인하고, 필요하면 `git reset HEAD <path>`로 제외할 것.

---

## 관련

- [[monorepo]] — 서브모듈/멀티레포 환경에서의 커밋 전략
- [[github-actions]] — 커밋 이벤트 기반 CI/CD 자동화

---
title: Git 워크플로우
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

## 서브모듈 커밋은 자동 push되지 않는다

- 슈퍼프로젝트의 `git push`는 **서브모듈에 새로 만든 커밋을 함께 올리지 않는다**. 슈퍼프로젝트는 서브모듈의 커밋 해시(포인터)만 기록하므로, 그 포인터가 가리키는 커밋이 서브모듈 원격에 없으면 CI에서 `git submodule update`가 `not our ref <hash>`로 실패한다.
- 해결: 서브모듈에서 먼저 push한 뒤 슈퍼프로젝트를 push한다. 자동화하려면 `push.recurseSubmodules=on-demand`.

```bash
# 1) 서브모듈의 미push 커밋을 올린다
cd path/to/submodule && git push origin <branch>

# 2) 이후 슈퍼프로젝트 push 시 서브모듈 커밋도 자동 push
git config --global push.recurseSubmodules on-demand

# 3) 전체 서브모듈 감사 — HEAD가 원격 어딘가에 포함돼 있는지
git submodule foreach --quiet \
  'git fetch origin -q; git branch -r --contains HEAD | grep -q . \
     && echo "$sm_path OK" || echo "$sm_path NEEDS PUSH"'
```

- `on-demand`: 슈퍼프로젝트가 참조하는 서브모듈 커밋이 원격에 없으면 자동으로 push 시도. `check`는 없을 때 push 대신 에러만 낸다.

---

## 주의사항

> [!WARNING]
> `git mv`/`git rm`은 `git add` 없이도 staged 상태가 된다. 도메인 분리 커밋 중이라면 커밋 전 반드시 `git status`로 의도치 않은 파일이 섞였는지 확인하고, 필요하면 `git reset HEAD <path>`로 제외할 것.

> [!WARNING]
> 서브모듈 커밋을 push하지 않은 채 슈퍼프로젝트 포인터만 올리면 CI가 `not our ref`로 깨진다. `push.recurseSubmodules=on-demand`를 전역 설정해 두는 것이 안전하다.

---

## 관련

- [[monorepo]] — 서브모듈/멀티레포 환경에서의 커밋 전략
- [[gitlab-cicd]] — 서브모듈 update가 들어가는 CI 단계
- [[github-actions]] — 커밋 이벤트 기반 CI/CD 자동화

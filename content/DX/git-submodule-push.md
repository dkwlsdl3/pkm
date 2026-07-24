---
title: 서브모듈 커밋 자동 push 안 됨
tags:
  - tech
created: 2026-05-29 (금)
---

# 서브모듈 커밋 자동 push 안 됨

> **TL;DR**: 슈퍼프로젝트의 `git push`는 서브모듈에 새로 만든 커밋을 함께 올리지 않는다. `push.recurseSubmodules=on-demand`로 자동화한다.

---

## 문제

- 슈퍼프로젝트의 `git push`는 **서브모듈에 새로 만든 커밋을 함께 올리지 않는다**. 슈퍼프로젝트는 서브모듈의 커밋 해시(포인터)만 기록하므로, 그 포인터가 가리키는 커밋이 서브모듈 원격에 없으면 CI에서 `git submodule update`가 `not our ref <hash>`로 실패한다.
- 해결: 서브모듈에서 먼저 push한 뒤 슈퍼프로젝트를 push한다. 자동화하려면 `push.recurseSubmodules=on-demand`.

## 코드 / 사용 예시

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
> 서브모듈 커밋을 push하지 않은 채 슈퍼프로젝트 포인터만 올리면 CI가 `not our ref`로 깨진다. `push.recurseSubmodules=on-demand`를 전역 설정해 두는 것이 안전하다.

---

## 관련

- [[git-workflow]] — 커밋 staging/분리 워크플로우

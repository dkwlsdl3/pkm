---
title: GitLab CI rules는 먼저 맞는 하나만 적용된다
tags:
  - tech
  - cicd
  - gitlab
  - troubleshooting
created: 2026-07-31 (금)
---

# GitLab CI rules는 먼저 맞는 하나만 적용된다

> **TL;DR**: `rules:`는 위에서부터 평가해 **처음 매칭되는 항목 하나만** 적용하고 즉시 멈춘다. 앞 규칙에 `when:`이 없으면 기본값 `on_success`(= 자동 실행)이므로, 뒤에 적어둔 `when: manual` 폴백은 **도달하지 않는다**. `when: manual`을 grep해서 "이 잡은 수동"이라 판단하면 오판이고, 실제로는 승인 없이 자동 배포된다.

---

## 증상

승인한 적 없는데 배포가 나갔다. 그런데 `.gitlab-ci.yml`을 grep하면 해당 잡에 `when: manual`이 분명히 있다.

## 원인

전환기·마이그레이션 흔적으로 규칙이 **두 개** 남아 있는 형태가 전형이다.

```yaml
backend:deploy:dev:
  rules:
    - if: '$CI_COMMIT_BRANCH == "develop" && $MIGRATION_DONE == "true"'
      # when: 생략 → 기본값 on_success = 자동 실행
    - if: '$CI_COMMIT_BRANCH == "develop"'
      when: manual        # ← 절대 도달하지 않는다
```

변수가 설정돼 있으면 1번이 매칭되고 평가가 끝난다. 2번은 **죽은 규칙**이다.

여기에 파일 헤더·잡별 주석이 "전환 완료까지는 manual"처럼 옛 사실을 말하고 있으면, 읽는 사람이 두 번 속는다.

## 해결

### 1. 죽은 규칙을 제거해 실제 동작을 드러낸다

```yaml
backend:deploy:dev:
  rules:
    - if: '$CI_COMMIT_BRANCH == "develop"'   # 단일 규칙 = 자동 배포
```

**동작은 바뀌지 않는다**(어차피 자동이었다). 목적은 **읽는 사람이 속지 않는 것**이다. 거짓 주석도 함께 정정한다.

### 2. 진짜 수동인 잡은 손대지 않는다

규칙이 하나뿐이고 `when: manual`인 잡(고객사 배포 등)에 같은 정리를 하면 **자동 배포로 바뀐다.** 정리 대상과 비대상을 구별하고, 주석에 대비를 명시한다.

### 3. 실제 동작은 파이프라인에서 확인한다

YAML 독해가 아니라 실행 결과로 확인한다.

```bash
glab ci lint                       # 문법
glab ci list                       # 최근 파이프라인
glab ci get -p <파이프라인ID>      # 잡별 when/상태
```

## 함께 걸리는 CI/CD 판독 함정

- **푸시 = 배포다** — 자동 규칙이 있으면 브랜치에 푸시하는 순간 나간다
- **`.gitlab-ci.yml`만 바꾼 푸시는 배포를 트리거하지 않을 수 있다** — `rules: changes:`에 CI 파일이 없으면 그렇다. 반대로 **CI 파일을 changes에 넣으면 CI를 건드릴 때마다 전 컴포넌트가 배포된다**(마이그레이션 포함). 사고를 제도화하는 설정이니 신중히
- **`git push`는 브랜치 전체를 민다** — 병렬 세션의 커밋이 딸려 나가 의도하지 않은 컴포넌트가 배포된다
- **배포 경로가 없는 컴포넌트를 놓친다** — 다른 컴포넌트에는 `deploy:dev`가 있는데 하나만 비대칭으로 없으면, 고친 코드가 서버에 나간 적이 없는 상태로 오래 방치된다(태그 전용 잡만 있고 태그가 0개인 경우 등)
- **러너 태그를 맞춰라** — 배포 잡이 shell 러너를 쓰는데 빌드용 docker 러너 태그를 붙이면 컨테이너 안에서 돌아 `sudo: command not found`로 죽는다

---

## 관련

- [[gitlab-manual-deploy-rules-changes]] — build/deploy의 `changes:` 불일치
- [[deploy-env-optin-flags-and-manual-button-trap]]
- [[gitlab-ci-deploy-runner]] · [[gitlab-ci-monorepo-root-pattern]]
- [[pipefail-grep-q-sigpipe]] — 같은 사건에서 나온 CI 셸 함정
- [[cicd-overview]]

---
title: GitLab CI/CD
tags:
  - tech
  - dx
  - cicd
created: 2026-05-18 (월)
---

# GitLab CI/CD

> **TL;DR**: 코드 커밋 시 Runner가 빌드·테스트·배포를 자동 실행 — `.gitlab-ci.yml`이 파이프라인 설계도

---

## 핵심 구성요소

| 구성 | 역할 |
|------|------|
| `.gitlab-ci.yml` | 파이프라인 정의 파일 (프로젝트 루트에 위치) |
| GitLab Runner | 실제 작업을 실행하는 에이전트 (서버에 설치) |
| Pipeline | 전체 CI/CD 흐름 |
| Stage | 파이프라인의 단계 (build → test → deploy) |
| Job | 각 Stage 안의 개별 작업 |

---

## .gitlab-ci.yml 기본 구조

```yaml
stages:
  - build
  - test
  - deploy

variables:
  APP_NAME: my-app

build-job:
  stage: build
  script:
    - echo "Building..."
    - cargo build --release
  artifacts:
    paths:
      - target/release/$APP_NAME

test-job:
  stage: test
  script:
    - cargo test

deploy-job:
  stage: deploy
  script:
    - rsync -av target/release/$APP_NAME user@server:/opt/app/
  only:
    - main  # main 브랜치 push 시만 실행
```

---

## GitLab Runner 설치 (Ubuntu)

```bash
# 설치
curl -L https://packages.gitlab.com/install/repositories/runner/gitlab-runner/script.deb.sh | sudo bash
sudo apt install gitlab-runner

# GitLab에 등록
sudo gitlab-runner register
# → GitLab URL, 등록 토큰, executor(shell/docker) 입력

# 상태 확인
sudo gitlab-runner status
```

---

## 주요 키워드

```yaml
# 특정 브랜치에서만 실행
only:
  - main
  - /^release-.*/

# 특정 조건 제외
except:
  - tags

# 이전 Job 결과물 전달
artifacts:
  paths:
    - dist/
  expire_in: 1 week

# 캐시로 의존성 재사용
cache:
  key: $CI_COMMIT_REF_SLUG
  paths:
    - node_modules/

# 다른 Job이 끝나야 시작
needs:
  - build-job
```

---

## 실행 흐름

```
git push → GitLab 수신
              │
              ▼
        Pipeline 생성
              │
     ┌────────┴────────┐
     ▼                 ▼
  Stage: build     (병렬 Job 가능)
     │
     ▼
  Stage: test
     │
     ▼
  Stage: deploy  (main 브랜치만)
```

---

## 관련

- [[github-actions]] — GitHub 환경의 CI/CD
- [[dx-overview]]

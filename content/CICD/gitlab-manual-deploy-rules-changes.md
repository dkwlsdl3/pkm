---
title: manual 배포 버튼이 빌드 없는 파이프라인에도 뜨는 함정
tags:
  - cicd
  - gitlab
  - deployment
---

# manual 배포 버튼이 빌드 없는 파이프라인에도 뜨는 함정

> **TL;DR**: build 잡엔 `rules:changes:`가 있는데 manual deploy 잡이 `if: branch == develop`만 있으면, 문서만 바뀐 파이프라인에도 배포 버튼이 생겨 낡은 바이너리가 배포될 수 있다.

---

## 증상

문서만 바뀐(코드 변경 없는) 파이프라인에도 manual deploy 버튼이 뜬다. `needs: [build, optional: true]`라 잡 생성은 되고 산출물만 없는 상태 — 누르면 실패하거나, shell 러너의 잔존 워크스페이스에서 **낡은 바이너리가 배포**된다. (실사고: 안내 혼선으로 사용자가 엉뚱한 파이프라인에서 버튼을 찾음)

## 원인

build 잡의 `rules: changes:`(컴포넌트 경로 조건)와 deploy 잡의 규칙이 불일치. deploy가 브랜치 조건만 보면 경로 변경 여부와 무관하게 잡이 생성된다.

## 해결

deploy 잡에 build와 **동일한 changes 조건**을 준다:

```yaml
deploy:prod:
  rules:
    - if: $CI_COMMIT_BRANCH == "develop"
      changes:
        paths: [service/backend/**/*, .gitlab-ci.yml]
      when: manual
```

트레이드오프: 코드 변경 없는 재배포는 예전 빌드 파이프라인의 버튼을 쓰거나 수동 파이프라인 실행으로 새로 빌드한다.

---

## 관련

- [[deploy-env-optin-flags-and-manual-button-trap]]
- [[gitlab-ci-deploy-runner]]
- [[cicd-overview]]

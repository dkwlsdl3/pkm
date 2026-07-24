---
title: GitLab CI 모노레포 루트 CI 패턴
tags:
  - tech
  - dx
  - cicd
created: 2026-05-18 (월)
---

# GitLab CI 모노레포 루트 CI 패턴

> **TL;DR**: 여러 컴포넌트를 한 레포에서 릴리스할 때는 루트 `.gitlab-ci.yml` 하나가 전체 오케스트레이션을 맡고, job 이름에 컴포넌트 네임스페이스를 붙인다

---

여러 컴포넌트를 한 레포에서 릴리스할 때는 루트 `.gitlab-ci.yml` 하나가 전체 오케스트레이션을 맡고, job 이름에 컴포넌트 네임스페이스를 붙이면 읽기 쉽다.

```yaml
stages:
  - validate
  - build
  - test
  - package
  - deploy
  - collect-packages
  - repository

backend:build:
  stage: build

frontend:build:
  stage: build

ai-engine:package:
  stage: package
```

운영 포인트:

- 컴포넌트별 캐시 키를 나눠 Rust/Cargo, pnpm store, Python/uv 캐시를 독립적으로 재사용한다.
- `collect-packages`와 repository 갱신은 실제 패키지 저장소를 바꿀 수 있으므로, 테스트 태그는 별도 bucket/prefix로 격리한다.
- 외부 레포에서 당분간 소비하는 패키지는 루트 CI 안에서 "빌드 대상"이 아니라 "수집 대상"으로 구분한다.
- 통합 직후에는 deploy gate 변수를 둬서 구 파이프라인과 새 파이프라인이 같은 dev 환경을 동시에 덮지 않게 한다.

---

## 관련

- [[gitlab-cicd]]

---
title: GitLab CI 환경별 시크릿 (environment_scope)
tags:
  - tech
  - cicd
  - gitlab
created: 2026-06-25 (목)
---

# GitLab CI 환경별 시크릿 (environment_scope)

> **TL;DR**: 같은 키(`DB_PASSWORD` 등)를 대상별로 다른 값으로 주려면 변수에 **environment_scope**를 걸고 잡에 `environment: name:`을 선언한다. scope=`*` 변수만 있는 채 다른 대상에 배포하면 그 대상 설정을 덮어쓴다.

---

## 개요

- **무엇**: GitLab CI 변수의 environment_scope 기반 환경별 시크릿 분리
- **왜 / 언제**: dev/prod 등 대상별로 같은 이름의 시크릿을 다른 값으로 주입해야 할 때

## 핵심

```yaml
deploy:prod:
  environment:
    name: prod          # 이 잡은 prod 환경 → scope=prod 변수가 scope=* 보다 우선
```

- 변수는 `(key, environment_scope)` 조합이 유니크 → 같은 이름 + 다른 scope 공존 가능. `*`(공용)와 `prod`(특정)를 같이 두면 잡의 `environment`에 맞는 게 선택됨.
- **함정**: scope=`*` 변수(예: dev용 DB 비번)만 있는 채 다른 대상에 배포하면 그 대상 설정을 dev 값으로 **덮어쓴다**. 안전 가드(`if [ "$DEPLOY_TARGET" != "..." ]; then exit 1`)로 미설정 시 중단시켜 사고 방지.
- ⚠️ scoped 변수는 잡에 `environment: name: <scope>` 선언이 있어야 주입된다 — 빠뜨리면 조용히 빈 값.

## 변수 플래그

- **Masked**: 로그 가림(값이 8자+·charset 조건 충족해야)
- **Protected**: protected 브랜치/태그에서만 노출 — develop이 비보호면 켜면 안 됨
- **Expand variable reference**: 값의 `$`를 다른 변수 참조로 해석 — 시크릿에 `$` 있으면 꺼서 literal 보존

---

## 관련

- [[gitlab-ci-deploy-runner]]
- [[cicd-overview]]

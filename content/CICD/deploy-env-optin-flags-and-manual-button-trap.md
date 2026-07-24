---
title: 공유 배포 env 템플릿의 opt-in 플래그 + manual 버튼 함정
tags:
  - gitlab-ci
  - deployment
  - configuration
---

# 공유 배포 env 템플릿의 opt-in 플래그 + manual 버튼 함정

## 함정 1 — env 템플릿에 기능 플래그 하드코딩

배포 env 파일 템플릿 하나가 여러 경로에서 공유되는 구조가 흔하다:
① 패키지(RPM `%config(noreplace)`) → 모든 고객 설치본 ② dev 서버 CI 배포
③ 특정 고객 CI 배포. 여기에 특정 고객 전용 기능을 `FLAG=true`로 박으면
**전 고객에 기능이 켜진다.**

올바른 패턴 — placeholder + 환경 스코프 변수:

```
# 템플릿
FEATURE_X_ENABLED=${FEATURE_X_ENABLED}
```
```yaml
# CI: envsubst 허용 목록에 변수 추가
- envsubst '... ${FEATURE_X_ENABLED}' < template.env > /etc/app/app.env
```
- GitLab 변수 `FEATURE_X_ENABLED=true`를 **environment_scope**(해당 고객)로만 등록
- 변수 미설정 환경은 빈 값 → 코드 게이트가 빈 값=비활성 처리(**기본 off, fail-safe**)
- ⚠️ scoped 변수는 잡에 `environment: name: <scope>` 선언이 있어야 주입된다 — 빠뜨리면 조용히 빈 값
- ⚠️ CI가 배포마다 env를 템플릿에서 재생성하면 **서버에서의 수동 env 수정은 다음 배포에 소실** — 반드시 변수/템플릿 경유. 반면 RPM `%config(noreplace)` 경로는 수동 수정이 보존됨(고객 서버는 이 방식이 정석)

## 함정 2 — manual 배포 버튼이 빌드 없는 파이프라인에도 뜸

build 잡에는 `rules: changes:`(컴포넌트 경로 조건)가 있는데 manual deploy 잡이
`if: branch == develop` 뿐이면, **문서만 바뀐 파이프라인에도 배포 버튼이 생긴다.**
`needs: [build, optional: true]`라 잡 생성은 되고 산출물만 없는 상태 — 누르면
실패하거나, shell 러너의 잔존 워크스페이스에서 **낡은 바이너리가 배포**될 수 있다.
(실사고: 안내 혼선으로 사용자가 엉뚱한 파이프라인에서 버튼을 찾음)

수정 — deploy 잡에 build와 **동일한 changes 조건**:

```yaml
deploy:prod:
  rules:
    - if: $CI_COMMIT_BRANCH == "develop"
      changes:
        paths: [service/backend/**/*, .gitlab-ci.yml]
      when: manual
```

트레이드오프: 코드 변경 없는 재배포는 예전 빌드 파이프라인의 버튼을 쓰거나
수동 파이프라인 실행으로 새로 빌드.

관련: [[cicd-overview]], [[gitlab-ci-deploy-runner]]

---

## 관련

- [[cicd-overview]]
- [[gitlab-ci-deploy-runner]]
- [[provisioning-tool-antipatterns]]

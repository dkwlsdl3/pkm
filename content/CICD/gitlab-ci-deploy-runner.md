---
tags:
  - tech
created: 2026-06-25 (목)
---

# GitLab CI deploy 러너 & tag 매칭

> **TL;DR**: deploy job의 tag와 매칭되는 러너가 대상 서버에 등록·실행 중이어야 자동배포가 돈다. 러너가 없으면 job이 pending으로 멈춰 "파이프라인은 있는데 배포가 안 되는" 상태가 된다.

---

## 개요

- **무엇인가**: GitLab CI에서 특정 서버에 배포하는 job의 러너 요구사항
- **왜 쓰는가**: "push했는데 배포가 안 됨" 원인 파악
- **언제 쓰는가**: shell executor로 서버에 직접 배포(deploy:dev 등)하는 파이프라인 설계

---

## 핵심 개념

### tag 기반 러너 매칭
```yaml
deploy:dev:
  tags:
    - dev-server      # 이 태그를 가진 러너에서만 실행
  script:
    - systemctl stop app && cp ... && systemctl start app
```
→ `dev-server` 태그 러너가 **대상 서버에 shell executor로** 등록돼 있어야 그 서버에서 배포 명령이 실행된다.

### 러너가 없으면
- job이 "stuck — no runners match" / pending 상태로 멈춤.
- build(다른 태그·다른 러너)는 돌아도 deploy만 안 됨 → 배포 미수행.
- **"파이프라인 설계 ≠ 자동배포 동작"** — 설계만으론 안 되고 러너 등록이 전제.

### 러너는 "프로젝트 스코프" — 서브모듈은 각각 별개
프로젝트 러너는 **등록된 프로젝트에서만** 동작한다. 모노레포가 git submodule로 여러 GitLab 프로젝트(루트 + 서브모듈들)로 쪼개져 있으면, **deploy 잡이 있는 서브모듈 프로젝트에 러너가 enable돼 있어야** 한다. 루트 프로젝트에만 등록된 러너는 서브모듈 잡을 못 잡아 pending.
- 해결: 러너를 대상 프로젝트들에 enable(`POST /projects/:id/runners {runner_id}`) — 대상 프로젝트 **Maintainer** 권한 필요. 또는 **그룹 레벨**에 러너/멤버십을 두면 그룹 내 모든 프로젝트로 상속(그룹 변수·러너 관리엔 Owner 필요할 수 있음).
- 권한 함정: 루트 프로젝트 Maintainer ≠ 서브모듈 프로젝트 Maintainer. "권한 줬는데 안 됨"은 잘못된 스코프에 준 것일 때가 많다.

### 환경별 시크릿 — environment_scope + `environment:`
같은 키(`DB_PASSWORD` 등)를 대상별로 다른 값으로 주려면 **environment_scope**를 쓴다.
```yaml
deploy:prod:
  environment:
    name: prod          # 이 잡은 prod 환경
  # → scope=prod 변수가 scope=* 보다 우선 적용
```
- 변수는 `(key, environment_scope)` 조합이 유니크 → 같은 이름 + 다른 scope 공존 가능. `*`(공용)와 `prod`(특정)를 같이 두면 잡의 `environment`에 맞는 게 선택됨.
- **함정**: scope=`*` 변수(예: dev용 DB 비번)만 있는 채로 다른 대상에 그대로 배포하면 그 대상 설정을 dev 값으로 **덮어쓴다**. 안전 가드(`if [ "$DEPLOY_TARGET" != "..." ]; then exit 1`)로 미설정 시 중단시키면 사고 방지.
- 변수 플래그: **Masked**(로그 가림, 값이 8자+·charset 조건 충족해야), **Protected**(protected 브랜치/태그에서만 노출 — develop이 비보호면 켜면 안 됨), **Expand variable reference**(값의 `$`를 다른 변수 참조로 해석 — 시크릿에 `$` 있으면 꺼서 literal 보존).

### 확인
```bash
# 대상 서버에 러너가 있나
systemctl is-active gitlab-runner; gitlab-runner list
# 프로젝트에 어떤 러너가 붙어있나 (API)
curl -s --header "PRIVATE-TOKEN: $TOKEN" "$API/projects/<id>/runners"
```

---

## 코드 / 사용 예시

```bash
# 러너 설치 (원격 스크립트 curl|bash 대신 repo 파일 + 패키지 매니저 권장) 후 등록
gitlab-runner register --url <gitlab-url> --token <runner-token> \
  --executor shell --tag-list dev-server
```

---

## 주의사항

> [!WARNING]
> shell executor 러너는 러너 유저(gitlab-runner) 권한으로 명령을 실행한다. deploy 스크립트가 `sudo systemctl/cp` 등을 쓰면 러너 유저에 (제한적) sudo NOPASSWD가 필요하며, 외부 공개 서버라면 sudo 범위를 최소화해야 한다.

---

## 관련

- [[cicd-overview]]

---
title: CI/CD 개요 (MOC)
tags:
  - tech
  - moc
created: 2026-06-25 (목)
---

# CI/CD 개요 (MOC)

> 파이프라인 빌드·테스트·배포 자동화

---

## 용어

| 표기 | 원어 | 뜻 |
|---|---|---|
| CI / CD | Continuous Integration / Continuous Delivery·Deployment | 변경을 자주 합쳐 자동 검증하는 것 / 그 결과를 자동으로 배포 가능 상태까지 또는 실제 배포까지 가져가는 것 |
| RPM | RPM Package Manager | RHEL 계열 패키지 형식. 빌드 산출물을 이 형식으로 배포한다 |
| runner | — | GitLab CI에서 job을 실제로 실행하는 에이전트. tag가 맞는 runner가 없으면 job은 pending에 머문다 |
| artifact | — | job이 남기는 산출물(빌드 결과·리포트). 다음 job이 내려받아 쓴다 |

---

## 핵심 개념

- [[gitlab-ci-deploy-runner]] — deploy job tag·러너 매칭, 러너 없으면 배포 안 됨(pending)
- [[gitlab-ci-environment-scoped-secrets]] — 대상별 시크릿 분리(environment_scope), scope=* 덮어쓰기 함정
- [[gitlab-submodule-to-monorepo]] — 서브모듈→모노레포 전환 함정 모음(마이그레이션 플레이북)
- [[deploy-env-optin-flags-and-manual-button-trap]] — 공유 env 템플릿 opt-in 플래그(environment_scope 변수, fail-safe 기본값)
- [[gitlab-manual-deploy-rules-changes]] — manual 배포 버튼이 빌드 없는 파이프라인에도 뜨는 rules:changes 함정
- [[gitlab-rules-first-match-wins]] — `rules:`는 먼저 맞는 하나만 적용, 뒤의 `when: manual`은 죽은 규칙(승인 없이 자동 배포)
- [[provisioning-tool-antipatterns]] — 설치/프로비저닝 자동화 CLI 안티패턴 4종(--help 오실행·대상 하드코딩·BatchMode 누락 hang·태그부재 stale)
- [[deploy-job-ordering-uncoordinated]] — 배포 잡이 서로를 `needs`로 모르면 순서가 빌드 시간에 좌우("구 백엔드 + 신 프론트" 창)

---

## 관련

- [[monitoring-overview]]

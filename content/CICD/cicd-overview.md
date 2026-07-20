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

## 핵심 개념

- [[gitlab-ci-deploy-runner]] — deploy job tag·러너 매칭, 러너 없으면 배포 안 됨(pending)
- [[gitlab-submodule-to-monorepo]] — 서브모듈→모노레포 전환 함정(rules:changes 태그·잡명 충돌·병행 구축 체크리스트)
- [[deploy-env-optin-flags-and-manual-button-trap]] — 공유 env 템플릿의 opt-in 플래그(scope 변수)와 manual 배포 버튼 rules:changes 함정
- [[provisioning-tool-antipatterns]] — 설치/프로비저닝 자동화 CLI 안티패턴 4종(--help 오실행·대상 하드코딩·BatchMode 누락 hang·태그부재 stale)

---

## 관련

- [[monitoring-overview]]

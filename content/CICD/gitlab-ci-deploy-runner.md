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

### 확인
```bash
# 대상 서버에 러너가 있나
systemctl is-active gitlab-runner; gitlab-runner list
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

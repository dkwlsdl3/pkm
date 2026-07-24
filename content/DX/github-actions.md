---
title: GitHub Actions
tags:
  - tech
created: 2026-05-14 (목)
---

# GitHub Actions

> **TL;DR**: GitHub Actions 핵심 패턴 — 크로스 레포 동기화, GitHub Pages 배포, cron 자동화

---

## GitHub Pages 배포

`upload-pages-artifact` + `deploy-pages` 조합으로 배포하는 표준 워크플로우는 [[github-actions-pages-deploy]] 참고.

---

## 크로스 레포 동기화

PAT로 타 레포를 checkout해 동기화·커밋·푸시하는 패턴은 [[github-actions-cross-repo-sync]] 참고.

---

## 특정 경로 변경 시에만 트리거

```yaml
on:
  push:
    branches: [main]
    paths:
      - "src/**"
      - "!src/**/*.test.ts"   # 테스트 파일 제외
```

변경 없으면 워크플로우 자체가 스킵 → 불필요한 빌드 방지.

---

## cron 스케줄

```yaml
on:
  schedule:
    - cron: "0 9 * * *"   # 매일 오전 9시 UTC (한국 오후 6시)
  workflow_dispatch:        # 수동 실행 버튼
```

> Public repo는 GitHub Actions 무제한 무료. Private repo는 월 2,000분 무료.

---

## gh CLI — 워크플로우 상태 확인

```bash
# Ubuntu에 설치
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update && sudo apt install gh -y
gh auth login

# 워크플로우 조회
gh run list --repo owner/repo --workflow deploy.yml --limit 5

# 실시간 모니터링
gh run watch <run-id> --repo owner/repo

# 실패한 run 재실행
gh run rerun <run-id> --repo owner/repo
```

---

## 관련

- [[dx-overview]]
- [[github-actions-pages-deploy]]
- [[github-actions-cross-repo-sync]]

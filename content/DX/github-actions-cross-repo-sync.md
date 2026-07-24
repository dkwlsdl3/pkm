---
title: GitHub Actions 크로스 레포 동기화
tags:
  - tech
created: 2026-05-14 (목)
---

# GitHub Actions 크로스 레포 동기화

> **TL;DR**: PAT(Personal Access Token)로 타 레포를 checkout해 파일을 동기화하고 커밋·푸시하는 패턴

---

PAT(Personal Access Token)을 secret으로 등록 후 타 레포 checkout.

```yaml
- uses: actions/checkout@v4
  with:
    repository: username/target-repo
    ref: main
    token: ${{ secrets.PAT_TOKEN }}
    path: target

- name: Sync files
  run: rsync -av --delete source/ target/content/

- name: Commit and push
  working-directory: target
  run: |
    git config user.name "github-actions[bot]"
    git config user.email "github-actions[bot]@users.noreply.github.com"
    git add -A
    if git diff --cached --quiet; then
      echo "No changes."
    else
      git commit -m "sync: $(date +'%Y-%m-%d %H:%M')"
      git push
    fi
```

**PAT 최소 권한**: `repo` (private repo 접근 시), `public_repo` (public repo만)

---

## 관련

- [[github-actions]]

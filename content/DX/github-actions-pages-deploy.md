---
title: GitHub Actions Pages 배포
tags:
  - tech
created: 2026-05-14 (목)
---

# GitHub Actions Pages 배포

> **TL;DR**: `actions/upload-pages-artifact` + `actions/deploy-pages` 조합으로 GitHub Pages에 배포하는 표준 워크플로우

---

`actions/upload-pages-artifact` + `actions/deploy-pages` 조합. 레포 Settings → Pages → Source를 **GitHub Actions**로 설정해야 동작.

```yaml
permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build
        run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: public   # 빌드 결과물 디렉토리

  deploy:
    needs: build
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/deploy-pages@v4
```

---

## 관련

- [[github-actions]]

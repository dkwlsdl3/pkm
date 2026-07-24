---
title: nvim-treesitter GLIBC 버전 불일치 해결
tags:
  - tech
created: 2026-05-13 (수)
---

# nvim-treesitter GLIBC 버전 불일치 해결

> **TL;DR**: Ubuntu 22.04(GLIBC 2.35)에서 최신 tree-sitter 바이너리(v0.26+, GLIBC 2.39 요구)가 실행되지 않는 문제 — GLIBC 2.35 호환 버전(v0.25.6)을 수동 설치해 해결.

> [!WARNING]
> 최신 tree-sitter 바이너리(v0.26+)는 GLIBC 2.39 필요 → Ubuntu 22.04(GLIBC 2.35)에서 실행 불가.
> GLIBC 2.35 호환 버전(v0.25.6)을 `~/bin`에 직접 설치해야 함.

```bash
curl -L "https://github.com/tree-sitter/tree-sitter/releases/download/v0.25.6/tree-sitter-linux-x64.gz" \
  -o /tmp/tree-sitter.gz
gunzip /tmp/tree-sitter.gz
chmod +x /tmp/tree-sitter
cp /tmp/tree-sitter ~/bin/tree-sitter
```

`~/bin`이 PATH에 포함되어 있으면 nvim이 자동으로 이 바이너리를 사용.
이후 nvim 열고 `:Lazy sync` 실행.

## 관련

- [[terminal-setup]]
- [[nvim-lazyvim-setup]]

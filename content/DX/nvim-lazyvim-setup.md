---
title: Neovim LazyVim 설치
tags:
  - tech
created: 2026-05-13 (수)
---

# Neovim LazyVim 설치

> **TL;DR**: neovim 최신 바이너리를 설치하고 LazyVim starter를 `~/.config/nvim`에 clone한 뒤 기본 옵션과 tokyonight 테마를 설정한다.

```bash
# neovim 최신 버전
curl -L "https://github.com/neovim/neovim/releases/latest/download/nvim-linux-x86_64.tar.gz" \
  | tar -xz -C /tmp/
cp /tmp/nvim-linux-x86_64/bin/nvim ~/.local/bin/nvim

# LazyVim starter
git clone https://github.com/LazyVim/starter ~/.config/nvim
rm -rf ~/.config/nvim/.git
rm -f ~/.config/nvim/lua/plugins/example.lua
```

**`~/.config/nvim/lua/config/options.lua`**
```lua
vim.opt.relativenumber = true
vim.opt.tabstop = 2
vim.opt.shiftwidth = 2
vim.opt.expandtab = true
```

**`~/.config/nvim/lua/plugins/tokyonight.lua`**
```lua
return {
  { "folke/tokyonight.nvim", opts = { style = "storm" } },
}
```

첫 실행 시 플러그인 자동 설치. 완료 후 `:Lazy sync` 실행.

> Ubuntu 22.04에서는 tree-sitter 파서 실행 오류가 발생할 수 있다 → [[nvim-treesitter-glibc-mismatch]] 참고.

## 관련

- [[terminal-setup]]
- [[nvim-treesitter-glibc-mismatch]]

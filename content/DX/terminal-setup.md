---
title: 터미널 환경 세팅
tags:
  - tech
created: 2026-05-13 (수)
---

# 터미널 환경 세팅

> **TL;DR**: WezTerm → zsh + oh-my-zsh → starship → nvim(LazyVim) 전체 스택 설치 가이드

> 대상 OS: Ubuntu 22.04 / 24.04, macOS, WSL2  
> 스택: WezTerm → zsh → oh-my-zsh → starship → nvim (LazyVim)

---

## 전체 흐름

```
WezTerm (터미널 에뮬레이터)
  └─ zsh + oh-my-zsh (셸 + 플러그인)
       ├─ starship (프롬프트)
       ├─ fzf / fzf-tab (퍼지 검색)
       ├─ zoxide (스마트 cd)
       ├─ eza / bat / ripgrep / fd (CLI 도구)
       └─ nvim + LazyVim (에디터)
```

---

## 1. 기본 패키지 설치

```bash
sudo apt update && sudo apt install -y \
  git curl wget unzip gcc build-essential \
  ripgrep fd-find fzf zoxide

# Ubuntu에서 fd는 fdfind로 설치됨 → fd로 심볼릭 링크
mkdir -p ~/.local/bin
ln -sf $(which fdfind) ~/.local/bin/fd
```

---

## 2. Rust / cargo

git-delta 빌드에 필요. 이미 설치되어 있으면 생략.

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env
```

---

## 3. CLI 도구

```bash
# eza (ls 대체)
curl -L "https://github.com/eza-community/eza/releases/latest/download/eza_x86_64-unknown-linux-musl.tar.gz" \
  | tar -xz -C ~/.local/bin/

# bat (cat 대체, Ubuntu에서 batcat으로 설치됨)
sudo apt install -y bat

# git-delta (diff 뷰어)
cargo install git-delta

# starship (프롬프트)
curl -sS https://starship.rs/install.sh | sh -s -- --bin-dir ~/.local/bin

# fastfetch (시스템 정보)
curl -L "https://github.com/fastfetch-cli/fastfetch/releases/latest/download/fastfetch-linux-amd64.tar.gz" \
  | tar -xz -C /tmp/
cp /tmp/fastfetch-linux-amd64/usr/bin/fastfetch ~/.local/bin/
```

---

## 4. oh-my-zsh + 플러그인

zsh 설치, oh-my-zsh, 핵심 플러그인 4종 설치 절차는 → [[zsh-oh-my-zsh-plugins]]

---

## 5. zsh 설정 파일

### `~/.zshenv`
```zsh
# .zshenv은 모든 zsh 세션에서 로드됨 (스크립트 포함)
# 최소한으로 유지 — PATH와 로그인 설정은 .zprofile에
```

### `~/.zprofile`
```zsh
# 로그인 셸 PATH (SSH + 데스크탑 로그인 시)
export PATH="$HOME/.local/bin:$HOME/bin:/usr/local/bin:$PATH"

# cargo
[[ -f "$HOME/.cargo/env" ]] && source "$HOME/.cargo/env"

# pyenv PATH
export PYENV_ROOT="$HOME/.pyenv"
[[ -d "$PYENV_ROOT/bin" ]] && export PATH="$PYENV_ROOT/bin:$PATH"

# nvm dir
export NVM_DIR="$HOME/.nvm"
```

### `~/.zshrc`
```zsh
export ZSH="$HOME/.oh-my-zsh"
ZSH_THEME=""

plugins=(
  git
  fzf-tab
  zsh-syntax-highlighting
  zsh-autosuggestions
  you-should-use
  sudo
  history-substring-search
  colored-man-pages
  extract
)

source $ZSH/oh-my-zsh.sh

# History
HISTSIZE=50000
SAVEHIST=50000
setopt HIST_IGNORE_ALL_DUPS HIST_IGNORE_SPACE SHARE_HISTORY HIST_REDUCE_BLANKS NO_BEEP

bindkey '^[[A' history-substring-search-up
bindkey '^[[B' history-substring-search-down

# Editor
alias vim="nvim"
alias vi="nvim"
alias vimdiff="nvim -d"
export EDITOR=nvim

# eza
alias ls="eza --icons --group-directories-first"
alias ll="eza -lh --icons --git --group-directories-first"
alias la="eza -lah --icons --git --group-directories-first"
alias lt="eza --tree --icons --level=2"
alias tree="eza --tree --icons"

# bat
if command -v batcat &>/dev/null && ! command -v bat &>/dev/null; then
  alias bat="batcat"
fi
alias cat="bat --paging=never"
export BAT_THEME="TwoDark"
export MANPAGER="sh -c 'col -bx | bat -l man -p'"

# 기타
alias grep="rg"
alias find="fd"
export GIT_PAGER="delta"

# fzf
export FZF_DEFAULT_COMMAND="fd --type f --hidden --follow --exclude .git"
export FZF_DEFAULT_OPTS="--height=40% --layout=reverse --border=rounded"
export FZF_CTRL_T_OPTS="--preview='bat --color=always --style=numbers --line-range=:100 {}' --preview-window=right:50%:wrap"

zstyle ':fzf-tab:complete:cd:*' fzf-preview 'eza --tree --icons --level=2 --color=always $realpath'

[ -f ~/.fzf.zsh ] && source ~/.fzf.zsh
eval "$(zoxide init zsh)"
eval "$(starship init zsh)"

fastfetch
```

---

## 6. starship 설정

tokyonight 팔레트 기반 `starship.toml` 전체 설정은 → [[starship-prompt-config]]

---

## 7. Neovim + LazyVim

neovim 바이너리 설치, LazyVim starter clone, 기본 옵션/테마 설정은 → [[nvim-lazyvim-setup]]

---

## 8. fastfetch 설정

**`~/.config/fastfetch/config.jsonc`**
```jsonc
{
  "$schema": "https://github.com/fastfetch-cli/fastfetch/raw/dev/doc/json_schema.json",
  "logo": { "source": "ubuntu", "padding": { "right": 2 } },
  "display": {
    "separator": "  ",
    "color": { "keys": "33", "title": "33" }
  },
  "modules": [
    { "type": "title", "format": "{user-name}@{host-name}" },
    "separator",
    { "type": "os",       "key": "OS"       },
    { "type": "kernel",   "key": "Kernel"   },
    { "type": "shell",    "key": "Shell"    },
    { "type": "terminal", "key": "Terminal" },
    { "type": "wm",       "key": "WM"       },
    "separator",
    { "type": "cpu",    "key": "CPU"    },
    { "type": "gpu",    "key": "GPU"    },
    { "type": "memory", "key": "Memory" },
    { "type": "disk",   "key": "Disk", "folders": "/" },
    { "type": "uptime", "key": "Uptime" },
    "separator",
    { "type": "colors", "symbol": "circle" }
  ]
}
```

---

## ⚠️ Ubuntu 22.04 전용 — nvim-treesitter 파서 오류 수정

GLIBC 버전 불일치로 tree-sitter 바이너리가 실행되지 않는 문제와 해결법은 → [[nvim-treesitter-glibc-mismatch]]

---

## 설치 체크리스트

- [ ] 기본 패키지 + fd 심볼릭 링크
- [ ] Rust/cargo
- [ ] eza / bat / git-delta / starship / fastfetch
- [ ] oh-my-zsh + 플러그인 4개
- [ ] `.zshenv` / `.zprofile` / `.zshrc` 작성
- [ ] `starship.toml` 작성
- [ ] neovim + LazyVim 설치
- [ ] `options.lua` / `tokyonight.lua` 작성 → `:Lazy sync`
- [ ] (22.04만) tree-sitter v0.25.6 설치
- [ ] fastfetch `config.jsonc` 작성

---

## 관련

- [[dotfiles]]
- [[dx-overview]]
- [[zsh-oh-my-zsh-plugins]]
- [[starship-prompt-config]]
- [[nvim-lazyvim-setup]]
- [[nvim-treesitter-glibc-mismatch]]

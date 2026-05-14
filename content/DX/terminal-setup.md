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

```bash
sudo apt install -y zsh
chsh -s $(which zsh)

# oh-my-zsh
sh -c "$(curl -fsSL https://raw.github.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"

# 플러그인
git clone https://github.com/zsh-users/zsh-syntax-highlighting \
  ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting
git clone https://github.com/zsh-users/zsh-autosuggestions \
  ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-autosuggestions
git clone https://github.com/Aloxaf/fzf-tab \
  ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/fzf-tab
git clone https://github.com/MichaelAquilina/zsh-you-should-use \
  ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/you-should-use
```

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

**`~/.config/starship.toml`**
```toml
palette = "tokyonight_storm"
command_timeout = 2000

format = """
$os\
$directory\
$git_branch\
$git_status\
$nodejs$bun$python$rust$golang$java\
$cmd_duration
$character"""

[palettes.tokyonight_storm]
blue    = "#7aa2f7"
purple  = "#bb9af7"
red     = "#f7768e"
orange  = "#ff9e64"
yellow  = "#e0af68"
green   = "#9ece6a"
teal    = "#73daca"
cyan    = "#7dcfff"
fg      = "#c0caf5"
dark    = "#1a1b26"

[os]
disabled = false
format = "[](fg:purple)[$symbol ](bg:purple fg:dark)"

[os.symbols]
Macos   = " "
Linux   = " "
Windows = " "

[directory]
truncation_length = 3
truncate_to_repo  = true
format = "[](fg:purple bg:blue)[ $path$read_only ](bg:blue fg:dark)"

[git_branch]
symbol = " "
format = "[](fg:blue bg:teal)[ $symbol$branch ](bg:teal fg:dark)"

[git_status]
format    = "[$all_status$ahead_behind](bg:teal fg:dark)[](fg:teal) "

[character]
success_symbol = "[❯](bold green)"
error_symbol   = "[❯](bold red)"

[cmd_duration]
min_time = 2000
format   = "[ ⏱ $duration ](fg:yellow)"
```

---

## 7. Neovim + LazyVim

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

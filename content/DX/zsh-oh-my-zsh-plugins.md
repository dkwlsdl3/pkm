---
title: oh-my-zsh 설치 및 플러그인
tags:
  - tech
created: 2026-05-13 (수)
---

# oh-my-zsh 설치 및 플러그인

> **TL;DR**: zsh를 로그인 셸로 지정하고 oh-my-zsh와 핵심 플러그인 4종(zsh-syntax-highlighting, zsh-autosuggestions, fzf-tab, you-should-use)을 설치한다.

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

설치한 플러그인은 `.zshrc`의 `plugins=(...)` 배열에 등록해야 활성화된다.

## 관련

- [[terminal-setup]]

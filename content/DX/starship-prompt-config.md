---
title: starship 프롬프트 설정
tags:
  - tech
created: 2026-05-13 (수)
---

# starship 프롬프트 설정

> **TL;DR**: tokyonight 팔레트 기반 starship.toml — OS 아이콘, 디렉토리, git 브랜치/상태, 명령 실행시간을 세그먼트 프롬프트로 구성.

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

## 관련

- [[terminal-setup]]

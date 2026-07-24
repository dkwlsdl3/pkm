---
title: Dotfiles 관리
tags:
  - tech
created: 2026-05-13 (수)
---

# Dotfiles 관리

> **TL;DR**: dotfiles를 Git으로 관리해 여러 기기에서 동일한 개발 환경 유지

> GitHub: `git@github.com:<YOUR_GITHUB_USER>/dotfiles.git`  
> 로컬 위치: `~/dotfiles/`

---

## 개념

설정 파일(dotfiles)을 Git으로 관리해 여러 기기에서 동일한 환경 유지.  
진짜 파일은 `~/dotfiles/`에 두고, 원래 위치엔 **심볼릭 링크**를 만들어 연결.

```
~/.claude/CLAUDE.md  →  ~/dotfiles/claude/CLAUDE.md  (진짜 파일)
```

프로그램은 `~/.claude/CLAUDE.md`를 읽지만 실제로는 `~/dotfiles/`의 파일을 읽음.  
`~/dotfiles/`가 Git 레포이므로 변경사항이 자동으로 추적됨.

---

## 레포 구조

```
~/dotfiles/
  install.sh              ← 새 기기 세팅 스크립트
  .gitignore
  claude/
    CLAUDE.md             ← 전역 AI 지침 (OMC + Karpathy 원칙)
    settings.json         ← Claude Code 설정
    commands/
      savelog.md          ← /savelog 커맨드
  agents/
    skills/               ← Matt Pocock 기반 10개 스킬
      caveman/
      diagnose/
      grill-me/
      ...
```

---

## 새 기기 세팅

```bash
# 1. 레포 클론
git clone git@github.com:<YOUR_GITHUB_USER>/dotfiles.git ~/dotfiles

# 2. 심볼릭 링크 자동 연결
bash ~/dotfiles/install.sh

# 3. Claude 열고 OMC 플러그인 설치
/plugin install oh-my-claudecode
```

`install.sh`가 하는 일:
- `~/.claude/`, `~/.agents/skills/` 디렉토리 생성
- 기존 파일이 있으면 `.backup`으로 이름 바꿔 보존
- 모든 항목을 `~/dotfiles/`로 심볼릭 링크 연결

---

## 동기화

```bash
# 설정 변경 후 푸시
cd ~/dotfiles
git add .
git commit -m "update: 변경 내용"
git push

# 다른 기기에서 최신 반영
cd ~/dotfiles
git pull
```

---

## 관리 대상 파일

| 파일 | 설명 |
|------|------|
| `claude/CLAUDE.md` | 전역 AI 지침 (OMC + Karpathy 4원칙) |
| `claude/settings.json` | Claude Code 테마, HUD, 플러그인 설정 |
| `claude/commands/savelog.md` | `/savelog` 커스텀 커맨드 |
| `agents/skills/*/` | Matt Pocock 기반 스킬 10개 (한국어 트리거 포함) |

---

## 관련

- [[terminal-setup]] — zsh, starship, nvim 세팅
- [[claude-code-setup]] — OMC, 스킬, Karpathy 원칙 상세

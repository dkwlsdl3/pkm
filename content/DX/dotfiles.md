---
title: Dotfiles 관리 (chezmoi)
tags:
  - tech
created: 2026-05-13 (수)
updated: 2026-08-07 (금)
---

# Dotfiles 관리 (chezmoi)

> **TL;DR**: dotfiles를 chezmoi로 관리한다. 소스 레포의 파일이 진짜이고 홈 디렉토리의 파일은 `chezmoi apply`가 매번 다시 써 내는 생성물이다 — 라이브 파일을 직접 고치면 사라진다.

---

## 심볼릭 링크 방식과의 차이

| | 심볼릭 링크 (이전) | chezmoi (현재) |
|---|---|---|
| 홈의 파일 | 레포를 가리키는 링크 | 레포에서 생성된 실제 파일 |
| 라이브 편집 | 곧 레포 편집 (그대로 추적됨) | 다음 apply에 덮어써짐 |
| 기기별 차이 | 분기 처리 어려움 | 템플릿·변수로 처리 |
| 부분 공유 | 파일 단위 복사 | `includeTemplate`으로 조각 공유 |

링크 방식은 편집이 곧 추적이라 편했지만, 기기마다 다른 값(경로·토큰 유무·OS)을 넣을 자리가 없었다. chezmoi는 템플릿을 거치는 대신 "라이브 파일은 생성물"이라는 제약이 붙는다.

## 소스 위치

```bash
chezmoi source-path   # 현재: ~/Projects/dotfiles-chezmoi
```

소스 파일명이 타깃 경로를 결정한다.

| 소스 접두어 | 의미 |
|---|---|
| `dot_claude/` | `~/.claude/` |
| `private_dot_config/` | `~/.config/` (권한 600) |
| `executable_*` | 실행 권한 부여 |
| `*.tmpl` | 템플릿으로 렌더링 |
| `run_once_*`, `run_onchange_*`, `run_after_*` | 스크립트 훅 |

## 관리 대상

```text
.chezmoitemplates/    ← 공유 조각 (에이전트 공통 규칙, 스킬 본문)
dot_claude/           ← Claude Code 지침·설정·스킬·훅
dot_codex/            ← Codex 지침·설정·스킬·훅
private_dot_config/   ← nvim, wezterm, starship, VSCode
private_dot_local/    ← bin(copen 등), libexec(훅 스크립트)
dot_zshrc, dot_zprofile, dot_tmux.conf
tests/                ← 훅 스크립트 테스트
docs/adr/             ← 세팅 결정 기록
```

에이전트 세팅의 구조는 [[claude-code-setup]] 참고.

## 일상 작업

```bash
chezmoi edit ~/.zshrc      # 소스를 열어 편집
chezmoi diff               # 적용 전 차이 확인
chezmoi apply              # 홈에 반영
chezmoi cd && git push     # 소스 레포 푸시

# 다른 기기에서
chezmoi update             # git pull + apply
```

## 새 기기 세팅

```bash
sh -c "$(curl -fsLS get.chezmoi.io)" -- init --apply \
  git@github.com:<YOUR_GITHUB_USER>/dotfiles-chezmoi.git
```

`run_once_*` 스크립트가 도구 설치까지 처리한다.

> 사용자명만 넘기는 `chezmoi init <user>` 축약형은 `<user>/dotfiles` 레포를 찾는다. 레포명이 `dotfiles`가 아니면 위처럼 URL을 전부 적어야 한다.

## 주의

> [!WARNING]
> `~/.claude/CLAUDE.md`처럼 chezmoi가 관리하는 파일을 직접 편집하면 다음 `chezmoi apply`에 날아간다. `chezmoi edit`을 쓰거나 소스를 고친 뒤 apply 한다. 관리 대상인지 확인은 `chezmoi managed | rg <경로>`.

> [!WARNING]
> `~/.zshrc`에 토큰 같은 비밀값을 하드코딩한 채 소스에 넣으면 레포에 그대로 커밋된다. 비밀값은 별도 파일로 분리해 chezmoi 관리에서 제외한다.

## 폐기된 방식

`~/dotfiles` 레포 + `install.sh`로 심볼릭 링크를 걸던 구조는 chezmoi로 이전했다. `~/dotfiles` 디렉토리는 지금 존재하지 않으며, 그 시절 링크(`~/.agents/skills/*`)는 끊어진 채 남아 있다.

---

## 관련

- [[claude-code-setup]] — 에이전트 지침·스킬·훅 구조
- [[terminal-setup]] — zsh, starship, nvim 세팅

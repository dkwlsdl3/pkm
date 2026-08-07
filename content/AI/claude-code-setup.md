---
title: Claude Code 전역 세팅
tags:
  - tech
  - ai
created: 2026-05-13 (수)
updated: 2026-08-07 (금)
---

# Claude Code 전역 세팅

> **TL;DR**: 전역 지침·스킬·훅을 chezmoi 단일 소스로 관리하고, 공통 규칙을 Claude/Codex 양쪽에 같은 템플릿으로 주입한다. 라이브 파일(`~/.claude/*`)을 직접 고치면 다음 `chezmoi apply`에 덮어써진다.

---

## 개요

- **무엇**: `~/.claude/` 전역 세팅의 구성 요소와 관리 소스
- **왜 / 언제**: 기기를 옮기거나 세팅이 깨졌을 때, 어떤 파일이 진짜 소스인지 판단해야 할 때

## 구성

```text
~/.claude/
  CLAUDE.md          ← 전역 지침 (공통 규칙 + Claude 전용 튜닝, 템플릿 생성물)
  settings.json      ← 모델·훅·statusline·권한
  statusline-command.sh
  skills/            ← 스킬 20개
  commands/savelog.md
  hooks/             ← docs-commit-gate, stop-gate, sudo-gate
  plugins/           ← 공식 마켓플레이스 플러그인 캐시
```

Codex도 같은 방식으로 `~/.codex/`(AGENTS.md, skills, hooks)를 관리한다.

## chezmoi 소스 매핑

소스: `~/Projects/dotfiles-chezmoi` (`chezmoi source-path`)

| 소스 | 타깃 |
|---|---|
| `dot_claude/CLAUDE.md.tmpl` | `~/.claude/CLAUDE.md` |
| `dot_claude/modify_settings.json.tmpl` | `~/.claude/settings.json` |
| `dot_claude/skills/<name>/SKILL.md.tmpl` | `~/.claude/skills/<name>/SKILL.md` |
| `dot_claude/hooks/*` | `~/.claude/hooks/*` |
| `dot_codex/AGENTS.md.tmpl` | `~/.codex/AGENTS.md` |
| `private_dot_local/libexec/agent-hooks/*` | `~/.local/libexec/agent-hooks/*` |

## 지침은 공통 + 도구별로 분리

`~/.claude/CLAUDE.md`와 `~/.codex/AGENTS.md`는 각각 두 조각을 이어 붙인 생성물이다.

- `.chezmoitemplates/agent-common.md` — 두 도구 공통 규칙 (응답 언어, 실행 기준, 비협상 규칙, 코딩 원칙). 이 안의 `Coding Principles` 4개가 [[karpathy-coding-principles]]에 해당한다.
- `.chezmoitemplates/agent-tuning-claude.md` / `agent-tuning-codex.md` — 도구별 보정

같은 규칙을 두 파일에 복사해 두면 한쪽만 갱신되어 갈라진다. 공통 부분을 한 곳에 두고 주입하는 구조가 그 드리프트를 막는다.

## 스킬도 단일 소스

`.chezmoitemplates/skills/<name>/SKILL.md`가 실제 본문이고, `dot_claude/skills`·`dot_codex/skills`는 `includeTemplate`으로 그것을 참조만 한다. 스킬 하나를 고치면 두 도구에 동시에 반영된다.

외부 스킬셋(Matt Pocock 기반) 위에 직접 만든 스킬을 얹어 쓴다.

| 구분 | 스킬 |
|---|---|
| 외부 기반 | caveman, diagnose, grill-me, grill-with-docs, handoff, improve-codebase-architecture, prototype, tdd, write-a-skill, zoom-out |
| 자체 제작 | agent-bootstrap, consensus, debate, delegate, review, savelog, obsidian-import, worklog-chain, works-kanban, works-wiki |

`consensus`·`debate`·`delegate`·`review`는 Claude가 Codex를 호출하는 쪽이라 Claude에만 두고, Codex 쪽에는 역방향인 `claude-review`를 둔다. 자세한 사용 패턴은 [[hetero-model-review-loop]] 참고.

## 훅으로 거는 게이트

지침 문장만으로는 잘 지켜지지 않는 규칙을 훅으로 강제한다.

- `docs-commit-gate` — 문서 커밋 남발 차단
- `stop-gate` — 작업을 덜 끝내고 턴을 종료하는 것 차단
- `sudo-gate` — 권한 상승 명령 확인
- `rg-flag-gate` — `grep -r` 형태의 잘못된 ripgrep 플래그 차단

## 플러그인

공식 마켓플레이스에서 playwright, rust-analyzer-lsp, frontend-design만 사용한다.

## 프로젝트별 로컬 지침

전역(`~/.claude/CLAUDE.md`) + 프로젝트 로컬이 함께 읽히고 충돌 시 로컬이 우선한다. 이 vault처럼 로컬 `CLAUDE.md`가 `AGENTS.md`를 `@` import 하게 두면, 규칙 소스를 한 파일로 두고 Claude·Codex 양쪽이 같은 내용을 읽는다.

## 주의

> [!WARNING]
> `~/.claude/CLAUDE.md`, `settings.json`, `skills/**`를 직접 편집하면 다음 `chezmoi apply`에 사라진다. `chezmoi edit <타깃>`을 쓰거나 소스를 고친 뒤 apply 한다.

## 폐기된 세팅

- **OMC (oh-my-claudecode)** — 멀티 에이전트 오케스트레이션 플러그인. Claude Code 자체 서브에이전트·스킬·훅으로 같은 일이 되면서 제거했다. HUD도 직접 만든 `statusline-command.sh`로 대체.
- **`~/dotfiles` + `install.sh` 심볼릭 링크 방식** — chezmoi로 이전. `~/.agents/skills/`의 링크는 그 시절 잔재이며 지금은 끊어져 있다. 이력은 [[dotfiles]] 참고.

---

## 관련

- [[dotfiles]]
- [[hetero-model-review-loop]]
- [[single-window-multi-session-worktree]]
- [[ai-workflow-tools]]
- [[karpathy-coding-principles]]

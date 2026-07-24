---
title: Claude Code 세팅 및 워크플로우
tags:
  - tech
created: 2026-05-13 (수)
---

# Claude Code 세팅 및 워크플로우

> **TL;DR**: OMC + Matt Pocock 스킬 + Karpathy 원칙 + dotfiles 관리로 구성된 Claude Code 전역 세팅

---

## 전체 구조

```
~/.claude/
  CLAUDE.md          ← 전역 지침 (OMC + Karpathy 원칙)
  settings.json      ← HUD, 플러그인, 환경변수 설정
  commands/
    savelog.md       ← /savelog 커스텀 커맨드
  hud/
    omc-hud.mjs      ← OMC HUD 스크립트
  plugins/           ← 플러그인 캐시 (OMC 등)

~/.agents/
  skills/            ← 전역 스킬 (Matt Pocock 기반)
```

---

## OMC (Oh My Claude Code)

멀티 에이전트 오케스트레이션 플러그인.

**설치:**
```bash
npm install -g oh-my-claude-sisyphus
# Claude Code에서
/plugin install oh-my-claudecode
/reload-plugins
/oh-my-claudecode:omc-setup
```

**주요 기능:**
- 전문화된 에이전트 자동 위임 (executor, architect, debugger 등)
- HUD statusline (컨텍스트 사용량, 에이전트 상태 등)
- ultrawork, ralph, autopilot 등 실행 모드

---

## 전역 스킬 (Matt Pocock 기반)

`~/.agents/skills/`에 설치. 한국어 트리거 추가됨.

| 스킬 | 용도 | 한국어 트리거 |
|------|------|--------------|
| caveman | 토큰 절약 압축 모드 | 짧게 말해, 간단하게 |
| diagnose | 버그 진단 루프 | 진단해줘, 디버그해줘 |
| grill-me | 설계 검토 인터뷰 | 내 계획 검토, 설계 피드백 |
| grill-with-docs | 문서 기반 설계 검토 | 문서 기반으로 검토 |
| handoff | 대화 핸드오프 문서 | 핸드오프, 다음 에이전트에 넘겨 |
| improve-codebase-architecture | 아키텍처 개선 | 리팩토링 기회 찾아줘 |
| prototype | 빠른 프로토타입 | 프로토타입 만들어줘, UI 시안 |
| tdd | 테스트 주도 개발 | TDD로 해줘 |
| write-a-skill | 새 스킬 작성 | 새 스킬 만들어줘 |
| zoom-out | 큰 그림 파악 | 전체 그림 보여줘, 맥락 설명해줘 |

**설치 방법:**
```bash
npx skills@latest add mattpocock/skills -g
# 불필요한 스킬 제거
rm -rf ~/.agents/skills/setup-matt-pocock-skills
rm -rf ~/.agents/skills/to-issues
rm -rf ~/.agents/skills/to-prd
rm -rf ~/.agents/skills/triage
```

---

## Karpathy 4원칙

`~/.claude/CLAUDE.md`에 전역 적용 중.

1. **Think Before Coding** — 구현 전 트레이드오프 명시, 모호함 먼저 해소
2. **Simplicity First** — 최소한의 코드만, 투기적 구현 금지
3. **Surgical Changes** — 요청된 것만 수정, 불필요한 정리 금지
4. **Goal-Driven Execution** — 명령이 아닌 성공 기준으로 실행

참고: https://discuss.pytorch.kr/t/karpathy-inspired-claude-code-guidelines-andrej-karpathy-llm-claude-code/9912

---

## /savelog 커맨드

작업 내용을 `~/Downloads/`에 마크다운으로 저장하고 프로젝트 메모리 업데이트.
전역 설치: `~/.claude/commands/savelog.md`
어느 프로젝트에서든 `/savelog` 호출 가능.

---

## dotfiles 동기화

GitHub: `git@github.com:<YOUR_GITHUB_USER>/dotfiles.git`

**새 기기 세팅:**
```bash
git clone git@github.com:<YOUR_GITHUB_USER>/dotfiles.git ~/dotfiles
bash ~/dotfiles/install.sh
# Claude 열고
/plugin install oh-my-claudecode
```

**동기화:**
```bash
# 변경 후
cd ~/dotfiles && git add . && git commit -m "..." && git push

# 다른 기기에서
cd ~/dotfiles && git pull
```

---

## 프로젝트별 로컬 CLAUDE.md

- 전역(`~/.claude/CLAUDE.md`) + 로컬(`.claude/CLAUDE.md`) 둘 다 읽힘
- 충돌 시 로컬이 우선
- 전역: 항상 적용할 행동 원칙 (Karpathy, OMC)
- 로컬: 프로젝트 특화 정보 (기술 스택, 컨벤션, 도메인 용어)
- 새 프로젝트에서 `/init` 실행하면 로컬 CLAUDE.md 자동 생성

---

## 관련

- [[dotfiles]]
- [[ai-workflow-tools]]

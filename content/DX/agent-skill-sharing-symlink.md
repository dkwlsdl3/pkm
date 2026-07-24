---
title: Agent Skill Sharing Symlink
tags:
  - tech
  - dx
created: 2026-06-02 (화)
---

# Agent Skill Sharing Symlink

> **TL;DR**: 여러 에이전트 도구가 같은 스킬을 써야 하면 공유 디렉터리를 단일 소스로 두고 각 도구의 스킬 폴더에는 심링크를 둔다.

---

## 개요

- **무엇인가**: Claude Code, Codex 같은 도구가 같은 로컬 스킬을 바라보도록 디렉터리 심링크를 구성하는 방식.
- **왜 쓰는가**: 도구별 스킬 디렉터리에 복사본을 두면 수정 누락과 버전 불일치가 생긴다.
- **언제 쓰는가**: 업무 자동화, 브라우저 조작, 사내 도구 연동처럼 같은 절차를 여러 에이전트 표면에서 반복 사용할 때.

---

## 핵심 개념

### 단일 소스

공유 스킬은 별도 공용 디렉터리에 둔다.

```bash
mkdir -p ~/.agents/skills
mv ~/.claude/skills/example-skill ~/.agents/skills/example-skill
```

각 도구별 스킬 폴더에는 같은 디렉터리를 가리키는 심링크를 만든다.

```bash
ln -s ~/.agents/skills/example-skill ~/.claude/skills/example-skill
ln -s ~/.agents/skills/example-skill ~/.codex/skills/example-skill
```

### 세션 재시작

많은 에이전트 런타임은 시작 시점에 스킬 목록을 읽는다. 심링크를 만든 뒤 현재 세션에 바로 보이지 않으면 런타임 재시작이나 스킬 목록 재조회가 필요할 수 있다.

---

## 코드 / 사용 예시

```bash
readlink -f ~/.claude/skills/example-skill
readlink -f ~/.codex/skills/example-skill
```

두 명령이 같은 실제 경로를 가리키면 단일 소스 공유가 된 것이다.

---

## 주의사항

> [!WARNING]
> 스킬 본문에는 사내 URL, 토큰, 쿠키, 개인 계정 정보 같은 민감 값을 넣지 않는다. 인증은 브라우저 세션이나 별도 보안 파일로 분리한다.

- 같은 이름의 스킬이 여러 경로에서 동시에 로드되면 목록에 중복 표시될 수 있다.
- 중복 표시가 싫으면 한쪽은 심링크만 남기고, 실제 복사본은 하나만 유지한다.
- 스킬이 상대 경로 리소스를 참조한다면 심링크 기준이 아니라 실제 스킬 디렉터리 기준으로 파일을 찾도록 구성한다.

---

## 관련

- [[playwright-mcp-session-persistence]]
- [[dotfiles]]

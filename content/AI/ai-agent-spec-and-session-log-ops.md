---
title: AI Agent 명세와 세션 로그 운영
tags:
  - tech
  - ai
  - agent
created: 2026-06-10 (수)
---

# AI Agent 명세와 세션 로그 운영

> **TL;DR**: AI agent를 제대로 쓰려면 코드보다 먼저 명세를 관리하고, 결과보다 과정인 세션 로그를 검색 가능하게 남겨야 한다.

---

## 개요

- **무엇인가**: AI coding agent에게 줄 명세, 작업 커서, 결정 기록, 세션 로그를 분리해서 운영하는 방식
- **왜 쓰는가**: agent가 이전 맥락을 다시 묻거나, 이미 실패한 접근을 반복하거나, 서로 다른 규칙으로 작업하는 문제를 줄이기 위해
- **언제 쓰는가**: Codex와 Claude Code 같은 AI coding agent를 프로젝트에 도입하거나, 나중에 팀원이 같은 운영 방식에 합류할 때

---

## 핵심 관점

### 1. 명세가 새로운 소스 코드다

WikiDocs의 명세 글은 OpenAI Sean Grove의 관점을 소개한다. 핵심은 코드가 의도와 맥락의 손실 압축이라는 점이다.

- 코드는 "무엇이 구현됐는가"를 보여준다.
- 명세는 "왜 만들어야 하는가", "성공 기준은 무엇인가", "어떤 행동은 버그인가"를 보여준다.
- AI가 구현을 많이 대신할수록 병목은 코딩 속도가 아니라 의도를 정확히 표현하는 능력으로 이동한다.

따라서 AI agent 운영에서 중요한 산출물은 코드만이 아니다. 반복적으로 적용될 규칙, 성공 기준, 금지할 행동, 검증 기준을 명세로 남겨야 한다.

### 2. 세션 로그는 과정의 기록이다

WikiDocs의 세션 로그 글은 `git log`와 세션 로그를 구분한다.

- `git log`: 무엇이 바뀌었는가
- 세션 로그: 왜 그렇게 바뀌었고, 어떤 시도와 실패를 거쳤는가

AI agent 작업에서는 이 과정이 특히 중요하다.

- 어떤 파일을 읽었는지
- 어떤 명령을 실행했는지
- 어떤 접근이 실패했는지
- 왜 방향을 바꿨는지
- 최종 코드에 이른 판단 흐름이 무엇인지

이 정보는 코드 리뷰, 장애 재현, 다음 agent에게 인계할 때 재사용 가치가 높다.

### 3. 작업일지는 세션 로그와 git 증거를 함께 본다

하루 작업을 정리할 때는 agent의 최종 답변만 믿지 않는다. 특히 여러 Claude/Codex 세션과 서브에이전트가 섞였을 때는 아래 순서가 안전하다.

1. 대상 로컬 날짜를 UTC 경계로 변환하고 `~/.claude/projects/**.jsonl` / `~/.codex/sessions/**.jsonl`에서 해당 `timestamp` 범위를 찾는다.
2. 사용자 프롬프트, task notification, 서브에이전트 결과, rate-limit/error 메시지를 분리해 본다.
3. `git log --since`, `git status --short --branch`, `git diff --stat`로 실제 커밋/미커밋 상태를 맞춘다.
4. "완료", "진행 중", "검증됨", "미검증"을 분리해서 Journal이나 worklog에 남긴다.

세션 로그는 "무슨 의도로 움직였는가"를 보여주고, git은 "실제로 무엇이 남았는가"를 보여준다. 둘을 같이 봐야 다음 agent에게 넘길 수 있는 기록이 된다.

---

## 운영 모델

### 프로젝트 repo 안에 둘 것

프로젝트별 진실 소스는 프로젝트 repo 안에 둔다.

| 파일 | 역할 |
|---|---|
| `AGENTS.md` | Codex 등 agent가 읽는 프로젝트 작업 계약 |
| `CLAUDE.md` | Claude Code용 import/부록. 공통 규칙은 `AGENTS.md`에 둔다 |
| `docs/agent-brief.md` | 현재 작업 커서, base head, verified facts, blockers, next step |
| `TODO.md` | backlog/spec queue |
| `docs/adr/` | 오래 유지될 결정 기록 |

원칙:

- 프로젝트 도메인 지식과 작업 상태는 개인 환경 설정에 넣지 않는다.
- 전역 memory에만 넣으면 다른 agent나 다른 PC에서 보장되지 않는다.
- agent가 자동으로 읽는 파일은 짧고 강하게 유지한다.

---

## 세션 로그 검색

세션 원본 JSONL을 `rg`·`jq`로 직접 검색하는 구체 방법은 [[session-log-search-rg-jq]]로 분리했다. 요지: `timestamp`가 UTC라 로컬 날짜를 UTC 경계로 변환해야 하고, 작업일지는 프롬프트뿐 아니라 도구 결과·Git 커밋을 함께 대조한다.

---

## 이 프로젝트에 적용한 결론

현재 개인 운영 단계에서는 아래 조합이 적절하다.

```text
프로젝트 현재 맥락
  -> docs/agent-brief.md

장기 결정
  -> docs/adr/

작업 큐와 명세
  -> TODO.md, AGENTS.md

원본 세션 검색
  -> rg + jq over JSONL

```

주의할 점:
- 세션 원본 검색은 `rg`+`jq`, 프로젝트 인계는 `agent-brief`, 장기 결정은 `ADR`이 맡는다.

---

## 팀원 온보딩 체크리스트

팀원이 추가되면 다음 순서로 공유한다.

1. 프로젝트 repo의 `AGENTS.md`, `CLAUDE.md`, `docs/agent-brief.md`, `TODO.md`, `docs/adr/` 읽기
2. 현재 작업의 기준 branch, base commit, active task를 확인하기
3. `rg`와 `jq`로 본인 로컬 JSONL 세션을 검색하는 날짜·경로 규칙 공유
4. 팀 차원의 세션 공유가 필요해지면 claudebin/claude-code-share 또는 viewer 계열 도구 검토

---

## 관련

- [[ai-overview]]
- [[context-engineering]]
- [[ai-workflow-tools]]
- [[session-log-search-rg-jq]]
- https://wikidocs.net/329525
- https://wikidocs.net/329393

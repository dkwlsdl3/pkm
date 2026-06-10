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

## 세션 로그 도구 선택

### 지금은 cass 우선

현재 개인/소규모 운영에서는 `cass`가 우선순위가 높다.

- Claude Code, Codex 등 여러 agent의 원본 로그를 검색 대상으로 묶는다.
- "전에 이거 어떻게 했더라?"를 찾는 용도에 적합하다.
- 실시간 저장소가 아니라, 이미 저장된 agent 로그를 나중에 인덱싱하는 검색기다.
- 최신 세션을 검색하려면 `cass index`로 인덱스를 갱신해야 한다.

```bash
cass status
cass index
```

### 팀원이 추가되면 검토할 도구

팀원이 합류하면 단순 로컬 검색만으로는 부족해질 수 있다.

| 목적 | 후보 |
|---|---|
| 세션을 URL로 공유 | Claudebin, claude-code-share |
| 세션을 사람이 훑기 쉽게 보기 | agent-session-viewer, Agent Sessions |
| Claude 로그 HTML 변환 | claude-code-viewer, claude-code-log |
| 조직 차원의 공유 갤러리 | 내부 세션 저장소 + SSO + 검색 UI |

도입 기준:

- PR이나 이슈에 "이 agent가 어떻게 판단했는지" 링크를 붙이고 싶다.
- 신규 팀원이 좋은 agent 세션을 보고 학습해야 한다.
- 여러 사람의 세션 로그를 검색/공유해야 한다.
- 로컬 cass 검색만으로는 협업 맥락 전달이 부족하다.

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
  -> cass

```

주의할 점:
- 세션 원본 검색은 `cass`, 프로젝트 인계는 `agent-brief`, 장기 결정은 `ADR`이 맡는다.

---

## 팀원 온보딩 체크리스트

팀원이 추가되면 다음 순서로 공유한다.

1. 프로젝트 repo의 `AGENTS.md`, `CLAUDE.md`, `docs/agent-brief.md`, `TODO.md`, `docs/adr/` 읽기
2. 현재 작업의 기준 branch, base commit, active task를 확인하기
3. cass 설치 및 `cass index`로 본인 로컬 세션을 검색 가능하게 만들기
4. 팀 차원의 세션 공유가 필요해지면 claudebin/claude-code-share 또는 viewer 계열 도구 검토

---

## 관련

- [[ai-overview]]
- [[context-engineering]]
- [[ai-workflow-tools]]
- https://wikidocs.net/329525
- https://wikidocs.net/329393

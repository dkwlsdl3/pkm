---
title: 세션 로그 검색 (rg + jq over JSONL)
tags:
  - tech
  - ai
  - agent
created: 2026-06-10 (수)
---

# 세션 로그 검색 (rg + jq over JSONL)

> **TL;DR**: Claude/Codex 세션 원본 JSONL을 별도 인덱서 없이 `rg`·`jq`로 직접 검색한다. `timestamp`는 UTC라 로컬 날짜를 UTC 경계로 변환해야 오전 구간을 놓치지 않는다.

---

## 개요

- **무엇**: `~/.claude/projects/**.jsonl` / `~/.codex/sessions/**.jsonl` 세션 로그를 직접 검색하는 방법
- **왜 / 언제**: 작업일지 작성·장애 재현·다음 agent 인계 시, agent 최종 답변만 믿지 않고 실제 과정을 대조할 때

## 동작 / 예시

로그는 사용자 프롬프트뿐 아니라 assistant 답변, 도구 호출·결과, `cwd`, `sessionId`, `/clear`·`/exit` 이벤트도 담는다.

`timestamp`는 UTC(`Z`). 예로 KST 2026-07-16 전체는 `2026-07-15T15:00:00Z` 이상 `2026-07-16T15:00:00Z` 미만. 파일명이나 `2026-07-16T` 접두사만 검색하면 KST 오전 0~9시를 놓친다.

```bash
# 후보 세션 파일 찾기(KST 7월 16일 예시)
rg -l \
  -e '"timestamp":"2026-07-15T(1[5-9]|2[0-3])' \
  -e '"timestamp":"2026-07-16T(0[0-9]|1[0-4])' \
  ~/.claude/projects ~/.codex/sessions -g '*.jsonl'

# 사람의 사용자 프롬프트만 추출(도구 결과 배열 제외)
jq -r '
  select((.timestamp? // "") >= "2026-07-15T15:00:00Z"
      and (.timestamp? // "") <  "2026-07-16T15:00:00Z")
  | select(.type == "user")
  | select((.message.content | type) == "string")
  | [.timestamp, .sessionId, .cwd, .message.content] | @tsv
' <session>.jsonl
```

답변은 `type == "assistant"`와 `message.content[] | select(.type == "text")`로 추출한다. 작업일지는 프롬프트만 요약하지 말고 도구 결과·Git 커밋과 함께 대조한다.

## 팀원이 추가되면 검토할 도구

로컬 검색만으로 부족해지면:

| 목적 | 후보 |
|---|---|
| 세션을 URL로 공유 | Claudebin, claude-code-share |
| 세션을 사람이 훑기 쉽게 보기 | agent-session-viewer, Agent Sessions |
| Claude 로그 HTML 변환 | claude-code-viewer, claude-code-log |
| 조직 차원 공유 갤러리 | 내부 세션 저장소 + SSO + 검색 UI |

도입 기준: PR/이슈에 판단 근거 링크를 붙이고 싶을 때, 신규 팀원이 좋은 세션을 학습해야 할 때, 여러 사람 세션을 검색·공유해야 할 때.

---

## 관련

- [[ai-agent-spec-and-session-log-ops]]
- [[ai-overview]]

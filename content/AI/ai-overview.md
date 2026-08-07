---
title: AI 개요 (MOC)
tags:
  - tech
  - moc
created: 2026-05-13 (수)
---

# AI 개요 (MOC)

> AI 개발 도구 세팅 및 워크플로우 모음

---

## 용어

| 표기 | 원어 | 뜻 |
|---|---|---|
| LLM | Large Language Model | 대규모 언어 모델 |
| RAG | Retrieval-Augmented Generation | 외부 문서를 검색해 그 내용을 근거로 답을 만드는 방식 → [[rag]] |
| VRAM | Video RAM | GPU에 붙은 메모리. 모델을 올릴 수 있는지가 이 용량으로 결정된다 |
| MCP | Model Context Protocol | 모델에 외부 도구·데이터 소스를 연결하는 프로토콜 |
| JSONL | JSON Lines | 한 줄에 JSON 하나씩 담는 형식. 세션 로그가 이 형식이라 `rg`·`jq`로 바로 훑을 수 있다 → [[session-log-search-rg-jq]] |
| UTC | Coordinated Universal Time | 표준시. 로그 타임스탬프가 UTC라 한국 시간과 9시간 차이가 나므로 날짜 경계를 변환해야 한다 |
| PSI / KS | Population Stability Index / Kolmogorov-Smirnov | 데이터 분포가 학습 때와 달라졌는지 재는 지표 → [[model-drift]] |
| HUD | Head-Up Display | 터미널 상단·하단에 상태를 띄우는 표시줄(statusline) |

`CLAUDE.md`·`AGENTS.md`는 약어가 아니라 에이전트가 읽는 지침 파일 이름이다.

---

## Claude Code

- [[claude-code-setup]] — 전역 지침·스킬·훅의 chezmoi 단일 소스 관리 구조
- [[karpathy-coding-principles]] — CLAUDE.md에 상시 적용하는 Karpathy 코딩 4원칙
- [[ai-workflow-tools]] — 외부 워크플로우 프레임워크 비교와 도입/제거 판단 이력

## 에이전트 운용 방식

- [[hetero-model-review-loop]] — 설계·구현·검증을 다른 모델에 나눠 맡기는 이유와 패턴
- [[single-window-multi-session-worktree]] — 병렬 세션을 한 창에 모으고 충돌은 worktree로 물리 분리

## 로컬 LLM

- [[local-llm-uncensored]] — 검열 없는(Abliterated) 로컬 LLM 모델 종류
- [[local-llm-tools]] — 로컬 LLM 구동 도구(LM Studio·Ollama·SillyTavern)와 VRAM 권장 사양

## 프롬프트 & 컨텍스트

- [[context-engineering]] — CLAUDE.md 최적화 원칙, 비자명 정보만 넣는 컨텍스트 엔지니어링
- [[agent-brief-scope-management]] — 작업 커서(agent brief) 비대 방지, 정보 수명별 저장소 분리
- [[ai-agent-spec-and-session-log-ops]] — AI agent 명세=소스코드 관점, 세션 로그·git 대조 운영 원칙
- [[session-log-search-rg-jq]] — 세션 JSONL을 rg·jq로 직접 검색(UTC 경계 변환)
- [[subagent-delta-review]] — 서브에이전트 델타 위임(컨텍스트 절약)
- [[subagent-adversarial-crosscheck]] — 서브에이전트 적대적 교차검증(반박 유도)

## ML 엔지니어링

- [[rag]] — RAG(검색 기반 생성) 개념·흐름
- [[chromadb]] — 로컬 벡터 DB ChromaDB 사용법
- [[model-drift]] — 모델 드리프트 감지, PSI/KS 지표

## AI 안전 · 에이전트 격리

- [[specification-gaming]] — 목표 극대화는 가장 값싼 경로를 찾는다: 문제를 푸는 대신 채점 환경을 뚫는다(o1-preview Docker 선례 포함)
- [[agent-eval-sandbox-design]] — 에이전트 평가 격리 설계 원칙: 기능상 필요한 예외 경로=공격면, 가드레일 완화↔격리 강도는 세트
- [[incident-forensics-self-hosted-model]] — 침해 로그 분석이 상용 AI 안전 필터에 막힌다: 자체 호스팅 모델을 사고 전에 준비
- [[openai-huggingface-sandbox-escape-2026-07]] — 위 셋이 도출된 실제 사건 기록(2026-07). 사실관계·출처 앵커

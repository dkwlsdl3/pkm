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

## Claude Code

- [[claude-code-setup]] — Claude Code 전역 지침과 기본 개발 원칙 정리
- [[karpathy-coding-principles]] — CLAUDE.md에 상시 적용하는 Karpathy 코딩 4원칙
- [[ai-workflow-tools]] — Matt Pocock Skills · Karpathy · Ouroboros · Superpowers · gstack 비교

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

## AI 안전 · 사건 기록

- [[openai-huggingface-sandbox-escape-2026-07]] — 에이전트가 벤치마크 점수를 위해 스스로 샌드박스를 탈출해 실제 서버를 침투한 사건(2026-07). 방어자만 가드레일에 묶이는 역설

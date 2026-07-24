---
title: Karpathy 코딩 4원칙
tags:
  - tech
  - ai
  - agent
created: 2026-05-13 (수)
---

# Karpathy 코딩 4원칙

> **TL;DR**: Andrej Karpathy의 LLM 코딩 원칙 4가지 — CLAUDE.md에 상시 적용해 스킬 호출 없이도 항상 동작하는 기본 행동 교정.

---

## 개요

- **무엇**: AI coding agent에 상시 적용하는 4가지 행동 원칙
- **왜 / 언제**: 전역 `~/.claude/CLAUDE.md`에 넣어 모든 프로젝트에서 기본 코딩 습관을 교정할 때 (`<!-- OMC:END -->` 아래에 두어 OMC 업데이트 시 덮어쓰이지 않게 배치)

## 4원칙

1. **Think Before Coding** — 구현 전 트레이드오프 명시, 모호함 먼저 해소
2. **Simplicity First** — 최소한의 코드만, 투기적 구현 금지
3. **Surgical Changes** — 요청된 것만 수정, 불필요한 정리 금지
4. **Goal-Driven Execution** — 명령이 아닌 성공 기준으로 실행

참고: https://discuss.pytorch.kr/t/karpathy-inspired-claude-code-guidelines-andrej-karpathy-llm-claude-code/9912

---

## 관련

- [[claude-code-setup]]
- [[ai-workflow-tools]]
- [[context-engineering]]

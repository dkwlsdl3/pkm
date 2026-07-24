---
title: 로컬 LLM 구동 도구 및 하드웨어
tags:
  - tech
  - ai
created: 2026-05-12 (화)
---

# 로컬 LLM 구동 도구 및 하드웨어

> **TL;DR**: 로컬 LLM을 실행하는 대표 도구(LM Studio·Ollama·SillyTavern)와 모델 크기별 VRAM 권장 사양.

---

## 구동 도구 및 인터페이스

- **LM Studio**: 초보자용 GUI. 내부 검색창에서 모델을 바로 받아 실행.
- **Ollama**: 터미널 기반, 가볍고 빠른 모델 실행.
- **SillyTavern**: 캐릭터 설정·역할극(RP)에 최적화된 전문 인터페이스.

## 하드웨어 권장 사항

- **8B(80억 파라미터) 모델**: VRAM 8GB ~ 12GB (RTX 3060/4060 등)
- **30B~70B 모델**: VRAM 24GB 이상 (RTX 3090/4090 또는 멀티 GPU)

---

## 관련

- [[local-llm-uncensored]]
- [[ai-overview]]

---
title: AI 워크플로우 도구 비교
tags:
  - tech
created: 2026-05-13 (수)
---

# AI 워크플로우 도구 비교

> **TL;DR**: Claude Code에서 사용 가능한 AI 워크플로우 강화 도구 비교 — 현재 Matt Pocock + Karpathy 조합으로 일상 작업 충분히 커버

---

## 한눈에 비교

|           | Matt Pocock Skills | Karpathy 원칙    | Ouroboros | Superpowers | gstack  |
| --------- | ------------------ | -------------- | --------- | ----------- | ------- |
| **형태**    | 스킬 모음              | CLAUDE.md 원칙   | 에이전트 런타임  | 방법론 프레임워크   | 스킬 모음   |
| **무게**    | 가벼움                | 최소             | 무거움       | 중간          | 중간      |
| **제어권**   | 사용자                | 사용자            | AI 주도     | 혼합          | 혼합      |
| **설치**    | npx 한 줄            | CLAUDE.md 붙여넣기 | 복잡        | 복잡          | npx 한 줄 |
| **현재 사용** | ✅                  | ✅              | ❌         | ❌           | ❌       |

---

## Matt Pocock Skills

- GitHub: https://github.com/mattpocock/skills
- 10개 전문화된 스킬 (diagnose, grill-me, tdd 등)
- 필요할 때 호출하는 방식 → 제어권 유지
- 한국어 트리거 추가해서 사용 중
- **추천 대상:** 일상적인 코딩 작업 전반

## Karpathy 원칙

- GitHub:https://github.com/forrestchang/andrej-karpathy-skills/tree/main
- CLAUDE.md에 상시 적용하는 행동 원칙 4가지
- 스킬 호출 없이 항상 동작
- **추천 대상:** 기본 코딩 습관 교정

## Ouroboros (Q00/ouroboros)

- GitHub: https://github.com/Q00/ouroboros
- "모호성 점수"로 코딩 시작 전 목표 명확성 검증
- 4단계 순환 루프: Interview → Seed → Execute → Evaluate
- 너무 무겁고 오버엔지니어링
- **추천 대상:** 대규모 팀 프로젝트, 요구사항이 복잡한 경우

## Superpowers (obra/superpowers)

- GitHub: https://github.com/obra/superpowers
- 7단계 선형 프로세스, TDD 강제
- Matt Pocock 스킬셋이랑 방향 유사한데 더 무거움
- Claude Code 외에 Cursor, Gemini CLI도 지원
- **추천 대상:** 멀티플랫폼 사용자

## gstack (garrytan/gstack)

- GitHub: https://github.com/garrytan/gstack
- CEO/EM/Designer 등 역할 기반 23개 스킬
- 실제 브라우저 자동화, cross-model 리뷰 특화
- 개인 프로젝트에서 "팀 시뮬레이션"이 필요할 때 유용
- **추천 대상:** 빠르게 만드는 개인 프로젝트, 팀 없이 혼자 작업

---

## 결론

> 현재 세팅(Matt Pocock + Karpathy)으로 일상 작업 충분히 커버.
> 개인 프로젝트에서 팀 시뮬레이션이 필요해지면 gstack 일부 스킬 추가 검토.

> 스킬 description에 한국어 트리거를 넣어 자동 로드되게 하는 세팅은 [[claude-code-setup]], Karpathy 원칙 자체는 [[karpathy-coding-principles]] 참고.

---

## 관련

- [[claude-code-setup]]
- [[karpathy-coding-principles]]
- [[dotfiles]]

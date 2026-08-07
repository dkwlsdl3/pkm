---
title: AI 워크플로우 도구 비교
tags:
  - tech
created: 2026-05-13 (수)
updated: 2026-08-07 (금)
---

# AI 워크플로우 도구 비교

> **TL;DR**: 외부 워크플로우 프레임워크를 비교한 뒤 무거운 것들을 걷어내고, 가벼운 외부 스킬셋 위에 직접 만든 스킬을 얹는 쪽으로 정착했다.

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

## 결론 (2026-08 갱신)

외부 프레임워크를 얹는 방향은 접었다. 남긴 것은 가벼운 외부 스킬셋(Matt Pocock 기반)과 CLAUDE.md 상시 원칙이고, 그 위에 필요할 때마다 직접 스킬을 만들어 붙이는 쪽이 더 잘 맞았다. 지금은 자체 제작 스킬이 절반을 넘는다.

- **무겁다고 판단해 도입하지 않음**: Ouroboros, Superpowers
- **팀 시뮬레이션은 다른 방식으로 해결**: gstack의 역할 기반 스킬 대신, 서로 다른 모델을 역할별로 세우는 방식을 쓴다 → [[hetero-model-review-loop]]
- **OMC(oh-my-claudecode)**: 도입했다가 제거. Claude Code의 서브에이전트·스킬·훅으로 대체됨 → [[claude-code-setup]]

> 위 표의 "현재 사용" 행은 2026-05 시점 기준이다. 지금의 실제 세팅 목록은 [[claude-code-setup]]을 보는 게 정확하다.

---

## 관련

- [[claude-code-setup]]
- [[hetero-model-review-loop]]
- [[karpathy-coding-principles]]
- [[dotfiles]]

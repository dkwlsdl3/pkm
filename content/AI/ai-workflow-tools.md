---
tags:
  - tech
created: 2026-05-13 (수)
---

# AI 워크플로우 도구 비교

> **TL;DR**: Claude Code에서 사용 가능한 AI 워크플로우 강화 도구 비교 — 현재 Matt Pocock + Karpathy 조합으로 일상 작업 충분히 커버

---

## 한눈에 비교

| | Matt Pocock Skills | Karpathy 원칙 | Ouroboros | Superpowers | gstack |
|---|---|---|---|---|---|
| **형태** | 스킬 모음 | CLAUDE.md 원칙 | 에이전트 런타임 | 방법론 프레임워크 | 스킬 모음 |
| **무게** | 가벼움 | 최소 | 무거움 | 중간 | 중간 |
| **제어권** | 사용자 | 사용자 | AI 주도 | 혼합 | 혼합 |
| **설치** | npx 한 줄 | CLAUDE.md 붙여넣기 | 복잡 | 복잡 | npx 한 줄 |
| **현재 사용** | ✅ | ✅ | ❌ | ❌ | ❌ |

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

### Matt Pocock 스킬 한국어 트리거 추가

**목적/배경**  
`~/.agents/skills/`에 설치된 10개 스킬의 description 필드에 한국어 트리거를 추가해 자연스러운 한국어 표현으로도 스킬이 자동 로드되도록 함.  
스킬 description은 exact string matching이 아니라 LLM이 의미적으로 판단하므로 비슷한 뉘앙스도 인식됨.

**추가된 한국어 트리거**

| 스킬 | 한국어 트리거 |
|------|-------------|
| caveman | 토큰 절약, 짧게 말해, 간단하게, 케이브맨 모드, 압축 모드 |
| diagnose | 진단해줘, 버그 찾아줘, 왜 안되지, 오류 원인 찾아줘, 디버그해줘 |
| grill-me | 나 검토해줘, 내 계획 검토, 질문해줘, 설계 피드백, 인터뷰해줘 |
| grill-with-docs | 문서 기반으로 검토, 도메인 언어로 검토, 아키텍처 검토 |
| handoff | 핸드오프, 다음 에이전트에 넘겨, 대화 압축해서 넘겨 |
| improve-codebase-architecture | 아키텍처 개선, 리팩토링 기회 찾아줘, 코드 구조 개선 |
| prototype | 프로토타입 만들어줘, 빠르게 만들어봐, UI 시안, 대충 만들어봐 |
| tdd | TDD로 해줘, 테스트 먼저 작성, 테스트 주도 개발 |
| write-a-skill | 새 스킬 만들어줘, 스킬 작성해줘 |
| zoom-out | 전체 그림 보여줘, 큰 그림에서 설명해줘, 맥락 설명해줘 |

---

### Karpathy 4원칙 전역 CLAUDE.md 추가

**목적/배경**  
Andrej Karpathy LLM 코딩 원칙을 CLAUDE.md에 추가해 모든 프로젝트에서 상시 적용.  
`<!-- OMC:END -->` 아래에 추가해 OMC 업데이트 시 덮어쓰이지 않도록 배치.

**4가지 원칙**
1. Think Before Coding — 구현 전 트레이드오프 명시, 모호함 해소
2. Simplicity First — 최소한의 코드, 투기적 구현 금지
3. Surgical Changes — 요청된 것만 수정
4. Goal-Driven Execution — 성공 기준으로 실행

참고: https://discuss.pytorch.kr/t/karpathy-inspired-claude-code-guidelines-andrej-karpathy-llm-claude-code/9912

---

## 관련

- [[claude-code-setup]]
- [[dotfiles]]

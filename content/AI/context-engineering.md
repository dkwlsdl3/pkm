---
title: Context Engineering (CLAUDE.md 최적화)
tags:
  - tech
created: 2026-05-14 (목)
---

# Context Engineering (CLAUDE.md 최적화)

> **TL;DR**: AI 에이전트에게 넘기는 컨텍스트 품질이 결과 품질을 결정한다 — 적을수록 좋고, 비자명한 것만 넣는다

---

## 핵심 원칙

**CLAUDE.md에 넣을 가치가 있는 것:**
- 코드만 봐선 알 수 없는 비즈니스 맥락 (커밋 규칙, 브랜치 전략 등)
- 놀랄 만한 제약 (예: musl static binary 빌드 필수 — glibc 버전 불일치 때문)
- 반복적으로 실수하는 패턴 방지용 규칙

**안 넣어도 되는 것:**
- 코드 읽으면 바로 보이는 컨벤션
- 너무 당연한 원칙 (`.env` 커밋 금지 등)
- 자주 바뀌는 상태 정보 → 메모리 파일이 더 적합

---

## 토큰 비용

- Anthropic 프롬프트 캐싱 TTL 5분 → 세션 내 반복 호출 시 ~10배 저렴
- 컨텍스트 창은 캐싱과 무관하게 소모됨
- 글로벌 CLAUDE.md + 프로젝트 CLAUDE.md 중복 내용 ≈ 150토큰 → 무시할 수준

---

## 제거 대상 예시

| 항목 | 제거 이유 |
|---|---|
| Build & Run 명령어 | `cargo build`, `npm run dev` 등 당연한 내용 |
| Environment Variables | 실제 `.env` 파일 직접 읽으면 됨 |
| DB 스키마 | migrations 코드에서 볼 수 있음 |
| 커밋 규칙 중 당연한 항목 | git add . 지양 등 |

---

## 구조 권장

```
~/.claude/CLAUDE.md          ← 전역 규칙 (언어, 스타일 등)
<project>/CLAUDE.md          ← 프로젝트 비자명 정보만
<project>/.claude/memory/    ← 자주 바뀌는 상태 정보
```

## 작업 커서 비대 방지

작업 커서(agent brief)는 작업일지나 지식 저장소가 아니다. 다음 세션이 바로 행동하기 위한 현재 상태만 남긴다.

- 완료 항목은 상세 서술 대신 커밋 해시와 결과 한 줄로 압축한다.
- 반복해서 참조할 운영 지식은 structure map이나 Tech 노트로 옮긴다.
- backlog와 현재 커서를 같은 문서에 중복 기록하지 않는다.
- 문서 크기 상한을 CI/drift 검사에 넣고, 초과 시 세션당 한 번 경고한다.
- `base_head`, 현재 작업, 검증된 사실, blocker, 다음 행동만 유지한다.

크기 제한은 그 자체가 목표가 아니라 "새 세션이 오래된 완료 서술을 다시 추론하는 비용"을 제한하는 장치다. 제한을 넘으면 문장을 줄이는 데 그치지 말고 정보의 수명에 맞는 저장소로 이동해야 한다.

---

## 실전 적용 결과

사내 프로젝트 CLAUDE.md 슬림화 사례:

| 파일 | 이전 | 이후 | 제거 내용 |
|---|---|---|---|
| CLAUDE.md | 220줄 | 103줄 | Build 명령어, .env 변수 목록, DB 스키마, Frontend 세부 가이드 |
| AGENTS.md | 105줄 | 83줄 | 동일 기준 적용 |

> Frontend Guidelines는 `service/frontend/app/claude.md` 포인터 한 줄로 대체.

---

## 관련

- [[ai-overview]]
- [[claude-code-setup]]

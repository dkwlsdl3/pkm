---
title: 모노레포 도구 비교 (Turborepo vs Nx vs Bazel)
tags:
  - tech
  - dx
  - architecture
created: 2026-05-18 (월)
---

# 모노레포 도구 비교 (Turborepo vs Nx vs Bazel)

> **TL;DR**: 빠른 도입엔 Turborepo, 복잡한 대형/혼합 스택엔 Nx, 구글/메타 규모엔 Bazel

---

### Turborepo (Vercel)

```bash
npx create-turbo@latest
```

- 기존 레포에 10분 내 적용 가능, 즉각적인 빌드 속도 개선
- package.json 스크립트 기반 — 프로젝트 구조 변경 불필요
- **약점**: 아키텍처 강제 없음, 순환 의존성 방지 미지원

### Nx

```bash
npx create-nx-workspace@latest
```

- 코드 생성, 아키텍처 규칙, 의존성 그래프 시각화 내장
- 멀티 언어 지원 (JS/TS, Java, Python, Go, Rust)
- **2025년 코어를 Rust로 마이그레이션** — 속도 대폭 향상
- **약점**: 설정 복잡, 기존 프로젝트 마이그레이션 난이도 높음

### 선택 기준

| 상황 | 권장 |
|------|------|
| 빠르게 도입, JS/TS 팀 | Turborepo |
| 복잡한 대형 모노레포, 혼합 기술 스택 | Nx |
| 구글/메타 규모 | Bazel |

---

## 관련

- [[monorepo]]

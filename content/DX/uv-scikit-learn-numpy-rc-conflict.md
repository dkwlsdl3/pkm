---
title: uv scikit-learn numpy RC 버전 충돌
tags:
  - tech
created: 2026-05-27 (화)
---

# uv scikit-learn numpy RC 버전 충돌

> **TL;DR**: `scikit-learn>=1.4,<2.0` 지정 시 uv sync가 실패하는데, 1.4.x가 PyPI에서 삭제된 `numpy==2.0.0rc1`을 빌드 의존성으로 요구하기 때문 — `scikit-learn>=1.5,<2.0`으로 올려서 해결한다.

---

`scikit-learn>=1.4,<2.0` 지정 시 uv sync 실패.

**원인**: 1.4.x 빌드 의존성이 `numpy==2.0.0rc1`(RC 버전) 요구 → PyPI에서 삭제됨.

**해결**: `scikit-learn>=1.5,<2.0`으로 변경.

---

## 관련

- [[uv]]

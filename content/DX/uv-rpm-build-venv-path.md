---
title: uv RPM 빌드 venv 경로 지정
tags:
  - tech
created: 2026-05-27 (화)
---

# uv RPM 빌드 venv 경로 지정

> **TL;DR**: RPM 패키징 등에서 venv 위치를 표준 경로가 아닌 스테이징 경로로 강제하려면 `UV_PROJECT_ENVIRONMENT` 환경변수와 `--no-install-project`를 함께 사용한다.

---

```bash
# UV_PROJECT_ENVIRONMENT로 venv 위치 강제 지정
UV_PROJECT_ENVIRONMENT="${STAGE_VENV}" uv sync \
  --frozen --no-dev --no-install-project \
  --project "${REPO_ROOT}"
```

---

## 관련

- [[uv]]

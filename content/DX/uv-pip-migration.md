---
title: uv pip 마이그레이션
tags:
  - tech
created: 2026-05-27 (화)
---

# uv pip 마이그레이션

> **TL;DR**: 기존 pip/requirements.txt 프로젝트를 uv로 전환할 때는 `uv init`으로 pyproject.toml을 만들고, 서비스는 `package = false`, Python 버전은 `.python-version`으로 고정한다.

---

### pyproject.toml 생성

```bash
uv init --no-workspace   # 기존 프로젝트에 pyproject.toml 추가
uv add $(cat requirements.txt | grep -v '^#')
```

**서비스 설정** (`package = false`):
```toml
[tool.uv]
package = false  # 라이브러리가 아닌 서비스 → wheel 빌드 불필요
```

### Python 버전 고정

```
# .python-version
3.11
```

> pyenv 기본 버전이 높으면(3.14 등) wheel 없는 패키지 소스 빌드 실패 위험. `.python-version`으로 명시.

---

## 관련

- [[uv]]

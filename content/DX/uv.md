---
title: uv
tags:
  - tech
created: 2026-05-27 (화)
---

# uv

> Rust 기반 Python 패키지 매니저 — pip/venv 대체, uv.lock으로 완전한 재현성 보장

---

## 설치

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

---

## pip → uv 마이그레이션

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

## 주요 명령어

```bash
uv sync                      # 의존성 설치 (uv.lock 기준)
uv sync --frozen             # uv.lock 변경 없이 설치
uv sync --no-dev             # 개발 의존성 제외
uv add <package>             # 패키지 추가
uv run <script>              # venv 없이 실행
```

---

## 트러블슈팅

### scikit-learn 버전 주의

`scikit-learn>=1.4,<2.0` 지정 시 uv sync 실패.

**원인**: 1.4.x 빌드 의존성이 `numpy==2.0.0rc1`(RC 버전) 요구 → PyPI에서 삭제됨.

**해결**: `scikit-learn>=1.5,<2.0`으로 변경.

---

## RPM 빌드 — venv 경로 지정

```bash
# UV_PROJECT_ENVIRONMENT로 venv 위치 강제 지정
UV_PROJECT_ENVIRONMENT="${STAGE_VENV}" uv sync \
  --frozen --no-dev --no-install-project \
  --project "${REPO_ROOT}"
```

---

## GitLab CI

```yaml
variables:
  UV_CACHE_DIR: "${CI_PROJECT_DIR}/.uv"

cache:
  key: uv-${CI_COMMIT_REF_SLUG}
  paths: [".uv/"]

script:
  - uv sync --frozen --no-dev
```

**venv 재빌드 여부 감지**:
```bash
if [ ! -d "${INSTALL_ROOT}/venv" ] || \
   ! cmp -s uv.lock ${INSTALL_ROOT}/uv.lock.installed; then
  UV_PROJECT_ENVIRONMENT=${INSTALL_ROOT}/venv uv sync \
    --frozen --no-dev --no-install-project --python 3.11
  cp uv.lock ${INSTALL_ROOT}/uv.lock.installed
fi
```

---

## 관련

- [[pnpm]]
- [[gitlab-cicd]]
- [[dx-overview]]

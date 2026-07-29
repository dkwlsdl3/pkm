---
title: uv
tags:
  - tech
created: 2026-05-27 (수)
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

기존 pip/requirements.txt 프로젝트 전환 절차는 [[uv-pip-migration]] 참고.

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

`scikit-learn>=1.4,<2.0` 지정 시 uv sync 실패 원인과 해결은 [[uv-scikit-learn-numpy-rc-conflict]] 참고.

---

## RPM 빌드 — venv 경로 지정

`UV_PROJECT_ENVIRONMENT`로 venv 위치를 강제 지정하는 방법은 [[uv-rpm-build-venv-path]] 참고.

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

- [[uv-pip-migration]]
- [[uv-scikit-learn-numpy-rc-conflict]]
- [[uv-rpm-build-venv-path]]
- [[pnpm]]
- [[gitlab-cicd]]
- [[dx-overview]]

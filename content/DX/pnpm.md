---
title: pnpm
tags:
  - tech
created: 2026-05-27 (화)
---

# pnpm

> npm 대체 패키지 매니저 — 하드링크 기반 디스크 절약, lockfile 재현성, 빠른 install

---

## 설치 (corepack)

```bash
corepack prepare pnpm@11.3.0 --activate
```

`package.json`에 고정:
```json
{
  "packageManager": "pnpm@11.3.0"
}
```

---

## npm → pnpm 마이그레이션

```bash
# package-lock.json → pnpm-lock.yaml 변환
pnpm import

# 이후 package-lock.json 삭제
rm package-lock.json
```

---

## ERR_PNPM_IGNORED_BUILDS 해결

pnpm v9+에서 postinstall 스크립트(네이티브 바이너리 빌드) 기본 차단.

**증상**:
```
ERR_PNPM_IGNORED_BUILDS: Ignored build scripts:
  @parcel/watcher@2.5.6, esbuild@0.27.7, unrs-resolver@1.12.2
```

**주의**: pnpm 11에서 `package.json`의 `"pnpm"` 필드 더 이상 읽지 않음 → 아래 방법 사용.

**해결**:
```bash
pnpm approve-builds
```

생성된 `pnpm-workspace.yaml`에서 `true`로 수정:
```yaml
# pnpm-workspace.yaml
allowBuilds:
  '@parcel/watcher': true
  esbuild: true
  unrs-resolver: true
```

> `pnpm approve-builds`가 placeholder 값으로 생성하므로 직접 `true`로 수정 필요.

---

## GitLab CI

```yaml
script:
  - corepack enable
  - corepack prepare pnpm@11.3.0 --activate
  - pnpm install --frozen-lockfile
  - pnpm run build
```

---

## 주요 파일

| 파일 | 용도 |
|---|---|
| `package.json` | `"packageManager": "pnpm@11.3.0"` — corepack이 읽음 |
| `pnpm-lock.yaml` | 의존성 버전 고정 |
| `pnpm-workspace.yaml` | `allowBuilds` — 네이티브 바이너리 빌드 허용 |

---

## 관련

- [[uv]]
- [[gitlab-cicd]]
- [[dx-overview]]

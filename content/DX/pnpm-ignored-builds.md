---
title: pnpm ERR_PNPM_IGNORED_BUILDS 해결
tags:
  - tech
created: 2026-05-27 (화)
---

# pnpm ERR_PNPM_IGNORED_BUILDS 해결

> **TL;DR**: pnpm v9+에서 postinstall 스크립트(네이티브 바이너리 빌드) 기본 차단 → `pnpm approve-builds`로 `pnpm-workspace.yaml`의 `allowBuilds`를 직접 `true`로 수정해야 함.

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

## 관련

- [[pnpm]]

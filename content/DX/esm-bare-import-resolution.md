---
tags:
  - dx
created: 2026-07-01 (수)
---

# ESM bare import는 스크립트 파일 위치 기준으로 해석된다

> `.mjs`가 `Cannot find package 'x'`로 즉사할 때의 원인과 우회.

## 증상

의존성이 설치된 프로젝트에서 `cd` 후 실행해도, 다른 위치에 있는 `.mjs` 스크립트가
`ERR_MODULE_NOT_FOUND: Cannot find package 'playwright'` 등으로 실패.

## 원인

ESM의 **bare specifier**(`import x from 'pkg'`) 해석은 **CWD가 아니라 그 import를 담은 모듈 파일의 URL** 기준으로 `node_modules`를 상향 탐색한다. 그래서 `cd 프로젝트 && node ~/elsewhere/script.mjs`를 해도, `node_modules`는 `~/elsewhere/` 상위에서 찾지 CWD(프로젝트)에서 찾지 않는다.

- CJS의 `NODE_PATH`는 ESM bare import엔 **적용 안 됨**.
- 심링크로 스크립트를 프로젝트에 걸어도, Node가 realpath로 해석하면 원위치 기준이라 소용없을 수 있다(`--preserve-symlinks` 별도).

## 우회

- 가장 단순: **스크립트를 의존성 있는 디렉토리(node_modules를 상위에 둔 곳)로 복사해 실행** 후 정리.
- 또는 그 스크립트 위치에 의존성을 설치/링크, 또는 `import`를 절대경로/`createRequire`로 대체.

## 관련
- [[agent-skill-sharing-symlink]] — 공유 스크립트 배치 시 함께 걸리는 함정

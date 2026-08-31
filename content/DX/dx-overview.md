---
title: DX 개요 (MOC)
tags:
  - tech
  - moc
created: 2026-05-13 (수)
---

# DX 개요 (MOC)

> DX(Developer Experience, 개발자 경험) — 개발 환경 세팅 및 생산성 도구 모음

---

## 용어

| 표기 | 원어 | 뜻 |
|---|---|---|
| DX | Developer Experience | 개발자 경험. 도구·환경이 개발을 얼마나 매끄럽게 하는지 |
| TUI | Text-based User Interface | 터미널 안에서 화면을 그리는 UI(vim, htop 등) |
| PKM | Personal Knowledge Management | 개인 지식 관리 → [[pkm-zettelkasten]] |
| MOC | Map of Content | 특정 주제의 노트를 모아 길잡이 역할을 하는 색인 노트 |
| E2E | End-to-End | 사용자 관점에서 전체 흐름을 실제로 돌려보는 테스트 |
| SPA | Single Page Application | 페이지 전환 없이 한 문서에서 동작하는 프런트엔드 구조 |
| ESM | ECMAScript Module | JavaScript 표준 모듈 방식(`import`/`export`). CommonJS(`require`)와 해석 규칙이 다르다 |
| CWD | Current Working Directory | 현재 작업 디렉토리. 프로세스가 상대 경로를 해석하는 기준점 |
| GLIBC | GNU C Library | 리눅스 표준 C 라이브러리. 빌드 환경보다 낮은 버전에서 실행하면 깨진다 |
| RPM | RPM Package Manager | RHEL 계열 패키지 형식·도구 |
| RC | Release Candidate | 정식 배포 후보 버전. 의존성 해석에서 정식판과 섞이면 충돌한다 |
| OTP | One-Time Password | 일회용 비밀번호. E2E 테스트에서 로그인 자동화의 걸림돌이 된다 |
| NFS | Network File System | 네트워크로 공유하는 파일시스템. 응답이 느려지면 파일 I/O가 블로킹된다 |

---

## 터미널 & 에디터

- [[terminal-setup]] — WezTerm·zsh·starship·nvim 전체 스택 설치 인덱스
- [[zsh-oh-my-zsh-plugins]] — oh-my-zsh + 핵심 플러그인 4종 설치
- [[starship-prompt-config]] — tokyonight 팔레트 기반 starship.toml
- [[nvim-lazyvim-setup]] — neovim + LazyVim starter 설치
- [[nvim-treesitter-glibc-mismatch]] — Ubuntu 22.04 GLIBC 2.35에서 tree-sitter 실행 실패 해결
- [[mouse-reporting-leak]] — TUI 종료 후 마우스 이스케이프 누수, reset/printf 복구

## 설정 파일 관리

- [[dotfiles]] — chezmoi로 dotfiles를 관리하는 이 환경의 구성(소스 레포 구조·타깃 매핑·새 기기 세팅)
- [[chezmoi]] — chezmoi 관리 파일은 타깃 직접 편집 시 apply로 소실, 소스 편집 후 apply

## 키보드 & 입력

- [[input-leap-setup]] — input-leap으로 Ubuntu ↔ MacBook 키보드/마우스 소프트웨어 공유
- [[xcape-hangul-toggle]] — xcape로 Ubuntu→Mac 한/영 전환 키(Alt_R) 전달
- [[keyboard-fn-remap]] — keyd로 MacBook 키보드 미디어키 → Fn키 리매핑

## 지식 관리

- [[pkm-zettelkasten]] — PKM / Zettelkasten 개념, Obsidian으로 구현하는 디지털 메모 상자
- [[niklas-luhmann]] — Zettelkasten을 실천한 사회학자(9만 카드→70권/400편)

## 작업 원칙

- [[redesign-check-existing-first]] — 앱 재설계 착수 전 기존 구현 확인(수정/이동=재편, 추가만 신규)
- [[adversarial-cross-review]] — 구현자≠검증자 적대적 교차검증, 하루 2회전에 실버그 11건 적발한 운용법
- [[unknown-is-not-absent]] — "모름"을 "없음·정상"으로 접지 말 것: 3값 outcome과 "확인 불가" 표시(실증 6사례)
- [[design-draft-eviction-to-adr]] — 구현이 끝난 설계 초안은 「지금도 유효한 계획」으로 읽힌다: 결정은 ADR·실측은 데이터 경로·판단은 코드 옆으로 퇴거(퇴거는 반드시 무언가를 잃으므로 교차검증 필수)
- [[duplicate-code-normalized-hash-detection]] — 이름만 다른 복사본은 토큰 복붙 탐지로 못 잡는다, 정규화 해시 + 클론 무리 세기
- [[code-fork-drift]] — 복사된 모듈은 반드시 드리프트한다(9쌍 중 미반영 3건 실측), 공용 라이브러리 추출 또는 주기 전수 대조
- [[code-audit-collector-design]] — 코드 전수조사 수집기 설계: 수집기 자신부터 fail-closed, 적중 수≠검토 단위(고유 위치), 반대 성격 그룹 분리, 정답지 재현율

## 문서 변환

- [[md-to-pdf-chrome-headless]] — pandoc 없이 Chrome headless로 md→html→pdf 변환, 한글 Noto 폰트 지정

## CI/CD & 자동화

- [[github-actions]] — GitHub Actions 트리거·cron·gh CLI 인덱스
- [[github-actions-pages-deploy]] — upload-pages-artifact + deploy-pages로 Pages 배포
- [[github-actions-cross-repo-sync]] — PAT로 타 레포 checkout·push 동기화
- [[gitlab-cicd]] — .gitlab-ci.yml 구조, GitLab Runner, 단계별 파이프라인
- [[gitlab-ci-monorepo-root-pattern]] — 모노레포 루트 CI: 컴포넌트 네임스페이스 job·캐시 분리
- [[gitlab-ci-runtime-dependency-baking]] — 런타임 의존성 베이스 이미지 베이킹 vs 임시 워크어라운드
- [[gitlab-npm-package-registry]] — GitLab npm package registry를 scope registry와 token 인증으로 안전하게 쓰는 패턴
- [[playwright-e2e]] — E2E 테스트 환경 구성(설치·config·project 분리)
- [[playwright-auth-storagestate]] — storageState로 refresh 쿠키만 저장해 access token 자동 복원
- [[playwright-selector-wait-strategy]] — role 없는 셀렉터 대체·SPA 초기화 대기
- [[playwright-mcp-session-persistence]] — Playwright MCP에서 세션 쿠키 기반 로그인을 storageState로 유지
- [[agent-skill-sharing-symlink]] — 에이전트 도구가 같은 스킬을 심링크로 공유하는 방식

## 버전 관리

- [[git-workflow]] — git mv/rm 자동 staging 주의, 도메인 분리 커밋, soft reset로 섞인 커밋 풀기
- [[git-submodule-push]] — 슈퍼프로젝트 push가 서브모듈 새 커밋을 안 올리는 함정, push.recurseSubmodules
- [[shared-worktree-parallel-agents]] — 에이전트 세션 병렬 운용: 경로 지정 커밋은 공유 파일을 못 막고, 경로 없는 stash는 옆 세션 작업을 걷어간다
- [[integrator-session-worktree-fanout]] — 그 해법: 작업 세션마다 격리 워크트리 + 통합 세션이 배분·머지만 맡는 구조, 세션 유형별 금지 규칙

## 레포지토리 전략

- [[monorepo]] — 모노레포(=싱글레포) vs 멀티레포 비교. ★**서브모듈로 묶은 구조는 모노레포가 아니다**(멀티레포+메타 레포) + 전환 체크리스트
- [[monorepo-tools]] — Turborepo / Nx / Bazel 비교와 선택 기준

## 언어 & 빌드

- [[rust-cargo]] — Rust/Cargo 핵심 명령어, 크로스 컴파일, musl 빌드
- [[rust-language-features]] — 왜 Rust인가 — 메모리안전성·성능·동시성·에러처리
- [[rust-backend-troubleshooting]] — Rust/Tokio 백엔드 hung vs crash 진단 순서
- [[db-connection-pool-exhaustion]] — API·scheduler·cleanup이 공유 DB pool을 고갈시키는 문제
- [[tokio-blocking-io-hazard]] — 네트워크 FS 동기 I/O가 Tokio worker를 막음, spawn_blocking
- [[dev-script-restart-vs-rebuild]] — dev 스크립트 restart는 rebuild가 아니다, 바이너리 mtime 대조 진단법
- [[rust-build-system-deps]] — Rust 빌드의 시스템 lib·네트워크 의존 진단 인덱스
- [[rust-openssl-vendored-build]] — openssl vendored=소스컴파일 실패, 시스템 링크 전환
- [[rust-utoipa-swagger-ui-vendored]] — utoipa-swagger-ui build.rs 다운로드를 vendored로 제거
- [[esm-bare-import-resolution]] — ESM `.mjs` bare import는 CWD 아닌 스크립트 파일 위치 기준 해석; 우회는 복사 실행

## 프론트엔드

- [[vue-dead-branch]] — 상보 조건(`v-if`/`v-else`)에서 데이터상 불가능한 분기·헬퍼·i18n 키 죽은 코드 정리
- [[live-canvas-vs-standalone-export]] — 라이브 디자인 캔버스와 내보내기 스냅샷의 버전 불일치 — 정본은 뷰어가 여는 파일
- [[nuxt-tooling]] — Nuxt 타입체크·ESLint CI 게이트
- [[nuxt-bundle-optimization]] — xlsx 지연 로딩·미사용 차트 제거로 번들 축소
- [[server-bundle-import-outside-source-tree]] — 서버 라우트가 소스 트리 밖 유틸을 상대 경로로 가져오면 개발 모드만 500: 프로덕션 빌드·단위시험·정적검사가 전부 통과한다

## 패키지 매니저

- [[pnpm]] — npm 대체 패키지 매니저, 하드링크 기반 디스크 절약
- [[pnpm-ignored-builds]] — pnpm v9+ postinstall 차단(ERR_PNPM_IGNORED_BUILDS) 해결
- [[uv]] — Rust 기반 Python 패키지 매니저, pyproject.toml + uv.lock
- [[uv-pip-migration]] — pip/requirements.txt → uv pyproject.toml 전환
- [[uv-scikit-learn-numpy-rc-conflict]] — scikit-learn 지정 시 numpy RC 의존성으로 uv sync 실패
- [[uv-rpm-build-venv-path]] — UV_PROJECT_ENVIRONMENT로 RPM 빌드 venv 경로 지정

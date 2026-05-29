---
title: DX 개요 (MOC)
tags:
  - tech
  - moc
created: 2026-05-13 (수)
---

# DX 개요 (MOC)

> Developer Experience — 개발 환경 세팅 및 생산성 도구 모음

---

## 터미널 & 에디터

- [[terminal-setup]] — WezTerm · zsh · oh-my-zsh · starship · nvim(LazyVim) 전체 스택 설치 가이드

## 설정 파일 관리

- [[dotfiles]] — dotfiles를 Git으로 관리해 여러 기기에서 동일 환경 유지

## 키보드 & 입력

- [[input-leap-setup]] — input-leap으로 Ubuntu ↔ MacBook 키보드/마우스 소프트웨어 공유
- [[keyboard-fn-remap]] — keyd로 MacBook 키보드 미디어키 → Fn키 리매핑

## 지식 관리

- [[pkm-zettelkasten]] — PKM / Zettelkasten 개념, Obsidian으로 구현하는 디지털 메모 상자

## CI/CD & 자동화

- [[github-actions]] — 크로스 레포 동기화, GitHub Pages 배포, cron 자동화 패턴
- [[gitlab-cicd]] — .gitlab-ci.yml 구조, GitLab Runner, 단계별 파이프라인
- [[playwright-e2e]] — E2E 테스트 환경 구성, storageState 인증 재사용, project 분리 패턴

## 버전 관리

- [[git-workflow]] — git mv/rm 자동 staging 주의, 도메인 분리 커밋, soft reset로 섞인 커밋 풀기

## 레포지토리 전략

- [[monorepo]] — 모노레포 vs 멀티레포 비교, Turborepo / Nx, Git 서브모듈 방식

## 언어 & 빌드

- [[rust-cargo]] — Rust/Cargo 핵심 명령어, 크로스 컴파일, musl 빌드
- [[rust-backend-troubleshooting]] — Rust/Tokio 백엔드 hung, DB 커넥션 풀 고갈, cleanup task 분리 진단

## 패키지 매니저

- [[pnpm]] — npm 대체 패키지 매니저, 하드링크 기반 디스크 절약, pnpm-workspace.yaml allowBuilds 설정
- [[uv]] — Rust 기반 Python 패키지 매니저, pyproject.toml + uv.lock 재현성 보장
- [[nuxt-tooling]] — Nuxt 타입체크(nuxi typecheck) · ESLint(@nuxt/eslint) · 번들 최적화 설정

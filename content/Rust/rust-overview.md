---
title: Rust 개요 (MOC)
tags:
  - tech
  - moc
created: 2026-06-04 (목)
---

# Rust 개요 (MOC)

> Rust 언어 — 함정, 패턴, 트러블슈팅 모음

---

## 노트

- [[sqlx-timestamptz-string-decode]] — TIMESTAMPTZ를 `Option<String>`으로 받으면 조용히 None이 되는 함정
- [[fs-copy-self-overwrite]] — `fs::copy` src==dst 자기 덮어쓰기 위험 + `(n)` 넘버링 방어 패턴
- [[embedded-script-contract-tests]] — 코드가 생성하는 셸 스크립트/systemd unit 문자열의 운영 계약을 단위테스트로 고정하는 패턴
- [[musl-cross-compile-openssl-libzfs]] — musl 정적빌드: openssl vendored로 해결 / libzfs-sys는 한계(CI 필요)
- [[openssl-sys-vendored-perl-deps]] — openssl-sys `vendored` 소스빌드가 요구하는 perl 모듈(RHEL/Rocky 최소 perl, `perl(모듈)` provides)

---

## 관련

- [[lustre-overview]] — Lustre 백엔드(actix-web)에서 만난 사례들

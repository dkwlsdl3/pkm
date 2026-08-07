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

## 용어

| 표기 | 원어 | 뜻 |
|---|---|---|
| RAII | Resource Acquisition Is Initialization | 자원을 객체 수명에 묶어 스코프를 벗어나면 자동 해제하는 방식. Rust의 소유권이 이걸 강제한다 |
| RHEL | Red Hat Enterprise Linux | Red Hat 상용 리눅스. 오래된 glibc·OpenSSL 버전 때문에 크로스 빌드 이슈가 잦다 |
| musl | — | glibc 대신 정적 링크에 쓰는 경량 C 라이브러리. 배포 환경 glibc 버전 의존을 없앤다 |
| FFI | Foreign Function Interface | 다른 언어(주로 C) 함수를 호출하는 경계 |
| ORM | Object-Relational Mapping | 객체와 DB 테이블을 대응시키는 계층(sqlx는 ORM이 아니라 쿼리 검증 방식) |

---

## 노트

- [[sqlx-timestamptz-string-decode]] — TIMESTAMPTZ를 `Option<String>`으로 받으면 조용히 None이 되는 함정
- [[sqlx-integer-i64-decode-mismatch]] — PostgreSQL `integer`를 `i64`로 받으면 항상 디코딩 실패, `unwrap_or(0)`가 삼킨다
- [[path-exists-conflates-stat-failure]] — `Path::exists()`는 stat 실패도 false, `symlink_metadata`로 3값 판정
- [[fs-copy-self-overwrite]] — `fs::copy` src==dst 자기 덮어쓰기 위험 + `(n)` 넘버링 방어 패턴
- [[embedded-script-contract-tests]] — 코드가 생성하는 셸 스크립트/systemd unit 문자열의 운영 계약을 단위테스트로 고정하는 패턴
- [[musl-cross-compile-openssl-libzfs]] — musl 정적빌드: openssl vendored로 해결 / libzfs-sys는 한계(CI 필요)
- [[openssl-sys-vendored-perl-deps]] — openssl-sys `vendored` 소스빌드가 요구하는 perl 모듈(RHEL/Rocky 최소 perl, `perl(모듈)` provides)
- [[utoipa-recursive-schema-no-recursion]] — 자기참조 ToSchema는 no_recursion 없으면 기동 시 stack overflow(빌드·테스트론 안 잡힘)
- [[form-urlencoded-space-plus-mangling]] — query 재직렬화가 %20→+ 변조, URL 수정은 raw 세그먼트 필터링으로
- [[route-inventory-syn-ast]] — 라우트 인벤토리를 정규식 대신 syn AST로 파싱, 표↔실등록 exact-set 비교로 CI 차단
- [[uds-http-shutdown-truncates-response]] — 유닉스 소켓에 HTTP를 직접 조립할 때 `shutdown(SHUT_WR)`을 부르면 hyper가 응답 전에 연결을 끊는다

---

## 관련

- [[lustre-overview]] — Lustre 백엔드(actix-web)에서 만난 사례들

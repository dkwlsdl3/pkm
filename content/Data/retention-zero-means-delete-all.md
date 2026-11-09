---
title: 보존기간 0 을 전량 삭제로 읽는 함수에 설정 기본값 0 이 흘러든다
tags:
  - tech
  - troubleshooting
created: 2026-11-09 (월)
---

# 보존기간 0 을 전량 삭제로 읽는 함수에 설정 기본값 0 이 흘러든다

> **TL;DR**: 정리 함수가 `retention_days <= 0` 을 「조건 없는 전량 DELETE」로 읽는다면, 그 함수에 값을 넘기는 경로를 전부 세라. 관리자의 「전체 삭제」와 주기 정리가 같은 함수를 쓰고 설정 컬럼이 `NOT NULL DEFAULT 0` 이면, **서비스가 뜨는 것만으로** 테이블이 비워진다. 범위를 타입으로 나눠 전량 삭제가 숫자 값으로 흘러들 수 없게 한다.

## 증상

- 아무도 삭제를 누르지 않았는데 로그·이력 테이블이 비어 있다
- 새 설치나 설정 초기화 직후에만 일어난다

## 원인

- 「0 = 전부」라는 특수값(sentinel)이 **두 경로에 공유**됐다: 의도된 전량 삭제 창구, 그리고 설정값을 그대로 넘기는 1시간 주기 정리
- 설정의 기본값이 0 이고, 주기 타이머의 첫 실행은 기동 직후다
- 지우는 대상이 「로그 4종」이 아니라 진단 이력·스크럽 이력·계정 생성 이력까지 **8개 테이블**이었다 — 함수 이름만 보고 피해 범위를 작게 읽기 쉽다

## 해결

```rust
use std::num::NonZeroU32;

pub enum CleanupScope {
    OlderThanDays(NonZeroU32), // 0 은 `ts < now()` 라 결국 전량과 같아지므로 타입으로 막는다
    All,                       // 관리자 창구에서만 만든다
}

// 주기 정리: 0·음수는 「비활성」으로 읽고 건너뛴다
fn scheduled_scope(setting: i64) -> Option<CleanupScope> {
    u32::try_from(setting).ok().and_then(NonZeroU32::new).map(CleanupScope::OlderThanDays)
}
```

- 판단부(`scheduled_scope`)는 **스케줄러 클로저 밖**의 함수로 뺀다. 클로저 안에 있으면 「0 이면 건너뛴다」를 시험이 실행할 수 없어, 막으려던 사고가 회귀 시험으로 잠기지 않는다
- 상한도 둔다. PostgreSQL `make_interval(days => n)` 은 `int4` 를 받지만 실제 실패는 타임스탬프 범위(약 246만 일)에서 나므로, 업무상 의미 있는 값(예: 36,500일)으로 자른다
- 창구는 음수·상한 초과에 400 을 돌려준다

---

## 관련

- [[fk-no-action-blocks-batch-cleanup]] — 이 정리를 한 트랜잭션으로 묶은 뒤 생긴 회귀
- [[mutation-check-test-effectiveness]] — 막으려던 사고를 시험이 실제로 잡는지, 구현을 되돌려 확인하는 법
- [[data-engineering-overview]]

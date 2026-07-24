---
title: SQL 뷰 경유 조회의 silent 컬럼 부재 함정
tags:
  - tech
created: 2026-07-16 (수)
---

# SQL 뷰 경유 조회의 silent 컬럼 부재 함정

> **TL;DR**: 코드가 DB **뷰**에서 행을 읽으면서 뷰가 노출하지 않는 컬럼을 `try_get(...).ok()` 같은 관용 폴백으로 꺼내면, 오류 대신 **조용히 None/기본값**이 되어 그 값에 걸린 분기 전체가 스킵된다. 컴파일러도 단위테스트도 못 잡는다. 뷰 스키마를 계약으로 검증하거나, 정본이 필요한 값은 base 테이블을 직접 JOIN해서 읽어라.

---

## 무엇이 잘못되나

두 가지 함정이 겹친다:

1. **컬럼 부재의 silent 처리** — `row.try_get("owner_id").ok().flatten()` 패턴은 "값이 NULL"과 "컬럼 자체가 없음"을 구분하지 않는다. 뷰에 그 컬럼이 없으면 항상 None → "소유자 없음"으로 오인 → 소유자 대상 처리(해제·정리·통지 등)가 통째로 건너뛰어진다.
2. **뷰 컬럼의 의미 표류** — 뷰가 `o.owner_name AS vm_name`처럼 base와 **다른 의미**를 같은 이름으로 노출하면, 코드는 이름만 보고 엉뚱한 값을 정본으로 쓴다.

```rust
// 안티패턴: 뷰(v_summary)를 읽으면서 base 컬럼을 관용 폴백으로 꺼냄
let row = sqlx::query(SELECT_FROM_VIEW_SQL).fetch_one(pool).await?;
let owner_id: Option<i64> = row.try_get("owner_id").ok().flatten(); // 뷰에 없음 → 항상 None
if let Some(id) = owner_id { release_resources(id).await?; }        // 영원히 실행 안 됨
destroy(...)                                                        // 릴리스 없이 파괴 강행
```

## 원칙

- **정본 값은 base 테이블에서**: 표시용 요약은 뷰로 읽더라도, 파괴/과금/권한 같은 결정에 쓰는 값은 base 테이블 JOIN으로 직접 조회한다.
- **컬럼 부재는 오류로**: 있어야 할 컬럼이면 `try_get(...)?`로 실패를 전파한다. 폴백(`ok()`/`unwrap_or_default()`)은 "없어도 진행이 안전"할 때만.
- **파괴 작업은 fail-closed**: 전제 단계(해제·정리)가 전부 성공했음을 확인한 뒤에만 파괴를 진행하고, 하나라도 실패하면 원상태 보존 + 재시도 가능하게 중단한다. fail-open이면 위 함정이 "조용한 스킵 → 파괴 강행"으로 증폭된다.
- **뷰 스키마 변경은 소비자 전수 조사와 세트**: 뷰에서 컬럼을 빼거나 별칭을 바꾸는 변경은 그 뷰를 읽는 코드 전부를 추적해야 한다(폴백 패턴이 있으면 grep으로 안 드러나는 소비자가 있다).

---

## 관련

- [[external-command-timeout-bulkhead]] — 같은 사건에서 나온 신뢰성 패턴(외부 명령 hang 격벽)
- [[compensation-saga-pitfalls]] — 프로비저닝 보상 설계 함정
- [[acid]] · [[data-engineering-overview]]

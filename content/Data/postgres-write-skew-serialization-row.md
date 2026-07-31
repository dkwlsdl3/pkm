---
title: write skew는 단일 행 FOR UPDATE 직렬화 지점으로 막는다
tags:
  - tech
created: 2026-07-31 (금)
---

# write skew는 단일 행 FOR UPDATE 직렬화 지점으로 막는다

> **TL;DR**: `INSERT ... WHERE NOT EXISTS (경쟁 행이 있는지)` 같은 조건은 **서로 다른 행을 쓰는 두 트랜잭션을 막지 못한다**(write skew). READ COMMITTED에서 둘 다 "경쟁자 없음"을 보고 통과한다. 리소스마다 **guard 행 하나**를 두고 그 행을 `SELECT ... FOR UPDATE`로 잠근 뒤 진행하면 직렬화 지점이 생긴다.

---

## 무엇이 잘못되나

배타적 점유를 "다른 활성 작업이 없으면 만든다"로 표현하는 흔한 패턴:

```sql
-- 안티패턴: 서로 다른 행을 INSERT하는 두 트랜잭션이 함께 통과한다
INSERT INTO operations (host, state, ...)
SELECT $1, 'active', ...
WHERE NOT EXISTS (
  SELECT 1 FROM operations WHERE host = $1 AND state = 'active'
);
```

- T1과 T2가 동시에 시작 → 각자 스냅샷에서 `NOT EXISTS`가 참
- 둘이 **서로 다른 새 행**을 쓰므로 행 잠금이 충돌하지 않는다
- 결과: 같은 호스트에 활성 작업 2개. 유니크 제약으로도 막기 어렵다(상태가 바뀌는 부분 조건이라)

이게 **write skew**다. 각 트랜잭션은 자기가 읽은 조건을 위반하지 않았지만, **함께 실행되면 불변식이 깨진다.** `SERIALIZABLE`이 아닌 격리 수준에서는 조건 검사가 잠금을 만들지 않기 때문이다.

## 해결: guard 행을 직렬화 지점으로 쓴다

리소스(호스트·테넌트·계좌 등)마다 **행 하나**를 미리 만들어 두고, 불변식을 건드리는 모든 경로가 그 행을 먼저 잠근다.

```sql
BEGIN;
-- 1) 직렬화 지점: 이 행을 잡은 트랜잭션만 진행한다
SELECT * FROM resource_guard WHERE resource_id = $1 FOR UPDATE;

-- 2) 이제 불변식 검사가 안전하다 (경쟁자는 여기서 대기 중)
--    ... NOT EXISTS 검사 / 상태 전이 / 새 작업 INSERT ...
COMMIT;
```

핵심은 **모든 경로**가 같은 행을 잠그는 것이다. 생성 경로만 잠그고 인수·해제·강제종료 경로가 안 잠그면 그 조합에서 다시 깨진다(실제로 그렇게 뚫린다 — 만료 lease를 탈취하는 경로가 **유효한 새 lease를 덮어쓰는** 형태로).

## guard 행이 담당하는 것 / 담당하지 않는 것

guard 행은 파생할 수 없는 것만 들고 있어야 한다.

| 역할 | 파생 가능? |
|---|---|
| **직렬화 지점** (`FOR UPDATE` 대상) | 불가 — 잠글 행이 실제로 있어야 한다 |
| **fencing token 발급기** (단조 증가 카운터) | 불가 |
| **격리·차단 플래그 보유** | 불가 |
| ~~현재 점유자 / 점유 만료시각~~ | **가능 — 작업 원장에서 파생하라** |

점유 상태를 guard에 따로 저장하면 작업 원장과 동기화해야 하고, 종료 경로마다 해제 코드가 필요해 **반드시 빠뜨린다**. → [[lease-derived-from-ledger]]

## CAS를 함께 쓴다

직렬화 지점만으로는 "늦게 도착한 이전 시도"를 막을 수 없다. 부작용 전후에 조건부 갱신(CAS)을 둔다.

```
의도 CAS  (부작용 직전): state='active' AND lease_expires_at > now() AND token = $expected
완료 CAS  (부작용 직후): effect_id = $expected
```

- **"CAS 0행 = 아무것도 쓰지 않았다"**가 성립하게 설계한다
- 그러면 재시도가 안전하고, 늦게 끝난 과거 시도가 새 결과를 덮지 않는다

## 상태 축을 섞지 말 것

"자동 판정 포기" 같은 상태를 결과(result) 축에 넣으면 terminal 정의·불변식·DB CHECK가 서로 충돌한다. **별도 축(non-terminal)**으로 두고 원래 진행 정보를 보존한다(조사 단서로 필요하다).

## 검증

- **실제 동시성 재현 테스트**를 쓴다. SQL 문자열에 `FOR UPDATE`가 있는지 검사하는 테스트는 실행 경로가 빠져도 통과한다 → [[mutation-check-test-effectiveness]]
- 값 도메인과 도달 가능 상태 조합을 **DB CHECK로 강제**한다. 컬럼이 자유 TEXT면 "N개 조합만 허용"은 주장일 뿐이고, 계약 밖 조합이 그대로 INSERT된다(실제로 그렇게 통과한다)
- 통합 테스트를 `#[ignore]`로 두면 `-- --ignored` 없이는 **조용히 skip**되어 검증이 실행되지 않은 채 green으로 보인다

## 시계 주의

만료 비교를 앱 시각이 아닌 DB `now()`로 하면 앱/DB 시계가 어긋난 환경에서 경계가 달라진다. 한쪽으로 통일하고 어느 쪽인지 문서에 남긴다.

---

## 관련

- [[lease-derived-from-ledger]] — 점유 상태를 원장에서 파생
- [[acid]] · [[db-oltp]] · [[sql-view-silent-column-absence-trap]]
- [[compensation-saga-pitfalls]] · [[mutation-check-test-effectiveness]]
- [[data-engineering-overview]]

---
title: 마이그레이션 중에도 다른 writer 는 계속 쓴다
tags:
  - tech
  - troubleshooting
created: 2026-07-31 (금)
---

# 마이그레이션 중에도 다른 writer 는 계속 쓴다

> **TL;DR**: 배포 파이프라인이 멈추는 것은 **애플리케이션 서버뿐**이다. 같은 테이블에 쓰는 **감시 데몬·수집기·다른 노드의 에이전트**는 계속 돈다. "중복 정리 → 유니크 인덱스 생성" 같은 마이그레이션은 그 사이에 **새 중복이 들어와** 인덱스 생성에서 실패한다. 정리가 오래 걸릴수록 확실히 실패한다.

## 증상

```
04:28:58  038 시작
04:41:12  DELETE 136,075          ← 12분 14초
04:41:12  ERROR: could not create unique index
          DETAIL: Key (owner_id, dns_address, interface_id)=(5, 8.8.8.8, null) is duplicated
```

- 로컬·스테이징에서는 통과하는데 **실제 배포에서만 실패**한다(데이터가 적고 writer가 안 돌기 때문)
- 재시도하면 또 실패한다. 실패 지점의 키 값이 매번 다르다

## 원인

### ① 정리가 느리다

중복 정리를 `IS NOT DISTINCT FROM` 자기조인으로 쓰면 인덱스를 못 타 **O(n²)** 가 된다 → [[is-not-distinct-from-index-pushout]]. 13만 행에서 12분이 걸린 사례가 있다.

### ② 그 12분 동안 다른 writer가 쓴다

CI는 백엔드만 정지시킨다. 그런데 이 테이블을 쓰는 것은 **감시 데몬과 각 노드의 수집 에이전트**다 — 배포 대상이 아니므로 멈추지 않는다.

🔴 **단일 트랜잭션이어도 막히지 않는다.** 기본 격리 수준(READ COMMITTED)에서는 **각 문장이 새 스냅샷을 본다.** 정리 문장이 끝난 뒤 인덱스 생성 문장이 시작될 때, 그 사이에 커밋된 새 행이 보인다.

증가 속도를 재면 실패가 확정적임을 알 수 있다 — **15분에 1,502행(초당 1.7행)** 이면 12분 창에서 재발하지 않을 수가 없다.

## 해결

```sql
BEGIN;
-- ① 경쟁 writer 를 트랜잭션 끝까지 대기시킨다
LOCK TABLE infra_dns_network_info IN EXCLUSIVE MODE;
--   EXCLUSIVE: INSERT/UPDATE/DELETE 는 대기, SELECT 는 통과
--   수집 라운드 한 번이 지연될 뿐이고 다음 주기에 정상 수집된다

-- ② 정리를 빠르게 — 윈도 함수(자기조인 금지)
DELETE FROM t USING (
  SELECT id, row_number() OVER (PARTITION BY a, b, c ORDER BY id DESC) rn FROM t
) d WHERE t.id = d.id AND d.rn > 1;

-- ③ 같은 트랜잭션에서 제약 생성
CREATE UNIQUE INDEX ... ;
COMMIT;
```

**잠금을 먼저 잡고 정리한다.** 순서가 반대면 정리 중에 들어온 행을 다시 잡아야 한다.

## 배포 전 점검

- 이 테이블에 쓰는 주체를 **전부** 센다. 애플리케이션 외에 데몬·에이전트·배치·다른 노드가 있는가
- CI가 멈추는 대상과 실제 writer 목록이 **일치하는가**
- 정리 대상 행수와 증가 속도를 **운영 데이터로** 재 본다. 로컬 행수로 소요를 추정하면 안 된다
- 잠금 시간이 서비스에 미치는 영향을 계산한다. 수집 지연 한 주기가 허용되는가

## 주의

> [!WARNING]
> `LOCK TABLE`은 **대기 시간이 곧 서비스 영향**이다. 정리가 12분 걸리는 상태 그대로 잠그면 12분간 쓰기가 막힌다. **정리를 빠르게 만드는 것과 잠그는 것은 함께 해야 한다** — 둘 중 하나만으로는 안전하지도, 빠르지도 않다.

> [!WARNING]
> 큰 테이블에서 `CREATE UNIQUE INDEX`는 무거운 작업이다. 잠금 없이 하려면 `CONCURRENTLY`가 있지만 **트랜잭션 안에서 못 쓰고**, 중복이 남아 있으면 무효 인덱스로 끝난다. 마이그레이션 파일에서는 잠금 방식이 단순하고 안전하다.

---

## 관련

- [[unique-index-null-semantics]] — 이 마이그레이션이 왜 필요했는가
- [[is-not-distinct-from-index-pushout]] — 정리가 O(n²)가 되는 이유
- [[migrations-replayed-in-full]] — 마이그레이션 재실행 모델의 함정
- [[dual-writer-no-owner-of-record]] — 여러 writer가 한 테이블을 쓸 때의 구조 문제

---
title: 읽고-비교하고-쓰는 상한은 초과를 허용한다
tags:
  - tech
  - troubleshooting
created: 2026-08-19 (수)
---

# 읽고-비교하고-쓰는 상한은 초과를 허용한다

> **TL;DR**: `SELECT count` → 애플리케이션에서 비교 → `UPDATE count+1` 세 걸음 사이에 다른 요청이 끼어들면 **상한을 넘겨서 통과한다.** 검사와 증가를 **한 문장으로** 합치고 갱신된 행 수로 판정하라.

## 증상

- 다운로드 횟수 상한이 10인데 **11번, 12번** 받아진 기록이 남는다
- 재고·쿼터·초대 인원 같은 다른 상한에서도 같은 초과가 보인다
- 부하가 낮을 때는 재현되지 않는다 — 동시 요청이 겹칠 때만 생긴다

## 원인

**검사(check)와 갱신(act) 사이에 틈이 있다.** TOCTOU(Time Of Check to Time Of Use) 의 전형이다.

```text
요청 A: SELECT count → 9        요청 B: SELECT count → 9
요청 A: 9 < 10 이므로 허용        요청 B: 9 < 10 이므로 허용
요청 A: UPDATE count = 10        요청 B: UPDATE count = 10   ← 둘 다 통과, 상한은 10인데 11번 받음
```

읽기가 트랜잭션 안에 있어도 해결되지 않는다. 기본 격리수준(READ COMMITTED)에서는 다른 트랜잭션의
커밋된 갱신이 그대로 보이고, 이 패턴은 **잃어버린 갱신(lost update)** 을 막아 주지 않는다.

## 해결

**조건을 SQL 문장 안으로 옮기고, 갱신된 행 수로 성패를 판정한다.**

```sql
UPDATE share_links
   SET download_count = download_count + 1
 WHERE token = $1
   AND (max_downloads IS NULL OR download_count < max_downloads)
RETURNING download_count;
```

```rust
let updated = sqlx::query(SQL).bind(token).fetch_optional(&pool).await?;
match updated {
    Some(_) => allow(),          // 원자적으로 증가에 성공
    None    => reject_limit(),   // 상한 초과 또는 없는 토큰
}
```

- 행이 안 잡히면 **상한 초과**다. 애플리케이션에서 다시 비교할 필요가 없다
- 잠금(`SELECT ... FOR UPDATE`)도 정답이지만 왕복이 하나 늘고 잠금 유지 구간이 길어진다
- 카운터를 올린 뒤 **실제 전송이 실패**하면 어떻게 할지는 별도 결정이다. 대개 "시작한 것도 한 번으로
  센다" 가 안전하다 — 되돌리면 재시도로 상한을 무한히 우회할 수 있다

---

## 관련

- [[partial-failure-is-not-success]]
- [[public-link-owner-lifecycle-gate]]

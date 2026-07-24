---
title: sqlx TIMESTAMPTZ → String 디코드 함정
tags:
  - tech
created: 2026-06-04 (목)
---

# sqlx TIMESTAMPTZ → String 디코드 함정

> **TL;DR**: PostgreSQL TIMESTAMPTZ 컬럼을 `Option<String>` 필드로 `try_get`하면 **에러 없이 항상 None** — 응답 구조체는 `Option<DateTime<Utc>>`로 선언해야 한다.

---

## 개요

- **무엇인가**: sqlx는 PG 타입과 Rust 타입의 매핑이 어긋나면 `try_get`이 `Err`를 반환하는데, `.ok()` 패턴과 결합하면 조용히 `None`이 된다
- **왜 문제인가**: 컴파일은 통과하고 런타임 에러도 없어서, 화면에 "값이 비어 보이는" 증상으로만 나타남 — 원인 추적이 프론트엔드부터 시작돼 멀리 돌아가기 쉬움
- **언제 의심하는가**: API 응답의 날짜/시각 필드가 항상 null·하이픈·빈칸일 때

---

## 핵심 개념

### 침묵하는 실패 패턴

```rust
// 구조체 (잘못된 선언)
pub struct Resource {
    pub created_at: Option<String>,   // ← DB는 TIMESTAMPTZ
}

// row 매핑 — try_get::<String>이 Err → .ok()가 None으로 삼킴
created_at: row.try_get("created_at").ok(),   // 항상 None!
```

### 교정

```rust
use chrono::{DateTime, Utc};

pub struct Resource {
    pub created_at: Option<DateTime<Utc>>,   // serde가 ISO 8601로 직렬화
}
```

- serde 직렬화 결과는 `"2026-06-04T05:24:23.473940Z"` 형태 — 프론트는 `new Date(iso)` 그대로 사용 가능
- `chrono` feature가 sqlx에 켜져 있어야 함 (`sqlx = { features = ["chrono"] }`)

---

## 주의사항

> [!WARNING]
> 한 타입 실수가 **여러 화면을 동시에** 죽일 수 있다. 실사례: 구조체 2개의 시각 필드가 String이라 ① 쿼터 요청일 하이픈 ② 저장소 '최근활동' 빈칸 ③ '최근활동순' 정렬 무력화가 한꺼번에 발생 — 전부 한 줄짜리 타입 교정으로 해결됐다.
> `try_get(...).ok()` / `.unwrap_or_default()` 패턴은 타입 불일치를 침묵시키므로, 시각·UUID 등 비문자열 컬럼은 반드시 구체 타입으로 받을 것.

---

## 관련

- [[rust-overview]]

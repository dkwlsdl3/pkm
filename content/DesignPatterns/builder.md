---
title: Builder
tags:
  - tech
  - design-pattern
  - creational
created: 2026-05-15 (목)
---

# Builder

> **TL;DR**: 복잡한 객체를 단계별로 조립한다 — 같은 생성 과정으로 다른 결과물을 만들 수 있다

---

## 문제: 언제 쓰나?

```python
# 문제: 파라미터가 너무 많은 생성자 (Telescoping Constructor)
user = User(
    name="홍길동",
    email="hong@example.com",
    age=30,
    address=None,        # 선택사항
    phone=None,          # 선택사항
    role="user",         # 기본값
    is_active=True,      # 기본값
    newsletter=False,    # 선택사항
)
```

- 어떤 파라미터가 뭘 의미하는지 불명확
- 선택 파라미터가 많아질수록 조합 폭발
- 생성자 오버로딩이 많아짐

→ **단계별로 설정값을 쌓아가다가 마지막에 build()** 로 완성

---

## 구조

```
Builder (설정 메서드들)
  .set_name()
  .set_email()
  .set_role()
  .build()  → Product (완성된 객체)
```

---

## 코드 예시

### Python — 메서드 체이닝 빌더

```python
class QueryBuilder:
    def __init__(self, table: str):
        self._table = table
        self._conditions = []
        self._columns = ["*"]
        self._limit = None
        self._order_by = None

    def select(self, *columns: str) -> "QueryBuilder":
        self._columns = list(columns)
        return self  # 체이닝을 위해 self 반환

    def where(self, condition: str) -> "QueryBuilder":
        self._conditions.append(condition)
        return self

    def order_by(self, column: str, direction: str = "ASC") -> "QueryBuilder":
        self._order_by = f"{column} {direction}"
        return self

    def limit(self, n: int) -> "QueryBuilder":
        self._limit = n
        return self

    def build(self) -> str:
        query = f"SELECT {', '.join(self._columns)} FROM {self._table}"
        if self._conditions:
            query += " WHERE " + " AND ".join(self._conditions)
        if self._order_by:
            query += f" ORDER BY {self._order_by}"
        if self._limit:
            query += f" LIMIT {self._limit}"
        return query


# 사용 — 메서드 체이닝
query = (
    QueryBuilder("users")
    .select("id", "name", "email")
    .where("is_active = true")
    .where("age > 18")
    .order_by("created_at", "DESC")
    .limit(10)
    .build()
)
# SELECT id, name, email FROM users WHERE is_active = true AND age > 18 ORDER BY created_at DESC LIMIT 10
```

### TypeScript — HTTP 요청 빌더

```typescript
class RequestBuilder {
    private url: string = "";
    private method: string = "GET";
    private headers: Record<string, string> = {};
    private body: unknown = null;

    setUrl(url: string): this {
        this.url = url;
        return this;
    }

    setMethod(method: string): this {
        this.method = method;
        return this;
    }

    setHeader(key: string, value: string): this {
        this.headers[key] = value;
        return this;
    }

    setBody(body: unknown): this {
        this.body = body;
        return this;
    }

    build(): Request {
        return new Request(this.url, {
            method: this.method,
            headers: this.headers,
            body: this.body ? JSON.stringify(this.body) : null,
        });
    }
}

const request = new RequestBuilder()
    .setUrl("https://api.example.com/users")
    .setMethod("POST")
    .setHeader("Content-Type", "application/json")
    .setHeader("Authorization", "Bearer <TOKEN>")
    .setBody({ name: "홍길동", email: "hong@example.com" })
    .build();
```

---

## 실전 사용 사례

| 사례 | 예시 |
|---|---|
| ORM 쿼리 빌더 | SQLAlchemy, TypeORM, Prisma |
| HTTP 클라이언트 | axios, fetch wrapper |
| 테스트 픽스처 | `UserBuilder().withRole("admin").build()` |
| 설정 객체 | `Config.builder().set(...).build()` |
| UI 컴포넌트 | Alert 다이얼로그 빌더 |

---

## 장단점

| 장점 | 단점 |
|---|---|
| 복잡한 객체 생성을 읽기 쉽게 | 간단한 객체엔 과도함 |
| 선택 파라미터를 자연스럽게 처리 | Builder 클래스 추가 필요 |
| 불완전한 객체 생성 방지 (build()에서 검증) | |
| 같은 과정으로 다른 결과 생성 가능 | |

---

## 관련

- [[factory-method]]
- [[design-patterns-overview]]

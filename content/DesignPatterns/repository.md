---
title: Repository
tags:
  - tech
  - design-pattern
  - architectural
created: 2026-05-15 (목)
---

# Repository

> **TL;DR**: 데이터 접근 로직을 비즈니스 로직에서 분리한다 — 데이터가 어디서 오든 비즈니스 로직은 모른다

---

## 문제: 언제 쓰나?

```python
# 문제: 비즈니스 로직에 DB 코드가 섞임
def get_active_users_with_orders():
    conn = sqlite3.connect("app.db")
    cursor = conn.cursor()
    cursor.execute("""
        SELECT u.*, COUNT(o.id) as order_count
        FROM users u
        LEFT JOIN orders o ON u.id = o.user_id
        WHERE u.is_active = 1
        GROUP BY u.id
    """)
    rows = cursor.fetchall()
    conn.close()
    # 비즈니스 로직과 DB 로직이 섞여있음
    return [User(*row) for row in rows if row[-1] > 0]
```

- DB 교체(SQLite → PostgreSQL)하면 비즈니스 코드까지 수정
- 테스트 시 실제 DB가 필요함
- 같은 쿼리가 여러 곳에 중복

---

## 구조

```
Service Layer (비즈니스 로직)
    ↓ 인터페이스만 알고 있음
Repository Interface
    ├─ SQLRepository (실제 DB)
    ├─ InMemoryRepository (테스트용)
    └─ CacheRepository (캐시 레이어)
```

---

## 코드 예시

### Python

```python
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import List, Optional
from datetime import datetime

@dataclass
class User:
    id: str
    name: str
    email: str
    is_active: bool
    created_at: datetime


# 리포지토리 인터페이스
class UserRepository(ABC):
    @abstractmethod
    def find_by_id(self, user_id: str) -> Optional[User]:
        pass

    @abstractmethod
    def find_all_active(self) -> List[User]:
        pass

    @abstractmethod
    def save(self, user: User) -> User:
        pass

    @abstractmethod
    def delete(self, user_id: str) -> None:
        pass


# 실제 DB 구현
class SQLUserRepository(UserRepository):
    def __init__(self, connection):
        self._conn = connection

    def find_by_id(self, user_id: str) -> Optional[User]:
        cursor = self._conn.cursor()
        cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        row = cursor.fetchone()
        return User(*row) if row else None

    def find_all_active(self) -> List[User]:
        cursor = self._conn.cursor()
        cursor.execute("SELECT * FROM users WHERE is_active = 1")
        return [User(*row) for row in cursor.fetchall()]

    def save(self, user: User) -> User:
        cursor = self._conn.cursor()
        cursor.execute(
            "INSERT OR REPLACE INTO users VALUES (?, ?, ?, ?, ?)",
            (user.id, user.name, user.email, user.is_active, user.created_at)
        )
        self._conn.commit()
        return user

    def delete(self, user_id: str) -> None:
        self._conn.execute("DELETE FROM users WHERE id = ?", (user_id,))
        self._conn.commit()


# 테스트용 인메모리 구현
class InMemoryUserRepository(UserRepository):
    def __init__(self):
        self._store: dict[str, User] = {}

    def find_by_id(self, user_id: str) -> Optional[User]:
        return self._store.get(user_id)

    def find_all_active(self) -> List[User]:
        return [u for u in self._store.values() if u.is_active]

    def save(self, user: User) -> User:
        self._store[user.id] = user
        return user

    def delete(self, user_id: str) -> None:
        self._store.pop(user_id, None)


# 비즈니스 로직 — DB를 전혀 모름
class UserService:
    def __init__(self, repo: UserRepository):
        self._repo = repo  # 인터페이스에만 의존

    def deactivate_inactive_users(self, days: int) -> int:
        """마지막 로그인 후 n일 지난 사용자 비활성화"""
        active_users = self._repo.find_all_active()
        deactivated = 0
        for user in active_users:
            # 비즈니스 규칙
            if (datetime.now() - user.created_at).days > days:
                user.is_active = False
                self._repo.save(user)
                deactivated += 1
        return deactivated

    def get_user(self, user_id: str) -> Optional[User]:
        user = self._repo.find_by_id(user_id)
        if not user:
            raise ValueError(f"사용자 없음: {user_id}")
        return user


# 프로덕션
import sqlite3
conn = sqlite3.connect("app.db")
service = UserService(SQLUserRepository(conn))

# 테스트 — DB 없이
test_repo = InMemoryUserRepository()
test_repo.save(User("1", "홍길동", "hong@test.com", True, datetime.now()))
test_service = UserService(test_repo)
```

### TypeScript

```typescript
interface UserRepository {
    findById(id: string): Promise<User | null>;
    findAllActive(): Promise<User[]>;
    save(user: User): Promise<User>;
    delete(id: string): Promise<void>;
}

// Prisma 구현
class PrismaUserRepository implements UserRepository {
    constructor(private prisma: PrismaClient) {}

    async findById(id: string): Promise<User | null> {
        return this.prisma.user.findUnique({ where: { id } });
    }

    async findAllActive(): Promise<User[]> {
        return this.prisma.user.findMany({ where: { isActive: true } });
    }

    async save(user: User): Promise<User> {
        return this.prisma.user.upsert({
            where: { id: user.id },
            update: user,
            create: user,
        });
    }

    async delete(id: string): Promise<void> {
        await this.prisma.user.delete({ where: { id } });
    }
}
```

---

## 실전 사용 사례

| 사례 | 설명 |
|---|---|
| ORM과 결합 | SQLAlchemy, TypeORM, Prisma를 래핑 |
| 멀티 데이터소스 | DB + Redis + Elasticsearch를 통합 |
| 테스트 | InMemory 구현으로 단위 테스트 |
| 마이크로서비스 | 서비스별 독립적인 데이터 접근 |
| CQRS | Read/Write 리포지토리 분리 |

---

## 장단점

| 장점 | 단점 |
|---|---|
| 비즈니스 로직이 DB 기술에 독립적 | 추가 레이어로 코드 증가 |
| DB 교체가 리포지토리만 바꾸면 됨 | 단순 CRUD에 과도할 수 있음 |
| InMemory로 빠른 단위 테스트 가능 | |
| 데이터 접근 코드 중앙화 | |

---

## 관련

- [[dependency-injection]]
- [[facade]]
- [[design-patterns-overview]]

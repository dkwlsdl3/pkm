---
title: Singleton
tags:
  - tech
  - design-pattern
  - creational
created: 2026-05-15 (목)
---

# Singleton

> **TL;DR**: 클래스의 인스턴스를 오직 1개만 생성하고, 전역 접근점을 제공한다

---

## 문제: 언제 쓰나?

- DB 커넥션 풀을 여러 곳에서 각자 만들면 리소스 낭비 + 연결 폭발
- 로거(Logger)를 곳곳에서 new 하면 설정이 제각각
- 앱 설정(Config)이 여러 인스턴스로 흩어지면 일관성 깨짐

→ **"이 객체는 딱 1개만 있어야 한다"** 는 요구사항

---

## 구조

```
Client → Singleton.getInstance() → 항상 같은 인스턴스 반환
                                    (없으면 생성, 있으면 기존 것)
```

---

## 코드 예시

### Python — 가장 단순한 방법 (모듈 수준)

```python
# logger.py — 파이썬에서 모듈 자체가 싱글턴
import logging

logger = logging.getLogger("app")
logger.setLevel(logging.INFO)

# 어디서든 import logger → 같은 객체
```

### Python — 클래스로 구현

```python
class DatabaseConnection:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._connect()
        return cls._instance

    def _connect(self):
        print("DB 연결 생성 (최초 1회)")
        self.connection = "connected"

# 사용
db1 = DatabaseConnection()
db2 = DatabaseConnection()
print(db1 is db2)  # True — 같은 객체
```

### TypeScript

```typescript
class Config {
    private static instance: Config;
    private settings: Record<string, string> = {};

    private constructor() {
        // 외부에서 new Config() 불가
        this.settings = { env: "production", debug: "false" };
    }

    static getInstance(): Config {
        if (!Config.instance) {
            Config.instance = new Config();
        }
        return Config.instance;
    }

    get(key: string): string {
        return this.settings[key];
    }
}

const config = Config.getInstance();
```

---

## 실전 사용 사례

| 사례 | 설명 |
|---|---|
| DB 커넥션 풀 | SQLAlchemy `create_engine()`, Prisma Client |
| 로거 | `logging.getLogger()` — 이름 같으면 같은 인스턴스 |
| 앱 설정 | 환경변수 파싱 결과를 전역 공유 |
| 캐시 인스턴스 | Redis 클라이언트 |
| 이벤트 버스 | 앱 전체 이벤트 허브 |

---

## 장단점

| 장점 | 단점 |
|---|---|
| 인스턴스 1개 보장 | 전역 상태 → 숨겨진 의존성 |
| 어디서든 접근 가능 | 테스트 어려움 (Mock 교체 힘듦) |
| 리소스 절약 | 멀티스레드 환경에서 Race Condition 주의 |

> 💡 **DI(의존성 주입)** 와 함께 쓰면 단점 대부분 해결 — 싱글턴이지만 인터페이스로 주입해 테스트 시 Mock 교체 가능

---

## 관련

- [[factory-method]]
- [[dependency-injection]]
- [[design-patterns-overview]]

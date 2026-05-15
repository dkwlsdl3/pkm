---
title: Decorator
tags:
  - tech
  - design-pattern
  - structural
created: 2026-05-15 (목)
---

# Decorator

> **TL;DR**: 객체를 래핑해서 기능을 동적으로 추가한다 — 상속 없이 기능 확장

---

## 문제: 언제 쓰나?

```python
# 문제: 기능 조합마다 서브클래스를 만들면 클래스 폭발
class TextMessage: ...
class LoggedTextMessage(TextMessage): ...       # 로깅 추가
class CachedTextMessage(TextMessage): ...       # 캐싱 추가
class LoggedCachedTextMessage(TextMessage): ... # 둘 다 — 조합 폭발!
```

- 기존 클래스를 수정하지 않고 기능을 추가하고 싶을 때
- 기능을 런타임에 조합해야 할 때
- 상속으로 풀면 클래스가 너무 많아질 때

---

## 구조

```
Component (인터페이스)
  ├─ ConcreteComponent (실제 구현)
  └─ Decorator (Component를 감싸고 같은 인터페이스 구현)
       └─ ConcreteDecorator (추가 기능 구현)
```

---

## 코드 예시

### Python — 함수 데코레이터 (가장 흔한 형태)

```python
import time
import functools

# 로깅 데코레이터
def log(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        print(f"호출: {func.__name__}({args}, {kwargs})")
        result = func(*args, **kwargs)
        print(f"반환: {result}")
        return result
    return wrapper

# 타이밍 데코레이터
def timer(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        start = time.time()
        result = func(*args, **kwargs)
        elapsed = time.time() - start
        print(f"{func.__name__} 실행 시간: {elapsed:.3f}초")
        return result
    return wrapper

# 재시도 데코레이터
def retry(max_attempts=3):
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            for attempt in range(max_attempts):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    if attempt == max_attempts - 1:
                        raise
                    print(f"재시도 {attempt + 1}/{max_attempts}: {e}")
        return wrapper
    return decorator

# 조합 — 데코레이터를 쌓아서 기능 추가
@log
@timer
@retry(max_attempts=3)
def fetch_data(url: str) -> dict:
    # 실제 API 호출
    return {"data": "..."}

fetch_data("https://api.example.com/data")
```

### Python — 클래스 데코레이터 패턴

```python
from abc import ABC, abstractmethod

class DataProcessor(ABC):
    @abstractmethod
    def process(self, data: str) -> str:
        pass

# 실제 구현
class CSVProcessor(DataProcessor):
    def process(self, data: str) -> str:
        return f"CSV 파싱: {data}"

# 데코레이터 베이스
class ProcessorDecorator(DataProcessor):
    def __init__(self, wrapped: DataProcessor):
        self._wrapped = wrapped

    def process(self, data: str) -> str:
        return self._wrapped.process(data)

# 로깅 데코레이터
class LoggingDecorator(ProcessorDecorator):
    def process(self, data: str) -> str:
        print(f"처리 시작: {len(data)}자")
        result = self._wrapped.process(data)
        print(f"처리 완료")
        return result

# 압축 데코레이터
class CompressionDecorator(ProcessorDecorator):
    def process(self, data: str) -> str:
        compressed = data[:10] + "..."  # 가정
        return self._wrapped.process(compressed)

# 조합 — 런타임에 기능 추가
processor = CSVProcessor()
processor = LoggingDecorator(processor)    # 로깅 추가
processor = CompressionDecorator(processor)  # 압축 추가

processor.process("a,b,c,d,e")
```

---

## 실전 사용 사례

| 사례 | 설명 |
|---|---|
| Python `@decorator` | `@login_required`, `@cache`, `@retry` |
| Express 미들웨어 | `app.use(logger)`, `app.use(auth)` |
| Java Spring `@Transactional` | 메서드에 트랜잭션 기능 추가 |
| 스트림 래핑 | `BufferedReader(FileReader(...))` |
| React HOC | `withAuth(MyComponent)` |

---

## 장단점

| 장점 | 단점 |
|---|---|
| 클래스 수정 없이 기능 추가 (OCP) | 데코레이터 순서가 중요 (헷갈릴 수 있음) |
| 기능을 런타임에 조합 가능 | 너무 많이 쌓으면 디버깅 어려움 |
| 상속보다 유연 | 데코레이터가 많아지면 복잡도 증가 |

---

## 관련

- [[adapter]]
- [[proxy]]
- [[chain-of-responsibility]]
- [[design-patterns-overview]]

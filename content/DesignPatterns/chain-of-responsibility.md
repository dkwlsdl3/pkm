---
title: Chain of Responsibility
tags:
  - tech
  - design-pattern
  - behavioral
created: 2026-05-15 (금)
---

# Chain of Responsibility

> **TL;DR**: 요청을 처리할 수 있는 핸들러를 체인으로 연결한다 — 각 핸들러는 처리하거나 다음으로 넘긴다

---

## 문제: 언제 쓰나?

```python
# 문제: 요청 검증 단계가 많아질수록 함수가 비대해짐
def handle_request(request):
    # 인증 확인
    if not request.token:
        return 401
    user = validate_token(request.token)
    if not user:
        return 401

    # 권한 확인
    if not user.has_permission(request.resource):
        return 403

    # Rate Limit 확인
    if rate_limiter.is_exceeded(user.id):
        return 429

    # 입력값 검증
    if not validate_input(request.body):
        return 400

    # 실제 처리
    return process(request)
```

→ 단계마다 독립적인 핸들러로 분리하고, 체인으로 연결

---

## 구조

```
Client → Handler1 → Handler2 → Handler3 → (처리 완료 또는 null)
           ↓            ↓           ↓
        처리 or      처리 or     처리 or
        다음으로      다음으로     중단
```

---

## 코드 예시

### Python — HTTP 미들웨어 체인

```python
from abc import ABC, abstractmethod
from typing import Optional, Callable

class Request:
    def __init__(self, token: str, user_id: str, body: dict):
        self.token = token
        self.user_id = user_id
        self.body = body
        self.user = None  # 인증 후 채워짐

class Response:
    def __init__(self, status: int, body: str):
        self.status = status
        self.body = body

class Handler(ABC):
    def __init__(self):
        self._next: Optional["Handler"] = None

    def set_next(self, handler: "Handler") -> "Handler":
        self._next = handler
        return handler  # 체이닝 가능하게

    def handle(self, request: Request) -> Response:
        if self._next:
            return self._next.handle(request)
        return Response(200, "OK")  # 체인 끝 — 성공

    @abstractmethod
    def _process(self, request: Request) -> Optional[Response]:
        """처리 불가 시 None 반환 → 다음으로"""
        pass

    def handle(self, request: Request) -> Response:
        result = self._process(request)
        if result:
            return result  # 이 핸들러에서 처리 (거부)
        if self._next:
            return self._next.handle(request)
        return Response(200, "처리 완료")


class AuthHandler(Handler):
    def _process(self, request: Request) -> Optional[Response]:
        if not request.token:
            return Response(401, "인증 토큰 없음")
        if request.token != "<VALID_TOKEN>":
            return Response(401, "유효하지 않은 토큰")
        request.user = {"id": request.user_id, "role": "user"}
        return None  # 다음으로


class RateLimitHandler(Handler):
    def __init__(self, limit: int = 100):
        super().__init__()
        self._counts: dict = {}
        self._limit = limit

    def _process(self, request: Request) -> Optional[Response]:
        user_id = request.user_id
        self._counts[user_id] = self._counts.get(user_id, 0) + 1
        if self._counts[user_id] > self._limit:
            return Response(429, f"요청 한도 초과 ({self._limit}/분)")
        return None


class ValidationHandler(Handler):
    def _process(self, request: Request) -> Optional[Response]:
        if not request.body:
            return Response(400, "요청 바디가 비어있음")
        return None


# 체인 구성
auth = AuthHandler()
rate_limit = RateLimitHandler(limit=100)
validation = ValidationHandler()

auth.set_next(rate_limit).set_next(validation)

# 사용
req = Request(token="<VALID_TOKEN>", user_id="u1", body={"data": "..."})
response = auth.handle(req)
print(f"{response.status}: {response.body}")
```

### Python — 로그 레벨 체인

```python
class Logger(ABC):
    DEBUG, INFO, WARNING, ERROR = 1, 2, 3, 4

    def __init__(self, level: int):
        self._level = level
        self._next: Optional["Logger"] = None

    def set_next(self, logger: "Logger") -> "Logger":
        self._next = logger
        return logger

    def log(self, level: int, message: str) -> None:
        if level >= self._level:
            self._write(message)
        if self._next:
            self._next.log(level, message)

    @abstractmethod
    def _write(self, message: str) -> None:
        pass

class ConsoleLogger(Logger):
    def _write(self, message: str) -> None:
        print(f"[CONSOLE] {message}")

class FileLogger(Logger):
    def _write(self, message: str) -> None:
        print(f"[FILE] {message}")

class SlackLogger(Logger):
    def _write(self, message: str) -> None:
        print(f"[SLACK 알림] {message}")

# 체인: DEBUG 이상 → 콘솔, WARNING 이상 → 파일, ERROR → 슬랙
console = ConsoleLogger(Logger.DEBUG)
file = FileLogger(Logger.WARNING)
slack = SlackLogger(Logger.ERROR)

console.set_next(file).set_next(slack)

console.log(Logger.DEBUG, "디버그 메시지")    # 콘솔만
console.log(Logger.WARNING, "경고 발생!")     # 콘솔 + 파일
console.log(Logger.ERROR, "오류 발생!")       # 콘솔 + 파일 + 슬랙
```

---

## 실전 사용 사례

| 사례 | 설명 |
|---|---|
| HTTP 미들웨어 | Express, FastAPI — 인증/검증/로깅 체인 |
| 이벤트 버블링 | DOM 이벤트가 부모로 전파 |
| 로그 처리 | 레벨별 핸들러 체인 |
| 승인 시스템 | 팀장 → 부장 → 임원 순 결재 |
| 캐시 레이어 | L1 캐시 → L2 캐시 → DB |

---

## 장단점

| 장점 | 단점 |
|---|---|
| 핸들러를 독립적으로 추가/제거 | 요청이 처리되지 않을 수 있음 |
| 처리 순서를 런타임에 변경 가능 | 체인이 길면 디버깅 어려움 |
| 단일 책임 원칙 — 각 핸들러가 한 가지만 | 성능 오버헤드 |

---

## 관련

- [[decorator]]
- [[observer]]
- [[design-patterns-overview]]

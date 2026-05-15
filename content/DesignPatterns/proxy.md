---
title: Proxy
tags:
  - tech
  - design-pattern
  - structural
created: 2026-05-15 (목)
---

# Proxy

> **TL;DR**: 실제 객체 대신 대리인이 앞에서 접근을 제어한다 — 지연 로딩, 캐싱, 접근 제어

---

## 문제: 언제 쓰나?

- 무거운 객체를 실제로 필요할 때까지 생성을 미루고 싶을 때 (지연 로딩)
- 같은 요청이 자주 오면 캐시해서 비용 절약
- 접근 권한 검사를 객체 앞에 두고 싶을 때
- 원격 서버의 객체를 로컬에서 쓰는 것처럼 사용하고 싶을 때

---

## 구조

```
Client → Proxy (실제 객체와 같은 인터페이스)
           └─ RealSubject (실제 객체, 필요할 때 생성/호출)
```

---

## 코드 예시

### 1. 캐싱 프록시

```python
from abc import ABC, abstractmethod
from typing import Optional
import time

class WeatherService(ABC):
    @abstractmethod
    def get_temperature(self, city: str) -> float:
        pass

# 실제 서비스 (느리고 비쌈)
class RealWeatherService(WeatherService):
    def get_temperature(self, city: str) -> float:
        print(f"외부 API 호출: {city} 날씨 조회 (200ms...)")
        time.sleep(0.2)  # 실제 API 호출 시뮬레이션
        return 23.5

# 캐싱 프록시
class CachingWeatherProxy(WeatherService):
    def __init__(self, service: WeatherService, ttl: int = 60):
        self._service = service
        self._cache: dict = {}
        self._cache_time: dict = {}
        self._ttl = ttl  # 캐시 유효 시간(초)

    def get_temperature(self, city: str) -> float:
        now = time.time()
        # 캐시 히트
        if city in self._cache and (now - self._cache_time[city]) < self._ttl:
            print(f"캐시 히트: {city}")
            return self._cache[city]

        # 캐시 미스 → 실제 서비스 호출
        result = self._service.get_temperature(city)
        self._cache[city] = result
        self._cache_time[city] = now
        return result


weather = CachingWeatherProxy(RealWeatherService())
print(weather.get_temperature("서울"))  # API 호출
print(weather.get_temperature("서울"))  # 캐시 히트
```

### 2. 지연 로딩 프록시

```python
class HeavyReport:
    def __init__(self):
        print("무거운 리포트 로딩 중... (5초)")
        time.sleep(5)  # 무거운 초기화
        self.data = "리포트 데이터"

    def display(self):
        print(self.data)

# 지연 로딩 프록시 — 실제로 필요할 때 생성
class LazyReportProxy:
    def __init__(self):
        self._report: Optional[HeavyReport] = None  # 아직 생성 안 함

    def display(self):
        if self._report is None:
            self._report = HeavyReport()  # 첫 호출 시 생성
        self._report.display()


proxy = LazyReportProxy()  # 즉시 반환 (무거운 로딩 없음)
# ... 다른 작업 ...
proxy.display()  # 여기서 실제 생성
```

### 3. 접근 제어 프록시

```python
class SecureFileSystem:
    def __init__(self, real_fs, user_role: str):
        self._fs = real_fs
        self._role = user_role

    def delete(self, path: str) -> None:
        if self._role != "admin":
            raise PermissionError(f"{self._role}는 삭제 권한 없음")
        self._fs.delete(path)

    def read(self, path: str) -> str:
        return self._fs.read(path)  # 읽기는 누구나 가능
```

---

## 실전 사용 사례

| 프록시 종류 | 사례 |
|---|---|
| **캐싱 프록시** | Redis 캐시 레이어, HTTP 캐시 |
| **지연 로딩** | ORM Lazy Loading (`user.posts`가 실제 쿼리 시점에 로드) |
| **접근 제어** | 권한 검사 미들웨어 |
| **원격 프록시** | gRPC stub, REST API 클라이언트 |
| **로깅 프록시** | 모든 메서드 호출 기록 |

---

## 장단점

| 장점 | 단점 |
|---|---|
| 실제 객체 수정 없이 부가 기능 추가 | 응답 지연이 생길 수 있음 |
| 지연 로딩으로 성능 최적화 | 구조 복잡도 증가 |
| 접근 제어 중앙화 | |

> 💡 Decorator vs Proxy: Decorator는 **기능 추가** 목적, Proxy는 **접근 제어/최적화** 목적

---

## 관련

- [[decorator]]
- [[adapter]]
- [[facade]]
- [[design-patterns-overview]]

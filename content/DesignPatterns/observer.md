---
title: Observer
tags:
  - tech
  - design-pattern
  - behavioral
created: 2026-05-15 (목)
---

# Observer

> **TL;DR**: 객체의 상태 변화를 구독한 모든 객체에게 자동으로 알린다 — 이벤트 기반 프로그래밍의 핵심

---

## 문제: 언제 쓰나?

```python
# 문제: 주문 완료 시 여러 곳에 알려야 함
def complete_order(order):
    order.status = "completed"

    # 이메일 알림
    EmailService().send_confirmation(order.user_email)

    # 재고 차감
    InventoryService().reduce(order.items)

    # 포인트 적립
    PointService().add(order.user_id, order.total * 0.01)

    # 통계 업데이트
    AnalyticsService().record(order)
```

- 새로운 처리를 추가할 때마다 `complete_order` 수정 필요
- 주문 로직과 알림 로직이 강하게 결합
- 테스트할 때 모든 서비스를 다 세팅해야 함

→ **"이 이벤트가 발생했을 때 관심 있는 쪽에서 알아서 처리"** 구조가 필요

---

## 구조

```
Subject (Observable)
  - observers 목록 관리
  - subscribe(), unsubscribe()
  - notify() → 모든 observer에게 전달

Observer (구독자)
  - update(event) 메서드 구현
```

---

## 코드 예시

### Python — 이벤트 버스

```python
from typing import Callable, Dict, List, Any

class EventBus:
    """간단한 이벤트 버스"""
    def __init__(self):
        self._handlers: Dict[str, List[Callable]] = {}

    def subscribe(self, event: str, handler: Callable) -> None:
        if event not in self._handlers:
            self._handlers[event] = []
        self._handlers[event].append(handler)

    def unsubscribe(self, event: str, handler: Callable) -> None:
        if event in self._handlers:
            self._handlers[event].remove(handler)

    def publish(self, event: str, data: Any = None) -> None:
        for handler in self._handlers.get(event, []):
            handler(data)


# 이벤트 버스 (싱글턴으로 사용)
bus = EventBus()

# 구독자들 — 주문 도메인과 완전히 분리
def send_confirmation_email(order):
    print(f"이메일 발송: {order['user_email']}")

def reduce_inventory(order):
    print(f"재고 차감: {order['items']}")

def add_points(order):
    print(f"포인트 적립: {order['total'] * 0.01}점")

bus.subscribe("order.completed", send_confirmation_email)
bus.subscribe("order.completed", reduce_inventory)
bus.subscribe("order.completed", add_points)

# 주문 완료 — 이제 단순하게
def complete_order(order):
    order["status"] = "completed"
    bus.publish("order.completed", order)  # 구독자들이 알아서 처리

# 새 기능 추가 = subscribe 한 줄 추가, complete_order 수정 없음
bus.subscribe("order.completed", lambda o: print(f"통계 기록: {o['id']}"))

complete_order({"id": "ord_1", "user_email": "a@b.com", "items": [], "total": 50000})
```

### Python — 클래스 기반 Observer

```python
from abc import ABC, abstractmethod

class Observer(ABC):
    @abstractmethod
    def update(self, event: str, data: dict) -> None:
        pass

class Subject:
    def __init__(self):
        self._observers: list[Observer] = []

    def attach(self, observer: Observer) -> None:
        self._observers.append(observer)

    def detach(self, observer: Observer) -> None:
        self._observers.remove(observer)

    def notify(self, event: str, data: dict) -> None:
        for observer in self._observers:
            observer.update(event, data)

class StockMonitor(Subject):
    def __init__(self, symbol: str):
        super().__init__()
        self._symbol = symbol
        self._price = 0.0

    @property
    def price(self):
        return self._price

    @price.setter
    def price(self, new_price: float):
        old_price = self._price
        self._price = new_price
        self.notify("price_changed", {
            "symbol": self._symbol,
            "old": old_price,
            "new": new_price
        })

class AlertObserver(Observer):
    def __init__(self, threshold: float):
        self._threshold = threshold

    def update(self, event: str, data: dict) -> None:
        if data["new"] > self._threshold:
            print(f"⚠️ {data['symbol']} 가격 급등! {data['new']}원")

# 사용
samsung = StockMonitor("005930")
samsung.attach(AlertObserver(threshold=80000))
samsung.attach(AlertObserver(threshold=90000))

samsung.price = 75000   # 알림 없음
samsung.price = 85000   # 첫 번째 알림
samsung.price = 95000   # 두 알림 모두
```

---

## 실전 사용 사례

| 사례 | 설명 |
|---|---|
| DOM 이벤트 | `element.addEventListener("click", handler)` |
| React 상태 | `useState`, `useEffect` — 상태 변화 구독 |
| Redux | Store 변화를 컴포넌트가 구독 |
| RxJS | Observable 스트림 구독 |
| 메시지 큐 | Kafka, RabbitMQ 토픽 구독 |
| WebSocket | 서버 이벤트 실시간 수신 |

---

## 장단점

| 장점 | 단점 |
|---|---|
| 발행자와 구독자의 느슨한 결합 | 구독자가 많으면 순서 예측 어려움 |
| 새 구독자 추가 시 기존 코드 수정 없음 | 메모리 누수 (구독 해제 안 하면) |
| 런타임에 구독/해제 가능 | 디버깅 어려움 (이벤트 흐름 추적) |

---

## 관련

- [[strategy]]
- [[command]]
- [[chain-of-responsibility]]
- [[design-patterns-overview]]

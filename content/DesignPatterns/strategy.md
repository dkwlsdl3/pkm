---
title: Strategy
tags:
  - tech
  - design-pattern
  - behavioral
created: 2026-05-15 (금)
---

# Strategy

> **TL;DR**: 알고리즘을 캡슐화해서 런타임에 교체 가능하게 한다 — if-else 지옥을 탈출

---

## 문제: 언제 쓰나?

```python
# 문제: 결제 방식마다 if-else
def process_payment(method, amount):
    if method == "card":
        # 카드 결제 로직 50줄
        validate_card(...)
        charge_card(...)
    elif method == "kakao":
        # 카카오페이 로직 40줄
        get_kakao_token(...)
        request_kakao_payment(...)
    elif method == "toss":
        # 토스 로직 45줄
        ...
    elif method == "bank":
        # 무통장 로직
        ...
    # 새 결제 수단 추가 = 이 함수 수정
```

- 새 알고리즘 추가마다 기존 코드 수정 (OCP 위반)
- 하나의 함수/클래스가 너무 많은 알고리즘을 알고 있음
- 테스트 시 특정 알고리즘만 독립적으로 테스트 불가

---

## 구조

```
Context (전략을 사용하는 쪽)
  - strategy: Strategy 인터페이스 참조
  - set_strategy() — 런타임에 교체 가능
  - execute() — strategy.algorithm() 호출

Strategy (인터페이스)
  └─ ConcreteStrategyA / B / C
```

---

## 코드 예시

### Python — 정렬 전략

```python
from abc import ABC, abstractmethod
from typing import List

class SortStrategy(ABC):
    @abstractmethod
    def sort(self, data: List[int]) -> List[int]:
        pass

class BubbleSort(SortStrategy):
    def sort(self, data: List[int]) -> List[int]:
        arr = data.copy()
        n = len(arr)
        for i in range(n):
            for j in range(n - i - 1):
                if arr[j] > arr[j + 1]:
                    arr[j], arr[j + 1] = arr[j + 1], arr[j]
        return arr

class QuickSort(SortStrategy):
    def sort(self, data: List[int]) -> List[int]:
        if len(data) <= 1:
            return data
        pivot = data[len(data) // 2]
        left = [x for x in data if x < pivot]
        mid = [x for x in data if x == pivot]
        right = [x for x in data if x > pivot]
        return self.sort(left) + mid + self.sort(right)

class Sorter:
    def __init__(self, strategy: SortStrategy):
        self._strategy = strategy

    def set_strategy(self, strategy: SortStrategy) -> None:
        self._strategy = strategy  # 런타임에 교체

    def sort(self, data: List[int]) -> List[int]:
        return self._strategy.sort(data)

# 사용
sorter = Sorter(QuickSort())
result = sorter.sort([3, 1, 4, 1, 5, 9, 2, 6])

# 런타임에 전략 교체
sorter.set_strategy(BubbleSort())
result = sorter.sort([3, 1, 4, 1, 5])
```

### Python — 결제 전략

```python
class PaymentStrategy(ABC):
    @abstractmethod
    def pay(self, amount: int) -> bool:
        pass

class CardPayment(PaymentStrategy):
    def __init__(self, card_number: str):
        self._card = card_number

    def pay(self, amount: int) -> bool:
        print(f"카드({self._card[-4:]}) {amount:,}원 결제")
        return True

class KakaoPayPayment(PaymentStrategy):
    def __init__(self, user_id: str):
        self._user_id = user_id

    def pay(self, amount: int) -> bool:
        print(f"카카오페이({self._user_id}) {amount:,}원 결제")
        return True

class ShoppingCart:
    def __init__(self):
        self._items = []
        self._payment: PaymentStrategy = None

    def set_payment_method(self, strategy: PaymentStrategy) -> None:
        self._payment = strategy

    def checkout(self) -> bool:
        total = sum(item["price"] for item in self._items)
        return self._payment.pay(total)

# 사용 — 전략만 바꾸면 됨
cart = ShoppingCart()
cart.set_payment_method(CardPayment("1234-5678-9012-3456"))
cart.checkout()

cart.set_payment_method(KakaoPayPayment("hong123"))
cart.checkout()
```

### 더 단순한 형태 — 함수를 전략으로

```python
# 클래스 대신 함수로 전략 교체 (Python 특유의 방식)
def discount_none(price: int) -> int:
    return price

def discount_10_percent(price: int) -> int:
    return int(price * 0.9)

def discount_vip(price: int) -> int:
    return int(price * 0.7)

class PriceCalculator:
    def __init__(self, discount_strategy=discount_none):
        self.discount = discount_strategy

    def calculate(self, price: int) -> int:
        return self.discount(price)

calc = PriceCalculator(discount_10_percent)
print(calc.calculate(10000))  # 9000

calc.discount = discount_vip  # 교체
print(calc.calculate(10000))  # 7000
```

---

## 실전 사용 사례

| 사례 | 전략 |
|---|---|
| 정렬 알고리즘 | Bubble, Quick, Merge 교체 |
| 결제 수단 | 카드, 카카오페이, 토스 |
| 압축 알고리즘 | zip, gzip, brotli |
| 인증 방식 | JWT, Session, OAuth |
| 할인 정책 | 일반, VIP, 쿠폰, 시즌세일 |
| 경로 탐색 | 최단거리, 최소환승, 최소비용 |

---

## 장단점

| 장점 | 단점 |
|---|---|
| if-else 제거, 코드 분리 | 전략 클래스 수가 늘어남 |
| 알고리즘 독립적으로 테스트 가능 | 간단한 경우엔 과도함 |
| 런타임에 알고리즘 교체 | 클라이언트가 전략 종류를 알아야 함 |
| 새 전략 추가 = 기존 코드 수정 없음 | |

---

## 관련

- [[observer]]
- [[command]]
- [[factory-method]]
- [[design-patterns-overview]]

---
title: Adapter
tags:
  - tech
  - design-pattern
  - structural
created: 2026-05-15 (금)
---

# Adapter

> **TL;DR**: 호환되지 않는 인터페이스를 연결한다 — 110V 플러그를 220V 콘센트에 꽂는 변환 어댑터와 같다

---

## 문제: 언제 쓰나?

- 외부 라이브러리/API가 우리 코드와 인터페이스가 다를 때
- 레거시 코드를 새 코드와 연결해야 할 때
- 서드파티 라이브러리를 교체할 가능성이 있을 때 (교체 비용 최소화)

```python
# 우리 코드는 이 인터페이스를 기대함
class PaymentProcessor:
    def charge(self, amount: int, currency: str) -> bool: ...

# 근데 써야 할 외부 라이브러리는 인터페이스가 다름
class StripeClient:
    def create_payment_intent(self, amount_cents: int, currency_code: str): ...
    def confirm_payment(self, intent_id: str): ...
```

---

## 구조

```
Client → Target 인터페이스 호출
           ↓
        Adapter (변환 레이어)
           ↓
        Adaptee (외부/기존 코드)
```

---

## 코드 예시

```python
from abc import ABC, abstractmethod

# 우리가 원하는 인터페이스 (Target)
class PaymentProcessor(ABC):
    @abstractmethod
    def charge(self, amount: int, currency: str) -> bool:
        pass

# 외부 라이브러리 (Adaptee) — 인터페이스가 다름
class StripeClient:
    def create_payment_intent(self, amount_cents: int, currency_code: str) -> dict:
        print(f"Stripe: {amount_cents}센트 결제 요청")
        return {"id": "pi_123", "status": "requires_confirmation"}

    def confirm_payment(self, intent_id: str) -> bool:
        print(f"Stripe: {intent_id} 결제 확인")
        return True


# 어댑터 — Stripe를 우리 인터페이스로 변환
class StripeAdapter(PaymentProcessor):
    def __init__(self, stripe_client: StripeClient):
        self._stripe = stripe_client

    def charge(self, amount: int, currency: str) -> bool:
        # 원화 → 센트 변환, 메서드 매핑
        amount_cents = amount * 100
        intent = self._stripe.create_payment_intent(amount_cents, currency.upper())
        return self._stripe.confirm_payment(intent["id"])


# 사용 — Client는 Stripe를 모름, PaymentProcessor만 알면 됨
def process_order(payment: PaymentProcessor, total: int):
    success = payment.charge(total, "krw")
    print("결제 성공" if success else "결제 실패")

stripe = StripeClient()
adapter = StripeAdapter(stripe)
process_order(adapter, 50000)

# 나중에 Toss로 교체 → TossAdapter만 만들면 됨
# process_order(TossAdapter(TossClient()), 50000)
```

### TypeScript — 로거 어댑터

```typescript
// 우리가 원하는 인터페이스
interface Logger {
    log(message: string): void;
    error(message: string): void;
}

// 외부 라이브러리 (Winston)
class WinstonLogger {
    info(msg: string, meta?: object): void { console.log("[INFO]", msg); }
    err(msg: string, meta?: object): void { console.error("[ERR]", msg); }
}

// 어댑터
class WinstonAdapter implements Logger {
    constructor(private winston: WinstonLogger) {}

    log(message: string): void {
        this.winston.info(message);
    }

    error(message: string): void {
        this.winston.err(message);
    }
}

// 사용
const logger: Logger = new WinstonAdapter(new WinstonLogger());
logger.log("서버 시작");  // 내부적으로 winston.info() 호출
```

---

## 실전 사용 사례

| 사례 | 설명 |
|---|---|
| 결제 모듈 통합 | Stripe, Toss, 카카오페이를 같은 인터페이스로 |
| 로거 교체 | console.log → Winston → Datadog 교체 시 |
| 외부 API 래핑 | 외부 API 응답 형식을 내부 모델로 변환 |
| 레거시 DB 연동 | 오래된 SQL 코드를 새 ORM과 연결 |
| 테스트 Mock | 실제 외부 서비스 → Mock 어댑터 교체 |

---

## 장단점

| 장점 | 단점 |
|---|---|
| 외부 코드를 수정 없이 통합 | 어댑터 클래스가 늘어남 |
| 라이브러리 교체 시 어댑터만 바꾸면 됨 | 간단한 경우엔 과도함 |
| 기존 코드를 건드리지 않음 (OCP) | 복잡한 변환은 어댑터가 비대해짐 |

---

## 관련

- [[facade]]
- [[proxy]]
- [[decorator]]
- [[design-patterns-overview]]

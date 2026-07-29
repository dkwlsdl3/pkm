---
title: Dependency Injection
tags:
  - tech
  - design-pattern
  - architectural
created: 2026-05-15 (금)
---

# Dependency Injection

> **TL;DR**: 객체가 필요한 의존성을 직접 생성하지 않고, 외부에서 주입받는다 — 테스트와 유연성의 핵심

---

## 문제: 언제 쓰나?

```python
# 문제: 의존성을 내부에서 생성하면 테스트가 불가능
class OrderService:
    def __init__(self):
        # 의존성을 직접 생성 — 교체 불가
        self.repo = SQLOrderRepository()      # 실제 DB 필요
        self.payment = StripePaymentGateway() # Stripe API 키 필요
        self.notifier = SendGridEmailSender() # SendGrid API 필요

    def place_order(self, user_id, items):
        # 테스트하려면 실제 DB, Stripe, SendGrid가 모두 필요
        ...
```

→ 의존성을 외부에서 넣어주면 테스트 시 Mock으로 교체 가능

---

## 구조

```
DI Container / 호출자
  ↓ 의존성 주입 (생성자, 메서드, 프로퍼티)
Object (의존성을 주입받는 쪽)
  → 인터페이스만 알고 구체 타입 모름
```

---

## 코드 예시

### Python — 생성자 주입 (Constructor Injection)

```python
from abc import ABC, abstractmethod
from typing import List

# 인터페이스 정의
class OrderRepository(ABC):
    @abstractmethod
    def save(self, order: dict) -> str: pass
    @abstractmethod
    def find_by_id(self, order_id: str) -> dict: pass

class PaymentGateway(ABC):
    @abstractmethod
    def charge(self, amount: int) -> bool: pass

class EmailSender(ABC):
    @abstractmethod
    def send(self, to: str, subject: str) -> None: pass


# 프로덕션 구현
class SQLOrderRepository(OrderRepository):
    def save(self, order: dict) -> str:
        print(f"DB에 주문 저장: {order}")
        return "order_123"
    def find_by_id(self, order_id: str) -> dict:
        return {"id": order_id}

class StripeGateway(PaymentGateway):
    def charge(self, amount: int) -> bool:
        print(f"Stripe 결제: {amount}원")
        return True

class SendGridSender(EmailSender):
    def send(self, to: str, subject: str) -> None:
        print(f"SendGrid 이메일: {to} — {subject}")


# 서비스 — 인터페이스에만 의존 (구체 타입 모름)
class OrderService:
    def __init__(
        self,
        repo: OrderRepository,         # 주입받음
        payment: PaymentGateway,       # 주입받음
        notifier: EmailSender,         # 주입받음
    ):
        self._repo = repo
        self._payment = payment
        self._notifier = notifier

    def place_order(self, user_email: str, items: List[dict]) -> str:
        total = sum(item["price"] for item in items)
        if not self._payment.charge(total):
            raise ValueError("결제 실패")
        order_id = self._repo.save({"items": items, "total": total})
        self._notifier.send(user_email, f"주문 확인: {order_id}")
        return order_id


# 프로덕션 조립 (Composition Root)
production_service = OrderService(
    repo=SQLOrderRepository(),
    payment=StripeGateway(),
    notifier=SendGridSender(),
)


# 테스트용 Mock — 실제 DB/API 없이 테스트 가능
class MockOrderRepository(OrderRepository):
    def __init__(self):
        self.saved_orders = []
    def save(self, order: dict) -> str:
        self.saved_orders.append(order)
        return "mock_order_1"
    def find_by_id(self, order_id: str) -> dict:
        return {"id": order_id}

class MockPaymentGateway(PaymentGateway):
    def __init__(self, should_succeed: bool = True):
        self.charged_amount = 0
        self._succeed = should_succeed
    def charge(self, amount: int) -> bool:
        self.charged_amount = amount
        return self._succeed

class MockEmailSender(EmailSender):
    def __init__(self):
        self.sent_emails = []
    def send(self, to: str, subject: str) -> None:
        self.sent_emails.append({"to": to, "subject": subject})

# 단위 테스트 — 외부 의존성 없음
def test_place_order():
    mock_repo = MockOrderRepository()
    mock_payment = MockPaymentGateway(should_succeed=True)
    mock_email = MockEmailSender()

    service = OrderService(mock_repo, mock_payment, mock_email)
    order_id = service.place_order("user@test.com", [{"price": 10000}])

    assert order_id == "mock_order_1"
    assert mock_payment.charged_amount == 10000
    assert mock_email.sent_emails[0]["to"] == "user@test.com"
    print("테스트 통과!")

test_place_order()
```

### Python — DI 컨테이너 (dependency-injector 라이브러리)

```python
from dependency_injector import containers, providers

class Container(containers.DeclarativeContainer):
    # 의존성 조립을 한 곳에서 관리
    order_repo = providers.Singleton(SQLOrderRepository)
    payment = providers.Singleton(StripeGateway)
    email = providers.Singleton(SendGridSender)

    order_service = providers.Factory(
        OrderService,
        repo=order_repo,
        payment=payment,
        notifier=email,
    )

# 사용
container = Container()
service = container.order_service()
```

### TypeScript — NestJS DI

```typescript
// NestJS는 DI를 프레임워크 레벨에서 지원
@Injectable()
class OrderService {
    constructor(
        private readonly repo: OrderRepository,    // 자동 주입
        private readonly payment: PaymentGateway,  // 자동 주입
        private readonly notifier: EmailSender,    // 자동 주입
    ) {}

    async placeOrder(userEmail: string, items: Item[]): Promise<string> {
        const total = items.reduce((sum, item) => sum + item.price, 0);
        await this.payment.charge(total);
        const orderId = await this.repo.save({ items, total });
        await this.notifier.send(userEmail, `주문 확인: ${orderId}`);
        return orderId;
    }
}

@Module({
    providers: [
        OrderService,
        { provide: OrderRepository, useClass: PrismaOrderRepository },
        { provide: PaymentGateway, useClass: StripeGateway },
        { provide: EmailSender, useClass: SendGridSender },
    ],
})
class OrderModule {}
```

---

## 주입 방식 3가지

| 방식 | 예시 | 사용 |
|---|---|---|
| **생성자 주입** (권장) | `__init__(self, repo: Repo)` | 필수 의존성 |
| **메서드 주입** | `service.set_repo(repo)` | 선택적 의존성 |
| **프로퍼티 주입** | `service.repo = repo` | 순환 의존성 해결 |

---

## 실전 사용 사례

| 사례 | 설명 |
|---|---|
| 단위 테스트 | Mock 주입으로 외부 의존성 격리 |
| 환경별 설정 | 개발/스테이징/프로덕션 구현 교체 |
| NestJS, Spring | 프레임워크 내장 DI 컨테이너 |
| A/B 테스트 | 두 구현 중 하나를 런타임에 주입 |

---

## 장단점

| 장점 | 단점 |
|---|---|
| 테스트 용이 (Mock 교체) | 초기 설정 복잡 (Composition Root) |
| 느슨한 결합 | DI 컨테이너 학습 비용 |
| 구현 교체 용이 | 작은 프로젝트엔 과도함 |
| 단일 책임 원칙 — 조립과 사용 분리 | |

---

## 관련

- [[singleton]]
- [[repository]]
- [[factory-method]]
- [[design-patterns-overview]]

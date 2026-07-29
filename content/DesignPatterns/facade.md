---
title: Facade
tags:
  - tech
  - design-pattern
  - structural
created: 2026-05-15 (금)
---

# Facade

> **TL;DR**: 복잡한 서브시스템을 단순한 인터페이스 뒤에 숨긴다

---

## 문제: 언제 쓰나?

```python
# 문제: 주문 처리에 관련된 서브시스템이 너무 많음
def place_order(user_id, items, payment_info):
    # 재고 확인
    inventory = InventoryService()
    for item in items:
        if not inventory.check_stock(item.id, item.quantity):
            raise OutOfStockError()
        inventory.reserve(item.id, item.quantity)

    # 결제 처리
    payment = PaymentGateway()
    payment.validate_card(payment_info)
    transaction = payment.charge(sum(i.price for i in items))

    # 주문 생성
    order_repo = OrderRepository()
    order = order_repo.create(user_id, items, transaction.id)

    # 배송 스케줄
    shipping = ShippingService()
    shipping.schedule(order.id, user_id)

    # 알림
    notifier = NotificationService()
    notifier.send_confirmation(user_id, order.id)

    return order
```

이 복잡한 흐름을 클라이언트가 직접 알 필요가 없음

---

## 구조

```
Client → Facade (단순 인터페이스)
           ├─ InventoryService
           ├─ PaymentGateway
           ├─ OrderRepository
           ├─ ShippingService
           └─ NotificationService
```

---

## 코드 예시

```python
class OrderFacade:
    """주문과 관련된 복잡한 프로세스를 단순 인터페이스로 제공"""

    def __init__(self):
        self._inventory = InventoryService()
        self._payment = PaymentGateway()
        self._order_repo = OrderRepository()
        self._shipping = ShippingService()
        self._notifier = NotificationService()

    def place_order(self, user_id: str, items: list, payment_info: dict) -> Order:
        """주문 전체 프로세스 — 클라이언트는 이것만 호출하면 됨"""
        self._check_and_reserve_inventory(items)
        transaction = self._process_payment(items, payment_info)
        order = self._create_order(user_id, items, transaction)
        self._arrange_delivery(order)
        self._send_confirmation(user_id, order)
        return order

    def cancel_order(self, order_id: str) -> None:
        """주문 취소도 단순 인터페이스로"""
        order = self._order_repo.find(order_id)
        self._payment.refund(order.transaction_id)
        self._inventory.release(order.items)
        self._shipping.cancel(order_id)
        self._notifier.send_cancellation(order.user_id)

    # 내부 세부 구현들은 private
    def _check_and_reserve_inventory(self, items): ...
    def _process_payment(self, items, info): ...
    def _create_order(self, user_id, items, transaction): ...
    def _arrange_delivery(self, order): ...
    def _send_confirmation(self, user_id, order): ...


# 사용 — 클라이언트 코드는 단순
facade = OrderFacade()
order = facade.place_order(user_id="u123", items=cart.items, payment_info=card)
```

### TypeScript — 파일 처리 파사드

```typescript
class VideoProcessingFacade {
    private decoder = new VideoDecoder();
    private encoder = new VideoEncoder();
    private compressor = new Compressor();
    private uploader = new CloudUploader();

    // 복잡한 처리를 한 메서드로
    async convertAndUpload(filePath: string): Promise<string> {
        const raw = await this.decoder.decode(filePath);
        const encoded = await this.encoder.encode(raw, "h264");
        const compressed = await this.compressor.compress(encoded);
        const url = await this.uploader.upload(compressed);
        return url;
    }
}

// 클라이언트
const processor = new VideoProcessingFacade();
const url = await processor.convertAndUpload("./video.mov");
```

---

## 실전 사용 사례

| 사례 | 설명 |
|---|---|
| Service Layer | Controller → Service (내부 복잡성 숨김) |
| SDK | 라이브러리가 복잡한 API를 단순하게 제공 |
| 레거시 래핑 | 복잡한 레거시 시스템을 새 인터페이스로 감쌈 |
| 마이크로서비스 BFF | Backend For Frontend가 여러 서비스를 통합 |
| 테스트 헬퍼 | 복잡한 테스트 셋업을 단순 메서드로 |

---

## 장단점

| 장점 | 단점 |
|---|---|
| 복잡성을 클라이언트에서 숨김 | 파사드가 비대해질 수 있음 (God Object) |
| 서브시스템 변경이 클라이언트에 영향 없음 | 서브시스템에 직접 접근 불가 (유연성 감소) |
| 계층 분리 명확 | |

> 💡 Facade와 Adapter의 차이: Adapter는 인터페이스를 **변환**, Facade는 복잡성을 **숨김**

---

## 관련

- [[adapter]]
- [[proxy]]
- [[design-patterns-overview]]

---
title: Factory Method
tags:
  - tech
  - design-pattern
  - creational
created: 2026-05-15 (목)
---

# Factory Method

> **TL;DR**: 객체 생성을 서브클래스에 위임해, 어떤 클래스를 만들지 결정을 미룬다

---

## 문제: 언제 쓰나?

```python
# 문제 상황: 알림 타입마다 생성 코드가 다름
def send_notification(type, message):
    if type == "email":
        notifier = EmailNotifier(smtp_host, smtp_port)
    elif type == "sms":
        notifier = SMSNotifier(api_key, sender_number)
    elif type == "push":
        notifier = PushNotifier(fcm_token)
    notifier.send(message)
```

새로운 알림 타입이 추가될 때마다 이 함수를 수정해야 함 → **개방-폐쇄 원칙(OCP) 위반**

→ 객체 생성 코드를 별도로 분리하고 싶을 때

---

## 구조

```
Creator (추상)
  └─ create_product()  ← 이게 팩토리 메서드
  └─ some_operation()  ← 생성된 객체 사용

ConcreteCreatorA → EmailNotifier 생성
ConcreteCreatorB → SMSNotifier 생성
```

---

## 코드 예시

```python
from abc import ABC, abstractmethod

# 제품 인터페이스
class Notifier(ABC):
    @abstractmethod
    def send(self, message: str) -> None:
        pass

# 구체 제품들
class EmailNotifier(Notifier):
    def send(self, message: str) -> None:
        print(f"이메일 발송: {message}")

class SMSNotifier(Notifier):
    def send(self, message: str) -> None:
        print(f"SMS 발송: {message}")

class PushNotifier(Notifier):
    def send(self, message: str) -> None:
        print(f"푸시 알림: {message}")

# 팩토리
class NotifierFactory(ABC):
    @abstractmethod
    def create_notifier(self) -> Notifier:
        pass

    def notify(self, message: str) -> None:
        notifier = self.create_notifier()  # 팩토리 메서드 호출
        notifier.send(message)

class EmailFactory(NotifierFactory):
    def create_notifier(self) -> Notifier:
        return EmailNotifier()

class SMSFactory(NotifierFactory):
    def create_notifier(self) -> Notifier:
        return SMSNotifier()

# 사용 — 새 타입 추가해도 기존 코드 수정 없음
factory = EmailFactory()
factory.notify("안녕하세요")
```

### 더 단순한 변형 — Simple Factory (함수형)

```python
def create_notifier(type: str) -> Notifier:
    notifiers = {
        "email": EmailNotifier,
        "sms": SMSNotifier,
        "push": PushNotifier,
    }
    cls = notifiers.get(type)
    if not cls:
        raise ValueError(f"알 수 없는 타입: {type}")
    return cls()

# 새 타입 추가 = dict에 한 줄 추가
notifier = create_notifier("email")
notifier.send("테스트")
```

---

## 실전 사용 사례

| 사례 | 설명 |
|---|---|
| ORM 다이얼렉트 | MySQL, PostgreSQL, SQLite별 쿼리 빌더 |
| UI 컴포넌트 | 플랫폼별(Web/Mobile) 렌더러 |
| 파서 | JSON, XML, CSV 파서 |
| 결제 모듈 | 카드, 무통장, 카카오페이 |
| 테스트 픽스처 | 테스트용 Mock 객체 생성 |

---

## 장단점

| 장점 | 단점 |
|---|---|
| 새 타입 추가 시 기존 코드 수정 없음 (OCP) | 클래스 수가 늘어남 |
| 생성 로직과 사용 로직 분리 | 간단한 경우엔 과도한 추상화 |
| 테스트 시 Mock Factory 교체 용이 | |

---

## 관련

- [[singleton]]
- [[builder]]
- [[strategy]]
- [[design-patterns-overview]]

---
title: 디자인 패턴 개요
tags:
  - tech
  - design-pattern
created: 2026-05-15 (금)
---

# 디자인 패턴 개요

> **TL;DR**: 소프트웨어 설계에서 반복되는 문제의 검증된 해결책 — GoF 23개 패턴 + 아키텍처 패턴

---

## 디자인 패턴이란

1994년 Gang of Four(GoF)가 정립한 23개 객체지향 설계 패턴. 반복적으로 등장하는 설계 문제에 대한 이름 붙여진 해결책. 패턴 자체가 코드가 아니라 **사고 방식**이다.

> "패턴을 외우는 게 아니라, 언제 이 패턴이 필요한지 느끼는 게 중요하다."

## 용어

| 표기 | 원어 | 뜻 |
|---|---|---|
| GoF | Gang of Four | 위 23개 패턴을 정립한 저자 4인 |
| SOLID | — | 객체지향 설계 5원칙의 머리글자 모음(SRP·OCP·LSP·ISP·DIP) |
| OCP | Open-Closed Principle | 개방-폐쇄 원칙. **확장에는 열려 있고 수정에는 닫혀 있어야 한다** — 기능을 추가할 때 기존 코드를 고치지 않아도 되게 만든다. 패턴 대부분이 이 원칙을 지키기 위한 장치다 |
| SRP | Single Responsibility Principle | 단일 책임 원칙. 한 클래스는 하나의 이유로만 바뀌어야 한다 |
| DI | Dependency Injection | 의존성 주입. 필요한 객체를 스스로 만들지 않고 외부에서 받는다 → [[dependency-injection]] |
| ORM | Object-Relational Mapping | 객체와 관계형 DB 테이블을 자동 대응시키는 계층 |
| DOM | Document Object Model | 브라우저가 HTML 문서를 객체 트리로 표현한 것 |

---

## 생성 패턴 (Creational)

객체를 **어떻게 만들까** — 생성 로직을 캡슐화해 유연성 확보

| 패턴 | 핵심 한 줄 | 언제 |
|---|---|---|
| [[singleton]] | 인스턴스를 딱 1개만 | DB 커넥션, 로거, 설정 |
| [[factory-method]] | 생성을 서브클래스에 위임 | 타입별로 다른 객체 생성 |
| [[builder]] | 복잡한 객체를 단계별 조립 | 옵션 많은 객체, 쿼리 빌더 |

---

## 구조 패턴 (Structural)

클래스를 **어떻게 조합할까** — 큰 구조를 효율적으로 구성

| 패턴 | 핵심 한 줄 | 언제 |
|---|---|---|
| [[adapter]] | 맞지 않는 인터페이스를 연결 | 외부 라이브러리 래핑 |
| [[decorator]] | 기능을 런타임에 동적 추가 | 로깅, 캐싱, 인증 |
| [[facade]] | 복잡한 내부를 단순 인터페이스로 | 서브시스템 통합 |
| [[proxy]] | 대리인이 접근을 제어 | 지연 로딩, 접근 제어 |

---

## 행위 패턴 (Behavioral)

객체가 **어떻게 협력할까** — 책임 분배와 알고리즘 캡슐화

| 패턴 | 핵심 한 줄 | 언제 |
|---|---|---|
| [[observer]] | 변화를 구독자에게 자동 알림 | 이벤트 시스템, 리액티브 |
| [[strategy]] | 알고리즘을 교체 가능하게 | if-else 분기 대체 |
| [[command]] | 요청을 객체로 캡슐화 | Undo/Redo, 작업 큐 |
| [[template-method]] | 뼈대는 부모, 세부는 자식 | 공통 플로우, 훅 메서드 |
| [[chain-of-responsibility]] | 요청을 체인으로 넘김 | 미들웨어, 필터 |

---

## 아키텍처 패턴

시스템 전체 구조를 잡는 상위 수준 패턴

| 패턴 | 핵심 한 줄 | 언제 |
|---|---|---|
| [[repository]] | DB 접근을 비즈니스 로직에서 분리 | 모든 데이터 접근 계층 |
| [[dependency-injection]] | 의존성을 외부에서 주입 | 테스트 가능한 구조 |

---

## 우선순위

```
🔴 매일 마주침
  Observer, Strategy, Decorator, Factory Method, Singleton, DI, Repository

🟡 자주 씀
  Adapter, Facade, Builder, Command

🟢 상황에 따라
  Proxy, Template Method, Chain of Responsibility
```

---

## 관련

- [[compensation-saga-pitfalls]] — 비동기 프로비저닝 보상(Saga) 설계 함정 4가지(실증)
- [[lease-derived-from-ledger]] — 점유(lease)를 별도 저장하지 말고 원장에서 파생: 반납 코드가 사라진다(실증)
- [[partial-failure-reported-as-success]] — 다단계 작업의 부분 실패가 완료로 보고되는 것: 응답과 화면 두 겹을 다 고쳐야 끝난다(실증)
- [[external-command-timeout-bulkhead]] — 외부 명령 hang 격벽: 타임드 래퍼+락 밖 실행+후조건 검증(실증)
- [[ai-overview]]
- [[dx-overview]]

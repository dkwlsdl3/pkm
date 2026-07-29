---
title: Template Method
tags:
  - tech
  - design-pattern
  - behavioral
created: 2026-05-15 (금)
---

# Template Method

> **TL;DR**: 알고리즘의 뼈대를 부모 클래스에 정의하고, 세부 단계는 자식 클래스에서 구현한다

---

## 문제: 언제 쓰나?

```python
# 문제: CSV, JSON, XML 임포트 처리가 거의 같은데 코드가 중복됨
class CSVImporter:
    def import_data(self, file_path):
        file = open(file_path)        # 파일 열기 (공통)
        data = self.parse_csv(file)   # 파싱 (다름)
        validated = self.validate(data)  # 검증 (공통)
        self.save_to_db(validated)    # 저장 (공통)
        file.close()                  # 정리 (공통)

class JSONImporter:
    def import_data(self, file_path):
        file = open(file_path)        # 중복!
        data = self.parse_json(file)  # 파싱 (다름)
        validated = self.validate(data)  # 중복!
        self.save_to_db(validated)    # 중복!
        file.close()                  # 중복!
```

→ 공통 흐름은 부모에, 달라지는 부분만 자식에서 구현

---

## 구조

```
AbstractClass (뼈대)
  - template_method() ← final, 순서 정의
    1. step1()        ← 구현됨 (공통)
    2. step2()        ← abstract (자식이 구현)
    3. hook()         ← 선택적 오버라이드
    4. step4()        ← 구현됨 (공통)

ConcreteClassA, B    ← step2() 각자 구현
```

---

## 코드 예시

### Python — 데이터 임포터

```python
from abc import ABC, abstractmethod

class DataImporter(ABC):
    """데이터 임포트 뼈대 — Template Method 패턴"""

    def import_data(self, file_path: str) -> int:
        """템플릿 메서드 — 알고리즘 순서를 정의 (오버라이드 금지)"""
        print(f"임포트 시작: {file_path}")

        raw = self._read_file(file_path)       # 공통
        data = self._parse(raw)                 # 자식 구현
        valid_data = self._validate(data)       # 공통
        self._before_save(valid_data)           # 훅 (선택적 오버라이드)
        count = self._save(valid_data)          # 공통
        self._cleanup()                         # 공통

        print(f"완료: {count}건 저장")
        return count

    # 공통 구현
    def _read_file(self, path: str) -> str:
        with open(path, "r", encoding="utf-8") as f:
            return f.read()

    def _validate(self, data: list) -> list:
        return [row for row in data if all(row.values())]

    def _save(self, data: list) -> int:
        print(f"DB 저장: {len(data)}건")
        return len(data)

    def _cleanup(self) -> None:
        print("임시 파일 정리")

    # 훅 — 기본 구현 있지만 필요시 오버라이드
    def _before_save(self, data: list) -> None:
        pass  # 기본적으로 아무것도 안 함

    # 추상 메서드 — 자식이 반드시 구현
    @abstractmethod
    def _parse(self, raw: str) -> list:
        pass


class CSVImporter(DataImporter):
    def _parse(self, raw: str) -> list:
        lines = raw.strip().split("\n")
        headers = lines[0].split(",")
        return [
            dict(zip(headers, line.split(",")))
            for line in lines[1:]
        ]


class JSONImporter(DataImporter):
    def _parse(self, raw: str) -> list:
        import json
        return json.loads(raw)

    def _before_save(self, data: list) -> None:
        # JSON은 저장 전 중복 제거 추가
        print(f"중복 제거: {len(data)}건 → ", end="")
        seen = set()
        data[:] = [d for d in data if (k := str(d)) not in seen and not seen.add(k)]
        print(f"{len(data)}건")


# 사용 — 인터페이스는 동일
csv_importer = CSVImporter()
csv_importer.import_data("data.csv")

json_importer = JSONImporter()
json_importer.import_data("data.json")
```

### Python — 게임 AI 행동 패턴

```python
class GameAI(ABC):
    def take_turn(self) -> None:
        """AI 턴 흐름 — 변경 불가"""
        self.collect_resources()
        self.build_structures()
        self.build_units()
        self.attack()

    @abstractmethod
    def collect_resources(self) -> None:
        pass

    @abstractmethod
    def build_structures(self) -> None:
        pass

    def build_units(self) -> None:
        print("기본 병사 생산")  # 기본 구현

    @abstractmethod
    def attack(self) -> None:
        pass

class AggressiveAI(GameAI):
    def collect_resources(self): print("빠른 자원 수집")
    def build_structures(self): print("병영 우선 건설")
    def build_units(self): print("정예 병사 생산")  # 오버라이드
    def attack(self): print("즉시 공격!")

class DefensiveAI(GameAI):
    def collect_resources(self): print("안전한 자원 수집")
    def build_structures(self): print("성벽 우선 건설")
    def attack(self): print("방어선 구축 후 반격")
```

---

## 실전 사용 사례

| 사례 | 설명 |
|---|---|
| 프레임워크 라이프사이클 | React의 `componentDidMount`, `componentWillUnmount` |
| Django CBV | `get()`, `post()` — View의 공통 처리 흐름 |
| JUnit 테스트 | `setUp()`, `tearDown()` — 테스트 프레임워크 |
| 데이터 처리 파이프라인 | ETL의 Extract → Transform → Load 뼈대 |
| 보고서 생성 | 헤더/바디/푸터 중 바디만 다른 경우 |

---

## 장단점

| 장점 | 단점 |
|---|---|
| 중복 코드 제거 (공통 흐름 한 곳에) | 상속 기반 → 자식이 부모에 의존 |
| 알고리즘 구조가 명확 | 추상 메서드가 많으면 자식 구현 부담 |
| 훅으로 선택적 확장 가능 | 흐름 변경 불가 (유연성 제한) |

> 💡 **Strategy vs Template Method**: Strategy는 **상속 없이 구성(composition)** 으로 교체, Template Method는 **상속** 으로 세부 구현 — 요즘은 상속보다 구성 선호 추세

---

## 관련

- [[strategy]]
- [[observer]]
- [[design-patterns-overview]]

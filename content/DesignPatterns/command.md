---
title: Command
tags:
  - tech
  - design-pattern
  - behavioral
created: 2026-05-15 (목)
---

# Command

> **TL;DR**: 요청을 객체로 캡슐화한다 — 실행 취소, 재실행, 큐잉, 로깅이 가능해진다

---

## 문제: 언제 쓰나?

- Undo/Redo 기능을 구현해야 할 때
- 작업을 나중에 실행하거나 큐에 넣어야 할 때
- 어떤 작업이 실행됐는지 기록(로그)해야 할 때
- 작업을 조합(매크로)해야 할 때

```python
# 문제: 텍스트 에디터 — undo를 어떻게 구현?
editor.write("Hello")
editor.delete(3)
editor.write("World")
editor.undo()  # 어떻게 이전 상태로?
```

단순히 메서드 호출로는 이전 상태 복원이 어렵다.

---

## 구조

```
Invoker (실행자) → Command.execute()
                 → Command.undo()

Command (인터페이스)
  - execute()
  - undo()
  └─ ConcreteCommand → Receiver (실제 작업 수행자) 호출
```

---

## 코드 예시

### Python — 텍스트 에디터 Undo/Redo

```python
from abc import ABC, abstractmethod
from typing import List

class Command(ABC):
    @abstractmethod
    def execute(self) -> None:
        pass

    @abstractmethod
    def undo(self) -> None:
        pass

class TextEditor:
    def __init__(self):
        self.text = ""

    def insert(self, pos: int, text: str) -> None:
        self.text = self.text[:pos] + text + self.text[pos:]

    def delete(self, pos: int, length: int) -> str:
        deleted = self.text[pos:pos + length]
        self.text = self.text[:pos] + self.text[pos + length:]
        return deleted


class InsertCommand(Command):
    def __init__(self, editor: TextEditor, pos: int, text: str):
        self._editor = editor
        self._pos = pos
        self._text = text

    def execute(self) -> None:
        self._editor.insert(self._pos, self._text)

    def undo(self) -> None:
        self._editor.delete(self._pos, len(self._text))


class DeleteCommand(Command):
    def __init__(self, editor: TextEditor, pos: int, length: int):
        self._editor = editor
        self._pos = pos
        self._length = length
        self._deleted_text = ""  # undo를 위해 저장

    def execute(self) -> None:
        self._deleted_text = self._editor.delete(self._pos, self._length)

    def undo(self) -> None:
        self._editor.insert(self._pos, self._deleted_text)


class EditorHistory:
    """Invoker — 명령 스택 관리"""
    def __init__(self, editor: TextEditor):
        self._editor = editor
        self._history: List[Command] = []
        self._redo_stack: List[Command] = []

    def execute(self, command: Command) -> None:
        command.execute()
        self._history.append(command)
        self._redo_stack.clear()  # 새 명령 시 redo 스택 초기화

    def undo(self) -> None:
        if not self._history:
            return
        command = self._history.pop()
        command.undo()
        self._redo_stack.append(command)

    def redo(self) -> None:
        if not self._redo_stack:
            return
        command = self._redo_stack.pop()
        command.execute()
        self._history.append(command)


# 사용
editor = TextEditor()
history = EditorHistory(editor)

history.execute(InsertCommand(editor, 0, "Hello"))
history.execute(InsertCommand(editor, 5, " World"))
print(editor.text)  # "Hello World"

history.undo()
print(editor.text)  # "Hello"

history.redo()
print(editor.text)  # "Hello World"
```

### Python — 작업 큐 (비동기 처리)

```python
import queue
import threading

class Command(ABC):
    @abstractmethod
    def execute(self) -> None:
        pass

class SendEmailCommand(Command):
    def __init__(self, to: str, subject: str, body: str):
        self.to = to
        self.subject = subject
        self.body = body

    def execute(self) -> None:
        print(f"이메일 발송: {self.to} — {self.subject}")

class ResizeImageCommand(Command):
    def __init__(self, path: str, width: int, height: int):
        self.path = path
        self.width = width
        self.height = height

    def execute(self) -> None:
        print(f"이미지 리사이즈: {self.path} → {self.width}x{self.height}")

# 작업 큐 — 명령을 큐에 넣고 워커가 처리
task_queue: queue.Queue[Command] = queue.Queue()

def worker():
    while True:
        command = task_queue.get()
        command.execute()
        task_queue.task_done()

# 백그라운드 워커 실행
thread = threading.Thread(target=worker, daemon=True)
thread.start()

# 명령을 큐에 추가 (즉시 반환)
task_queue.put(SendEmailCommand("user@example.com", "환영합니다", "..."))
task_queue.put(ResizeImageCommand("photo.jpg", 800, 600))
task_queue.join()  # 모든 작업 완료 대기
```

---

## 실전 사용 사례

| 사례 | 설명 |
|---|---|
| Undo/Redo | 텍스트 에디터, 포토샵, 게임 |
| 작업 큐 | Celery, RQ, Bull — 비동기 작업 |
| 트랜잭션 로그 | DB 변경 이력 기록 |
| 매크로 | 여러 커맨드를 묶어 하나로 |
| 스케줄러 | 특정 시간에 커맨드 실행 |

---

## 장단점

| 장점 | 단점 |
|---|---|
| Undo/Redo 구현 용이 | 간단한 작업에 클래스가 너무 많아짐 |
| 작업 큐잉, 지연 실행 | 상태 관리가 복잡해질 수 있음 |
| 작업 이력 로깅 자동화 | |
| 발신자와 수신자의 완전한 분리 | |

---

## 관련

- [[observer]]
- [[strategy]]
- [[template-method]]
- [[design-patterns-overview]]

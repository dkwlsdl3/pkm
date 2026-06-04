---
tags:
  - tech
created: 2026-06-04 (목)
---

# 모달 @click.stop × click-outside 충돌 — capture 단계 리스너

> **TL;DR**: 모달 내용부의 `@click.stop`(배경 클릭 닫힘 방지)이 내부 컴포넌트의 `document` click-outside 리스너까지 죽인다 — 외부 클릭 감지는 **capture 단계**(`addEventListener(..., true)`)로 등록하면 stopPropagation의 영향을 받지 않는다.

---

## 개요

- **무엇인가**: Select/Dropdown류 컴포넌트는 보통 `document.addEventListener('click', handleClickOutside)`로 바깥 클릭을 감지해 닫는다. 그런데 Dialog가 내용 클릭의 버블링을 `@click.stop`으로 끊으면, 모달 안에서의 클릭은 document까지 도달하지 못해 click-outside가 영영 안 불린다
- **증상**: "모달 안에서만 드롭다운이 안 닫힌다 / 여러 개가 동시에 열린 채 남는다" — 모달 밖에서는 정상이라 원인을 드롭다운 쪽에서 찾기 쉬움
- **언제 의심하는가**: 특정 컨테이너(모달·팝오버) 안에서만 외부클릭 닫힘이 동작하지 않을 때 → 조상 요소의 `stopPropagation` 탐색

---

## 핵심 개념

### 이벤트 흐름과 stopPropagation의 사각지대

```
capture:  document → … → Dialog → Select(버튼)     ← capture 리스너는 여기서 이미 실행됨
target:                            클릭 지점
bubble:   Select → Dialog(@click.stop ✂) → ✗document  ← 버블 리스너는 차단됨
```

`stopPropagation`은 현재 단계 이후의 전파만 끊는다 — **capture 단계에서 document에 등록한 리스너는 어떤 자손의 stop보다 먼저 실행**된다.

---

## 코드 / 사용 예시

```js
// Select.vue (Vue 3 script setup)
const handleClickOutside = (event) => {
  if (!isOpen.value) return
  const inSelect = selectRef.value?.contains(event.target)
  const inDropdown = dropdownRef.value?.contains(event.target)
  if (!inSelect && !inDropdown) isOpen.value = false
}

onMounted(() => {
  // capture 단계 등록 — 모달의 @click.stop이 버블링을 막아도 외부 클릭 감지 가능
  document.addEventListener('click', handleClickOutside, true)
})
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside, true)  // 옵션 일치 필수
})
```

---

## 주의사항

> [!WARNING]
> `removeEventListener`는 등록 때와 **capture 옵션이 일치해야** 해제된다 (`true`로 등록했으면 `true`로 해제).
> capture 리스너는 타깃의 자체 클릭 핸들러보다 먼저 실행되므로, "열기 버튼 클릭"을 외부 클릭으로 오인하지 않도록 `contains(event.target)` 검사를 반드시 유지할 것.

---

## 관련

- [[frontend-overview]]

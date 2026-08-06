---
title: flex 자식의 min-height auto 가 스크롤바 생성을 막는다
tags:
  - tech
  - troubleshooting
created: 2026-08-04 (화)
---

# flex 자식의 min-height auto 가 스크롤바 생성을 막는다

> **TL;DR**: flex 자식은 기본값 `min-height: auto` 때문에 **내용 높이 밑으로 줄어들지 않는다.** 그래서 `flex-1 overflow-auto` 를 걸어도 보이는 높이와 내용 높이가 같아져 **스크롤바 생성 조건 자체가 성립하지 않고**, 넘친 부분은 조상의 `overflow-hidden` 이 그냥 잘라낸다. 스크롤 컨테이너의 **모든 flex 조상에 `min-h-0`** 을 걸어야 한다.

## 증상

- 고정 높이 카드 안의 목록·트리를 펼치면 **아래쪽이 잘려서 안 보이고 스크롤도 안 된다**
- 스크롤바가 아예 그려지지 않는다(마우스 휠도 안 먹는다)
- 높이를 지정하지 않은 카드에서는 멀쩡하다 → "특정 화면에서만" 발생

## 원인

CSS Flexbox 명세상 flex 아이템의 `min-width`/`min-height` **초기값은 `auto`** 이고, 이는 "콘텐츠의 최소
크기 밑으로 줄지 않는다"를 뜻한다(일반 블록 요소의 `0` 과 다르다).

연쇄는 이렇게 간다.

1. 카드가 높이를 고정한다 (`h-[588px]`, `overflow-hidden`)
2. 내용 칸에 `flex-1` 만 걸려 있다 → `min-height: auto` 적용
3. 내용이 1044px 이면 **이 칸이 1044px 로 늘어난다.** 카드가 정한 588px 안으로 줄어들지 않는다
4. 자식이 요청한 `h-full` 은 **부모의 1044px 기준**으로 계산된다
5. 스크롤 영역의 **보이는 높이 972px = 내용 높이 972px** → 넘침이 없으므로 스크롤바가 안 생긴다
6. 넘친 부분은 카드의 `overflow-hidden` 이 잘라낸다 → 마지막 노드가 카드 경계 밖 124px

실측(DevTools 콘솔):

```js
const card = document.querySelector('.card');
const pane = document.querySelector('.scroll-pane');
console.log(card.clientHeight, card.scrollHeight);   // 588 1044  ← 카드가 넘침
console.log(pane.clientHeight, pane.scrollHeight);   // 972 972   ← 스크롤 조건 불성립
```

★**진단 기준**: `scrollHeight === clientHeight` 인데 화면이 잘려 보이면 이 결함이다. `overflow` 값을
아무리 바꿔도 해결되지 않는다.

## 해결

스크롤 컨테이너까지 내려오는 **모든 flex 자식 체인에 `min-h-0`** 을 건다. 한 군데라도 빠지면 그대로 재발한다.

```html
<!-- 카드: 높이 고정 -->
<div class="flex h-[588px] flex-col overflow-hidden">
  <header class="shrink-0">…</header>

  <!-- ★ flex-1 만으로는 부족하다. min-h-0 을 함께 -->
  <div class="min-h-0 flex-1">
    <div class="h-full overflow-y-auto">
      <FolderTree />
    </div>
  </div>
</div>
```

```css
/* Tailwind 없이 */
.card-body { flex: 1 1 auto; min-height: 0; }
```

수정 후 실측: 스크롤 영역 516px / 내용 972px(스크롤 가능), 카드 588px = 588px(넘침 해소).

> [!NOTE]
> 가로 방향(`flex-row`)에서는 **`min-w-0`** 이 같은 역할을 한다. 긴 텍스트가 `truncate` 로 줄지 않고 형제를
> 밀어내는 증상이 이것이다.

> [!WARNING]
> 카드 공통 컴포넌트를 고치면 **높이를 지정한 인스턴스에만** 동작이 바뀐다. 높이를 지정하지 않은 카드는
> 영향이 없으므로 영향 범위를 세어 두고(예: 전체 49곳 중 3곳) 그 세 곳을 직접 확인하라.

> [!NOTE]
> 스크롤바가 생겼는데 **안 보인다면** 별개 문제다 — 사이드바용 자동 숨김 스타일(평소 투명, hover 시에만
> 표시)을 내용 패널에 그대로 재사용한 경우가 흔하다. 목록 패널에는 상시 표시 스타일이 맞다.

---

## 관련

- [[frontend-overview]]
- [[sidebar-active-menu-longest-match]]
- [[modal-click-outside-capture]]

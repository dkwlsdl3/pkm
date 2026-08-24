---
title: navigator.clipboard 는 http 에서 undefined 다 — 복사 성공 토스트가 거짓이 되는 자리
tags:
  - tech
  - troubleshooting
created: 2026-08-24 (월)
---

# navigator.clipboard 는 http 에서 undefined 다 — 복사 성공 토스트가 거짓이 되는 자리

> **TL;DR**: Clipboard API(`navigator.clipboard`)는 **보안 컨텍스트(https 또는 localhost)에서만** 제공된다. http 로 접속한 사내 배포에서는 객체 자체가 `undefined` 라 `writeText` 호출이 즉시 던진다. 호출부가 `await` 없이 부르고 곧바로 "복사되었습니다" 토스트를 띄우면 **복사가 안 됐는데 성공으로 보인다**. 복사 유틸은 **성공 여부를 값으로 돌려주고**, 비보안 컨텍스트용 `execCommand('copy')` 폴백을 둔다.

## 용어

| 표기 | 원어 | 뜻 |
|---|---|---|
| secure context | 보안 컨텍스트 | https, `localhost`, `file://` 등 브라우저가 "안전한 출처" 로 보는 페이지. 일부 API 는 여기서만 노출된다 |
| Clipboard API | — | `navigator.clipboard.writeText/readText`. 비동기·권한 기반의 표준 클립보드 접근 |
| `execCommand('copy')` | — | 옛 방식. 표준에서 deprecated 지만 비보안 컨텍스트에서 동작하는 유일한 실용 경로다 |
| fire-and-forget | — | Promise 를 `await` 하지 않고 결과를 버리는 호출. 실패가 어디에도 보고되지 않는다 |

## 증상

- 고객 문의: "링크 복사 버튼을 눌러도 붙여넣기에 아무것도 없다". 화면에는 "복사되었습니다" 가 뜬다
- 개발 환경(localhost)·https 데모에서는 재현되지 않는다 — **http 로 접속하는 실배포에서만** 난다
- 콘솔에 `Cannot read properties of undefined (reading 'writeText')` 가 unhandled rejection 으로 남지만 아무도 보지 않는다

## 원인

```js
// 결함 — 결과를 기다리지 않고 성공을 단정한다
navigator.clipboard.writeText(url)      // http 면 navigator.clipboard === undefined → throw
toast.success('복사되었습니다')           // 그래도 뜬다
```

같은 코드가 화면 4곳에 복사돼 있었고, 처음 보고는 2곳만 짚었다. **되돌려 보고(호출부 전수 검색)** 로 4곳을 확정했다 — [[code-fork-drift]].

## 해결

```js
// utils/clipboard.js — 성공 여부를 반환하는 것이 요점
const copyByExecCommand = (text) => {
  let ta = null
  try {                                        // DOM 조작까지 try 안에 — 밖에 두면 예외가 샌다
    ta = document.createElement('textarea')
    ta.value = text
    ta.setAttribute('readonly', '')            // 모바일 키보드 올라오는 것 방지
    ta.style.position = 'fixed'; ta.style.top = '-9999px'; ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    ta.setSelectionRange(0, text.length)       // iOS 사파리는 select() 만으로 범위가 안 잡힌다
    return document.execCommand('copy') === true
  } catch { return false }
  finally { try { ta?.remove() } catch {} }
}

export const copyToClipboard = async (text) => {
  if (navigator.clipboard?.writeText) {
    try { await navigator.clipboard.writeText(text); return true } catch { /* 폴백으로 */ }
  }
  return copyByExecCommand(text)
}

// 호출부 — 값을 보고 토스트를 고른다
const ok = await copyToClipboard(url)
ok ? toast.success('복사되었습니다') : toast.error('복사에 실패했습니다. 직접 선택해 복사하세요')
```

- `display:none` 인 요소는 선택이 안 되므로 **화면 밖으로 밀어** 숨긴다.
- 시험은 `navigator.clipboard` 를 `undefined` 로 만든 환경과, `writeText` 가 reject 하는 환경 둘 다에서 **반환값이 false** 인지 고정한다.
- 근본 해결은 https 배포다. 그때까지 폴백은 "http 에서도 동작" 이 아니라 **"실패를 거짓 성공으로 보이지 않게 함"** 이 목적이다.

> [!WARNING]
> "성공 토스트" 는 사용자에게 **사실 진술**이다. 결과를 모르는 채 띄우면 [[http-200-fake-write-failure]] 와 같은 계열 — 실패가 성공으로 위장된다.

---

## 관련

- [[query-failure-vs-empty-state]] — 조회 실패를 빈 상태로 그리는 같은 계열
- [[http-200-fake-write-failure]] — 실패를 성공 응답으로 위장하는 백엔드 판
- [[unknown-is-not-absent]] — 확인 안 된 것을 "됐다" 로 접지 말라
- [[code-fork-drift]] — 복사된 호출부는 한 번에 전수 정정
- [[frontend-overview]]

---
title: ko-KR 날짜 포맷은 기본이 12시간제다
tags:
  - tech
  - troubleshooting
created: 2026-11-09 (월)
---

# ko-KR 날짜 포맷은 기본이 12시간제다

> **TL;DR**: `toLocaleString('ko-KR')` 계열은 `hour12` 를 주지 않으면 12시간제로 찍고, 실측 런타임에서는 `오후` 가 아니라 **영문 `PM`** 이 나왔다. `hour12: false` 를 주면 이번엔 `14시 3분 7초` 같은 문장형이 된다. 화면 표기는 한 유틸에서 자리수를 조립해 고정하고, 나머지 자리의 `toLocale*` 호출은 lint 로 막는다.

## 증상

- 한국어 화면에 `2026. 08. 06. PM 02:03`, 시각 열에 `PM 02:03:07` 이 보인다
- 날짜를 보여 주는 화면마다 표기가 다르다(복사된 포맷 함수가 화면마다 조금씩 다름)
- 시험은 초록이다 — 기대값을 **구현과 같은 `toLocaleString` 호출로 계산**해서, 영문 `AM` 이 박힌 문자열을 정답으로 고정하고 있었다

## 원인

`Intl.DateTimeFormat` 의 ko-KR 기본 시간 주기가 12시간제(`h12`)다. 오전·오후 표기 문자열은 런타임에 실린 ICU(International Components for Unicode, 로케일 데이터 라이브러리) 데이터를 따른다.

```js
// Node 24.15 · ICU 78.2 · TZ=Asia/Seoul 실측
const d = new Date('2026-08-06T05:03:07Z')
d.toLocaleString('ko-KR')                    // "2026. 8. 6. PM 2:03:07"
d.toLocaleString('ko-KR', { hour12: false }) // "2026. 8. 6. 14시 3분 7초"
new Intl.DateTimeFormat('ko-KR', { hour: 'numeric' }).resolvedOptions().hourCycle // "h12"
```

## 해결

포맷 정본을 한 파일에 두고 자리수를 직접 조립한다. 잘못된 값(`undefined` → Invalid Date)은 `NaN.NaN.NaN` 대신 빈 값 표시로 돌린다.

```js
// utils/dates.js
const pad = (n) => String(n).padStart(2, '0')

export function formatDateTime(value) {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '-'
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
```

`Intl` 을 쓰고 싶다면 `hourCycle: 'h23'` 과 자리 옵션을 모두 명시한다(같은 런타임 실측 `"2026. 08. 06. 14:03"`). 다만 구분자·공백도 ICU 데이터를 따르므로, 화면마다 같은 문자열이어야 하면 조립 쪽이 흔들리지 않는다.

> [!WARNING]
> 시험 기대값을 구현과 같은 API 로 계산하지 마라. 그러면 결함이 정답이 된다. 기대값은 **사람이 읽은 실제 문자열**(`"2026.08.06 14:03"`)로 고정한다.

---

## 관련

- [[tolocalestring-locale-drift]] — 같은 메서드의 숫자 쪽 함정
- [[vue-template-lint-blind-spot]] — 이 호출을 lint 로 막을 때 템플릿이 빠지는 문제
- [[narrow-lint-rule-false-negative]] — 금지 규칙을 좁혔을 때 생긴 미탐
- [[mutation-check-test-effectiveness]] — 시험이 실제로 결함을 잡는지 구현을 되돌려 확인하는 법
- [[frontend-overview]]

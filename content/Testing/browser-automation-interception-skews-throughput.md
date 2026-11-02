---
title: 브라우저 자동화의 요청 가로채기가 전송 처리량을 왜곡한다
tags:
  - tech
  - troubleshooting
created: 2026-11-02 (월)
---

# 브라우저 자동화의 요청 가로채기가 전송 처리량을 왜곡한다

> **TL;DR**: Puppeteer·Playwright 같은 브라우저 자동화로 대용량 업로드·다운로드 속도를 잴 때, **요청 가로채기**(request interception)나 **네트워크 감시**(CDP Network 이벤트)를 켜 두면 도구가 바이너리 본문을 다루느라 처리량이 수십 배 떨어진다. 그 숫자는 제품 성능이 아니다. 측정 구간에서는 감시를 끄고, 도구를 켠 경우와 끈 경우를 비교해 도구 영향부터 확인한다.

| 표기 | 원어 | 뜻 |
|---|---|---|
| CDP | Chrome DevTools Protocol | 자동화 도구가 브라우저를 조종·관찰하는 통로 |
| MiB/s | mebibytes per second | 초당 2²⁰바이트 단위 처리량 |

## 증상

- 실제 웹 화면으로 10GiB 업로드를 쟀더니 **4.78MiB/s**가 나왔다. 같은 경로의 SMB는 약 111MiB/s였다.
- 측정 중 자동화 도구(Node)의 메모리가 **3.5GiB**까지 늘었다.

## 원인

- 시험 코드가 요청을 가로채(인증 헤더 주입·관찰용) 각 청크의 본문을 도구 프로세스로 넘기고 있었다.
- 네트워크 이벤트 감시도 켜져 있어서, 청크마다 본문 직렬화·전달 비용이 들었다.
- 256MiB 기준으로 감시를 켜면 **37.4초**, 끄면 **3.5초**였다. 도구 비용이 측정값을 지배했다.

## 해결

```js
// 측정 구간 진입 전: 가로채기·네트워크 감시 해제
await page.setRequestInterception(false);
const cdp = await page.target().createCDPSession();
await cdp.send('Network.disable');
// 인증 헤더가 필요하면 측정 대상 요청에만 정확히 일치시켜 붙이고, 본문은 건드리지 않는다
```

- 고친 뒤 10GiB 업로드는 중앙값 **87.37MiB/s**였다.
- 측정 보고서에 "도구 on/off에서 같은 구간을 잰 비교"를 남긴다. 그래야 다음 사람이 숫자를 믿을 근거가 생긴다.
- 장시간 전송 중 인증 만료(청크 401)가 나면 갱신 뒤 재시도로 회복했는지도 함께 기록한다.

---

## 관련

- [[nested-vm-measurement-needs-same-host-control]] — 같은 날 겪은 다른 측정 조건 함정
- [[storage-perf-reporting-honesty]]
- [[playwright-selector-wait-strategy]]
- [[testing-overview]]

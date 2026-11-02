---
title: 청크를 모아 Blob으로 저장하는 다운로드는 대용량에서 브라우저 메모리에 막힌다
tags:
  - tech
  - troubleshooting
created: 2026-11-02 (월)
---

# 청크를 모아 Blob으로 저장하는 다운로드는 대용량에서 브라우저 메모리에 막힌다

> **TL;DR**: 웹 화면이 `fetch`로 받은 청크를 배열에 모았다가 `Blob`으로 만들어 `<a download>`로 저장하면, **파일 크기 이상의 메모리를 브라우저 렌더러가 쥔다.** 10GiB 파일에서 Windows는 18MiB/s로 느려졌고, Linux Chrome은 렌더러 메모리 한도(16GiB)를 넘어 충돌했다. 같은 파일을 **브라우저 네이티브 다운로드**로 받으면 86MiB/s로 끝났다. 대용량은 브라우저가 디스크로 바로 쓰게 맡긴다.

| 표기 | 원어 | 뜻 |
|---|---|---|
| Blob | Binary Large Object | 브라우저 메모리(또는 임시 저장소)에 담긴 이진 데이터 덩어리 |
| SIGILL | illegal instruction signal | 프로세스가 비정상 종료될 때 받는 신호 중 하나. 여기서는 렌더러가 메모리 한도 초과 뒤 죽은 흔적 |

## 증상

- Windows Edge에서 10GiB 다운로드는 SHA256이 일치했지만 중앙값 **18.34MiB/s**(약 9분 18초)였다. 같은 PC의 업로드는 약 87MiB/s였다.
- InPrivate(시크릿) 창에서는 저장이 실패했다. 노트북 커밋 메모리는 15GiB에서 26GiB로 올랐다.
- Ubuntu Chrome에서는 웹 화면 다운로드가 두 번 모두 **렌더러 충돌**로 끝났다. 커널 기록은 다음과 같았다.

```text
mmap: chrome (…): VmData 17179901952 exceed data ulimit 17179869184
traps: chrome[…] trap invalid opcode
```

## 원인

- 청크 배열 + 최종 `new Blob(chunks)`는 전체 파일을 렌더러 메모리에 들고 있다. 합치는 순간에는 일시적으로 더 많이 든다.
- Linux Chromium은 렌더러에 **데이터 영역 한도 16GiB**를 건다(`prlimit`으로 실제 값 확인). 이 한도를 넘자 충돌했다.
- 메모리 압박으로 스왑이 일어나면 그것이 속도 저하로 나타난다. Windows 저속이 같은 원인인지는 **확정하지 않았다.** InPrivate 실패도 "디스크로 내보내지 않는 모드라서"라는 추정만 있다.

## 해결

```js
// 1) 가장 단순: 브라우저 네이티브 다운로드 — 브라우저가 디스크로 바로 스트리밍
//    Authorization 헤더를 못 붙이므로 단기 다운로드 토큰(또는 쿠키 인증)을 쓴다
const { url } = await api.post('/download-token', { path });
location.href = url;  // 서버는 Content-Disposition: attachment 로 응답

// 2) 진행률 표시가 꼭 필요하면 디스크로 바로 쓰는 스트림
const handle = await window.showSaveFilePicker({ suggestedName: name }); // Chromium 계열
await (await fetch(src)).body.pipeTo(await handle.createWritable());
```

- 실측 비교(Ubuntu, 10GiB): 네이티브 다운로드 중앙값 **86.58MiB/s**(약 1분 58초)로 성공했다. 웹 화면 방식은 2회 모두 충돌했다.
- 측정할 때 HTTP 캐시 재사용과 시크릿 모드 같은 브라우저 조건을 고정한다. 브라우저 제어 응답의 기본 시간 제한(3분)도 대용량에 맞춰 늘린다.

---

## 관련

- [[reverse-proxy-response-timeout-long-download]] — 대용량 다운로드의 서버·프록시 쪽 함정(별개)
- [[browser-automation-interception-skews-throughput]] — 같은 측정에서 겪은 도구 쪽 함정
- [[frontend-overview]]

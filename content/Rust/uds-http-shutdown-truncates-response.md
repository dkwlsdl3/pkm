---
title: 유닉스 소켓 HTTP 요청 후 shutdown하면 응답이 잘린다
tags:
  - tech
  - troubleshooting
created: 2026-08-03 (월)
---

# 유닉스 소켓 HTTP 요청 후 shutdown하면 응답이 잘린다

> **TL;DR**: 유닉스 소켓에 HTTP 요청을 직접 조립해 보낸 뒤 `shutdown(SHUT_WR)`로 쓰기 방향을 닫으면, hyper 서버가 **응답을 쓰기 전에 읽기 EOF를 보고 연결을 끊는다** → 클라이언트는 응답 0바이트를 받는다. 요청에 `Content-Length`가 있으면 서버는 본문 끝을 알 수 있으므로 **EOF 신호가 애초에 필요 없다** — `shutdown`을 부르지 말 것.

## 증상

유닉스 도메인 소켓으로 로컬 데몬에 요청을 보내는 경로가 **한 번도 성공한 적이 없다.** 작업이 "요청 보냄" 상태에서 영구 정지하고 실제 동작도 일어나지 않는다.

로그가 양쪽에서 갈린다.

```
클라이언트: "netexec returned malformed HTTP"
데몬:      "Accepted root peer uid=0"  →  "connection closed before message completed"
```

데몬은 요청을 **받았다**. 그런데 응답을 쓰지 못했다.

## 원인

요청을 다 보낸 뒤 쓰기 방향을 닫는 관용구를 썼다.

```rust
stream.write_all(&request).await?;
stream.shutdown().await?;          // ← 이것이 원인
let mut buf = Vec::new();
stream.read_to_end(&mut buf).await?;   // buf.len() == 0
```

hyper(`hyper_util::server::conn::auto::Builder` 등)는 커넥션의 읽기 쪽에서 EOF를 관측하면 **그 커넥션을 종료 대상으로 판단한다.** 아직 응답을 쓰지 않았어도 그렇다. `shutdown()`은 `SHUT_WR`이라 "요청 다 보냈다"는 뜻으로 쓰기 쉽지만, 서버 입장에서는 **연결이 끝났다는 신호**로 읽힌다.

`SHUT_WR`로 요청 끝을 알리는 관용구는 HTTP 이전의 단순 프로토콜(finger·일부 SMTP 파이프라인·raw 소켓) 관례다. HTTP는 `Content-Length` 또는 `Transfer-Encoding: chunked`로 본문 경계를 표현하므로 **EOF에 의존하지 않는다.**

두 방식을 나란히 보내 갈랐다:

| 방식 | 응답 |
|---|---|
| `shutdown()` 호출 | **0 바이트** |
| `shutdown()` 생략 | **213 바이트** — `HTTP/1.1 400 Bad Request` (정상 응답) |

400이지만 **응답이 왔다**는 것이 핵심이다. 원인이 shutdown임을 확정하는 데는 성공 응답이 필요 없다.

## 해결

`shutdown()`을 제거하고, 응답은 `Content-Length`까지만 읽는다.

```rust
stream.write_all(&request).await?;
// shutdown 하지 않는다 — Content-Length 가 본문 끝을 알려준다
let mut buf = vec![0u8; 8192];
let n = stream.read(&mut buf).await?;   // 또는 헤더 파싱 후 Content-Length 만큼
```

진단 요령 — **같은 요청을 두 방식으로 보내 갈라보는 스크립트**를 만들어 두면 원인 확정이 몇 초로 줄어든다.

```bash
# ① 현재 구현과 같은 방식(요청 후 쓰기 종료)
printf 'POST /op HTTP/1.1\r\nHost: localhost\r\nContent-Length: 2\r\n\r\n{}' \
  | socat -t2 - UNIX-CONNECT:/run/example.sock | wc -c

# ② shutdown 생략 — socat이 쓰기를 닫지 않도록 유지
printf 'POST /op HTTP/1.1\r\nHost: localhost\r\nContent-Length: 2\r\n\r\n{}' \
  | socat -t2 -,ignoreeof - UNIX-CONNECT:/run/example.sock | head -1
```

②만 응답이 오면 원인은 shutdown이다. 둘 다 실패하면 경로·본문 스키마 등 다른 곳이다.

> [!WARNING]
> 이 결함은 **테스트가 덮기 쉽다.** 테스트 더블이 요청 바이트만 받고 응답 형식을 흉내내면 EOF 타이밍을 재현하지 않는다. 실제 hyper 서버를 띄운 통합 테스트가 아니면 초록불이 아무것도 보증하지 않는다.

> [!NOTE]
> HTTP 클라이언트 라이브러리(`hyper`의 클라이언트, `reqwest` + custom connector)를 쓰면 이 문제 자체가 생기지 않는다. 요청을 손으로 조립하는 선택이 원인의 전제였다.

---

## 관련

- [[tokio-blocking-io-hazard]] — async 소켓 다루기의 다른 함정
- [[rust-backend-troubleshooting]]
- [[embedded-script-contract-tests]] — 테스트 더블이 실체를 재현하지 않는 문제
- [[mutation-check-test-effectiveness]] — 초록불이 실행을 증명하지 않을 때
- [[nginx-grpc-gateway-dedicated-port]]

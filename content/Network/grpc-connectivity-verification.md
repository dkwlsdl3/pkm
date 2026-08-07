---
title: gRPC 경로 검증 — 무인증 Ping과 SSH 터널 SNI 오버라이드
tags:
  - nginx
  - grpc
  - tls
  - firewalld
---

# gRPC 경로 검증 — 무인증 Ping과 SSH 터널 SNI 오버라이드

> **TL;DR**: 운영 서버에 데이터를 쓰지 않고도 gRPC 에러 코드만으로 TCP→TLS→프록시→백엔드 전 구간을 진단하고, 공인망에 포트가 없을 때는 SSH 터널 + SNI 오버라이드로 내부 경로를 그대로 검증한다.

> 용어: **gRPC**(Google이 만든 RPC = 원격 프로시저 호출 프레임워크, HTTP/2 기반) · **TLS**(Transport Layer Security, 통신 암호화) · **SNI**(Server Name Indication, TLS 핸드셰이크에서 접속할 호스트명을 미리 알리는 확장) · **LB**(Load Balancer, 부하 분산기) · **NAT**(Network Address Translation, 주소 변환). → [[network-overview]] 용어 표

## 경로 검증 트릭 — 데이터 없이 전 구간 증명

토큰 인증이 있는 gRPC 서버라면 **무인증 Ping 한 방**으로 충분하다:
서버가 `UNAUTHENTICATED(16)`를 돌려주면 TCP → TLS(인증서 검증) → 프록시
grpc_pass → 백엔드 인증 게이트까지 전 구간이 통과됐다는 뜻. 운영 서버에
아무 데이터도 쓰지 않고 경로를 실증할 수 있다.

- `DEADLINE_EXCEEDED` + "Waiting for LB pick" = TCP 연결 자체가 안 됨(방화벽/NAT 포워딩)
- `UNAVAILABLE` + "HTTP status code 502" = TLS·프록시는 통과, 업스트림 연결 실패
- `UNAUTHENTICATED` = 전 구간 OK

## SSH 터널로 내부 경로 검증 (grpc-js)

공인망에 포트가 안 열려 있어도(NAT 포워딩 없음) 내부 경로를 그대로 검증하려면
터널 + SNI 오버라이드:

```bash
ssh -f -N -L 18443:127.0.0.1:8443 proxy-host
```
```js
const opts = {
  'grpc.ssl_target_name_override': 'api.example.com',  // 인증서 hostname 검증용
  'grpc.default_authority': 'api.example.com',
};
new Service('127.0.0.1:18443', grpc.credentials.createSsl(), opts);
```

## 관련

- [[nginx-grpc-gateway-dedicated-port]]

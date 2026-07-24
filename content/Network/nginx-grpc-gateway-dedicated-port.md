---
tags:
  - nginx
  - grpc
  - tls
  - firewalld
---

# 기존 웹 프록시 옆에 gRPC 수신 붙이기 — 전용 포트 패턴

기존 443에서 여러 서비스를 서빙 중인 nginx 프록시에 gRPC 수신 경로를 추가할 때,
**같은 도메인 + 전용 포트의 독립 server 블록**이 최소 침습이다.

## 왜 전용 포트인가

- 기존 443 server 블록을 전혀 건드리지 않는다 → 사이드 이펙트 0, 롤백 = 심링크 제거+reload
- 서브도메인을 새로 파지 않아도 됨 → 클라이언트측 DNS/hosts 추가 작업 0
  (특히 상대측 내부망에 DNS가 없을 때 결정적), 와일드카드/SAN 인증서 그대로 유효
- 443에 http2 플래그를 얹는 방식은 기존 브라우저 트래픽에 영향 리스크

## 구성

```nginx
# /etc/nginx/sites-available/myservice-grpc-8443
server {
    listen 8443 ssl http2;
    server_name api.example.com;           # 기존 도메인 재사용
    ssl_certificate     /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;
    grpc_read_timeout  300s;
    grpc_send_timeout  300s;
    location / { grpc_pass grpc://<BACKEND_IP>:8086; }   # 백엔드는 평문 gRPC
}
```

배포는 `ln -s` → `nginx -t` 통과 시에만 `reload`, 실패 시 심링크 제거(자동 롤백 체인).
nginx 1.13.10+면 grpc_pass 지원(1.18 확인).

## 방화벽 — 출발지 한정 개방

업스트림 서버(firewalld)는 포트를 전체 개방하지 말고 **프록시 IP 출발지 한정**:

```bash
firewall-cmd --permanent --add-rich-rule='rule family=ipv4 source address=<프록시IP> port port=8086 protocol=tcp accept'
firewall-cmd --reload
```

nginx 502 + 로그 `connect() failed (113)` / `No route to host`면 대부분 이
업스트림 방화벽이 원인(포트 리스닝은 확인됐는데 중계만 실패하는 패턴).

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

관련: [[network-overview]], [[gitlab-ci-deploy-runner]]

---
title: 기존 웹 프록시 옆에 gRPC 수신 붙이기 — 전용 포트 패턴
tags:
  - nginx
  - grpc
  - tls
  - firewalld
created: 2026-07-10 (금)
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

배포 후 데이터 없이 경로 전 구간을 검증하는 방법(무인증 Ping 에러 코드 매핑,
공인망 미개방 시 SSH 터널 + SNI 오버라이드)은 [[grpc-connectivity-verification]] 참고.

---

## 관련

- [[network-overview]]
- [[gitlab-ci-deploy-runner]]
- [[grpc-connectivity-verification]]

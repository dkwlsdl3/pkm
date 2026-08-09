---
title: Network 개요 (MOC)
tags:
  - tech
  - moc
created: 2026-06-12 (금)
---

# Network 개요 (MOC)

> 물리 링크·스위치·NIC(Network Interface Card, 랜카드) 레벨의 네트워크 구성과 진단

---

## 용어

Network 노트 전반에서 반복되는 약어. 개별 노트에서 처음 만나면 여기로 돌아온다.

| 표기 | 원어 | 뜻 |
|---|---|---|
| L1 / L2 / L3 | OSI Layer 1 / 2 / 3 | 물리(케이블·전기신호) / 데이터링크(MAC 주소·스위치) / 네트워크(IP·라우팅) 계층. 진단은 아래에서 위로 올라간다 |
| NIC | Network Interface Card | 네트워크 인터페이스(랜카드) |
| MAC | Media Access Control | L2에서 장비를 식별하는 하드웨어 주소 |
| LACP | Link Aggregation Control Protocol | 여러 물리 링크를 하나로 묶는 표준 프로토콜 → [[nic-bonding]] |
| STP | Spanning Tree Protocol | 브리지 구간의 루프를 자동으로 끊어 방지하는 프로토콜 |
| RX / TX | Receive / Transmit | 수신 / 송신. 에러 카운터를 볼 때 어느 방향인지 구분해야 한다 |
| ACL | Access Control List | 접근 제어 목록(무엇을 허용/차단하는지 나열한 규칙) |
| NAT | Network Address Translation | 주소 변환. 사설 주소를 공인 주소로 바꿔 내보낸다 |
| DHCP | Dynamic Host Configuration Protocol | IP 주소를 자동으로 배분하는 프로토콜 |
| TLS | Transport Layer Security | 통신 암호화 표준(구 SSL) |
| SNI | Server Name Indication | TLS 핸드셰이크에서 접속하려는 호스트명을 미리 알리는 확장. 한 IP에 여러 도메인을 얹을 때 필요 |
| SAN | Subject Alternative Name | 인증서가 커버하는 도메인 목록을 담는 필드 (스토리지의 SAN과 무관) |
| gRPC | gRPC Remote Procedure Calls | Google이 만든 RPC(원격 프로시저 호출) 프레임워크. HTTP/2 기반 |
| OOB | Out Of Band | 대역 외. 서비스 트래픽과 분리된 관리 전용 경로 |
| LB | Load Balancer | 부하 분산기 |
| RJ45 | — | 흔히 쓰는 8핀 이더넷 커넥터 규격 |

> 스위치 LED 라벨은 제품마다 다르다. `LNK`는 링크 연결, `SPD`는 속도(Speed) 표시로 쓰는 경우가 많다 → [[link-layer-debugging]]

---

## 진단

- [[link-layer-debugging]] — sysfs speed·RX 카운터·ip neigh로 L1→L2→L3 단계 진단, 스위치 LED 읽는 법
- [[bond-bridge-topology-verification]] — 본딩/브리지 토폴로지는 문서가 아니라 4종 명령 실측이 정본

## 구성

- [[nic-bonding]] — NIC 2포트 본딩: active-backup vs LACP, 단일 플로우 대역폭 한계
- [[nginx-grpc-gateway-dedicated-port]] — 기존 443 옆 gRPC 수신: 전용 포트 server 블록 + 출발지 한정 방화벽
- [[reverse-proxy-response-timeout-long-download]] — 큰 폴더 다운로드만 간헐 504: `proxy_read_timeout` 기본 60초는 전체 시간이 아니라 읽기 간격 상한
- [[grpc-connectivity-verification]] — 무인증 Ping·에러코드 매핑·SSH터널 SNI로 gRPC 경로 진단

---

## 관련

- [[os-overview]] — SSH·iptables·브리지 등 호스트 쪽 네트워크 설정
- [[network-bridge]] — 가상 브리지 설정, STP, QEMU ACL

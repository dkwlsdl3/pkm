---
title: VPN & Tailscale
tags:
  - tech
  - network
  - vpn
created: 2026-05-18 (일)
---

# VPN & Tailscale

> **TL;DR**: VPN은 공용 인터넷 위에 암호화 터널을 만드는 기술 — Tailscale은 WireGuard 기반 Zero-config Mesh VPN

---

## VPN 클라이언트 작동 원리

### 핵심 메커니즘

1. **가상 네트워크 인터페이스(vNIC) 생성** — 프로그램 실행 시 OS에 가상 랜카드 생성
2. **캡슐화 및 암호화** — 송신 데이터(Payload)를 암호화 후 VPN 서버 주소가 적힌 새 헤더로 래핑
3. **터널링** — ISP나 외부에서 내용을 볼 수 없는 암호화 터널로 전달
4. **해독 및 라우팅** — VPN 서버가 패킷을 복호화해 사내 네트워크로 전달

---

## 트래픽 분기 방식: 분할 vs 전체 터널링

| 방식 | 작동 원리 | 특징 |
|---|---|---|
| **분할 터널링** (Split Tunneling) | 목적지 IP에 따라 분기 — 사내망 트래픽만 VPN 경유 | 일반 웹 속도 저하 없음. 대다수 기업 기본 설정 |
| **전체 터널링** (Full Tunneling) | 모든 트래픽(0.0.0.0/0)을 VPN으로 → 사내 보안 장비 통과 | 강력한 보안 통제 가능, 인프라 부하 시 속도 저하 |

VPN 연결 시 단말기는 물리 네트워크(Wi-Fi/Ethernet)와 가상 네트워크(VPN)를 동시에 가지며, VPN 클라이언트가 **라우팅 테이블**을 수정해 우선순위를 결정한다.

---

## Tailscale

Zero-config Mesh VPN. 복잡한 방화벽·포트 포워딩 설정 없이 기기 간 안전한 연결.

### 특징

- **WireGuard 기반** — 기존 OpenVPN, IPsec보다 빠르고 가벼움
- **P2P Mesh 구조** — 중앙 게이트웨이 없이 기기끼리 1:1 직접 암호화 통신 → 병목 없음
- **Coordination 서버** — Tailscale 중앙 서버는 공개키 교환·주소록 역할만, 실제 트래픽에는 접근하지 않음
- **SSO 연동** — Google, Microsoft 계정으로 로그인, 전 세계 어디서나 동일한 LAN 환경 구현

### 일반 VPN vs Tailscale

```
일반 VPN:  클라이언트 → VPN 게이트웨이 서버 → 목적지
Tailscale: 클라이언트 ←————— P2P 직접 연결 —————→ 목적지
                        (Coordination 서버는 키 교환만)
```

### 설치 (Ubuntu)

```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up
```

### 설치 (macOS)

App Store에서 Tailscale 설치 후 로그인.

### 주요 명령어

```bash
tailscale status          # 연결된 기기 목록
tailscale ip              # 내 Tailscale IP 확인
tailscale ping <hostname> # 특정 기기 연결 테스트
tailscale down            # 연결 해제
```

---

## WireGuard

Tailscale의 기반 프로토콜. 직접 사용 시:

```bash
# Ubuntu
sudo apt install wireguard

# 설정 파일
sudo nano /etc/wireguard/wg0.conf

# 실행
sudo wg-quick up wg0
sudo systemctl enable wg-quick@wg0
```

---

## 관련

- [[ssh-key-auth]]
- [[network-bridge]]
- [[iptables-nat]]
- [[os-overview]]

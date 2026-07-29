---
title: Tailscale
tags:
  - tech
  - network
  - vpn
created: 2026-05-18 (월)
---

# Tailscale

> **TL;DR**: Tailscale은 WireGuard 기반 Zero-config Mesh VPN — 중앙 게이트웨이 없이 기기끼리 P2P 직접 암호화 통신

---

Zero-config Mesh VPN. 복잡한 방화벽·포트 포워딩 설정 없이 기기 간 안전한 연결.

## 특징

- **WireGuard 기반** — 기존 OpenVPN, IPsec보다 빠르고 가벼움
- **P2P Mesh 구조** — 중앙 게이트웨이 없이 기기끼리 1:1 직접 암호화 통신 → 병목 없음
- **Coordination 서버** — Tailscale 중앙 서버는 공개키 교환·주소록 역할만, 실제 트래픽에는 접근하지 않음
- **SSO 연동** — Google, Microsoft 계정으로 로그인, 전 세계 어디서나 동일한 LAN 환경 구현

## 일반 VPN vs Tailscale

```
일반 VPN:  클라이언트 → VPN 게이트웨이 서버 → 목적지
Tailscale: 클라이언트 ←————— P2P 직접 연결 —————→ 목적지
                        (Coordination 서버는 키 교환만)
```

## 설치 (Ubuntu)

```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo tailscale up
```

## 설치 (macOS)

App Store에서 Tailscale 설치 후 로그인.

## 주요 명령어

```bash
tailscale status          # 연결된 기기 목록
tailscale ip              # 내 Tailscale IP 확인
tailscale ping <hostname> # 특정 기기 연결 테스트
tailscale down            # 연결 해제
```

---

## 관련

- [[vpn-tailscale]]
- [[vpn-fundamentals]]
- [[tailscale-lan-mdns-fallback-pitfall]]
- [[wireguard]]

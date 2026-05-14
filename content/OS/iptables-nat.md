---
title: iptables NAT
tags:
  - tech
created: 2026-05-14 (목)
---

# iptables NAT

> **TL;DR**: VM/컨테이너가 호스트를 거쳐 인터넷에 나가게 해주는 네트워크 주소 변환 — MASQUERADE가 핵심

---

## 개념

NAT(Network Address Translation) — 내부 IP를 외부 IP로 변환해서 통신하는 기술.

VM(172.25.0.x)은 사설 IP라 인터넷에 직접 못 나감. 호스트가 대신 패킷을 내보내고 응답을 돌려주는 방식.

```
VM (172.25.0.10) → 호스트 (enp4s0, 공인IP) → 인터넷
                ← MASQUERADE로 응답 역변환 ←
```

---

## 설정

```bash
# IP 포워딩 활성화 (커널이 패킷을 다른 인터페이스로 전달 허용)
sudo sysctl -w net.ipv4.ip_forward=1

# MASQUERADE: 나가는 패킷의 출발지 IP를 호스트 IP로 변환
sudo iptables -t nat -A POSTROUTING -s 172.25.0.0/24 -o enp4s0 -j MASQUERADE

# FORWARD: 브리지 ↔ 외부 인터페이스 간 패킷 허용
sudo iptables -A FORWARD -i br-lnet -o enp4s0 -j ACCEPT
sudo iptables -A FORWARD -i enp4s0 -o br-lnet -m state --state RELATED,ESTABLISHED -j ACCEPT
```

**MASQUERADE vs SNAT**
- `MASQUERADE` — 호스트 IP가 유동적일 때 (DHCP). 자동으로 현재 IP 사용
- `SNAT` — 호스트 IP가 고정일 때. 명시적으로 IP 지정, 약간 빠름

---

## 영구 적용

재부팅 시 iptables 규칙 초기화됨. 영구 적용하려면:

```bash
sudo apt install -y iptables-persistent
sudo netfilter-persistent save
```

---

## 관련

- [[kvm-libvirt]]
- [[network-bridge]]
- [[os-overview]]

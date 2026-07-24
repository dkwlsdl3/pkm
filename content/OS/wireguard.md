---
title: WireGuard
tags:
  - tech
  - network
  - vpn
created: 2026-05-18 (일)
---

# WireGuard

> **TL;DR**: Tailscale의 기반 프로토콜 — `wg0.conf` 설정 후 `wg-quick`으로 직접 구동 가능

---

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

- [[vpn-tailscale]]
- [[tailscale]]

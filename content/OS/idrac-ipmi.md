---
tags:
  - tech
created: 2026-05-14 (목)
---

# iDRAC / IPMI

> **TL;DR**: OS 없이도 서버를 원격 제어할 수 있는 독립 관리 칩 — 전원 ON/OFF, BIOS 진입, 콘솔 접근

---

## 개념

**IPMI (Intelligent Platform Management Interface)** — 서버 하드웨어 관리 표준 인터페이스. 메인보드에 독립적인 관리 칩(BMC)이 있어 OS와 무관하게 동작.

**iDRAC (Integrated Dell Remote Access Controller)** — Dell 서버의 IPMI 구현체. HP는 iLO, Lenovo는 XClarity.

```
서버 전원 꺼짐 상태에서도
  iDRAC ← 독립 전원 → 네트워크 접속 가능
  → 전원 ON, BIOS 설정, 콘솔 접근
```

---

## ipmitool로 iDRAC IP 설정

```bash
sudo apt install -y ipmitool

sudo ipmitool lan set 1 ipsrc static
sudo ipmitool lan set 1 ipaddr 30.30.99.201
sudo ipmitool lan set 1 netmask 255.255.255.0
sudo ipmitool lan set 1 defgw ipaddr 30.30.99.1

# 설정 확인
sudo ipmitool lan print 1 | grep -E "IP Address|Gateway"
```

설정 후 브라우저에서 `http://30.30.99.201` 접속 → iDRAC 웹 인터페이스.

---

## 주요 활용

| 상황 | iDRAC로 가능한 것 |
|---|---|
| OS 부팅 불가 | 가상 콘솔로 BIOS/복구 접근 |
| 원격 전원 관리 | 강제 재시작, 전원 ON/OFF |
| 하드웨어 모니터링 | 온도, 팬 속도, 전력 소비 |
| 원격 미디어 마운트 | ISO 이미지로 원격 OS 설치 |

---

## 관련

- [[os-overview]]

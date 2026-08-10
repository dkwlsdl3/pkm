---
title: iDRAC / IPMI / Redfish
tags:
  - tech
created: 2026-05-14 (목)
---

# iDRAC / IPMI / Redfish

> **TL;DR**: OS 없이도 서버를 원격 제어할 수 있는 독립 관리 칩 — 전원 ON/OFF, BIOS 진입, 콘솔 접근

---

## 개념

**IPMI (Intelligent Platform Management Interface)** — 서버 하드웨어 관리 표준 인터페이스. 메인보드에 독립적인 관리 칩(BMC)이 있어 OS와 무관하게 동작.

**iDRAC (Integrated Dell Remote Access Controller)** — Dell 서버의 BMC 구현체. HP는 iLO, Lenovo는 XClarity Controller(XCC)다.

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
sudo ipmitool lan set 1 ipaddr <IDRAC_IP>
sudo ipmitool lan set 1 netmask <NETMASK>
sudo ipmitool lan set 1 defgw ipaddr <GATEWAY_IP>

# 설정 확인
sudo ipmitool lan print 1 | grep -E "IP Address|Gateway"
```

설정 후 브라우저에서 `http://<IDRAC_IP>` 접속 → iDRAC 웹 인터페이스.

> iDRAC **IP를 까먹었을 때**도 호스트 OS에서 같은 명령으로 조회: `sudo ipmitool lan print 1 | grep "IP Address"`. (`/dev/ipmi0` 있으면 ipmitool만 설치하면 됨)

---

## 가상 미디어로 OS 설치

iDRAC 웹 → Virtual Media로 로컬 ISO를 마운트해 베어메탈에 OS 설치(예: TrueNAS·Rocky). 순서: Virtual Media에 ISO 마운트 → 부팅을 Virtual CD로 → 인스톨러. 자주 막히는 지점은 [[idrac-virtual-media-install-pitfalls]] 참고.

---

## 주요 활용

| 상황 | iDRAC로 가능한 것 |
|---|---|
| OS 부팅 불가 | 가상 콘솔로 BIOS/복구 접근 |
| 원격 전원 관리 | 강제 재시작, 전원 ON/OFF |
| 하드웨어 모니터링 | 온도, 팬 속도, 전력 소비 |
| 원격 미디어 마운트 | ISO 이미지로 원격 OS 설치 |

## BMC 웹 UI와 Redfish 교차검증

BMC 웹 UI 상태를 못 믿을 때 Redfish API로 실제 상태를 조회해 교차검증한다. 절차는 [[redfish-webui-verification]] 참고.

---

## 관련

- [[os-overview]]
- [[idrac-virtual-media-install-pitfalls]]
- [[redfish-webui-verification]]

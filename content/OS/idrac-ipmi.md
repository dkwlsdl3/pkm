---
title: iDRAC / IPMI
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
sudo ipmitool lan set 1 ipaddr <IDRAC_IP>
sudo ipmitool lan set 1 netmask <NETMASK>
sudo ipmitool lan set 1 defgw ipaddr <GATEWAY_IP>

# 설정 확인
sudo ipmitool lan print 1 | grep -E "IP Address|Gateway"
```

설정 후 브라우저에서 `http://<IDRAC_IP>` 접속 → iDRAC 웹 인터페이스.

> iDRAC **IP를 까먹었을 때**도 호스트 OS에서 같은 명령으로 조회: `sudo ipmitool lan print 1 | grep "IP Address"`. (`/dev/ipmi0` 있으면 ipmitool만 설치하면 됨)

---

## 가상 미디어로 OS 설치 — 실전 함정

iDRAC 웹 → Virtual Media로 로컬 ISO를 마운트해 베어메탈에 OS 설치(예: TrueNAS·Rocky). 순서: Virtual Media에 ISO 마운트 → 부팅을 Virtual CD로 → 인스톨러.

> [!WARNING]
> 자주 막히는 지점:
> - **ISO 파일 선택 후 `Map Device`까지 눌러야** 실제 마운트됨. 선택만 하고 Close하면 안 물려서 그냥 디스크로 부팅된다.
> - one-time "다음 부팅=Virtual CD" override는 **휘발성**(cold boot 등에 풀림). 확실한 건 POST 때 **`F11` 부트매니저**로 Virtual Optical Drive를 **직접 선택**.
> - 기존 OS가 종료 hang(예: Lustre/NFS unmount 멈춤)이면 → iDRAC **Power Cycle(Cold Boot)**로 강제로 넘긴다(백업 됐을 때).
> - 가상 미디어는 **iDRAC 웹을 연 PC(브라우저)에서 서빙**된다. 설치 중(extract) ISO를 계속 읽으므로 **그 PC가 절전/종료되거나 브라우저를 닫으면 설치가 깨진다.** 설치 끝날 때까지 켜둘 것. (느린 건 가상미디어가 네트워크로 ISO를 읽기 때문)
> - 설치 후 재부팅 전 **Virtual Media를 Disconnect**해야 인스톨러로 다시 안 들어간다.

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

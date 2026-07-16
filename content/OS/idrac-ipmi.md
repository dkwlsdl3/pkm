---
title: iDRAC / IPMI
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

## BMC 웹 UI와 Redfish 교차검증

Redfish는 서버 하드웨어 관리용 표준 HTTP API다. 전원, 부팅, 스토리지 같은 최종 상태를 구조화된 JSON으로 읽을 수 있어 웹 UI 자동화보다 검증에 유리하다.

```bash
# 시스템 전원 상태
curl -sk -u '<USER>:<PASSWORD>' \
  https://<BMC>/redfish/v1/Systems/1

# 예시: 스토리지 컨트롤러와 물리 디스크 링크
curl -sk -u '<USER>:<PASSWORD>' \
  https://<BMC>/redfish/v1/Systems/1/Storage
```

웹 UI는 클라이언트 캐시, 다중선택 상태, 비동기 재조회가 꼬여 실제로 성공한 작업을 실패로 표시할 수 있다. 이때 같은 버튼을 반복해서 누르지 말고 다음 순서로 확인한다.

1. UI 오류 메시지와 현재 표시 상태를 기록한다.
2. Redfish GET으로 모든 대상 리소스의 실제 상태를 개별 조회한다.
3. 가상 디스크 수, 물리 디스크 상태, 전원 상태처럼 서로 독립된 후조건을 확인한다.
4. 이미 목표 상태라면 재실행하지 않는다. 목표 상태가 아니면 지원 액션과 허용값을 조회한 뒤 변경한다.

> [!WARNING]
> BMC 자격증명을 명령 이력, 문서, savelog에 남기지 않는다. 자동화에서는 제한 권한 계정과 임시 credential 전달 방식을 사용한다.

---

## 관련

- [[os-overview]]

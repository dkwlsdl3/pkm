---
title: iDRAC 가상 미디어 OS 설치 실전 함정
tags:
  - tech
created: 2026-05-14 (목)
---

# iDRAC 가상 미디어 OS 설치 실전 함정

> **TL;DR**: iDRAC Virtual Media로 베어메탈에 OS를 설치할 때 자주 막히는 지점 정리

---

iDRAC 웹 → Virtual Media로 로컬 ISO를 마운트해 베어메탈에 OS 설치(예: TrueNAS·Rocky). 순서: Virtual Media에 ISO 마운트 → 부팅을 Virtual CD로 → 인스톨러.

> [!WARNING]
> 자주 막히는 지점:
> - **ISO 파일 선택 후 `Map Device`까지 눌러야** 실제 마운트됨. 선택만 하고 Close하면 안 물려서 그냥 디스크로 부팅된다.
> - one-time "다음 부팅=Virtual CD" override는 **휘발성**(cold boot 등에 풀림). 확실한 건 POST 때 **`F11` 부트매니저**로 Virtual Optical Drive를 **직접 선택**.
> - 기존 OS가 종료 hang(예: Lustre/NFS unmount 멈춤)이면 → iDRAC **Power Cycle(Cold Boot)**로 강제로 넘긴다(백업 됐을 때).
> - 가상 미디어는 **iDRAC 웹을 연 PC(브라우저)에서 서빙**된다. 설치 중(extract) ISO를 계속 읽으므로 **그 PC가 절전/종료되거나 브라우저를 닫으면 설치가 깨진다.** 설치 끝날 때까지 켜둘 것. (느린 건 가상미디어가 네트워크로 ISO를 읽기 때문)
> - 설치 후 재부팅 전 **Virtual Media를 Disconnect**해야 인스톨러로 다시 안 들어간다.

---

## 관련

- [[idrac-ipmi]]

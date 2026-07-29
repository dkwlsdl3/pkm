---
title: Tailscale LAN mDNS 오검증 함정
tags:
  - tech
  - network
  - vpn
created: 2026-05-18 (월)
---

# Tailscale LAN mDNS 오검증 함정

> **TL;DR**: 같은 사무실 Wi-Fi에서 원격 데스크톱이 되는 건 자동 검색(mDNS)이 로컬 LAN으로 붙었기 때문 — Tailscale 경로 검증이 아니다

---

## 함정: 원격 데스크톱이 LAN으로 붙어 "되는 줄" 착각

같은 사무실 Wi-Fi(같은 LAN)에서 원격 데스크톱(Moonlight/Sunshine 등)을 설정하면, 자동 검색(mDNS/로컬 IP)으로 **로컬 LAN을 통해 붙는다.** 사무실에선 되니 "고쳤다" 착각하지만, 집(다른 망)엔 그 LAN이 없어 실패한다 — **Tailscale 경로로 붙는지 검증한 적이 없는 것.**

- 검증/사용: 자동 검색에 의존하지 말고 **Tailscale IP(100.x.y.z)로 명시 연결**. 그게 되면 어느 망에서나 된다.
- 가벼운 작업(터미널·에이전트 실행)은 풀 GUI 스트리밍보다 **Tailscale IP로 SSH**가 더 확실. (`tailscale status`로 양쪽 기기가 online인지부터 확인; DNS 경고가 있어도 IP로는 됨)

---

## 관련

- [[vpn-tailscale]]
- [[tailscale]]

---
title: Network 개요 (MOC)
tags:
  - tech
  - moc
created: 2026-06-12 (금)
---

# Network 개요 (MOC)

> 물리 링크·스위치·NIC 레벨의 네트워크 구성과 진단

---

## 진단

- [[link-layer-debugging]] — sysfs speed·RX 카운터·ip neigh로 L1→L2→L3 단계 진단, 스위치 LED 읽는 법

## 구성

- [[nic-bonding]] — NIC 2포트 본딩: active-backup vs LACP, 단일 플로우 대역폭 한계
- [[nginx-grpc-gateway-dedicated-port]] — 기존 443 옆 gRPC 수신: 전용 포트 server 블록 + 출발지 한정 방화벽 + 무인증 Ping 경로증명

---

## 관련

- [[os-overview]] — SSH·iptables·브리지 등 호스트 쪽 네트워크 설정
- [[network-bridge]] — 가상 브리지 설정, STP, QEMU ACL

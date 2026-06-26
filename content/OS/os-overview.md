---
title: OS 개요 (MOC)
tags:
  - tech
  - moc
created: 2026-05-13 (수)
---

# OS 개요 (MOC)

> Ubuntu / Rocky Linux / macOS 운영 및 서버 관리

---

## 네트워크 & 원격 접속

- [[ssh-key-auth]] — SSH 키 인증 설정 (Ubuntu ↔ Mac 양방향), SSH config alias
- [[dns-hosts-emergency-bypass]] — DNS 장애 시 hosts 파일로 사내 서비스 도메인 긴급 우회
- [[iptables-nat]] — NAT/MASQUERADE 설정, VM 인터넷 연결
- [[network-bridge]] — 가상 브리지 설정, STP, QEMU ACL
- [[vpn-tailscale]] — VPN 작동 원리, 분할/전체 터널링, Tailscale Mesh VPN

## 보안 & 인증

- [[sso]] — SSO 개념, SAML / OAuth / OIDC 비교, IdP·SP 역할

## 가상화

- [[kvm-libvirt]] — KVM/libvirt 설치, virt-install, virsh 명령어, NAT 설정
- [[proxmox-virtualization]] — Proxmox VE(무료 AGPL), KVM+ZFS 기반, REST API 외부 제어, 대안 지형(XCP-ng·Harvester·oVirt)
- [[idrac-ipmi]] — Dell 서버 원격 관리, ipmitool로 iDRAC IP 설정

## 시스템

- [[systemd-service]] — 서비스 파일 작성, linger, SIGTSTP 문제
- [[linux-permissions]] — rwx 권한, sticky bit, setuid/setgid
- [[dkms]] — 커널 업데이트 시 모듈 자동 재빌드
- [[grub-kernel-pinning]] — GRUB 커널 고정(인덱스 vs 이름) + apt-mark hold
- [[musl-static-binary]] — glibc 버전 불일치 해결, musl 정적 빌드
- [[smartctl]] — SMART 수집, -d sat / -d cciss,N, raw_value 파싱, sudoers 경로
- [[anaconda-text-install]] — Rocky/RHEL 텍스트 설치: inst.text nomodeset, r refresh, 설치 소스 의미
- [[conda-breaks-system-dnf]] — conda가 LD_LIBRARY_PATH 점유 → 시스템 dnf libsolv 충돌, `env -u LD_LIBRARY_PATH dnf` 우회

## 스토리지 & 마운트

- [[fstab-uuid-mount]] — fstab은 UUID로(raw 디바이스명 금지), NVMe 디바이스명 변동·`nofail` 함정
- [[systemd-automount-watchdog]] — automount 환경 마운트 watchdog: mountpoint+timeout stat, stale 복구, hang 방어

---

## 관련

- [[lustre-overview]] — Lustre 파일시스템 (KVM VM 기반 테스트 환경)
- [[network-overview]] — 물리 링크·스위치·NIC 진단과 구성
- [[dx-overview]]

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

- [[ssh-key-auth]] — SSH 키 인증 설정 (Ubuntu ↔ Mac 양방향)
- [[ssh-config-alias]] — SSH config Host alias로 접속 정보 재사용
- [[dns-hosts-emergency-bypass]] — DNS 장애 시 hosts 파일로 서비스 도메인 긴급 우회
- [[iptables-nat]] — NAT/MASQUERADE 설정, VM 인터넷 연결
- [[network-bridge]] — 가상 브리지 설정, STP
- [[qemu-bridge-helper-acl]] — virt-install용 qemu-bridge-helper ACL 허용
- [[vpn-tailscale]] — VPN & Tailscale 인덱스
- [[vpn-fundamentals]] — VPN 원리(vNIC/캡슐화/터널링), 분할 vs 전체 터널링
- [[tailscale]] — Tailscale 특징·설치·명령어·일반 VPN 비교
- [[tailscale-lan-mdns-fallback-pitfall]] — 원격 데스크톱이 LAN 자동검색으로 "되는 줄" 착각하는 함정
- [[wireguard]] — WireGuard 설치·설정

## 보안 & 인증

- [[sso]] — SSO 개념(IdP/SP 역할·선택 기준·이점)
- [[saml]] — SAML XML Assertion 흐름
- [[oidc]] — OIDC ID Token(JWT) 로그인 흐름
- [[oauth2]] — OAuth 2.0 Access Token 위임 흐름
- [[selinux-confined-daemon-ocf-ra]] — confined SELinux 도메인이 실행하는 OCF/RA rc=1 실패 진단

## 가상화

- [[kvm-libvirt]] — KVM/libvirt 설치, virt-install, virsh 명령어
- [[qemu-session-vs-system]] — qemu:///session vs system 차이·전환·마이그레이션
- [[libvirt-guest-rename-namespaces]] — VM 리네임 시 이름 공간 4개 체크리스트
- [[proxmox-virtualization]] — Proxmox VE, REST API 외부 제어, 대안 지형
- [[vm-management-scope]] — 단일호스트 VM 관리 vs 멀티노드 HA 클러스터 난이도 구분
- [[idrac-ipmi]] — Dell 서버 원격 관리, ipmitool로 iDRAC IP 설정
- [[idrac-virtual-media-install-pitfalls]] — 가상 미디어 OS 설치 함정(Map Device·F11·cold boot)
- [[redfish-webui-verification]] — BMC 웹 UI ↔ Redfish 교차검증

## 시스템

- [[systemd-service]] — 서비스 파일 작성·주요 명령어
- [[shell-sigtstp-background]] — 터미널 SIGTSTP로 백그라운드 프로세스가 정지되는 문제
- [[shell-heredoc-pitfall]] — heredoc을 `&&`로 이어붙이면 종결자 오염, write 후 read-back 검증
- [[systemd-user-timer]] — user 타이머 무인 주기 작업: Persistent+linger, XDG_RUNTIME_DIR
- [[linux-permissions]] — rwx 권한, sticky bit, setuid/setgid
- [[dkms]] — 커널 업데이트 시 모듈 자동 재빌드
- [[grub-kernel-pinning]] — GRUB 커널 고정(인덱스 vs 이름) + apt-mark hold
- [[musl-static-binary]] — glibc 버전 불일치 해결, musl 정적 빌드
- [[smartctl]] — SMART 수집 기본 명령어, sudoers 경로
- [[smartctl-device-type-sat-cciss]] — `-d sat` vs `-d cciss,N` 디바이스 타입 선택
- [[smartctl-raw-value-parsing]] — RAW_VALUE 컬럼 파싱 함정
- [[anaconda-text-install]] — Rocky/RHEL 텍스트 설치: inst.text nomodeset
- [[conda-breaks-system-dnf]] — conda가 시스템 dnf libsolv 충돌, `env -u LD_LIBRARY_PATH dnf` 우회
- [[el-kernel-swap-safety]] — 벤더 패치커널 스왑 전 확인, 안 하면 dracut emergency
- [[server-fan-noise-bmc-diagnosis]] — 서버 팬 폭음 진단: 온도+BMC 팬정책, 1U baseline 오해 주의

## 스토리지 & 마운트

- [[fstab-uuid-mount]] — fstab은 UUID로(raw 디바이스명 금지), NVMe 변동·`nofail` 함정
- [[disk-by-id-canonicalize-pitfall]] — by-id 심링크를 canonicalize로 풀어버리는 안티패턴
- [[systemd-automount-watchdog]] — automount 마운트 watchdog: stale 복구·hang 방어
- [[storcli-eall-sall-boot-disk]] — 컨트롤러 일괄 범위(eall/sall) 명령이 부팅 디스크까지 전환하는 함정

---

## 관련

- [[lustre-overview]] — Lustre 파일시스템 (KVM VM 기반 테스트 환경)
- [[network-overview]] — 물리 링크·스위치·NIC 진단과 구성
- [[dx-overview]]

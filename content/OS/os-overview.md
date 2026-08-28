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

## 용어

OS 노트 전반에서 반복되는 약어. 개별 노트에서 처음 만나면 여기로 돌아온다.

**서버 원격 관리 (OS가 죽어도 접근하는 경로)**

| 표기 | 원어 | 뜻 |
|---|---|---|
| BMC | Baseboard Management Controller | 메인보드에 붙어 OS와 독립적으로 동작하는 관리 칩. 아래 iDRAC·XCC·iLO는 모두 그 구현체 |
| iDRAC | integrated Dell Remote Access Controller | Dell 서버의 BMC |
| XCC | XClarity Controller | Lenovo 서버의 BMC |
| iLO | integrated Lights-Out | HP 서버의 BMC |
| IPMI | Intelligent Platform Management Interface | BMC를 제어하는 표준 인터페이스(`ipmitool`) |
| Redfish | — | IPMI를 대체하는 REST 기반 관리 표준 |

**배포판 · 패키징 · 부팅**

| 표기 | 원어 | 뜻 |
|---|---|---|
| RHEL | Red Hat Enterprise Linux | Red Hat의 상용 리눅스 |
| EL8 / EL9 | Enterprise Linux 8 / 9 | RHEL과 그 호환 배포판(Rocky, Alma) 계열 버전 |
| RPM | RPM Package Manager | RHEL 계열 패키지 형식·도구 (원래 Red Hat Package Manager) |
| DKMS | Dynamic Kernel Module Support | 커널이 바뀌면 외부 모듈을 자동 재빌드하는 장치 → [[dkms]] |
| GRUB | GRand Unified Bootloader | 리눅스 부트로더 → [[grub-kernel-pinning]] |
| BIOS | Basic Input/Output System | 펌웨어 초기화 단계. 요즘은 UEFI가 대신하지만 관행상 BIOS라 부른다 |
| ISO | — | 광학 디스크 이미지 파일(ISO 9660 형식) |

**가상화 · 스토리지**

| 표기 | 원어 | 뜻 |
|---|---|---|
| KVM | Kernel-based Virtual Machine | 리눅스 커널 내장 하이퍼바이저 → [[kvm-libvirt]] |
| QEMU | Quick Emulator | 가상 하드웨어를 제공하는 에뮬레이터. KVM과 짝으로 쓴다 |
| LVM | Logical Volume Manager | 물리 디스크를 논리 볼륨으로 추상화하는 리눅스 계층 |
| UUID | Universally Unique Identifier | 장치·객체를 유일하게 식별하는 값. fstab은 이걸로 적는다 → [[fstab-uuid-mount]] |
| NVMe | Non-Volatile Memory express | PCIe에 직접 붙는 SSD 규격. 디바이스명이 부팅마다 바뀔 수 있다 |
| SMART | Self-Monitoring, Analysis and Reporting Technology | 디스크 자기진단 기능 → [[smartctl]] |

**보안 · 인증**

| 표기 | 원어 | 뜻 |
|---|---|---|
| SELinux | Security-Enhanced Linux | 프로세스가 접근할 수 있는 대상을 레이블로 강제하는 커널 보안 모듈 |
| AVC | Access Vector Cache | SELinux의 접근 판정 캐시. 거부 로그가 `avc: denied`로 찍힌다 |
| OCF / RA | Open Cluster Framework / Resource Agent | 클러스터가 자원을 시작·정지·감시할 때 호출하는 표준 스크립트 규약 |
| SAML | Security Assertion Markup Language | XML 기반 SSO 표준 → [[saml]] |
| IdP / SP | Identity Provider / Service Provider | 신원을 증명하는 쪽 / 그 증명을 받아 로그인시키는 쪽 |

**네트워크 · 원격 접속**

| 표기 | 원어 | 뜻 |
|---|---|---|
| NIC | Network Interface Card | 네트워크 인터페이스(랜카드) |
| VPN | Virtual Private Network | 공용망 위에 암호화 터널을 만들어 사설망처럼 쓰는 기술 → [[vpn-fundamentals]] |
| vNIC | virtual NIC | VPN·가상화가 만드는 가상 네트워크 인터페이스 |
| LAN | Local Area Network | 같은 구내망(사무실·집 내부 네트워크) |
| mDNS | multicast DNS | DNS 서버 없이 같은 LAN 안에서 이름을 찾는 방식. LAN 밖에서는 동작하지 않는다 |
| NAT | Network Address Translation | 주소 변환. `MASQUERADE`는 iptables에서 출발지 주소를 나가는 인터페이스 주소로 바꾸는 NAT 규칙 이름이다 |
| ACL | Access Control List | 접근 제어 목록(무엇을 허용/차단하는지 나열한 규칙) |
| REST | Representational State Transfer | HTTP 메서드와 URL로 자원을 다루는 API 양식 |
| LDAP | Lightweight Directory Access Protocol | 사용자·조직 정보를 담은 디렉터리 서비스 조회 프로토콜 |
| SSO | Single Sign-On | 한 번 로그인으로 여러 서비스를 쓰는 방식 → [[sso]] |
| VNC / vKVM | Virtual Network Computing / virtual KVM | 원격 화면 공유 방식 / BMC가 제공하는 원격 콘솔 |

**디스크 인터페이스 · 기타**

| 표기 | 원어 | 뜻 |
|---|---|---|
| SATA / SAS | Serial ATA / Serial Attached SCSI | 디스크 연결 규격. SAS가 서버용 상위 규격이다 |
| SCSI | Small Computer System Interface | 오래된 스토리지 명령 체계. 지금도 프로토콜 계층으로 남아 `-d sat` 같은 옵션에 등장한다 → [[smartctl-device-type-sat-cciss]] |
| AHCI | Advanced Host Controller Interface | SATA 컨트롤러 표준 동작 모드 |
| WWN | World Wide Name | 스토리지 장치에 부여되는 전역 고유 식별자 |
| VE | Virtual Environment | Proxmox VE 제품명의 일부 |
| HA | High Availability | 고가용성. 한 노드가 죽어도 서비스가 이어지는 구성 → [[ha-overview]] |
| GUI | Graphical User Interface | 그래픽 화면 인터페이스 |
| XML | Extensible Markup Language | 태그 기반 데이터 형식. libvirt 도메인 정의와 SAML이 이 형식이다 |
| GNU | GNU's Not Unix | 자유 소프트웨어 프로젝트 이름(재귀 약어). `GNU tar`처럼 구현체를 구분할 때 쓴다 |
| SIGTSTP / SIGPIPE / SIGKILL | signal: terminal stop / broken pipe / kill | 프로세스에 보내는 시그널. 각각 터미널 정지(`Ctrl+Z`), 읽는 쪽이 사라진 파이프에 쓰기, 강제 종료 |

인증 약어(JWT·OIDC·RBAC·CSRF 등)는 [[auth-overview]], 물리 링크·스위치 약어(L1/L2/L3·LACP·STP·SNI 등)는 [[network-overview]]의 용어 표 참고.

---

## 네트워크 & 원격 접속

- [[ssh-key-auth]] — SSH 키 인증 설정 (Ubuntu ↔ Mac 양방향)
- [[ssh-config-alias]] — SSH config Host alias로 접속 정보 재사용
- [[ssh-n-stdin-truncation]] — `ssh -n`이 표준입력을 끊어 파일이 0바이트로 배포되고도 성공으로 보인다
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
- [[selinux-unlabeled-mount-no-avc]] — `unlabeled_t` 마운트 접근 차단이 AVC 로그를 안 남긴다, 경로만 바꿔 가르는 분리 실험

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
- [[pipefail-grep-q-sigpipe]] — `producer | grep -q`가 pipefail+SIGPIPE로 "찾았을 때 실패"하는 역전
- [[process-substitution-hides-exit-code]] — `while … done < <(cmd)` 는 생산자 종료 코드를 안 봐서, 중간에 죽어도 부분 출력이 완주로 읽힌다
- [[filename-nul-boundary]] — 파일 이름 경계는 개행이 아니라 NUL, 목록·정렬·대조·세기 전부 바꿔야 한다
- [[cli-output-locale-translated-header]] — CLI 출력 헤더는 로케일 번역됨, 컬럼명 매칭 금지 · 위치 파싱
- [[kernel-ring-buffer-overflow-counting]] — 커널 링 버퍼가 넘치면 사건 수가 줄어 개선처럼 보인다
- [[debugfs-pseudo-file-read-buffer]] — 크기 0으로 보고되는 의사 파일을 작은 버퍼로 읽으면 EINVAL, `cat`은 되는데 코드만 실패
- [[sysfs-enotdir-vs-notfound]] — `/sys` 순회에서 파일 항목의 ENOTDIR을 안 걸러내면 라운드 전체가 실패
- [[systemd-user-timer]] — user 타이머 무인 주기 작업: Persistent+linger, XDG_RUNTIME_DIR
- [[systemd-unit-name-distro-variance]] — 유닛명이 배포판마다 다름(smb/smbd), `is-active`의 inactive가 "유닛 없음"을 숨긴다
- [[linux-permissions]] — rwx 권한, sticky bit, setuid/setgid
- [[systemd-umask-file-permission-drift]] — 서비스 umask(0077)와 대화형 셸(0022)이 달라 같은 코드가 다른 권한 파일을 만든다
- [[backup-strips-source-permissions]] — 백업 아카이브가 원본 640 보호를 벗겨 secret을 world-readable로 남기는 유출
- [[tar-root-restores-archived-modes]] — root 의 GNU tar 는 `-p`·`--same-owner` 가 기본이라 해제 전 하드닝이 되돌아간다
- [[rsync-delete-path-normalization]] — `--delete` 보호 목록은 경로 정규화 없이 뚫린다 + 원격 와일드카드는 셸에서 확장
- [[rsync-checksum-verify-cost]] — `--checksum` 은 전량 읽기, 안전 확인은 원본 삭제 직전 dry-run 패스에만
- [[binary-vs-decimal-byte-units]] — 1024 로 나눈 값에 TB 라벨을 붙이면 디스크 스펙과 어긋난다
- [[statvfs-used-vs-df-reserved-blocks]] — `used = total - bavail` 은 root 예약분을 사용으로 센다(`df` 와 어긋남, `used + free < total` 이 정상)
- [[dkms]] — 커널 업데이트 시 모듈 자동 재빌드
- [[grub-kernel-pinning]] — GRUB 커널 고정(인덱스 vs 이름) + apt-mark hold
- [[musl-static-binary]] — glibc 버전 불일치 해결, musl 정적 빌드
- [[smartctl]] — SMART 수집 기본 명령어, sudoers 경로
- [[smartctl-device-type-sat-cciss]] — `-d sat` vs `-d cciss,N` 디바이스 타입 선택
- [[smartctl-raw-value-parsing]] — RAW_VALUE 컬럼 파싱 함정
- [[smartctl-exit-status-bitmask]] — 종료코드는 비트마스크: Bit3~7 은 「디스크가 나쁘다」는 정상 신호라 `!= 0` 을 실패로 읽으면 나빠지는 순간 수집이 멈춘다
- [[sas-selftest-scsi-log-page]] — SAS 자기진단은 SMART 속성이 아니라 SCSI 로그 페이지(0x10), 전송 둘·파서 하나
- [[anaconda-text-install]] — Rocky/RHEL 텍스트 설치: inst.text nomodeset
- [[conda-breaks-system-dnf]] — conda가 시스템 dnf libsolv 충돌, `env -u LD_LIBRARY_PATH dnf` 우회
- [[el-kernel-swap-safety]] — 벤더 패치커널 스왑 전 확인, 안 하면 dracut emergency
- [[server-fan-noise-bmc-diagnosis]] — 서버 팬 폭음 진단: 온도+BMC 팬정책, 1U baseline 오해 주의

## 스토리지 & 마운트

- [[fstab-uuid-mount]] — fstab은 UUID로(raw 디바이스명 금지), NVMe 변동·`nofail` 함정
- [[disk-by-id-canonicalize-pitfall]] — by-id 심링크를 canonicalize로 풀어버리는 안티패턴
- [[systemd-automount-watchdog]] — automount 마운트 watchdog: stale 복구·hang 방어
- [[unmounted-path-looks-absent]] — 마운트가 빠지면 하위 전 경로가 "없음"으로 보인다, 정리 작업은 fail-closed 로
- [[storcli-eall-sall-boot-disk]] — 컨트롤러 일괄 범위(eall/sall) 명령이 부팅 디스크까지 전환하는 함정

---

## 관련

- [[lustre-overview]] — Lustre 파일시스템 (KVM VM 기반 테스트 환경)
- [[network-overview]] — 물리 링크·스위치·NIC 진단과 구성
- [[dx-overview]]

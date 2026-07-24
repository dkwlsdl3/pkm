---
title: KVM / libvirt 가상화
tags:
  - tech
created: 2026-05-11 (월)
---

# KVM / libvirt 가상화

> **TL;DR**: Linux KVM 기반 VM 생성·관리 — virt-install로 생성, virsh로 운영

---

## 설치

```bash
# 가상화 지원 확인 (0보다 크면 지원)
egrep -c '(vmx|svm)' /proc/cpuinfo
lsmod | grep kvm

# 패키지 설치
sudo apt update && sudo apt install -y \
  qemu-kvm libvirt-daemon-system libvirt-clients \
  bridge-utils virtinst virt-manager

# 그룹 설정 (재로그인 필요)
sudo usermod -aG libvirt $USER
sudo usermod -aG kvm $USER

# 동작 확인
sudo virsh list --all
```

---

## 네트워크 브리지 설정

VM들이 호스트 내부에서 통신하기 위한 가상 스위치 구성과 qemu-bridge-helper 권한 설정은 [[network-bridge]] 참고.

---

## VM 생성 (virt-install)

### 텍스트 모드 설치

```bash
virt-install \
  --name <vm-name> \
  --ram 4096 \
  --vcpus 4 \
  --disk path=$HOME/vms/<vm-name>.qcow2,size=50,format=qcow2 \
  --os-variant rhel8.0 \
  --network bridge=br-lnet,model=virtio \
  --location $HOME/iso/Rocky-8.10-x86_64-dvd1.iso \
  --graphics none \
  --extra-args "console=ttyS0,115200n8 inst.text"
```

> `--cdrom` 대신 `--location` 사용해야 `--extra-args`가 동작함.

### VNC 모드 설치

```bash
virt-install \
  --name <vm-name> \
  --ram 4096 \
  --vcpus 4 \
  --disk path=$HOME/vms/<vm-name>.qcow2,size=100,format=qcow2 \
  --os-variant rhel8.0 \
  --network bridge=br-lnet,model=virtio \
  --location $HOME/iso/Rocky-8.10-x86_64-dvd1.iso \
  --graphics vnc,listen=localhost
```

VNC 접속:
```bash
sudo apt install -y tigervnc-viewer
virsh vncdisplay <vm-name>   # 포트 확인
vncviewer localhost:5900
```

---

## virsh 주요 명령어

```bash
virsh list --all                    # 전체 VM 목록
virsh start <vm>                    # VM 시작
virsh shutdown <vm>                 # 정상 종료
virsh destroy <vm>                  # 강제 종료
virsh console <vm>                  # 시리얼 콘솔 접속 (Ctrl+] 로 탈출)
virsh autostart <vm>                # 호스트 부팅 시 자동 시작
virsh vncdisplay <vm>               # VNC 포트 확인

# 디스크 동적 추가
virsh attach-disk <vm> <disk.qcow2> vdb \
  --driver qemu --subdriver qcow2 --persistent

# user session (qemu:///session) 사용 시
virsh --connect qemu:///session list --all
```

### qemu:///session vs qemu:///system

session/system 연결 차이와 zvol 접근 등을 위한 system 전환·마이그레이션 절차는 [[qemu-session-vs-system]] 참고.

---

### virsh console 활성화 (GUI 설치된 VM)

GUI 모드로 설치된 VM은 virsh console 기본 불가. VM 내부에서 활성화:

```bash
systemctl enable --now serial-getty@ttyS0.service
grubby --update-kernel=ALL --args="console=ttyS0,115200n8"
```

---

## VM 인터넷 연결

내부 네트워크의 VM이 외부 인터넷에 접근하기 위한 iptables NAT 설정은 [[iptables-nat]] 참고.

---

## nmcli 네트워크 설정 (VM 내부)

GUI 설치 후 네트워크가 저장되지 않은 경우:

```bash
nmcli con mod enp1s0 ipv4.method manual \
  ipv4.addresses <IP>/24 \
  ipv4.gateway <GW> \
  ipv4.dns <DNS_IP> \
  connection.autoconnect yes
nmcli con up enp1s0
```

---

---

## scsi_debug — 개발환경 가상 디스크 생성

실제 디스크 없이 풀 생성 테스트 등에 사용. 커널 모듈로 가상 SCSI 디스크를 만들어 `/dev/sdX`로 노출.

```bash
# 가상 디스크 4개 생성 (각 512MB)
sudo modprobe scsi_debug num_tgts=4 dev_size_mb=512 sector_size=512

# /dev/sdX 형태로 자동 인식됨
lsblk

# 제거
sudo modprobe -r scsi_debug
```

> 모니터링 데몬이 주기적으로 sysfs를 스캔하는 경우 디바이스 생성/제거가 자동 감지된다.

---

## 관련

- [[network-bridge]]
- [[iptables-nat]]
- [[qemu-session-vs-system]]
- [[ssh-key-auth]]
- [[lustre-overview]]
- [[smartctl]]

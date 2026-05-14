---
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

## 네트워크 브리지 설정 (netplan)

VM들이 호스트 내부에서 통신하기 위한 가상 스위치.

```yaml
# /etc/netplan/01-network-manager-all.yaml
network:
  version: 2
  renderer: NetworkManager
  bridges:
    br-lnet:
      addresses:
        - 172.25.0.1/24
      parameters:
        stp: false
        forward-delay: 0
```

```bash
sudo chmod 600 /etc/netplan/01-network-manager-all.yaml
sudo netplan apply
ip addr show br-lnet
```

### qemu-bridge-helper 권한 설정

브리지 사용 VM 생성 전 반드시 설정. 없으면 `failed to parse default acl file` 오류 발생.

```bash
sudo mkdir -p /etc/qemu
echo "allow br-lnet" | sudo tee /etc/qemu/bridge.conf
sudo chmod 644 /etc/qemu/bridge.conf
sudo chmod u+s /usr/lib/qemu/qemu-bridge-helper
```

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
  --graphics vnc,listen=127.0.0.1
```

VNC 접속:
```bash
sudo apt install -y tigervnc-viewer
virsh vncdisplay <vm-name>   # 포트 확인
vncviewer 127.0.0.1:5900
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

### virsh console 활성화 (GUI 설치된 VM)

GUI 모드로 설치된 VM은 virsh console 기본 불가. VM 내부에서 활성화:

```bash
systemctl enable --now serial-getty@ttyS0.service
grubby --update-kernel=ALL --args="console=ttyS0,115200n8"
```

---

## VM 인터넷 연결 (iptables NAT)

내부 네트워크의 VM이 외부 인터넷에 접근해야 할 때.

```bash
# IP 포워딩 활성화
sudo sysctl -w net.ipv4.ip_forward=1

# NAT 설정 (enp4s0 = 호스트 외부 인터페이스)
sudo iptables -t nat -A POSTROUTING -s 172.25.0.0/24 -o enp4s0 -j MASQUERADE
sudo iptables -A FORWARD -i br-lnet -o enp4s0 -j ACCEPT
sudo iptables -A FORWARD -i enp4s0 -o br-lnet -m state --state RELATED,ESTABLISHED -j ACCEPT
```

---

## nmcli 네트워크 설정 (VM 내부)

GUI 설치 후 네트워크가 저장되지 않은 경우:

```bash
nmcli con mod enp1s0 ipv4.method manual \
  ipv4.addresses <IP>/24 \
  ipv4.gateway <GW> \
  ipv4.dns 8.8.8.8 \
  connection.autoconnect yes
nmcli con up enp1s0
```

---

## 관련

- [[ssh-key-auth]]
- [[lustre-overview]]

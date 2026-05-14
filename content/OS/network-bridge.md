---
tags:
  - tech
created: 2026-05-14 (목)
---

# 네트워크 브리지

> **TL;DR**: 소프트웨어로 만든 스위치 — VM들을 같은 네트워크에 묶어주는 가상 허브

---

## 개념

브리지(bridge) = 2계층(L2) 소프트웨어 스위치.

물리 스위치 없이 호스트 내 VM/컨테이너들이 서로 통신하거나, 호스트 물리 인터페이스에 연결해 외부 네트워크와 직접 통신하게 만드는 장치.

```
br-lnet (172.25.0.1/24)
  ├── meta VM  (172.25.0.10)
  ├── oss1 VM  (172.25.0.11)
  └── oss2 VM  (172.25.0.12)
```

---

## Ubuntu netplan 설정

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
        stp: false       # VM 전용 내부망이므로 루프 없음 → STP 불필요
        forward-delay: 0 # STP 비활성화 시 딜레이도 0으로
```

```bash
sudo netplan apply
ip addr show br-lnet
```

---

## STP (Spanning Tree Protocol)

브리지 루프(패킷이 무한 순환) 방지 프로토콜. 물리 네트워크에서 필요하지만 VM 전용 내부망에서는 불필요 → `stp: false`로 비활성화하면 부팅 시 포워딩 딜레이(기본 15초) 없앨 수 있음.

---

## QEMU 브리지 허용 설정

virt-install이 br-lnet을 사용하려면 QEMU ACL 파일에 허용 등록 필요:

```bash
sudo mkdir -p /etc/qemu
echo "allow br-lnet" | sudo tee /etc/qemu/bridge.conf
sudo chmod u+s /usr/lib/qemu/qemu-bridge-helper
```

없으면 `failed to parse default acl file` 오류 발생.

---

## 관련

- [[kvm-libvirt]]
- [[iptables-nat]]
- [[os-overview]]

---
title: QEMU 브리지 헬퍼 ACL
tags:
  - tech
created: 2026-05-14 (목)
---

# QEMU 브리지 헬퍼 ACL

> **TL;DR**: virt-install이 네트워크 브리지를 쓰려면 QEMU ACL 파일에 허용 등록이 필요하다

---

virt-install이 br-lnet을 사용하려면 QEMU ACL 파일에 허용 등록 필요:

```bash
sudo mkdir -p /etc/qemu
echo "allow br-lnet" | sudo tee /etc/qemu/bridge.conf
sudo chmod u+s /usr/lib/qemu/qemu-bridge-helper
```

없으면 `failed to parse default acl file` 오류 발생.

---

## 관련

- [[network-bridge]]
- [[kvm-libvirt]]

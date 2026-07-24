---
title: qemu:///session vs qemu:///system
tags:
  - tech
created: 2026-05-11 (월)
---

# qemu:///session vs qemu:///system

> **TL;DR**: libvirt 연결 URI 두 종류 — 사용자 권한(session) vs root 권한(system), zvol 등 접근 시 system 전환 필요

---

## 비교

| | session | system |
|---|---|---|
| QEMU 프로세스 권한 | 사용자 권한 | root 권한 |
| `/dev/zvol/` 접근 | 불가 | 가능 |
| 기본값 | X | O |

```bash
# ~/.zshrc에 추가하면 기본값 변경
export LIBVIRT_DEFAULT_URI=qemu:///session

# 또는 매번 명시
virsh --connect qemu:///session list --all
```

---

## session → system 마이그레이션

zvol attach 등 root 권한이 필요한 작업 시 system으로 이전 필요.

```bash
# 1. 기존 session VM XML dump
virsh -c qemu:///session dumpxml <vm> > /tmp/<vm>.xml

# 2. session VM 종료 및 제거
virsh -c qemu:///session destroy <vm>
virsh -c qemu:///session undefine <vm>

# 3. system에 등록 및 시작
virsh -c qemu:///system define /tmp/<vm>.xml
virsh -c qemu:///system start <vm>
```

---

## qemu.conf 설정

system QEMU가 사용자 홈 디렉토리의 qcow2 이미지에 접근하려면 `/etc/libvirt/qemu.conf` 수정 필요.

```
user = "admin"
group = "libvirt"
dynamic_ownership = 0
```

- `user = "admin"`: 사용자 홈 디렉토리 하위 qcow2 이미지 접근 허용
- `dynamic_ownership = 0`: 기존 파일 소유권 변경 방지

```bash
sudo systemctl restart libvirtd
```

---

## 관련

- [[kvm-libvirt]]

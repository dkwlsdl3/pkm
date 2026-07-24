---
title: Lustre 서버 설치 (EL8)
tags:
  - tech
created: 2026-05-12 (화)
---

# Lustre 서버 설치 (EL8)

> **TL;DR**: Rocky Linux 8 / RHEL 8 기준 MGS+MDT+OST Lustre 서버 구성 가이드

---

## 환경

- OS: Rocky Linux 8.10 (또는 RHEL 8.x)
- Lustre: 2.15.8 (Whamcloud 공식 패키지)
- 구성: meta VM (MGS+MDT) + oss1/oss2 VM (OST × 2)

---

## 1. Lustre 저장소 추가 및 패키지 설치

heredoc 들여쓰기 문제로 repo 파싱 실패할 수 있으므로 파일 직접 생성 후 배포 권장.

```bash
cat > /tmp/lustre.repo << 'EOF'
[lustre-server]
name=lustre-server
baseurl=https://downloads.whamcloud.com/public/lustre/lustre-2.15.8/el8.10/server/
gpgcheck=0
enabled=1

[e2fsprogs-wc]
name=e2fsprogs-wc
baseurl=https://downloads.whamcloud.com/public/e2fsprogs/latest/el8/
gpgcheck=0
enabled=1
EOF

# 각 서버에 배포 (예: scp 사용)
scp /tmp/lustre.repo root@<MGS_IP>:/etc/yum.repos.d/lustre.repo
scp /tmp/lustre.repo root@<OSS1_IP>:/etc/yum.repos.d/lustre.repo
```

설치 및 재부팅 (Lustre 전용 커널로 교체됨):
```bash
dnf install -y epel-release
dnf install -y lustre e2fsprogs
grub2-set-default 0
grub2-mkconfig -o /boot/grub2/grub.cfg
reboot
```

재부팅 후 Lustre 커널 확인:
```bash
uname -r  # 예: 4.18.0-553.82.1.el8_lustre.x86_64
```

---

## 2. Lustre 전용 디스크 추가

OS 디스크와 Lustre 데이터 디스크를 분리하는 이유: I/O 격리, 독립 확장, 운영환경 표준. KVM 환경에서 디스크를 추가하는 방법(`virsh attach-disk` 등)은 [[kvm-libvirt]] 참고.

---

## 3. Lustre 파일시스템 포맷 (mkfs.lustre)

```bash
# MGS + MDT (같은 서버에 구성 시)
mkfs.lustre --fsname=<fsname> --mgs --mdt --index=0 /dev/vdb

# OST (각 OSS 서버에서)
mkfs.lustre --fsname=<fsname> --ost --mgsnode=<MGS_IP>@tcp --index=0 /dev/vdb
mkfs.lustre --fsname=<fsname> --ost --mgsnode=<MGS_IP>@tcp --index=1 /dev/vdb
```

> `mkfs.lustre`는 디스크에 역할(MGS/MDT/OST), 소속 파일시스템, MGS 주소, 인덱스를 기록.
> OST 마운트 시 이 정보를 읽어 MGS에 자동 등록됨.

---

## 4. firewalld 비활성화 및 LNET 설정

LNET 미설정 또는 firewalld 차단 시 OST 마운트 타임아웃 발생.

```bash
# firewalld 비활성화 (개발 환경)
systemctl stop firewalld && systemctl disable firewalld

# LNET 로드
modprobe lustre      # MGS/MDS
modprobe lnet        # OSS
lctl network up
```

---

## 5. 마운트

```bash
# MDT
mkdir -p /mnt/mdt && mount -t lustre /dev/vdb /mnt/mdt

# OST
mkdir -p /mnt/ost0 && mount -t lustre /dev/vdb /mnt/ost0
```

자동 마운트 설정:
```bash
echo "lustre" > /etc/modules-load.d/lustre.conf
echo "/dev/vdb /mnt/mdt lustre defaults,_netdev 0 0" >> /etc/fstab
```

---

## 관련

- [[lustre-overview]]
- [[lustre-client-setup]]
- [[lustre-troubleshooting]]
- [[kvm-libvirt]]

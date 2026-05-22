---
title: Lustre 클라이언트 설치 (Ubuntu)
tags:
  - tech
created: 2026-05-12 (화)
---

# Lustre 클라이언트 설치 (Ubuntu)

> **TL;DR**: Ubuntu에서 Lustre 마운트 — Whamcloud pre-built 패키지가 특정 커널만 지원하므로 커널 버전 맞추기가 핵심

---

## 커널 버전 제약

Whamcloud는 Ubuntu 22.04용 클라이언트 패키지를 **특정 커널 버전**에 대해서만 pre-built 제공.

```
https://downloads.whamcloud.com/public/lustre/lustre-<버전>/ubuntu2204/client/
```

패키지 파일명 형식: `lustre-client-modules-<커널버전>_<lustre버전>_amd64.deb`

→ 현재 실행 중인 커널이 패키지 대상 커널과 다르면 **빌드 방식으로는 설치 불가** (kernel API 변경).  
→ 해결책: 커널을 패키지 기준에 맞게 다운그레이드.

> [!WARNING]
> 커널 다운그레이드 전 NVIDIA 드라이버, ZFS 등 DKMS 의존 패키지 영향 확인 필수.  
> DKMS는 커널 설치 시 자동으로 해당 커널용 모듈을 재빌드해주므로 대부분 무영향.

---

## 커널 다운그레이드 예시 (6.8 → 5.15.0-88)

```bash
# 1. 대상 커널 설치 (DKMS가 자동으로 5.15용 모듈 빌드)
sudo apt install -y linux-image-5.15.0-88-generic linux-headers-5.15.0-88-generic

# 2. GRUB 기본 부팅 커널 변경
#    /boot/grub/grub.cfg에서 UUID 확인 후 설정
sudo sed -i 's/GRUB_DEFAULT=0/GRUB_DEFAULT="gnulinux-advanced-<UUID>>gnulinux-5.15.0-88-generic-advanced-<UUID>"/' /etc/default/grub
sudo update-grub
sudo reboot
```

재부팅 후 확인:
```bash
uname -r        # 5.15.0-88-generic
nvidia-smi      # NVIDIA 드라이버 정상 로드 확인
```

---

## Lustre 클라이언트 패키지 설치

```bash
cd /tmp
# 버전에 맞는 URL에서 다운로드
wget https://downloads.whamcloud.com/public/lustre/lustre-2.15.8/ubuntu2204/client/lustre-client-modules-5.15.0-88-generic_2.15.8-1_amd64.deb
wget https://downloads.whamcloud.com/public/lustre/lustre-2.15.8/ubuntu2204/client/lustre-client-utils_2.15.8-1_amd64.deb

# 의존성 먼저 설치
sudo apt install -y libkeyutils-dev

sudo dpkg -i lustre-client-modules-5.15.0-88-generic_2.15.8-1_amd64.deb
sudo dpkg -i lustre-client-utils_2.15.8-1_amd64.deb

sudo modprobe lustre
```

---

## 마운트

```bash
sudo mkdir -p /mnt/lustre
sudo mount -t lustre <MGS_IP>@tcp:/<fsname> /mnt/lustre

# 마운트 확인
sudo lfs df /mnt/lustre
```

정상 출력 예시:
```
<fsname>-MDT0000_UUID    11601564     2452    10552184   1% /mnt/lustre[MDT:0]
<fsname>-OST0000_UUID    50541812     1256    47902732   1% /mnt/lustre[OST:0]
<fsname>-OST0001_UUID    50541812     1256    47902732   1% /mnt/lustre[OST:1]
```

---

## 재부팅 후 수동 복구 절차

fstab 미등록 상태에서 재부팅 후 매번 수행해야 하는 순서:

```bash
# 1. LNET 로드 및 NIC 설정
sudo modprobe lnet
sudo lnetctl lnet configure        # /etc/lnet.conf 적용
sudo lctl list_nids                # <HOST_LNET_IP>@tcp 확인

# lnet.conf가 파싱 실패하면 수동 추가
sudo lnetctl net add --net tcp --if br-lnet

# 2. Lustre 마운트
sudo mount -t lustre <MGS_IP>@tcp:/lustrefs /mnt/lustre
lfs df                             # MDT + OST 모두 출력 확인
```

> `lctl list_nids`에 아무것도 안 나오면 `/etc/lnet.conf`의 `net:` 최상위 키 확인 → [[lustre-troubleshooting]]

---

## fstab 자동 마운트 등록

```bash
# /etc/fstab 에 추가
<MGS_IP>@tcp:/lustrefs /mnt/lustre lustre defaults,_netdev 0 0
```

> [!WARNING]
> 클라이언트 fstab에는 `_netdev` 사용 가능. 단, 서버 타겟(MDT/OST) fstab에는 `nofail` 사용 불가 — ldiskfs 미인식 → [[lustre-troubleshooting#서버-타겟-fstab-nofail-불가]]

---

## 관련

- [[lustre-overview]]
- [[lustre-server-setup]]
- [[lustre-troubleshooting]]

---
tags:
  - tech
created: 2026-06-18 (목)
---

# GRUB 커널 고정 — 인덱스 vs 이름

> **TL;DR**: `GRUB_DEFAULT`를 인덱스(`"1>4"`)로 잡으면 커널이 추가될 때 밀려서 엉뚱한 커널로 부팅된다. 이름 기반 + `apt-mark hold`로 고정.

---

## 개요

- **무엇인가**: Ubuntu에서 특정 커널 버전으로 부팅을 고정하는 방법
- **왜 쓰는가**: ZFS/Lustre 등 DKMS·외부 모듈이 특정 커널(예: 5.15)에만 빌드돼 있어 자동 커널 업데이트로 부팅이 깨지는 것 방지
- **언제 쓰는가**: 커널 업데이트가 잦은데 특정 커널을 유지해야 하는 워크스테이션/서버

---

## 핵심 개념

### 1. 인덱스 기반의 함정
- `GRUB_DEFAULT="1>4"` = "Advanced options의 5번째 항목" (위치 기반)
- **새 커널이 설치되면 메뉴 순서가 밀려** 같은 인덱스가 다른 커널을 가리킴
- 예: 처음엔 `1>4`가 5.15였는데 6.8 커널 2개 추가 후 6.8.0-111을 가리킴

### 2. 이름 기반 고정 (권장)
```bash
# /etc/default/grub
GRUB_DEFAULT="Advanced options for Ubuntu>Ubuntu, with Linux 5.15.0-88-generic"
sudo update-grub
# 확인: grub.cfg의 set default= (들여쓰기 때문에 ^앵커 grep 주의)
grep "set default=" /boot/grub/grub.cfg
```

### 3. 자동 교체/제거 방지
```bash
sudo apt-mark hold linux-image-5.15.0-88-generic linux-headers-5.15.0-88-generic
# 불필요한 커널 + hwe 메타 제거 (hwe 메타가 살아있으면 새 커널 계속 설치됨)
sudo apt-get purge linux-image-6.8.0-* linux-image-generic-hwe-22.04
```

---

## 주의사항

> [!WARNING]
> - 변경 전 `/etc/default/grub` 백업(`grub.bak`).
> - 6.8 커널 제거 후 `/boot/vmlinuz` 심볼릭이 dangling 되면 5.15로 재지정.
> - 다른 디스크의 OS(os-prober가 잡은 항목)는 별개 — 메뉴의 `(on /dev/sdX)`는 그쪽 커널.
> - 변경 후 재부팅 전까지는 실제 부팅 검증이 안 된 상태.

---

## 관련

- [[os-overview]] — 서버·OS 관리
- [[zfs-overview]] — ZFS(커널 모듈 버전 의존 배경)

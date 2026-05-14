---
tags:
  - tech
created: 2026-05-14 (목)
---

# DKMS

> **TL;DR**: 커널 업데이트해도 서드파티 모듈이 자동으로 재빌드되게 해주는 프레임워크

---

## 개념

DKMS(Dynamic Kernel Module Support) — 커널 버전에 종속된 모듈을 소스코드 형태로 관리해서, 커널 업데이트 시 자동으로 재컴파일하는 시스템.

**왜 필요한가?**
커널 모듈(.ko 파일)은 특정 커널 버전에 종속. 커널 업데이트 시 기존 모듈이 로드 안 됨.
DKMS 없으면 업데이트마다 수동으로 모듈 재빌드 필요.

**사용 예:**
- NVIDIA 드라이버 (가장 흔한 케이스)
- ZFS
- VirtualBox 커널 모듈

---

## 동작 흐름

```
apt upgrade linux-image  →  DKMS 훅 실행
                         →  등록된 모듈 소스코드로 재컴파일
                         →  새 커널용 .ko 생성 → 자동 로드
```

---

## 주요 명령어

```bash
dkms status                          # 등록된 모듈 목록 및 상태
dkms build -m <모듈> -v <버전> -k <커널>  # 수동 빌드
dkms install -m <모듈> -v <버전>         # 설치
```

---

## 오류 사례: zfs-dkms

Ubuntu 22.04 + 커널 6.8에서 zfs-dkms 2.1.5 호환 오류:

```bash
# zfs 자체는 정상, dkms 패키지만 제거
sudo dpkg --remove --force-remove-reinstreq zfs-dkms
sudo apt install -f
```

---

## 관련

- [[os-overview]]

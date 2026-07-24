---
title: smartctl
tags:
  - tech
created: 2026-05-26 (화)
---

# smartctl

> SMART 데이터 수집 및 디스크 자가진단 CLI 도구

---

## 기본 명령어

```bash
# 디스크 정보 조회
smartctl -i /dev/sda
smartctl -d sat -i /dev/sda       # SAT 레이어 경유 (SATA 환경 권장)

# SMART 속성 + 건강 상태 조회
smartctl -A -H /dev/sda
smartctl -d sat -A -H /dev/sda

# selftest 시작
smartctl -d sat -t short /dev/sda
smartctl -d sat -t long /dev/sda

# selftest 결과 조회
smartctl -l selftest /dev/sda
```

---

디스크 컨트롤러별로 `-d` 옵션을 다르게 지정해야 하는 경우(AHCI `-d sat` vs smartpqi `-d cciss,N`)는 [[smartctl-device-type-sat-cciss]] 참고.

RAW_VALUE 컬럼 파싱 시 last index 파싱이 실패하는 이유는 [[smartctl-raw-value-parsing]] 참고.

---

## sudoers NOPASSWD 설정

```bash
# 실제 경로 먼저 확인 (usr/bin이 아닌 usr/sbin인 경우 있음)
which smartctl   # → /usr/sbin/smartctl

# sudoers 등록
echo "admin ALL=(ALL) NOPASSWD: /usr/sbin/smartctl" | sudo tee /etc/sudoers.d/smartctl-nopasswd
```

> `/usr/bin/smartctl`과 `/usr/sbin/smartctl` 경로가 다르면 NOPASSWD가 적용되지 않음.

---

## 관련

- [[smartctl-device-type-sat-cciss]]
- [[smartctl-raw-value-parsing]]
- [[kvm-libvirt]]
- [[os-overview]]

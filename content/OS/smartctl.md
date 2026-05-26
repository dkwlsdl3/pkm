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

## SATA Direct (-d sat)

Ubuntu 22.04 + AHCI 컨트롤러 환경에서 SG_IO ioctl 방식은 SAT(SCSI-ATA Translation) 레이어를 통과하지 못해 실패. `-d sat` 옵션으로 SAT 레이어를 명시적으로 지정.

```bash
smartctl -d sat -i /dev/sda
smartctl -d sat -A -H /dev/sda
smartctl -d sat -t short /dev/sda
```

---

## SmartPQI 컨트롤러 (-d cciss,N)

Microchip SmartRAID 9350-8i 등 smartpqi 드라이버 환경에서는 `-d scsi`가 아닌 `-d cciss,N`만 동작.

```bash
# 컨트롤러 감지
cat /sys/class/scsi_host/host*/proc_name   # "smartpqi" 출력 확인

# 디스크별 조회 (N = 0, 1, 2, ...)
smartctl -d cciss,0 -i /dev/sda
smartctl -d cciss,0 -A -H /dev/sda
smartctl -d cciss,0 -t short /dev/sda
smartctl -d cciss,0 -l selftest /dev/sda
```

> `smartctl --scan`이 `-d scsi`로 반환해도 실제로는 `-d cciss,N`만 동작하는 경우 있음.

---

## raw_value 파싱 주의

`smartctl -A` 출력의 RAW_VALUE는 **9번째 컬럼(parts[9])**. 뒤에 괄호 부가정보가 붙는 경우 last index 파싱은 실패.

```
ID# ATTRIBUTE_NAME  FLAG  VALUE WORST THRESH TYPE    UPDATED WHEN_FAILED RAW_VALUE
194 Temperature     0x22  038   046   000    Old_age Always  -           38 (0 15 0 0 0)
  9 Power_On_Hours  0x32  080   080   000    Old_age Always  -           18216 (42 215 0)
```

```rust
// 올바른 파싱
let raw_value = parts[9].replace(',', "").parse::<u64>().unwrap_or(0);

// 잘못된 파싱 — "0)" → parse 실패 → 0
let raw_value = parts[parts.len() - 1].parse::<u64>().unwrap_or(0);
```

---

## sudoers NOPASSWD 설정

```bash
# 실제 경로 먼저 확인 (usr/bin이 아닌 usr/sbin인 경우 있음)
which smartctl   # → /usr/sbin/smartctl

# sudoers 등록
echo "admin ALL=(ALL) NOPASSWD: /usr/sbin/smartctl" | sudo tee /etc/sudoers.d/keeper-smartctl
```

> `/usr/bin/smartctl`과 `/usr/sbin/smartctl` 경로가 다르면 NOPASSWD가 적용되지 않음.

---

## 관련

- [[kvm-libvirt]]
- [[os-overview]]

---
title: smartctl 디바이스 타입 지정 (-d sat vs -d cciss,N)
tags:
  - tech
created: 2026-05-26 (화)
---

# smartctl 디바이스 타입 지정 (-d sat vs -d cciss,N)

> **TL;DR**: AHCI 환경은 `-d sat`, smartpqi(SmartRAID) 환경은 `-d cciss,N`을 명시해야 SMART 조회가 동작한다.

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

## 관련

- [[smartctl]]

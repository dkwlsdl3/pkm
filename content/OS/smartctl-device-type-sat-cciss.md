---
title: smartctl 디바이스 타입 지정 (-d sat vs -d cciss,N)
tags:
  - tech
created: 2026-05-26 (화)
---

# smartctl 디바이스 타입 지정 (-d sat vs -d cciss,N)

> **TL;DR**: AHCI 환경은 `-d sat`, smartpqi(SmartRAID) 환경은 `-d cciss,N`을 명시해야 SMART 조회가 동작한다. **어느 하나로 고정하면 다른 전송 타입의 디스크에서 전량 실패**하므로, 수집기는 `--scan-open`으로 전송 타입을 먼저 판별해야 한다.

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

## ⚠️ `-d` 고정 호출은 다른 전송 타입에서 전량 실패한다

수집 데몬이 `-d sat`을 **하드코딩**해 두면 SAS 디스크에는 ATA 명령이 나가 매 주기 `exit 2`("unsupported scsi opcode")로 실패한다. 증상이 조용하다 — 조회가 죽는 게 아니라 **시리얼이 빈 문자열로 남고 SMART 상태행이 아예 생기지 않는다.** 화면에는 디스크가 보이는데 건강·온도만 비어 있다.

```bash
# 전송 타입 판별 (1회 호출로 전 디스크)
smartctl --scan-open
# /dev/sda -d scsi   # SAS
# /dev/sdb -d sat    # SATA
# /dev/nvme0 -d nvme
```

- ⚠️`--scan-open`은 같은 물리 디스크를 **컨트롤러 경유 경로로 한 번 더 낸다**(`/dev/bus/0`). 걸러내지 않으면 **이중 등록**이 판별 단계에서 재발한다 — 블록장치 접두(`/dev/sd*`)만 취한다
- 판별 결과는 **전용 컬럼에 저장**한다. 화면 표시용 문자열(`'SAS (MegaRAID:9)'` 등)에 의미를 겸용시키면, 그 문자열을 파싱하는 곳이 늘어날수록 판정과 표시가 엇갈린다
- 자기진단(self-test) 분기도 같은 판정을 써야 한다. `device_type` 문자열에 `"SAS"`가 들어있는지로 분기하면, sysfs vendor가 그대로 들어간 블록장치 행(`HGST`·`SEAGATE`)에서는 SAS 판정이 안 돼 ATA 경로로 간다

### SAS SMART를 SG_IO로 직접 조회하기

RAID 컨트롤러 ioctl 없이 블록장치에 SCSI 명령(LOG SENSE `0x4D`, READ DEFECT DATA `0xB7`)을 직접 보내도 같은 바이트를 얻는다. 전송 계층만 바꾸는 것이므로 **해석 함수는 그대로 재사용**한다 — 두 경로가 같은 함수를 쓰면 값이 갈라질 수 없다.

> "SG_IO는 실패한다"는 통념은 **ATA 명령을 SAT 계층에 보낸 경우**에 대한 것이다. SCSI 명령을 SCSI 장치에 보내는 경로는 계층 변환이 없어 해당하지 않는다.

```bash
sg_logs -p 0x0d /dev/sdj    # 온도 페이지 — 데몬이 받는 바이트와 대조 가능
```

---

## 관련

- [[smartctl]]
- [[smartctl-raw-value-parsing]] — 원시값 해석 함정(페이지를 잘못 읽으면 그럴듯한 오답이 나온다)
- [[storcli-eall-sall-boot-disk]]
- [[dual-writer-no-owner-of-record]] — 두 수집 경로가 같은 대상을 각자 등록하는 구조

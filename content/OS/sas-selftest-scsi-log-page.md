---
title: SAS 디스크 자기진단은 SMART 속성이 아니라 SCSI 로그 페이지로 읽는다
tags:
  - tech
  - troubleshooting
created: 2026-08-18 (화)
---

# SAS 디스크 자기진단은 SMART 속성이 아니라 SCSI 로그 페이지로 읽는다

## 용어

| 표기 | 원어 | 뜻 |
|---|---|---|
| SAS | Serial Attached SCSI | SCSI 명령을 쓰는 서버용 디스크 인터페이스. SATA 와 명령 체계가 다르다 |
| SATA | Serial ATA | ATA 명령을 쓰는 일반 디스크 인터페이스 |
| SMART | Self-Monitoring, Analysis and Reporting Technology | 디스크 자가 진단·상태 보고 규격 |
| CDB | Command Descriptor Block | SCSI 명령을 담는 바이트 묶음 |
| SG_IO | SCSI Generic I/O | 리눅스에서 블록 장치에 SCSI 명령을 직접 보내는 ioctl 인터페이스 |
| HBA | Host Bus Adapter | 디스크를 호스트에 붙이는 어댑터. RAID 없이 낱개로 노출하는 모드가 있다 |

> **TL;DR**: ATA(SATA) 디스크의 "SMART 속성 표" 를 SAS 에서 찾으면 없다. SAS 는 **로그 페이지**로 답한다 — 자기진단 이력은 **페이지 0x10(Self-Test Results)**. 그리고 같은 디스크라도 **RAID 컨트롤러 경유냐 블록 장치 직결이냐에 따라 전송 방법만 다르고 받는 바이트는 같다** — 그래서 **전송 계층과 해석(파서) 을 분리**해야 경로마다 이력이 달라지지 않는다.

---

## 증상

RAID 컨트롤러 없이(HBA·직결) 붙은 SAS 디스크에서 **자기진단 시작이 거부**되고,
화면의 진단 이력이 비어 있다. 같은 모델이 컨트롤러 뒤에 붙어 있을 때는 정상 동작한다.

## 원인

두 가지가 겹쳐 있다.

1. **명령 체계가 다르다.** ATA 는 속성 ID·raw 값 표를 돌려주지만, SAS 는 `LOG SENSE` 로
   **페이지 번호를 지정해** 구조화된 응답을 받는다. 자기진단 이력은 페이지 **0x10**.
2. **전송 경로가 둘이다.** 컨트롤러 뒤의 디스크는 컨트롤러 전용 ioctl 로 CDB 를 감싸 보내고,
   직결 디스크는 블록 장치에 **SG_IO** 로 같은 CDB 를 보낸다. 구현이 컨트롤러 경로만
   갖고 있으면 직결 디스크는 "지원하지 않음" 으로 떨어진다.

## 해결

**전송과 해석을 분리한다.** 두 경로가 같은 CDB 로 같은 페이지를 받으므로 파서는 하나여야 한다.

```rust
/// SAS 자기진단 로그 페이지(0x10) 응답을 이력 항목으로 해석한다.
///
/// ⚠️ 전송 계층과 분리해 둔 이유: 컨트롤러 경유(ioctl)와 블록장치 직결(SG_IO)이
/// 같은 CDB 로 같은 페이지를 받는다. 해석이 두 벌이 되면 같은 디스크의 진단 이력이
/// 경로마다 달라진다.
pub fn parse_sas_selftest_log(buffer: &[u8]) -> Result<Vec<SelfTestLogEntry>> { ... }

/// 첫 항목으로 "진행 중인가" 를 판정한다. 반환 = (진행 중, 남은 비율)
/// ⚠️ 남은 비율은 항상 0 이다 — 이 페이지에 그 값이 없다. 표시에는 이력 값을 쓴다
pub fn sas_selftest_in_progress(buffer: &[u8]) -> (bool, u8) { ... }
```

```bash
# 확인용 — 전송 방식(-d)만 다르고 보는 정보는 같다
smartctl -l selftest -d scsi /dev/sdX          # 직결
smartctl -l selftest -d megaraid,N /dev/sdY    # 컨트롤러 경유
```

## 주의

> [!WARNING]
> **"남은 비율" 을 이 페이지에서 기대하지 마라.** 진행 중 판정에는 쓸 수 있지만 진척률 값은
> 없다. 없는 값을 0 으로 채워 화면에 내보내면 "0% 남음 = 곧 끝남" 으로 오해된다.

> [!WARNING]
> **조회 실패와 "진행 중 아님" 을 같은 값으로 돌려주는 기존 규약이 있다면, 새 경로만 고치지 마라.**
> 두 전송 경로가 같은 규약을 따라야 하므로, 바꾸려면 양쪽을 함께 바꾼다.

> [!WARNING]
> **동작시간(Power On Hours)도 경로마다 다른 자리에서 나온다.** 정본을 하나로 정하지 않으면
> 화면 값과 실제가 어긋난다 → [[smartctl-raw-value-parsing]]

---

## 관련

- [[smartctl]]
- [[smartctl-device-type-sat-cciss]]
- [[smartctl-raw-value-parsing]]
- [[storcli-eall-sall-boot-disk]]
- [[zfs-hba-vs-hwraid]]

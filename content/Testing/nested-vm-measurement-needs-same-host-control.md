---
title: 중첩 VM 측정값은 같은 호스트 대조군 없이 실물 예상치로 쓸 수 없다
tags:
  - tech
  - troubleshooting
created: 2026-11-02 (월)
---

# 중첩 VM 측정값은 같은 호스트 대조군 없이 실물 예상치로 쓸 수 없다

> **TL;DR**: VM 안의 VM(예: Linux 호스트 → Windows VM → WSL2)에서 잰 처리량을 실물 Windows의 예상치로 쓰면 안 된다. 실측에서 실물이 **1.96배~3.06배** 빨랐다. 비교하려면 **같은 호스트·같은 조건에 대조 경로**(예: 같은 VM의 SMB)를 두고, 상대값으로 말한다.

## 증상

- 중첩 Windows VM 안 WSL에서 Lustre로 복사한 속도가 업로드 35.82 / 다운로드 24.44MiB/s였다.
- 같은 시험을 실물 노트북에서 하자 70.35 / 74.68MiB/s가 나왔다.
- 그 전에는 dd direct I/O 1GiB, robocopy `/J` 10GiB, Ubuntu 10GiB처럼 **조건이 다른 결과를 한 표에 놓고** 원인을 비교했다가 철회했다.

## 원인

- 중첩 가상화는 CPU·인터럽트·가상 NIC 비용이 단계마다 곱해진다. 그 크기는 경로마다 다르다.
- 같은 VM의 SMB 다운로드도 49.85에서 89.24MiB/s로 빨라졌다. 그러니 **차이 전부를 WSL·중첩 탓으로 돌릴 수도 없다.** 호스트 자체 조건이 함께 바뀐 것이다.

## 해결

1. 측정 환경마다 **대조 경로를 같이 잰다**(같은 VM, 같은 파일, 같은 회차 순서로 SMB와 대상 경로).
2. 결론은 절대값이 아니라 대조 대비 비율로 말한다. "같은 노트북의 SMB 대비 업로드 약 37%, 다운로드 약 16% 느림"처럼.
3. 서로 다른 도구·크기·I/O 방식의 결과는 한 표에서 원인 비교에 쓰지 않는다. 같은 정의(예: 10GiB 실제 파일 복사 + fsync, 3회 중앙값)로 다시 잰다.

| 환경 | 경로 | 업로드 | 다운로드 |
|---|---|---:|---:|
| 실물 노트북 | SMB(대조) | 111.21 | 89.24 |
| 실물 노트북 | WSL Lustre | 70.35 | 74.68 |
| 중첩 VM | SMB(대조) | 103.79 | 49.85 |
| 중첩 VM | WSL Lustre | 35.82 | 24.44 |

(10GiB, 3회 중앙값, MiB/s, 1GbE)

---

## 관련

- [[storage-perf-reporting-honesty]] — 조건 섞기 금지 원칙
- [[benchmark-baseline-drift-within-run]] — 배수는 같은 실행 창 안에서만
- [[measurement-name-overclaims-scope]]
- [[browser-automation-interception-skews-throughput]]
- [[testing-overview]]

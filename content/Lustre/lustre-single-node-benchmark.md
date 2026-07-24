---
title: 단일노드 Lustre 벤치마크 방법론
tags:
  - tech
created: 2026-06-18 (목)
---

# 단일노드 Lustre 벤치마크 방법론

> **TL;DR**: 한 서버에 VM으로 MDS/OSS를 몰아넣은 단일노드 Lustre를 측정할 때의 함정(측정 방식·캐시·아티팩트)과 내부/외부 측정 분리 원칙.

---

## 개요

- **무엇인가**: 서버 1대 안에 MDS/OSS 역할 VM + OST(HDD raidz1) + Lustre client를 모두 올린 단일노드 구성의 성능·안정성 측정 방법
- **왜 쓰는가**: 멀티노드 확장 전 MVP 데모/검증, 관리도구·설치자동화 검증
- **언제 쓰는가**: 분산 스케일이 아직 없고 제품 방향 판단이 필요할 때

---

## 핵심 개념

### 1. ior 측정 3대 함정
IOR로 대역폭을 잴 때 결과를 착시로 만드는 3가지 함정(O_DIRECT 미지원, write/read 미분리, ZFS 부적합) → [[lustre-ior-measurement-pitfalls]]

### 2. 측정 아티팩트 (CoV 폭발)
매 iter `drop_caches`·ZFS ARC/txg flush가 대역폭 타이머를 오염시켜 CoV가 폭발하는 현상과 `sar` 판별법, MMP 영향 → [[lustre-benchmark-cache-artifact]]

### 3. 내부 vs 외부 측정 분리
- **내부 self-mount** = Lustre 자체 상한 (서버에서 직접 `/mnt/lustre`)
- **외부 1GbE client** = 실사용 천장 (~112 MiB/s = 1GbE 물리 한계, iperf3·과거 서버와 교차 확인)
- 두 수치를 섞으면 보고·해석이 왜곡됨 → 반드시 분리 표기

### 4. 단일노드 타당성
- 노드 확장성·장애 격리·네트워크 분산 이득은 **없음**
- 단 stripe_count=4로 OST 여러 개를 쓰면 **디스크 병렬 이득은 일부 존재** ("분산 이득 0"은 과장)
- 도구 선택: ior=구조/stripe 검증, fio=운영형 안정성 본판정, mdtest=메타데이터

### 5. 다중 vs 단일 스트림 (np 스윕) — 동시성 스케일링
- "다중 추출이 단일보다 빠른가"는 IOR `np` 스윕(1 / 4 / 8 / 16) read 대역폭으로 판정.
- 동시성 이득은 **작은~중간 파일에서 큼**(read 5~12×, 메타데이터 ~12×), **대용량은 백엔드 천장 근접해 축소**(~1.6×).
- 단일 클라이언트 측정은 **NIC 대역(1GbE ~112 MiB/s)에 묶이므로**, 다중 효과는 *다중 클라 합산·작은 파일·메타데이터*에서 봐야 드러난다.
- 내부 self-mount는 동시성 이득을 깨끗이 보여주나 CoV가 크다(worst-case) → 절대수치보다 "다중>단일 경향"으로 판정.

---

## 코드 / 사용 예시

```bash
# stripe 배치 확인 (반복 OST 분산이 CoV를 키울 수 있음)
lfs getstripe -d /mnt/lustre/bench
lfs setstripe -c 4 -S 1M <dir>   # OST 4개 분산
```

---

## 주의사항

> [!WARNING]
> - 단일노드 내부 결과를 **멀티노드 Lustre 수평 확장 성능처럼 말하지 말 것**.
> - read가 디스크 한계를 초과하면 ZFS ARC 착시 의심 → [[zfs-arc-and-lustre-overhead]]
> - 결과서는 조건(stripe/direct/cold·warm/내외부)을 섞지 말 것 → [[storage-performance-testing]]

---

## 관련

- [[lustre-overview]] — Lustre 아키텍처 개요
- [[zfs-arc-and-lustre-overhead]] — ARC 착시·계층 오버헤드
- [[storage-performance-testing]] — 성능테스트 정직성·지표·도구
- [[lustre-ior-measurement-pitfalls]] — IOR 측정 3대 함정
- [[lustre-benchmark-cache-artifact]] — 벤치마크 캐시 아티팩트 (drop_caches·ZFS ARC/txg)

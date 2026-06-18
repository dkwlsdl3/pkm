---
title: Lustre 파일시스템 개요 (MOC)
tags:
  - tech
  - moc
created: 2026-05-12 (화)
---

# Lustre 파일시스템 개요 (MOC)

> HPC 환경의 고성능 분산 파일시스템 — 대용량 병렬 I/O 특화

---

## 아키텍처

```
클라이언트
    │  mount -t lustre <MGS_IP>@tcp:/<fsname> /mnt/lustre
    ▼
MGS (Management Server)  ← 파일시스템 설정 정보 저장
MDS (Metadata Server)    ← 파일명, 디렉토리, 권한 관리
OSS (Object Storage Server) × N  ← 실제 데이터 저장
```

### 핵심 구성요소

| 구성요소 | 역할 | 타겟 디스크 타입 |
|---------|------|----------------|
| MGS | 파일시스템 전체 설정 관리 | MGT |
| MDS | 메타데이터 (파일명·권한·위치) | MDT |
| OSS | 실제 데이터 블록 저장 | OST (여러 개) |
| 클라이언트 | 마운트해서 파일시스템으로 사용 | — |

> MGS + MDS는 같은 서버에 함께 구성 가능 (`mkfs.lustre --mgs --mdt`)

---

## 노트

- [[lustre-server-setup]] — EL8 기준 서버 설치 및 포맷 (MGS/MDT/OST)
- [[lustre-client-setup]] — Ubuntu 클라이언트 설치 및 커널 버전 제약
- [[lustre-troubleshooting]] — identity_upcall, 재부팅 자동 마운트(ping 스크립트·automount 패턴), 부팅 레이스 rc=-16/-5 판별, Lustre 노드 식별 컬럼 기반 전환
- [[project-quota-semantics]] — 프로젝트 쿼터 inode 집계(루트 포함)·mv 후 project ID 잔류·setquota 단위 함정
- [[lustre-single-node-benchmark]] — 단일노드 Lustre 벤치 함정·측정 아티팩트·내부/외부 측정 분리

---

## 관련

- [[kvm-libvirt]] — KVM VM 기반 Lustre 테스트 환경 구성

---
title: MinIO
tags:
  - tech
  - data
  - storage
created: 2026-05-18 (월)
---

# MinIO

> **TL;DR**: 사내 구축형 S3 호환 오브젝트 스토리지 — AI 학습용 비정형 데이터 저장에 최적

---

## 개념

MinIO는 Amazon S3 API와 완벽 호환되는 **오픈소스 오브젝트 스토리지**. 클라우드 의존 없이 온프레미스에 구축 가능.

"우리 집 전용 아마존 S3" — S3 SDK를 그대로 사용하면서 데이터는 자체 서버에 저장.

---

## 특징

| 항목 | 내용 |
|------|------|
| API 호환 | Amazon S3 완전 호환 (기존 S3 SDK/CLI 그대로 사용) |
| 성능 | NVMe SSD 기준 최대 325 GiB/s 읽기, 100 GiB/s 쓰기 |
| 배포 | 단일 바이너리, Docker, Kubernetes 지원 |
| 라이선스 | AGPL-3.0 (상용 라이선스 별도) |
| 저장 방식 | Erasure Coding (데이터 보호, RAID 유사) |

---

## 적합한 사용 사례

- **AI/ML 학습 데이터셋** — 이미지, 오디오, 영상, JSON 등 비정형 대용량 파일
- **백업 및 아카이브** — S3 호환 백업 도구(Restic, Velero 등) 연동
- **로그·이벤트 저장** — 파이프라인 중간 결과물 임시 저장
- **데이터 레이크** — Landing 레이어 원천 데이터 저장소

---

## 설치 (단일 노드)

```bash
# 바이너리 다운로드
wget https://dl.min.io/server/minio/release/linux-amd64/minio
chmod +x minio

# 실행
MINIO_ROOT_USER=<MINIO_ROOT_USER> MINIO_ROOT_PASSWORD=<MINIO_ROOT_PASSWORD> \
  ./minio server /data --console-address ":9001"
```

- 데이터 포트: `9000`
- 웹 콘솔: `9001`

---

## 주요 개념

```
Bucket (버킷)  ←→  S3 Bucket
Object (객체)  ←→  S3 Object / 파일
Prefix         ←→  폴더 (실제론 키 접두사)
```

---

## ZFS와 연계

MinIO의 데이터 디렉토리(`/data`)를 ZFS 데이터셋으로 구성:

```bash
# ZFS 데이터셋 생성
zfs create tank/minio

# MinIO가 해당 경로 사용
./minio server /tank/minio
```

- ZFS 스냅샷으로 MinIO 데이터 백업
- ZFS 체크섬으로 오브젝트 무결성 보장
- ZFS 압축(lz4)으로 스토리지 효율 향상

---

## 관련

- [[data-storage]]
- [[data-governance]]
- [[zfs]]
- [[data-engineering-overview]]

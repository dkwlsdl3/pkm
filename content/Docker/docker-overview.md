---
title: Docker 개요 (MOC)
tags:
  - tech
  - moc
created: 2026-06-01 (월)
---

# Docker 개요 (MOC)

> Docker 데몬 운영 및 이미지 빌드 트러블슈팅

---

## 데몬 운영

- [[dockerd-dataroot-symlink]] — `mkdir /var/lib/docker: file exists` = data-root 심링크 대상 미마운트 진단·복구

## 이미지 빌드

- [[dockerfile-dnf-before-conda]] — conda가 dnf의 libsolv를 깨므로 모든 dnf install은 conda 설치 이전에 배치

---

## 관련

- [[os-overview]] — 스토리지·마운트
- [[fstab-uuid-mount]] — data-root 볼륨 마운트 안정화
- [[gitlab-cicd]] — Docker executor 기반 CI

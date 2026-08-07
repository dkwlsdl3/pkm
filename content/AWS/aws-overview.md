---
title: AWS 개요 (MOC)
tags:
  - tech
  - moc
created: 2026-06-01 (월)
---

# AWS 개요 (MOC)

> AWS(Amazon Web Services) 운영 — EC2, 접속·관리, 인프라 트러블슈팅

---

## 용어

| 표기 | 원어 | 뜻 |
|---|---|---|
| EC2 | Elastic Compute Cloud | AWS의 가상 서버 서비스 |
| SSM | AWS Systems Manager | 인스턴스를 에이전트로 관리하는 서비스. Session Manager는 그중 접속 기능 |
| IAM | Identity and Access Management | AWS의 권한 관리 체계. 사용자·역할에 정책을 붙여 접근을 제어한다 |
| S3 | Simple Storage Service | 오브젝트 스토리지 |
| Nitro | — | AWS의 하이퍼바이저·하드웨어 플랫폼 이름. NVMe 디바이스명이 부팅마다 바뀔 수 있다 |

---

## 접속 & 관리

- [[ec2-ssm-access-no-key]] — 키페어 분실 시 SSM Session Manager로 SSH 키 없이 EC2 접속 (IAM 역할 + 에이전트 재기동)
- [[ssm-ssh-proxycommand-tunnel]] — SSM 터널 위에서 표준 ssh/scp/rsync (AWS-StartSSHSession ProxyCommand)

---

## 관련

- [[os-overview]] — Linux 서버 운영·스토리지
- [[fstab-uuid-mount]] — Nitro NVMe 디바이스명 변동 대응(fstab UUID)

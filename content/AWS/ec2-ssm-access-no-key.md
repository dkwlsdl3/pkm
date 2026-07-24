---
title: EC2 SSM 접속 (키페어 분실)
tags:
  - tech
created: 2026-06-01 (월)
---

# EC2 SSM 접속 (키페어 분실)

> **TL;DR**: EC2 키페어 private key는 생성 시 1회만 제공되고 재발급이 안 된다. 키를 잃었어도 **SSM Session Manager**로 SSH 키 없이 접속할 수 있다 — IAM 역할에 `AmazonSSMManagedInstanceCore`만 있으면 된다.

---

## 개요

- **무엇인가**: SSH 키페어 없이 EC2 인스턴스에 셸 접속하는 AWS Systems Manager(SSM) Session Manager 경로
- **왜 쓰는가**: `.pem` private key는 인스턴스 생성 시 단 한 번만 다운로드되며 재발급 불가. 키를 분실하면 전통적 SSH는 불가능
- **언제 쓰는가**: 키 분실, 로컬에 자격증명/SSH 키가 없을 때, 또는 22번 포트를 열지 않고 관리하고 싶을 때

---

## 핵심 개념

### SSM 접속 전제 조건

1. 인스턴스에 **SSM Agent**가 설치·실행 중이어야 한다 (최신 Amazon Linux/Ubuntu 이미지는 기본 포함).
2. 인스턴스의 **IAM 인스턴스 프로파일(역할)**에 `AmazonSSMManagedInstanceCore` 정책이 있어야 한다.
3. 인스턴스가 SSM 엔드포인트로 아웃바운드 통신이 가능해야 한다(NAT/IGW 또는 VPC 엔드포인트).

조건이 충족되면 콘솔의 **Fleet Manager** 또는 Session Manager에서 노드가 "관리형(Managed)"으로 등록되고, 브라우저 터미널 또는 `aws ssm start-session`으로 접속할 수 있다.

### 자주 막히는 지점

- **IAM 권한 누락**: 역할에 S3 접근 등 다른 정책만 있고 SSM 권한이 없으면 노드가 등록되지 않는다 → `AmazonSSMManagedInstanceCore` 추가.
- **에이전트 백오프**: 오랫동안 SSM 연결에 실패한 에이전트는 백오프 상태로 들어가 권한을 추가해도 곧바로 안 붙는다 → **인스턴스 재부팅**으로 에이전트를 재기동하면 Fleet Manager에 등록된다.

### Serial Console과의 차이

- **EC2 Serial Console**은 OS 로그인 비밀번호가 미리 설정돼 있어야 쓸 수 있어, 비밀번호도 없는 키 분실 상황엔 부적합하다.
- Fleet Manager / Session Manager(리눅스 터미널)는 추가 비용이 없다.

---

## 코드 / 사용 예시

```bash
# (로컬에 AWS CLI + SSM 플러그인이 있을 때)
aws ssm start-session --target <INSTANCE_ID> --region <REGION>

# 권한 추가는 콘솔에서: 인스턴스 IAM 역할에 AmazonSSMManagedInstanceCore 연결
# 그 뒤에도 노드가 안 보이면 인스턴스 재부팅으로 SSM Agent 재기동
```

### ssh/scp/rsync를 SSM 터널로 (키만 심으면 진짜 ssh처럼)
Session Manager 셸만으론 조작이 불편하다. **`AWS-StartSSHSession` 문서를 ProxyCommand로** 쓰면 22번 포트 개방·퍼블릭 IP 없이 일반 `ssh`/`scp`/`rsync`가 SSM 터널로 동작한다.
```bash
# 1) SSM 셸(또는 send-command)로 공개키를 authorized_keys에 심는다
#    aws ssm send-command --document-name AWS-RunShellScript \
#      --parameters 'commands=["echo <PUBKEY> >> /home/<user>/.ssh/authorized_keys"]'
# 2) ~/.ssh/config
#   Host myhost
#     HostName <INSTANCE_ID>          # i-xxxx (IP 아님)
#     User ubuntu
#     IdentityFile ~/.ssh/mykey
#     ProxyCommand aws ssm start-session --target %h \
#       --document-name AWS-StartSSHSession --parameters portNumber=%p --region <REGION>
# → ssh myhost / scp ... myhost:/ 그대로 됨
```
키페어를 새로 만들어도 기존 인스턴스엔 자동 반영 안 된다(키페어=생성 시점 authorized_keys 한 줄일 뿐) → 이렇게 직접 심는 게 정석.

---

## 주의사항

> [!WARNING]
> IAM 역할에 SSM 정책을 추가해도 에이전트가 백오프 상태면 즉시 등록되지 않는다. 권한 추가 → 그래도 안 보이면 **재부팅**이 가장 확실한 재기동 수단이다. 단, 재부팅은 마운트/심링크 등 잠재된 인프라 가정을 드러낼 수 있으니 [[fstab-uuid-mount]]·[[dockerd-dataroot-symlink]] 회귀를 함께 점검할 것.

---

## 관련

- [[fstab-uuid-mount]] — 재부팅 시 NVMe 디바이스명 변동 대응
- [[dockerd-dataroot-symlink]] — 재부팅 후 도커 데몬 복구
- [[ssh-key-auth]] — 일반 SSH 키 인증
- [[aws-overview]]

---
title: SSM 터널로 ssh/scp/rsync (AWS-StartSSHSession ProxyCommand)
tags:
  - tech
  - aws
created: 2026-06-01 (월)
---

# SSM 터널로 ssh/scp/rsync (AWS-StartSSHSession ProxyCommand)

> **TL;DR**: `AWS-StartSSHSession` 문서를 SSH `ProxyCommand`로 쓰면 22번 포트 개방·퍼블릭 IP 없이 일반 `ssh`/`scp`/`rsync`가 SSM 터널로 그대로 동작한다.

---

## 개요

- **무엇**: Session Manager 셸 대신, SSM 터널 위에서 표준 SSH 도구를 쓰는 구성
- **왜 / 언제**: Session Manager 브라우저 셸만으론 파일 전송·조작이 불편할 때, 포트 개방 없이 `ssh`/`scp`/`rsync`를 쓰고 싶을 때

## 동작 / 예시

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

## 관련

- [[ec2-ssm-access-no-key]]
- [[ssh-key-auth]]
- [[aws-overview]]

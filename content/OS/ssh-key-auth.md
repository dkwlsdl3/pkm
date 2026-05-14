---
tags:
  - tech
created: 2026-05-13 (수)
---

# Ubuntu → Mac SSH 키 인증 설정

> **TL;DR**: Ubuntu에서 Mac으로 SSH 키 인증 설정 — 양방향 키 인증 + 비밀번호 로그인 차단

---

## 환경

| 항목 | 내용 |
|---|---|
| Ubuntu PC | 30.30.30.226 (admin) |
| MacBook Air | 30.30.30.237 (kth), macOS 14 Sonoma |

기존에 Mac → Ubuntu 방향 SSH 키 인증은 설정되어 있었고,  
이번에 반대 방향인 **Ubuntu → Mac** 키 인증을 추가 설정했다.

---

## 1. Mac Remote Login 활성화

```
시스템 설정 → 일반 → 공유 → 원격 로그인 → ON
접근 허용: 관리자
전체 디스크 접근 허용: OFF (파일 전송 용도로는 충분)
```

---

## 2. Ubuntu 공개키 Mac에 등록

Ubuntu의 공개키를 Mac의 `~/.ssh/authorized_keys`에 추가.

```bash
# Mac 터미널에서 실행
echo "ssh-ed25519 <YOUR_PUBLIC_KEY> <user>@<host>" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

Ubuntu에서 Mac 호스트 키 등록:

```bash
ssh-keyscan -H 30.30.30.237 >> ~/.ssh/known_hosts
```

---

## 3. 비밀번호 로그인 비활성화

공용 네트워크(카페 등) 사용 시 브루트포스 차단을 위해 비밀번호 인증 비활성화.  
`/etc/ssh/sshd_config.d/` 하위에 별도 파일로 관리.

```bash
# Mac 터미널에서 실행
sudo tee /etc/ssh/sshd_config.d/no-password.conf << EOF
PasswordAuthentication no
KbdInteractiveAuthentication no
EOF

sudo launchctl stop com.openssh.sshd
sudo launchctl start com.openssh.sshd
```

---

## 4. 동작 확인

```bash
# Ubuntu에서 테스트
ssh -o BatchMode=yes kth@30.30.30.237 echo "키 인증 성공"   # ✅
ssh -o PasswordAuthentication=no -o PubkeyAuthentication=no kth@30.30.30.237  # Permission denied ✅
```

---

## 최종 상태

| 방향 | 인증 방식 | 상태 |
|---|---|---|
| Mac → Ubuntu | SSH 키 인증 | ✅ |
| Ubuntu → Mac | SSH 키 인증 | ✅ |
| Ubuntu → Mac | 비밀번호 인증 | 차단 ✅ |

---

## SSH Config alias

반복 입력 줄이기 위해 `~/.ssh/config`에 alias 등록.

```
Host <alias> <ip>
  HostName <ip>
  User <username>
```

이후 `ssh <alias>`로 접속 가능.

---

## 관련

- SSH 키 알고리즘: ed25519 (Edwards-curve, 256bit, 현재 권장 방식)
- Mac `전체 디스크 접근 허용` OFF 상태: Unix 권한 기준으로 접근 가능, TCC 보호 경로(타 사용자 Documents 등)는 접근 불가
- [[input-leap-setup]]

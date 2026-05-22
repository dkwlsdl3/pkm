---
title: DNS 장애 시 hosts 파일 긴급 우회
tags:
  - tech
  - os
  - dns
  - troubleshooting
created: 2026-05-22 (금)
---

# DNS 장애 시 hosts 파일 긴급 우회

> DNS 레코드 오설정으로 사내 서비스 도메인이 실제 서버 IP를 찾지 못할 때, 로컬 `hosts` 파일로 임시 우회하는 절차.

---

## 장애 개요

- 현상: ERP, Git, Wiki 등 사내 서비스 도메인 접속 불가
- 영향: 사내 네트워크 연결 여부와 무관하게 도메인 기반 서비스 접근 실패
- 핵심 원인: `xxx.me`도메인의 네임서버 또는 DNS 레코드가 잘못된 외부 호스팅 서버를 가리킴
- 서버 상태: 실제 웹 서버와 네트워크 인프라는 공인 IP `<SERVICE_PUBLIC_IP>`에서 정상 동작

IP 직접 접속이 실패하는 이유는 Nginx가 도메인 이름과 SSL 인증서 일치를 기준으로 요청을 처리하기 때문이다. 브라우저에 IP만 입력하면 인증서 불일치 또는 virtual host 매칭 실패로 차단될 수 있다.

---

## Linux 우회 절차

`/etc/hosts`를 관리자 권한으로 연다.

```bash
sudo nano /etc/hosts
```

아래 매핑을 파일 하단에 추가한다.

```text
<SERVICE_PUBLIC_IP> works.xxx.me git.xxx.me wiki.xxx.me repo.xxx.me
```

저장 후 원래 서비스 주소로 다시 접속한다.

---

## Windows 우회 절차

1. 메모장을 관리자 권한으로 실행한다.
2. `C:\Windows\System32\drivers\etc\hosts` 파일을 연다.
3. 파일 하단에 아래 매핑을 추가하고 저장한다.

```text
<SERVICE_PUBLIC_IP> works.xxx.me git.xxx.me wiki.xxx.me
```

---

## 복구 후 롤백

DNS 설정이 정상화되면 `hosts`에 추가했던 `<SERVICE_PUBLIC_IP> ...` 라인을 삭제한다.

이 라인을 남겨두면 서버 IP가 바뀌었을 때 다시 접속 장애가 발생할 수 있다.

---

## 관련

- [[network-bridge]]
- [[ssh-key-auth]]
- [[systemd-service]]

---
title: systemd 서비스
tags:
  - tech
created: 2026-05-14 (목)
---

# systemd 서비스

> **TL;DR**: Linux 부팅/서비스 관리자 — 데몬 등록, 자동시작, 의존성 순서 제어

---

## 서비스 파일 구조

```ini
[Unit]
Description=서비스 설명
After=network-online.target   # 이 유닛 이후에 시작
Wants=network-online.target   # 없어도 되지만 있으면 먼저 시작

[Service]
Type=oneshot        # 한 번 실행 후 종료 (스크립트용)
# Type=simple       # 포그라운드 프로세스 (기본)
# Type=forking      # 데몬 방식 (fork 후 부모 종료)
ExecStart=/usr/local/bin/my-script.sh
RemainAfterExit=yes  # oneshot이어도 active 상태 유지
TimeoutStartSec=300

[Install]
WantedBy=multi-user.target
```

---

## 주요 명령어

```bash
sudo systemctl daemon-reload          # 서비스 파일 변경 후 적용
sudo systemctl enable my.service      # 부팅 시 자동시작 등록
sudo systemctl start my.service       # 즉시 시작
sudo systemctl status my.service      # 상태 확인
journalctl -u my.service -f           # 로그 실시간 확인
```

---

## User linger

일반 사용자의 systemd 서비스는 **해당 유저 로그인 중에만** 실행됨. 로그아웃 시 종료.

```bash
loginctl enable-linger admin   # 로그아웃 후에도 user 서비스 유지
```

KVM autostart처럼 부팅 시 유저 세션 없이도 서비스 실행이 필요한 경우 필수.

---

## SIGTSTP 문제

터미널에서 `./binary &`로 백그라운드 실행 시, 터미널 종료 시 `SIGTSTP`(정지 신호) 받아 프로세스가 T(Stopped) 상태로 멈춤.

```bash
# 올바른 방법
nohup ./binary > /tmp/binary.log 2>&1 &
# 또는 systemd 서비스로 등록
```

---

## 관련

- [[os-overview]]
- [[kvm-libvirt]]

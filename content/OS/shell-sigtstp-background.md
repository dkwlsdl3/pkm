---
title: SIGTSTP 백그라운드 정지 문제
tags:
  - tech
created: 2026-07-24 (금)
---

# SIGTSTP 백그라운드 정지 문제

> **TL;DR**: 터미널에서 `./binary &`로 백그라운드 실행 시 터미널 종료로 SIGTSTP를 받아 프로세스가 T(Stopped) 상태로 멈추는 문제와 해결법

---

터미널에서 `./binary &`로 백그라운드 실행 시, 터미널 종료 시 `SIGTSTP`(정지 신호) 받아 프로세스가 T(Stopped) 상태로 멈춤.

```bash
# 올바른 방법
nohup ./binary > /tmp/binary.log 2>&1 &
# 또는 systemd 서비스로 등록
```

---

## 관련

- [[systemd-service]]

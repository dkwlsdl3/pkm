---
title: 이미 root 인 데몬이 sudo 를 거쳐 실패한다
tags:
  - tech
  - troubleshooting
created: 2026-09-21 (월)
---

# 이미 root 인 데몬이 sudo 를 거쳐 실패한다

> **TL;DR**: 개발할 때 일반 사용자로 돌리며 붙여 둔 `sudo` 접두사가, 서비스로 배포되어 **root 로 도는 데몬**에 그대로 남는다. sudo 는 TTY·비밀번호·`secure_path`·환경 정리를 요구하므로 비대화형 서비스 컨텍스트에서 실패하고, 데몬은 그 실패를 **로그로만 쌓는다**. 권한은 처음부터 있었다.

## 용어

| 표기 | 원어 | 뜻 |
|---|---|---|
| 데몬 | daemon | 백그라운드 상주 프로세스. 여기서는 systemd 서비스로 도는 감시 프로세스 |
| TTY | teletypewriter | 터미널 장치. sudo 는 기본 설정에서 이것을 요구할 수 있다(`requiretty`) |
| `secure_path` | — | sudo 가 강제로 덮어쓰는 PATH. 사용자 PATH 에 있던 도구가 sudo 뒤에서는 안 보일 수 있다 |

## 증상

- 서비스 로그에 같은 명령 실패가 3초마다(수집 주기마다) 쌓인다. 기능은 조용히 죽어 있다.
- 같은 명령을 셸에서 `sudo` 로 실행하면 잘 된다 — **재현이 안 된다고 결론 내기 쉽다.**
- `journalctl` 에 `sudo: no tty present and no askpass program specified` 또는 PATH 관련 "command not found" 가 보인다.

## 원인

```bash
# 개발 시절: 일반 사용자로 실행했기 때문에 필요했다
sudo smartctl -a /dev/sda

# 배포 후: 서비스가 User=root 로 돈다. sudo 는 불필요할 뿐 아니라 해롭다
#  - 비대화형이라 비밀번호/askpass 요구 시 즉시 실패
#  - secure_path 로 PATH 가 덮여 도구를 못 찾을 수 있다
#  - 환경변수가 정리되어 설정이 사라질 수 있다
```

여기에 두 번째 결함이 겹친다 — **실패가 로그로만 남는 구조**. 반환값을 확인하지 않거나 `warn!` 만 남기고 지나가면, 매 라운드 실패해도 상태는 "정상"으로 보고된다.

## 해결

```bash
# 1) 실행 주체를 확인한다 (추측하지 않는다)
systemctl show <service> -p User -p Group
# 서비스가 root 면 sudo 를 지운다. 필요 권한이 일부뿐이면 CAP_* 로 좁힌다

# 2) 서비스 컨텍스트에서 실제로 실행해 본다 — 셸에서 되는지는 근거가 아니다
systemd-run --uid=root --pipe --wait /usr/sbin/smartctl -a /dev/sda; echo "exit=$?"

# 3) 실패를 로그로만 남기지 않는다
#    반환값을 판정에 반영하고, 연속 실패는 상태로 올린다
```

- 권한이 **일부 명령에만** 필요하면 데몬 전체를 root 로 올리는 대신 `AmbientCapabilities=CAP_SYS_RAWIO` 처럼 필요한 능력만 준다.
- 개발 편의로 붙인 `sudo` 는 코드가 아니라 **개발 환경 설정**으로 빼둔다. 소스에 남기면 반드시 배포로 따라간다.

> [!WARNING]
> **"셸에서 sudo 로 되니까 코드도 된다"가 이 함정의 핵심이다.** 셸에는 TTY 가 있고 PATH 가 다르다. 서비스 컨텍스트에서 그대로 실행해 확인하지 않으면 재현되지 않는다.

> [!WARNING]
> 반복 실패가 로그에만 쌓이는 구조는 이 결함을 **수 주간 숨긴다.** 주기 작업의 실패는 카운터나 상태로 올려 화면에서 보이게 하라.

---

## 관련

- [[systemd-service]] — 서비스 실행 주체·권한 설정
- [[selinux-confined-daemon-ocf-ra]] — 데몬 컨텍스트가 셸과 다른 또 다른 사례
- [[package-manager-exit-code-not-success]] — 종료코드를 확인하지 않아 실패가 묻히는 경우
- [[secret-in-process-argv]] — 명령을 외부로 실행할 때 함께 보는 함정
- [[os-overview]]

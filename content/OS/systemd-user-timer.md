---
tags:
  - os
created: 2026-07-01 (수)
---

# systemd user 타이머로 무인 주기 작업

> 사용자 권한(sudo 없이) 주기 작업을 놓침 복구까지 포함해 돌리는 법.

## 유닛 2개 (user 스코프)

`~/.config/systemd/user/<name>.service` (oneshot) + `<name>.timer`.

```ini
# name.timer
[Timer]
OnCalendar=*-*-* 23:59:00
Persistent=true          # 실행 시각에 꺼져 있었으면 다음 부팅 때 따라잡음
RandomizedDelaySec=120
[Install]
WantedBy=timers.target
```

```bash
systemctl --user daemon-reload
systemctl --user enable --now <name>.timer
systemctl --user list-timers <name>.timer   # NEXT/LEFT 확인
```

## 반드시 아는 점

- **`Persistent=true`** = cron 대비 결정적 장점. cron은 그 시각에 꺼져 있으면 실행을 그냥 건너뛴다. 만료 전 반드시 실행돼야 하는 작업(토큰 갱신 등)엔 필수.
- **user 타이머는 로그인 세션 중에만 동작** — 로그아웃/재부팅 후에도 돌리려면 `sudo loginctl enable-linger <user>` 한 번(linger 활성). `loginctl show-user <user> --property=Linger`로 확인.
- **비대화 셸에서 `systemctl --user`가 버스를 못 찾으면** `XDG_RUNTIME_DIR=/run/user/$(id -u)`를 export.
- **ExecStart의 런타임 경로**: 버전 매니저(nvm 등)로 설치한 node는 절대경로가 버전 업 시 깨진다 → `/bin/bash -c 'export NVM_DIR=$HOME/.nvm; . "$NVM_DIR/nvm.sh"; exec node ...'`로 로드 후 실행하면 견고.
- 로그는 `journalctl --user -u <name>.service`.

## 관련
- [[systemd-service]]
- [[systemd-automount-watchdog]]
- [[session-keepalive-refresh-vs-relogin]] — 주기 재로그인 스케줄러로 활용

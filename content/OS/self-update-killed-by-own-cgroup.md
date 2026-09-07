---
title: 자기를 갱신하는 서비스는 자기 cgroup 안에서 패키지 관리자를 돌리면 안 된다
tags:
  - tech
  - troubleshooting
created: 2026-09-07 (일)
---

# 자기를 갱신하는 서비스는 자기 cgroup 안에서 패키지 관리자를 돌리면 안 된다

> **TL;DR**: 서비스가 자기 자신을 포함한 패키지를 갱신할 때, 그 서비스 프로세스에서 `dnf` 를 그냥 띄우면 자식이 **그 서비스의 cgroup(control group, 프로세스를 묶어 자원·신호를 함께 관리하는 커널 기능) 안**에 들어간다. 패키지의 `%post` 가 스키마 적용을 위해 **자기 서비스를 정지**하면 `systemctl stop` 이 cgroup 전체에 SIGTERM 을 보내 **rpm 트랜잭션 한복판에서 dnf 와 rpm 이 함께 죽는다**. `systemd-run` 으로 임시 유닛을 만들어 PID 1 아래에서 돌려라.

## 증상

- 화면에서 "업데이트" 버튼을 누르면 갱신이 중간에 끊긴다. 터미널에서 같은 `dnf` 명령을 직접 돌리면 잘 된다.
- rpm 데이터베이스가 잠기거나 패키지가 반쯤 적용된 채 남는다.
- 자기 자신을 갱신하는 경로에서 **반드시** 재현된다.

## 원인

systemd 서비스가 띄운 자식 프로세스는 그 서비스의 cgroup에 속한다. `systemctl stop`은 유닛의 메인 프로세스만이 아니라 **cgroup 전체**에 신호를 보낸다.

```
myapp-backend.service (cgroup)
├── myapp-backend             ← %post 가 이걸 멈추려고 systemctl stop
└── sudo dnf upgrade          ← 같은 cgroup이라 함께 SIGTERM
    └── rpm                   ← 트랜잭션 도중 죽는다
```

`%post` 가 서비스를 내리는 것 자체는 정상 설계다 — 스키마를 적용하는 동안 옛 바이너리가 붙어 있으면 안 되기 때문이다. 문제는 **그 stop 의 사정거리 안에 갱신 프로세스가 들어가 있다**는 점이다.

## 해결

`systemd-run` 으로 임시 유닛을 만들어 systemd(PID 1) 아래에서 돌린다. 그러면 서비스가 정지돼도 트랜잭션은 끝까지 간다.

```rust
const UPDATE_UNIT: &str = "myapp-software-update";
const UPDATE_LOG_PATH: &str = "/var/log/myapp/software-update.log";

// 출력은 유닛의 journal 로 가서 이 프로세스로 안 돌아온다 → 셸로 감싸 로그 파일에 남긴다.
let script = format!("mkdir -p {dir} && {dnf} > {log} 2>&1", ...);

Command::new("sudo").args([
    "systemd-run",
    "--unit", UPDATE_UNIT,
    "--collect",   // 끝나면 유닛을 치운다 — 남기면 다음 실행이 "이미 있다"로 실패
    "--wait",
    "--quiet",
    "--", "/bin/sh", "-c", &script,
]);
```

- **유닛 이름은 고정한다.** 두 갱신이 겹치면 `systemd-run` 이 "이미 있다"로 실패하고, 그 실패가 곧 동시 실행 방지가 된다(rpm 은 어차피 한 번에 하나만 돈다).
- **출력을 파일로 남긴다.** 임시 유닛의 출력은 호출 프로세스로 돌아오지 않고, 서비스가 재시작된 뒤에도 결과를 봐야 하기 때문이다.

> [!WARNING]
> **`--wait` 는 클라이언트가 기다릴 뿐 유닛의 수명을 좌우하지 않는다.** 호출 프로세스가 죽어도 갱신은 계속되는데, 그때는 **HTTP 응답이 끊겨 화면은 실패로 본다**(실제로는 성공하고 있다). 이 간극은 로그 파일을 사후 확인 경로로 두어 메운다.

---

## 관련

- [[package-manager-exit-code-not-success]] — 갱신 성공 판정을 종료코드에서 떼기
- [[rpm-scriptlet-pre-vs-post]] — 스크립틀릿 단계 선택
- [[schema-change-with-live-consumers]] — 스키마 적용 중 소비자를 세우는 이유

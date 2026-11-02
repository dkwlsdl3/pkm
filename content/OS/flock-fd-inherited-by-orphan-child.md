---
title: flock 잠금 fd를 물려받은 고아 자식이 잠금을 계속 쥔다
tags:
  - tech
  - troubleshooting
created: 2026-11-02 (월)
---

# flock 잠금 fd를 물려받은 고아 자식이 잠금을 계속 쥔다

> **TL;DR**: `flock`으로 잡은 잠금은 프로세스가 아니라 **열린 파일 설명(open file description)** 에 묶인다. 잠금 fd(file descriptor, 파일 설명자)를 자식 프로세스가 물려받으면, 부모가 끝나도 그 자식이 살아 있는 동안 잠금이 풀리지 않는다. 잠금 아래에서 실행할 명령이 오래 사는 자식을 남길 수 있다면, 자식에게 fd를 넘기지 않는다(`flock -o`).

## 증상

- 여러 에이전트 세션이 공유하는 빌드 슬롯 대기열이 **45분 동안 멈췄다.** 모든 세션의 빌드가 대기 상태였다.
- 잠금을 잡았던 빌드 프로세스는 이미 끝나 있었다.
- 실제로 잠금을 쥔 것은 시험이 띄운 **고아 셸**이었다. 그 셸은 이미 지워진 폴더를 기다리며 영원히 대기 중이었다.

## 원인

- `exec 9>lockfile; flock 9; cmd` 패턴에서 fd 9는 `cmd`와 그 자식들에게 상속된다(close-on-exec가 꺼져 있음).
- flock 잠금은 같은 열린 파일 설명을 공유하는 **모든 fd가 닫혀야** 풀린다. 부모 종료는 조건이 아니다.
- 시험이 백그라운드로 띄운 셸이 부모보다 오래 살면서 fd 9를 붙잡고 있었다.

## 해결

```bash
# 누가 잠금 파일을 쥐고 있나 — 우선 원인 프로세스를 찾는다
lsof /path/to/build.lock
fuser -v /path/to/build.lock

# 재발 방지: 명령 실행 전 잠금 fd를 닫아 자식에게 물려주지 않는다
flock -o /path/to/build.lock cargo build     # -o, --close (util-linux)
# fd 패턴을 써야 한다면 자식 실행 시 명시적으로 닫는다
cmd 9>&-
```

- `flock -o`는 util-linux 문서에 있는 옵션이다. "command가 잠금을 쥐면 안 되는 자식을 띄울 때 유용하다"고 적혀 있다. 단, 이렇게 하면 잠금은 `flock` 프로세스가 쥔다. 명령이 끝날 때까지 `flock`이 기다리므로 의미는 그대로다.
- 당시 조치는 고아 셸 종료뿐이었다. 재발 방지 수정은 보류했다. 위의 `-o`·`9>&-`는 일반 해법이다(그 사례에 적용한 것은 아님).

---

## 관련

- [[shell-sigtstp-background]] — 백그라운드 자식 프로세스의 다른 함정
- [[mutual-exclusion-key-mismatch]] — 잠금 설계 쪽 함정
- [[os-overview]]

---
tags:
  - tech
created: 2026-06-09 (화)
---

# Keeper Transfer CLI

> **TL;DR**: `keeper transfer push`는 Synapse 전용 `sync` 느낌을 줄이고 Works export, SynapseAI raw 데이터, 일반 배치 산출물을 같은 방식으로 전송하기 위한 범용 CLI 표면이다.

---

## 개요

- **무엇인가**: `keeper-gen-2-cli`의 범용 파일/디렉터리 전송 명령
- **왜 쓰는가**: Synapse 전용으로 보이던 `keeper sync push`를 다른 팀의 데이터 산출물 전송에도 쓸 수 있는 명령으로 확장하기 위해
- **언제 쓰는가**: Works export, SynapseAI raw 데이터, 일반 배치 결과물, 대용량 단일 파일, 수만 건 파일 묶음을 Keeper 계열 저장소로 보낼 때

---

## 핵심 개념

### transfer와 sync

- `keeper transfer push`가 새 1급 명령이다.
- 기존 `keeper sync`는 깨지지 않도록 legacy alias로 유지한다.
- backend 보고 endpoint는 아직 legacy `/api/system/synapse-sync/runs`를 쓰므로 CLI 내부 adapter로 호환한다.

### 장애 대응 계약

- rsync 실패나 네트워크 끊김은 성공으로 속이지 않고 `exitCode: 4`, `error.code: "RSYNC_FAILED"`로 반환한다.
- `--retry`와 `--retry-delay`는 같은 rsync 명령을 지정 횟수만큼 다시 시도한다.
- 큰 단일 파일은 `--append-verify`를 붙이고 같은 명령을 재실행하면 이어받기를 검증하면서 재개할 수 있다.
- 실패 원인은 JSON의 `rsync.stderrTail`이나 `--log-file` 로그에서 확인한다.

---

## 코드 / 사용 예시

```bash
keeper transfer push ./export \
  --destination keeper@example-host \
  --target /keeper-data/datasets/project-a \
  --dry-run \
  --json
```

```bash
keeper transfer push <source> \
  --destination keeper@example-host \
  --target /keeper-data/datasets/project-a \
  --retry 3 \
  --retry-delay 30 \
  --timeout 60 \
  --connect-timeout 10 \
  --append-verify \
  --json
```

---

## 주의사항

> [!WARNING]
> `--append-verify`와 `--partial-dir`는 rsync 3.4.3 기준 동시에 사용할 수 없으므로 CLI validation에서 사전 차단한다.

> [!WARNING]
> SSH 연결 timeout은 rsync `--contimeout`이 아니라 SSH command의 `-o ConnectTimeout=N`으로 매핑해야 한다.

> [!WARNING]
> rsync stats를 JSON byte 값으로 파싱해야 할 때는 `--human-readable`을 제거해야 `totalFileSizeBytes`를 정수 byte로 안정적으로 얻을 수 있다.

---

## 검증 기준

- `npm test`
- `npm run build`
- `npm run lint`
- `node bin/keeper.js transfer push --help`
- `npm_config_cache=/tmp/npm-cache npm pack --dry-run`
- 맥 local smoke, 256MiB large file, 20,000 files many-file, 맥에서 우분투 원격 interrupt/resume

---

## 남은 일

- GitLab Package Registry에 `@keeper/cli@0.2.3` publish가 필요하면 별도 `npm publish` 실행
- 실제 Keeper/Synapse 운영망 최종 end-to-end 검증
- backend가 generic transfer endpoint를 제공하면 CLI legacy report adapter를 새 endpoint로 전환

---

## 관련

- [[gitlab-npm-package-registry]]
- [[data-storage]]
- [[2026-06-09]]

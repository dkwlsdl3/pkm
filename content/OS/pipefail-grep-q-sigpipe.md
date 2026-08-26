---
title: pipefail에서 grep -q가 파이프라인 판정을 역전시키는 함정
tags:
  - tech
  - troubleshooting
created: 2026-07-31 (금)
---

# pipefail에서 grep -q가 파이프라인 판정을 역전시키는 함정

> **TL;DR**: `set -o pipefail` 아래에서 `producer | grep -q PATTERN`은 **찾았을 때 실패**할 수 있다. `grep -q`가 첫 일치에서 즉시 종료하면 producer가 SIGPIPE(종료코드 141)로 죽고, pipefail이 그 141을 파이프라인 종료 상태로 채택한다. **없을 때는 정상 판정되므로 "성공 케이스만 틀리는" 최악의 형태**다. `grep -c`로 바꾸고 명령치환으로 받아라.

---

## 증상

CI 자기검증이 **정상 배포에서만 실패**한다.

```bash
#!/bin/sh
set -eo pipefail        # GitLab 러너 등이 기본으로 이렇게 실행한다

if ! strings /usr/bin/mytool | grep -q "FEATURE_MARKER"; then
  echo "마커 없음 — 교체 실패"; exit 1
fi
echo "통과"
```

- 구버전(마커 없음) → **정상 판정**
- 신버전(마커 있음) → **"마커 없음"으로 실패**

즉 검사가 완전히 뒤집혀 있는데, 구버전에서 테스트하면 맞게 동작하는 것처럼 보인다.

## 원인

세 가지가 겹친다.

1. `grep -q`는 **첫 일치에서 즉시 exit 0**한다(더 읽지 않는다)
2. 그 순간 파이프의 읽는 쪽이 닫히므로 producer(`strings`, `cat`, `find`, `yes` …)가 **SIGPIPE로 죽는다** → 종료 상태 141 (`128 + 13`)
3. `pipefail`은 **파이프라인 중 0이 아닌 마지막 종료 상태**를 파이프라인 결과로 채택한다 → 141

마커가 없으면 grep이 EOF까지 읽으므로 producer가 정상 종료하고, grep만 1을 반환해 의도대로 동작한다. **그래서 실패 케이스에서는 버그가 드러나지 않는다.**

입력이 클수록(수 MB 바이너리) producer가 아직 쓰는 중일 확률이 높아 재현율이 올라간다. 작은 입력은 producer가 이미 다 써서 종료했을 수 있어 **간헐적으로 통과**한다 — 더 헷갈린다.

## 해결

```bash
# 입력을 끝까지 읽어 SIGPIPE가 발생하지 않게 하고,
# 명령치환으로 받아 파이프라인 종료 상태 자체를 판정에서 배제한다
count=$(strings /usr/bin/mytool | grep -c "FEATURE_MARKER" || true)
echo "마커 일치 ${count}건"
if [ "$count" -eq 0 ]; then
  echo "마커 없음 — 교체 실패"; exit 1
fi
```

핵심 3가지:

- **`grep -c`** — 입력을 끝까지 읽으므로 SIGPIPE가 없다
- **명령치환** — 파이프라인 종료 상태가 `if`의 판정에 쓰이지 않는다
- **건수를 로그에 남긴다** — 다음에 오탐/정탐을 구별할 수 있다

### 다른 회피법

| 방법 | 비고 |
|---|---|
| `set +o pipefail` 국소 해제 | 범위를 좁게. 다른 실패를 함께 숨기게 되므로 최후 수단 |
| producer를 리다이렉트로 대체 | `grep -q PATTERN < file` — 파이프가 없으면 SIGPIPE도 없다 |
| `grep -q ... ; rc=$?` 로 상태만 받기 | pipefail은 여전히 파이프라인 상태를 씌우므로 파이프가 남아 있으면 무효 |

## 같은 뿌리의 함정

- `strings`는 **ASCII만 뽑는다** — 비ASCII(한글 등) 문자열을 기능 마커로 쓰면 영원히 안 잡힌다
- **버전 문자열로 배포본을 판별하려면 버전을 실제로 올려야 한다** — 코드가 바뀌었는데 버전이 같으면 `--version`으로 구/신 구별이 불가능해 결국 마커를 뒤지게 된다

---

## 관련

- [[shell-heredoc-pitfall]] · [[shell-sigtstp-background]]
- [[unknown-is-not-absent]] — 실패·모름을 정상으로 접는 같은 계열
- [[mutation-check-test-effectiveness]] — 검증이 실제로 결함을 잡는지 되돌려 확인
- [[os-overview]]
- [[process-substitution-hides-exit-code]] — `pipefail` 로도 못 잡는 프로세스 치환 쪽 종료 코드 유실

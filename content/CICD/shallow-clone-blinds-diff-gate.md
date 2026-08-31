---
title: 얕은 클론에서 diff 기반 게이트는 아무 일도 하지 않는다
tags:
  - tech
  - cicd
  - troubleshooting
created: 2026-08-28 (금)
---

# 얕은 클론에서 diff 기반 게이트는 아무 일도 하지 않는다

> **TL;DR**: "기준 커밋 대비 증가분"을 보는 CI 검사는 **기준을 못 잡으면 검사할 것이 없어진다.** CI 기본값이 얕은 클론(shallow clone)이면 `git merge-base HEAD origin/develop` 이 실패하고, 기준이 `HEAD` 로 폴백되면서 **기준 == 대상 → 증가 0 → 잡이 영원히 초록**이 된다. 전체 클론(`GIT_DEPTH: 0`)을 명시하고, **기준 산출 실패를 폴백이 아니라 종료코드로 끝낸다.**

---

## 용어

| 표기 | 원어 | 뜻 |
|---|---|---|
| 얕은 클론 | shallow clone | 최근 N개 커밋만 받아 오는 클론. CI 기본값인 경우가 많다(GitLab 은 `GIT_DEPTH` 기본 20 등) |
| merge-base | — | 두 커밋의 가장 가까운 공통 조상. "이 브랜치가 develop 에서 갈라진 지점" |
| fail-open | — | 검사가 실패했을 때 막지 않고 통과시키는 것. 반대는 fail-closed |

## 증상

- 문서·설계 초안 증가를 막는 게이트 잡이 **한 번도 빨간불이 된 적이 없다.**
- 위반을 일부러 넣어 밀어 봐도 통과한다.
- 로컬에서 같은 스크립트를 돌리면 위반이 잡힌다 — **CI 에서만 안 잡힌다.**

## 원인

게이트가 이런 모양이었다.

```bash
BASE=$(git merge-base HEAD origin/develop 2>/dev/null || git rev-parse HEAD)
./scripts/check-design-lifecycle.sh --transition "$BASE"
```

CI 러너의 클론이 얕으면 두 가지가 겹친다.

1. `origin/develop` ref 자체가 없거나, 있어도 **공통 조상이 받아 온 깊이 밖**에 있어 `merge-base` 가 실패한다.
2. `|| git rev-parse HEAD` 폴백이 **기준을 HEAD 자신으로** 만든다.

기준과 대상이 같은 커밋이면 어떤 diff 계산이든 **변화량 0** 이다. 검사는 성실히 돌고 "위반 0건"을 보고하며 종료코드 0을 준다. **검사가 죽은 것이 아니라, 검사할 대상이 빈 것이다** — 그래서 로그만 봐서는 정상과 구별되지 않는다.

같은 함정이 `develop` 브랜치 push 에서도 난다. 이때 `merge-base HEAD origin/develop` 은 **HEAD 자신**이라 항상 무효다(직전 SHA 와 비교해야 한다).

## 해결

기준을 확보하는 것과, 못 확보했을 때 멈추는 것 **둘 다** 필요하다.

```yaml
quality:docs-lifecycle:
  variables:
    # 얕은 클론이면 merge-base 가 실패하고 기준이 HEAD 로 떨어져 이 잡이 영원히 초록이 된다
    GIT_DEPTH: 0
  script:
    - |
      BASE=$(git merge-base HEAD origin/develop) || {
        echo "✖ 기준 커밋을 못 잡았다 — 얕은 클론이거나 origin/develop 이 없다. 통과시키지 않는다."
        exit 2
      }
      ./scripts/check-design-lifecycle.sh --transition "$BASE"
```

- **`2>/dev/null || 폴백` 을 지운다.** 스크립트 안에 HEAD 폴백을 남겨도 되지만 그것은 **로컬 편의용**이고, CI 에서 거기 떨어지면 검사하지 않은 것과 같다.
- 도구 부재도 같은 계열이다 — `command -v perl || exit 2` 처럼 **없으면 멈춘다.** 도구가 없으면 검사는 "위반 0건"으로 조용히 통과한다.
- 종료코드는 위반(1)과 **검사 불능**(2)을 가른다. 둘을 같은 코드로 내면 "위반이 없다"와 "확인하지 못했다"가 구별되지 않는다.

### 점검 방법

게이트를 새로 만들면 **일부러 위반을 넣은 브랜치를 CI 에 한 번 밀어 본다.** 빨간불이 안 뜨면 그 게이트는 존재하지 않는 것이다. 로컬 통과는 증거가 되지 않는다 — 로컬은 전체 클론이다.

---

## 관련

- [[count-comparison-is-not-a-freeze-gate]] — 기준을 잘 잡아도 비교 축이 얕으면 우회된다
- [[allow-failure-hides-fail-fast-skip]] — 같은 계열: 잡은 초록인데 검사는 안 돌았다
- [[test-selection-zero-match]] — 0건 선택이 green 이 되는 문제
- [[unknown-is-not-absent]] — 확인 못 한 것을 「없음」으로 접지 말라

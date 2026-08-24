---
title: allow_failure 잡 안의 검사는 게이트가 아니다
tags:
  - tech
  - cicd
  - troubleshooting
created: 2026-08-21 (금)
---

# allow_failure 잡 안의 검사는 게이트가 아니다

> **TL;DR**: fail-fast 러너(cargo test 등) + `allow_failure: true` 잡의 조합은 **앞쪽 시험 하나가 실패하면 나머지 전부를 생략하고도 파이프라인을 green으로** 만든다. 실측 사례: 5번째 시험의 상시 실패로 통합 시험 205건이 한 번도 안 돌았다. 반드시 돌아야 하는 검사는 `allow_failure` 잡 밖의 별도 잡으로 뺀다.

## 증상

- 파이프라인은 늘 green인데, 특정 시험군(통합 시험·회귀 시험)이 깨져도 아무도 모른다.
- 로컬에서 돌리면 실패하는 시험이 CI 이력에는 실패 기록조차 없다 — **실행된 적이 없기 때문**이다.

## 원인

두 장치가 겹쳐야 성립한다. 하나만 있으면 드러난다.

1. **러너의 fail-fast**: `cargo test`는 시험 바이너리 하나가 실패하면 뒤 바이너리를 중단한다(`--no-fail-fast` 없을 때). 앞쪽에 상시 실패 시험이 있으면 그 뒤 전부가 생략된다.
2. **잡의 `allow_failure: true`**: 잡이 빨간불이어도 파이프라인은 green. 그래서 "생략됐다"는 신호(잡 실패)가 사람 눈에 닿지 않는다.

여기에 부정 목록 필터(`--skip <이름>`)가 있으면 더 악화된다 — 부분문자열 매칭이라 시험 이름이 바뀌면 **조용히 풀리고**, 새 `#[ignore]` 시험은 자동으로 깨워진다.

## 해결

- **게이트가 필요한 검사는 `allow_failure` 잡 밖으로.** 결정적으로 판정되는 검사(목록 대조, 정적 검사)와 환경 flake가 섞이는 시험(DB 필요)을 다른 잡으로 갈라, 앞쪽만 배포를 막게 한다.
- 시험 선택은 부정 목록(`--skip`) 대신 **긍정 선택**(`--test '*'`, 이름 지정)으로. 이름 필터를 쓰는 자리는 **0건 매칭도 종료코드 0**이므로 실행 건수를 단언한다.
- 여러 cargo 호출로 나눌 때 `--no-fail-fast`는 **한 호출 안에서만 유효**하고, 러너 스크립트가 `set -e`면 첫 실패에서 스크립트가 죽는다 → 호출별 종료코드를 모아 마지막에 판정한다.
- `cargo test --tests`는 `--lib`의 **상위집합**이다(`--help` 정의: "test = true인 모든 target"). 두 잡의 시험 집합이 서로소라는 가정은 이중 실행이나 누락으로 이어진다.

```yaml
# 나쁨: 검사가 allow_failure 잡 안에 있다 → 실패해도 green
test:integration:
  allow_failure: true
  script: cargo test --tests -- --include-ignored   # 하나 깨지면 뒤 전부 생략

# 좋음: 결정적 검사는 게이트 잡으로 분리
test:list-guard:            # allow_failure 없음 → 배포를 실제로 막는다
  script: ./check-test-targets.sh
```

---

## 관련

- [[deploy-job-ordering-uncoordinated]] — 같은 파이프라인의 순서 함정: `needs`는 스테이지 배리어를 우회한다
- [[gitlab-rules-first-match-wins]] — 잡 생성 규칙 쪽의 유사 함정
- [[mutation-check-test-effectiveness]] — "시험이 실제로 잠그는가"를 재는 법. 이 함정은 그 전 단계인 "시험이 실제로 도는가"
- [[test-selection-zero-match]] — 같은 계열: 시험 선택이 0건 매치여도 잡은 green

---
title: 배포 잡이 서로를 모르면 순서는 빌드 시간이 정한다
tags:
  - tech
  - troubleshooting
created: 2026-08-03 (월)
---

# 배포 잡이 서로를 모르면 순서는 빌드 시간이 정한다

> **TL;DR**: 컴포넌트별 배포 잡이 각각 **자기 build만** `needs`로 잡으면 배포 순서는 설계가 아니라 **빌드 소요시간**이 정한다. 컴파일이 느린 백엔드는 늘 뒤에 올라가고 그 구간은 "구 백엔드 + 신 프론트"가 된다. 교차 `needs` + `optional: true`로 순서를 고정한다.

## 증상

배포 직후 몇 분 동안 프론트가 백엔드에 없는 필드를 기대해 화면이 비거나(`—`, 빈 목록) 404를 낸다. 잠시 뒤 저절로 정상이 된다.

"자동 회복되니까 무해"로 넘기기 쉽지만, **시연·검수 시점에 걸리면 그것이 결과**다.

## 원인

파이프라인 그래프가 이렇게 생겨 있다.

```yaml
frontend:build:  { stage: build }
backend:build:   { stage: build }

frontend:deploy:dev:
  needs: [frontend:build]      # 백엔드를 모른다
backend:deploy:dev:
  needs: [backend:build]       # 프론트를 모른다
```

두 배포 잡이 **서로를 모르므로** 각자 자기 build가 끝나는 즉시 시작한다. 같은 stage에 있어도 `needs`를 쓰면 stage 순서는 무력해진다. 결과적으로 **먼저 빌드가 끝난 쪽이 먼저 배포된다.**

Rust·Java 같은 릴리스 빌드는 프론트 번들링보다 늘 느리다 → **프론트가 항상 먼저** 올라간다. 그 창(window)이 "구 백엔드 + 신 프론트"다.

특히 위험한 조합: **SQL·템플릿을 컴파일 시점에 바이너리에 박는 경우.** 예컨대 Rust의 `include_str!`로 쿼리를 넣으면, 신 프론트가 기대하는 컬럼은 **신 백엔드 바이너리가 올라가야만** 생긴다. 배포 창 동안 그 열은 전부 빈 값이 된다.

## 해결

배포 잡이 서로를 `needs`로 참조하게 만들어 순서를 고정한다.

```yaml
frontend:deploy:dev:
  needs:
    - frontend:build
    - job: backend:deploy:dev
      optional: true          # ★ 필수
```

`optional: true`가 없으면 안 된다:

- **함정 ①** — 프론트만 바뀐 푸시에서는 `backend:deploy:dev`가 `rules`로 생성되지 않는다. `optional` 없이 참조하면 파이프라인 자체가 **YAML 오류로 깨진다.**
- **함정 ②** — CI 파일만 고친 푸시는 배포 잡을 트리거하지 않는 규칙이 흔하다. 그래서 **이 수정의 검증이 까다롭다** — 고쳤는지 확인하려면 실제 코드 변경을 함께 태워야 한다.

판단 기준:

- 손해가 **몇 분짜리 자동 회복**이고, 검수·시연 일정이 임박했다면 **조치를 미루는 것이 맞다**. 검증이 까다로운 CI 변경을 데모 이틀 전에 넣을 이유가 없다.
- 대신 **원인·방향·함정을 문서로 남긴다.** 다음 사람이 같은 창을 다시 조사하지 않도록.
- 즉시 완화가 필요하면 프론트 쪽에서 **없는 필드를 "확인 불가"로 표시**해 거짓 정보를 피한다(빈 값을 "없음"으로 단정하지 않는다).

> [!WARNING]
> stage 순서를 믿지 말라. `needs`를 쓰는 순간 그 잡은 stage 게이트를 벗어나 **DAG 순서로만** 실행된다.

> [!NOTE]
> 원인 확정은 파이프라인 하나만 실측하면 끝난다 — 각 배포 잡의 시작·종료 타임스탬프와 `needs` 그래프를 나란히 놓는다. 추측할 필요가 없다.

---

## 관련

- [[gitlab-rules-first-match-wins]] — `rules`가 잡 생성을 좌우한다
- [[gitlab-manual-deploy-rules-changes]]
- [[deploy-env-optin-flags-and-manual-button-trap]]
- [[gitlab-ci-deploy-runner]]
- [[gitlab-ci-monorepo-root-pattern]]
- [[unknown-is-not-absent]] — 배포 창 동안 빈 값을 "없음"으로 단정하지 않기

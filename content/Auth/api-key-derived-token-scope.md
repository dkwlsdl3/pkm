---
title: API 키 파생 토큰에 권한 스코프를 강제한다
tags:
  - tech
  - troubleshooting
created: 2026-07-31 (금)
---

# API 키 파생 토큰에 권한 스코프를 강제한다

> **TL;DR**: API 키를 토큰으로 교환하는 엔드포인트가 **키의 `permissions`를 버리고 소유자 role 기준 전권 토큰을 발급**하면, 읽기 전용 키로 쓰기 API를 전부 호출할 수 있다(권한 상승). Claims에 `scope: Option<Vec<String>>`을 `serde(default)`로 추가하면 **기존 토큰 하위호환을 지키면서 scope 유무만으로 토큰 유래를 구분**할 수 있다.

---

## 증상 / 취약점

```rust
// 안티패턴
let (_permissions, owner_role) = lookup_api_key(&key).await?;   // ← 키 권한을 버린다
let token = create_access_token(user_id, owner_role)?;          // ← 소유자 전권
```

`permissions = {read}`로 발급한 키로도 삭제·변경 API가 전부 통과한다. 키 발급 화면이 권한을 고르게 해 뒀다면 **사용자는 제한된 키라고 믿는다.**

## 설계

### 1. 토큰 유래를 구분할 수 있게 만든다

```rust
struct Claims {
    sub: String,
    role: String,
    #[serde(default)]                    // ★ 이미 발급된 토큰도 계속 검증된다
    scope: Option<Vec<String>>,
}
```

발급 함수를 **분리**한다:

| 경로 | 함수 | scope |
|---|---|---|
| 일반 로그인 / OTP / 패스키 / refresh | `create_access_token` | 항상 `None` |
| API 키 교환 | `create_api_key_access_token` | **빈 배열이어도 `Some`** |

내부 scoped 생성 함수를 비공개로 두면 API 키 경로만 `Some`을 만들 수 있다 ⇒ **별도 플래그 없이 `scope` 유무로 유래를 구분**한다.

### 2. 판정은 순수 함수로

```rust
fn api_key_scope_allows(is_write: bool, scope: Option<&[String]>) -> bool {
    match scope {
        None            => true,                          // 일반·기존 토큰 (동작 보존)
        Some(_) if !is_write => true,                      // 읽기는 허용
        Some(s)         => s.iter().any(|v| v == "write"), // 쓰기는 정확히 "write"만
    }
}
```

★ **허용값을 넓게 해석하지 않는다.** `permissions` 배열에 DB CHECK가 없고 생성 API가 임의 문자열을 그대로 저장한다면, `"admin"`이 상위 권한이라는 **계약 근거가 없다.** 대소문자 구분 정확한 `"write"`만 인정하고 회귀 테스트로 고정한다.

### 3. 강제 지점은 공통 인증 경로 뒤 별도 관문

JWT 검증 직후, 개별 extractor보다 **앞**에 둔다. 그러면 extractor 4종(일반·승인·관리자·capability) 전부를 한 번에 덮는다.

- 쓰기 여부는 중앙 라우트표에서 읽는다
- 라우트 메타데이터가 없으면 **스코프 토큰만** fail-closed 403(일반 토큰은 영향 없음)
- 메시지를 다른 거부와 구별한다: `"API key scope does not permit write operations"`

### 4. 인가 킬스위치와 무관하게 항상 강제한다

역할 매트릭스용 킬스위치는 **매트릭스 장애 복구용**이고 권한 상승 취약점을 다시 여는 용도가 아니다. 스코프 검사는 매트릭스 판정보다 앞에서 독립 실행되고 권한 스키마에 의존하지 않으므로, 킬스위치와 분리해 둘 수 있다.

## 남는 위험 — 하위호환의 대가

`serde(default)`로 기존 토큰을 살리면, **이미 발급된 API 키 파생 토큰은 `scope` 필드가 없어 일반 토큰과 구분되지 않는다** ⇒ 만료까지 스코프 강제를 받지 않는다. 창의 길이는 access token TTL이다(예: 900초 = 약 15분).

이걸 없애려면 전 토큰 무효화(서명 키 로테이션 등)가 필요하다. **감수할지 결정하고 문서에 남긴다** — 조용히 넘기면 나중에 "강제했다"는 주장이 그 창에서 거짓이 된다.

## 검증

- scope 조합 전수(None / Some(빈) / Some({read}) / Some({write}) × 읽기·쓰기)
- 정확한 `"write"`만 통과(대문자·유사값 음성 케이스)
- 라우트 메타데이터 부재 시 fail-closed
- Claims 하위호환(scope 없는 토큰 검증 통과)
- **삭제된 테스트 0건**을 diff로 확인

---

## 관련

- [[central-route-table-as-policy-source]] — is_write 판정의 출처
- [[authz-cutover-observe-rehearse-enforce]] — 이 취약점이 드러난 전환 작업
- [[session-keepalive-refresh-vs-relogin]] · [[oauth2]]
- [[auth-overview]]

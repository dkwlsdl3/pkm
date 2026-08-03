---
title: double-submit 쿠키는 형제 서브도메인이 우회한다
tags:
  - tech
  - troubleshooting
created: 2026-08-03 (월)
---

# double-submit 쿠키는 형제 서브도메인이 우회한다

> **TL;DR**: OAuth/OIDC `state`를 쿠키와 쿼리로 대조하는 naive double-submit은, 같은 **등록가능도메인**(eTLD+1)을 공유하는 형제 서브도메인 하나를 잡은 공격자가 상위 도메인 스코프로 같은 이름 쿠키를 심으면 **양쪽 값을 다 자기가 정해서** 통과한다. 쿠키 이름에 `__Host-` 접두사를 쓰거나 state를 세션·서버측에 묶어야 한다.

## 증상

CSRF 방어가 "있는 것처럼" 보이지만 막히지 않는다. 두 단계로 나타난다.

**1단계 — 검증하는 척만 하는 상태.** `state`를 생성해 인증 URL에 붙이고, 콜백이 쿼리로 받고, API 문서에 "CSRF state"라고까지 적혀 있는데 **저장하거나 비교하는 코드가 없다.**

```
GET /api/auth/sso/{provider}/callback?code=forged-code-12345&state=attacker-state
→ 302 /auth/login?sso_error=token_parse_failed
```

쿠키도 없고 state도 남의 것인데 관문 없이 **토큰 교환까지 진입**했다.

**2단계 — double-submit을 넣었는데도 우회 가능한 상태.** 아래가 이 노트의 본론이다.

## 원인

쿠키의 신뢰 경계는 **오리진이 아니라 등록가능도메인**이다.

`app.example.com` · `wiki.example.com` · `git.example.com` 은 서로 다른 오리진이지만 쿠키에 관해서는 `example.com` 이라는 공통 상위를 공유한다. 형제 서브도메인 하나를 장악한(또는 그곳에 XSS·업로드 경로를 가진) 공격자는

```
Set-Cookie: sso_state=attacker-state; Domain=example.com; Path=/
```

로 **피해 서비스에도 도달하는 쿠키를 심을 수 있다.** 그 뒤 콜백 URL의 쿼리에도 같은 값을 넣으면 쿠키 == 쿼리가 성립한다. 즉 **대조의 양쪽을 모두 공격자가 정한다.** naive double-submit의 알려진 우회다.

`SameSite=Lax`는 이것을 막지 못한다. 서브도메인 쿠키 주입은 크로스사이트 요청이 아니라 **같은 사이트 안의 쓰기**이고, OAuth 콜백은 top-level GET 내비게이션이라 Lax에서 쿠키가 그대로 전송된다.

자동 승인 사용자 생성과 결합하면 위조 콜백 한 번이 계정 생성으로 이어져 영향이 커진다.

## 해결

```
# ① 쿠키를 호스트에 못박는다 — Domain 속성을 붙일 수 없으므로 형제가 심을 수 없다
Set-Cookie: __Host-sso_state=<random>; Secure; Path=/; HttpOnly; SameSite=Lax
```

`__Host-` 접두사는 브라우저가 `Domain` 없음 + `Secure` + `Path=/`를 강제하고, 상위 도메인에서 심은 동명 쿠키를 이 이름으로 만들 수 없게 한다. 상위 도메인 쿠키 공유가 필요한 구조라면 대신 **서버측 세션이나 서명된 값에 state를 묶는다**(공격자가 값을 알아도 세션이 다르면 통과 못 한다).

검증 로직에서 함께 지킬 것:

- **토큰 교환보다 먼저** 검증한다. 위조 콜백에 authorization code를 소모하게 두면 안 된다.
- 쿠키·쿼리 **한쪽이 없거나 빈 문자열이면 실패**다. "없으면 통과"는 검증이 아니다.
- state 값은 로그에 남기지 않는다(있음/없음만). 유효한 state가 로그로 새면 검증이 무의미해진다.
- 검증 후 state 쿠키를 즉시 폐기한다(재사용 방지).

> [!WARNING]
> "state를 만들어 보내고 있다"는 사실은 방어의 근거가 아니다. **비교하는 코드가 있는지**로만 판정한다. API 문서에 적혀 있는 것은 더더욱 근거가 아니다.

> [!NOTE]
> 사내 서비스들이 한 도메인 아래 서브도메인으로 나뉘어 있는 조직에서는 이 우회가 이론이 아니다. 서브도메인 개수만큼 신뢰 표면이 늘어난다.

---

## 관련

- [[oauth2]] · [[oidc]] — state 파라미터의 위치
- [[sso]] — SSO 로그인 흐름 전체
- [[session-keepalive-refresh-vs-relogin]] — 세션·쿠키 수명 다루기
- [[unknown-is-not-absent]] — "없으면 통과"류 fail-open
- [[adversarial-cross-review]] — 이 구멍은 적대검증 3라운드에서 발굴됐다

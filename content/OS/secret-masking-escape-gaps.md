---
title: 비밀값 마스킹은 값이 원형 그대로일 때만 듣는다
tags:
  - tech
  - troubleshooting
created: 2026-09-07 (일)
---

# 비밀값 마스킹은 값이 원형 그대로일 때만 듣는다

> **TL;DR**: 로그·오류에서 비밀값을 지우는 코드는 "내가 아는 그 문자열이 그대로 나온다"를 전제한다. 실제로 새는 건 그 전제가 깨진 형태다 — **우리가 넘긴 것은 값을 감싼 문법**(`user = "token:비밀"`, `PASSWORD '비밀';`)인데 외부 프로그램의 표준오류에는 **감싼 문법이 벗겨진 값만** 나온다. 따옴표·구분자 안쪽까지 후보로 뽑고, **긴 조각부터** 치환하고, 개행이 든 값은 지우지 말고 **거부**해라.

## 증상

- 마스킹 함수도 있고 "지운다"는 시험도 통과하는데, 실제 로그에는 토큰이 그대로 남는다.
- 마스킹을 세게 걸었더니 오류 문구가 별표로 덮여 **원인을 읽을 수 없다**.
- 인증이 실패하는데 이유가 안 보인다 — 넘긴 값과 우리가 아는 원문이 다르다.

## 원인

### 1. 감싼 문법이 벗겨진 형태로 되돌아온다

우리가 프로그램에 넘기는 것은 값이 아니라 **값을 감싼 문법**이다.

| 넘기는 것 | 오류에 나오는 것 |
|---|---|
| `user = "token:hunter2"` (curl 설정) | `curl: (67) authentication failed: hunter2` |
| `ALTER USER postgres PASSWORD 'hunter2';` | `password rejected: hunter2` |

줄 전체만 비교하는 마스킹은 `hunter2` 단독을 못 잡는다. **시험이 `TOKEN=hunter2` 같은 편한 형태로 쓰여 있으면 통과하는데 실전에서 안 지워진다** — 시험은 실제로 넘기는 형태로 써야 한다.

### 2. 짧은 조각과 긴 조각의 순서

너무 짧은 조각(3글자 이하)을 지우면 아무 문장에나 걸려 오류를 읽을 수 없게 만든다. 반대로 **짧은 조각을 먼저 지우면 긴 조각이 더 이상 안 맞는다** — 치환은 길이 내림차순이어야 한다.

### 3. 개행이 든 값은 "지우면" 어긋난다

환경변수에 개행이 섞이는 일은 흔하다. 여기서 개행을 **조용히 걸러내면** 설정에 실리는 값(`abc`)과 마스킹 대상(`a\nbc`)이 달라져 오류에 나온 값을 못 지운다. 게다가 개행은 설정 파일의 줄 구분이라 그 줄이 통째로 깨져 **인증이 실패하는데 원인이 안 보인다**.

## 해결

후보를 넉넉히 뽑되 길이 하한을 두고, 긴 것부터 지운다.

```rust
fn secret_candidates(secret: &str) -> Vec<String> {
    const MIN_LEN: usize = 4;          // 짧은 조각은 문장을 덮어 버린다
    let mut out = Vec::new();
    let mut push = |piece: &str| {
        let piece = piece.trim().trim_matches(|c| c == '"' || c == '\'' || c == ';');
        if piece.len() >= MIN_LEN && !out.contains(&piece.to_string()) {
            out.push(piece.to_string());
        }
    };
    for line in secret.split('\n').map(str::trim).filter(|l| !l.is_empty()) {
        push(line);
        for separator in ['=', ':'] {                 // KEY=값 · 사용자:값
            if let Some((_, value)) = line.split_once(separator) {
                push(value);
                // `user = "token:비밀"` 은 구분자가 둘이다 — 안쪽까지 들어간다
                if let Some((_, inner)) = value.trim().trim_matches('"').split_once(':') {
                    push(inner);
                }
            }
        }
        for quote in ['"', '\''] {                    // 따옴표로 감싼 값
            let mut parts = line.split(quote);
            let _ = parts.next();
            for quoted in parts.step_by(2) { push(quoted); }
        }
    }
    // 🔴긴 것부터 — 짧은 조각이 먼저 지워지면 긴 조각이 안 맞는다
    out.sort_by_key(|p| std::cmp::Reverse(p.len()));
    out
}
```

개행이 든 값은 **거부한다**.

```rust
for (label, value) in [("사용자", user), ("토큰", secret)] {
    if value.contains('\n') || value.contains('\r') {
        anyhow::bail!("{}에 줄바꿈이 들어 있다 — 그대로 쓰면 인증이 실패하고 원인이 드러나지 않는다", label);
    }
}
```

> [!WARNING]
> **"비밀이 확정된 값"과 "추측 후보"를 나눠라.** 확정된 값은 짧아도 지운다. 반면 추측 후보는 하한을 둔다. 그리고 확정 경로에서는 **앞뒤 공백을 벗기지 마라** — 토큰이 `" a "` 일 때 다듬으면 문장의 모든 `a` 가 사라진다.

> [!NOTE]
> 마스킹 시험의 합격 기준은 두 개다. ① 비밀값이 안 남는다 ② **오류를 여전히 읽을 수 있다**(`curl: (67)`, `authentication failed` 가 남는다). 앞의 것만 재면 문장을 통째로 별표로 덮어도 통과한다.

---

## 관련

- [[secret-in-process-argv]] — 지우기 전에 애초에 새지 않게 하는 쪽
- [[verify-criteria-before-seeing-values]] — 시험이 실제 형태를 쓰지 않으면 통과가 무의미하다
- [[argv-assembly-single-gate]]

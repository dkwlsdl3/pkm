---
title: 길이 제한 식별자를 앞자르기 하면 충돌한다
tags:
  - tech
  - troubleshooting
created: 2026-08-18 (화)
---

# 길이 제한 식별자를 앞자르기 하면 충돌한다

> **TL;DR**: 이름이 길다고 앞 N 자만 잘라 식별자로 쓰면, **접두가 같은 서로 다른 대상이 같은 값을 갖는다.** 그 식별자로 자원을 고르는 쪽은 보통 **첫 일치를 돌려주고 중복을 알려 주지 않으므로**, 엉뚱한 대상을 조작하고도 성공으로 끝난다. 잘라야 한다면 **읽을 수 있는 앞부분 + 원본 전체의 해시 꼬리**로 만든다.

---

## 증상

디스크 시리얼(최대 20자) 로 장치를 찾아 분리하는 기능이, **다른 볼륨의 장치를 건드렸다.**

```
volume-project-alpha-data-01  → volume-project-alpha  (앞 20자)
volume-project-alpha-data-02  → volume-project-alpha  (같은 값!)
```

시리얼은 `/dev/disk/by-id` 항목을 고르는 손잡이다. 두 볼륨이 같은 값을 가지면
조회 쪽은 먼저 찾은 것을 돌려주고, 호출자는 그것이 맞는지 알 방법이 없다.

## 원인

**앞자르기는 전단사(injective)가 아니다.** 원본이 다르면 결과도 다르다는 보장이 없다.
그런데 식별자는 정의상 유일해야 하므로, 이 둘이 정면으로 충돌한다.

길이 제한 자체는 대개 바깥에서 온다(하이퍼바이저 시리얼 20자, DNS 라벨 63자,
컨테이너 이름 규칙 등) — 없앨 수 없는 제약이다.

## 해결

**앞부분 + 원본 전체의 해시 꼬리.** 해시를 자르기 **전** 이름 전체에서 뽑는 것이 핵심이다.

```rust
const MAX_LEN: usize = 20;
const HASH_LEN: usize = 8;

fn make_identifier(full_name: &str) -> String {
    let sanitized: String = full_name.chars()
        .map(|c| if c.is_ascii_alphanumeric() || c == '-' { c } else { '_' })
        .collect();

    if sanitized.len() <= MAX_LEN { return sanitized; }

    // 해시는 "잘리기 전 원본 전체" 에서 뽑는다 — 앞부분이 같아도 갈린다
    let digest = Sha256::digest(full_name.as_bytes());
    let hash: String = format!("{:x}", digest).chars().take(HASH_LEN).collect();

    let head: String = sanitized.chars().take(MAX_LEN - HASH_LEN - 1).collect();
    format!("{}-{}", head, hash)   // 정확히 MAX_LEN
}
```

- **결정적**이므로 같은 대상은 항상 같은 값이 된다
- 앞부분을 남기므로 사람이 로그에서 알아볼 수 있다
- 해시 길이는 대상 개수에 맞춰 정한다 — 16진 8자 = 32비트, 생일 문제로 **약 8만 개에서 충돌 확률 50%**

## 주의

> [!WARNING]
> **정제(sanitize) 후에 해시를 뽑으면 안 된다.** 금지 문자를 `_` 로 바꾼 뒤 해싱하면
> `a.b` 와 `a-b` 가 같은 값이 되어 충돌이 되살아난다. 해시는 **원본**에서.

> [!WARNING]
> **이 값으로 "이미 붙어 있는" 자원을 되찾지 마라.** 붙인 뒤 이름이 바뀌면 값이 달라진다.
> 실제 정의에서 읽어야 한다 → [[derived-value-vs-canonical-source]]

---

## 관련

- [[derived-value-vs-canonical-source]]
- [[disk-by-id-canonicalize-pitfall]]
- [[unique-index-null-semantics]]

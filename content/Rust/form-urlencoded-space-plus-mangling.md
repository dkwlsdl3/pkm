---
title: "form_urlencoded 재직렬화가 %20을 +로 바꾼다"
tags:
  - tech
created: 2026-07-13 (월)
---
# form_urlencoded 재직렬화가 %20을 +로 바꾼다

## 증상

URL의 query를 `url::form_urlencoded::Serializer`로 파싱→재직렬화하면 `%20`(공백)이 `+`로 바뀐다. 폼 인코딩 규약으로는 맞지만, **query 값을 그대로 소비하는 쪽**(예: postgres 연결 문자열의 `options=-c%20timezone%3D...`)은 `+`를 공백으로 해석하지 않아 파라미터가 깨진다.

## 원칙

- URL을 "수정"할 때(특정 키 제거 등) 디코드→재인코딩 왕복을 피하고, **raw 세그먼트를 `&`로 잘라 필터링**만 한다:

```rust
let kept: Vec<String> = parsed.query().unwrap_or("")
    .split('&')
    .filter(|seg| !seg.is_empty())
    .filter(|seg| {
        let key = seg.split('=').next().unwrap_or("");
        key != "host" && key != "hostaddr"   // 디코드는 키 비교에만
    })
    .map(str::to_owned)
    .collect();
```

- 회귀 테스트는 인코딩 원형 보존을 assert: 입력의 `%20`·`%3D`가 출력에 그대로 남는지

## 곁가지

- psql은 URI query의 값 안에 raw `=`가 있으면 거부하기도 한다 — 접속만 필요하면 `?` 앞까지만 쓰는 게 빠른 우회

## 관련

- [[rust-overview]]

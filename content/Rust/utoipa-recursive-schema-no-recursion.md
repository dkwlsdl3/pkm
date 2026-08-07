---
title: utoipa 자기참조 스키마 — 기동 시 stack overflow
tags:
  - rust
  - utoipa
  - openapi
created: 2026-07-10 (금)
---

# utoipa 자기참조 스키마 — 기동 시 stack overflow

## 증상

`ToSchema` derive한 구조체가 자기 자신을 참조하면(트리 노드의 `children: Vec<Self>` 등)
**컴파일·유닛 테스트는 전부 통과**하는데, 서버 기동 직후 워커 스레드가
`has overflowed its stack`으로 즉사한다.

```rust
#[derive(Serialize, ToSchema)]
pub struct TreeNode {
    pub name: String,
    pub children: Vec<TreeNode>,   // ← 여기
}
```

## 원인

utoipa(5.x)는 스키마 생성 시 중첩 타입을 인라인 전개하는데 **재귀를 감지하지
못한다**(공식 문서 명시). OpenAPI 문서는 앱 팩토리/기동 시점에 만들어지므로,
빌드나 로직 테스트로는 절대 안 잡히고 **실기동에서만 발현**한다.

## 해법

재귀 지점 필드에 `#[schema(no_recursion)]`:

```rust
#[schema(no_recursion)]
pub children: Vec<TreeNode>,
```

구조체 레벨에 붙이면 전 필드에 적용. 상호 재귀(Pet→Owner→Pet)는 루프를 끊을
쪽에 붙인다.

## 재발 방지

스키마 생성 자체를 유닛 테스트로 박아둔다 — no_recursion이 빠지면 이 테스트가
stack overflow로 죽는다:

```rust
#[test]
fn tree_node_schema_generation_terminates() {
    let _ = <TreeNode as utoipa::PartialSchema>::schema();
}
```

교훈: **"빌드+테스트 green ≠ 기동 가능"**. OpenAPI/DI 컨테이너류 기동 시점
초기화가 있는 프레임워크는 기동 경로도 검증 대상.

관련: [[rust-overview]]

---

## 관련

- [[rust-overview]]
- [[rust-build-system-deps]]

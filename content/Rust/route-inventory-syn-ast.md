---
title: 라우트 인벤토리는 정규식 대신 syn AST로 파싱
tags:
  - tech
  - rust
created: 2026-07-29 (수)
---

# 라우트 인벤토리는 정규식 대신 syn AST로 파싱

> **TL;DR**: "등록된 모든 라우트가 권한 분류표에 있나"를 CI로 막으려면 소스를 정규식으로 긁지 말고 `syn`으로 **AST 파싱**한다. 주석 처리된 등록이 자동으로 배제되고, 표 ↔ 실등록 **exact-set 비교**로 누락·유령 엔트리를 둘 다 잡는다.

## 개요

- **무엇**: 중앙 분류표(라우트 → 카테고리/권한 메타)와 실제 앱 등록 그래프가 일치하는지 검사하는 테스트
- **왜 / 언제**: 라우트가 수십~수백 개로 늘면 "표에 넣는 걸 잊은 새 엔드포인트"가 권한 검사 사각지대가 된다. 신규 라우트를 추가하면 **테스트가 실패해서 알려주는 것**이 유일하게 지속 가능한 방법

## 왜 정규식이 안 되나

```rust
// 정규식 `\.route\("([^"]+)"` 로 긁으면 이것도 잡힌다
// .route("/api/legacy/dump", web::get().to(dump))   ← 주석 처리된 죽은 등록
```

- 주석·`#[cfg(...)]`로 비활성된 등록, 문자열 리터럴이 아닌 상수·매크로 경유 등록을 구분하지 못한다
- 여러 줄에 걸친 체인, 중첩 `scope()`의 경로 접두사 합성을 재현할 수 없다

## 동작 / 예시

`syn`으로 소스를 파싱해 등록 함수의 호출 그래프를 따라간다.

```toml
# Cargo.toml — 테스트 전용 의존성
[dev-dependencies]
syn = { version = "2", features = ["full", "visit"] }
proc-macro2 = "1"
```

```rust
// tests/route_inventory.rs (요지)
use syn::visit::Visit;

struct RouteCollector { found: Vec<String> }

impl<'ast> Visit<'ast> for RouteCollector {
    fn visit_expr_method_call(&mut self, node: &'ast syn::ExprMethodCall) {
        if node.method == "route" {
            if let Some(syn::Expr::Lit(lit)) = node.args.first() {
                // scope 접두사와 합성해 최종 경로를 만든다
                self.found.push(literal_path(lit));
            }
        }
        syn::visit::visit_expr_method_call(self, node); // 체인 계속 순회
    }
}

let ast = syn::parse_file(&std::fs::read_to_string("src/main.rs")?)?;
// 주석·비활성 코드는 파싱 단계에서 이미 사라져 있다
```

그리고 **집합 비교**로 양방향 누락을 잡는다.

```rust
let registered: BTreeSet<_> = collector.found.into_iter().collect();
let declared: BTreeSet<_> = route_table::all().iter().map(|e| e.path.clone()).collect();

assert!(registered.difference(&declared).next().is_none(), "분류표 누락");
assert!(declared.difference(&registered).next().is_none(), "표에만 있는 유령 엔트리");
```

## 도입 순서

1. **리포트 모드로 먼저 넣는다** — 실패시키지 않고 차이만 출력. 기존 라우트가 많으면 즉시 강제하면 CI가 전면 적색이 된다
2. 시드 엔트리로 표를 채워 차이를 0으로 만든다
3. 그 다음에 `assert`로 승격해 회귀를 막는다

> [!WARNING]
> 등록 진입점이 `main.rs` 하나가 아니면(모듈별 `configure(cfg)` 분산) 그 함수들까지 따라가야 한다. 따라가지 못한 파일은 "라우트 0개"로 조용히 통과하므로, **파싱한 파일 수·발견 라우트 수를 함께 assert**해 침묵 실패를 막는다.

---

## 관련

- [[embedded-script-contract-tests]] — 코드가 생성하는 문자열의 운영 계약을 테스트로 고정하는 같은 결의 패턴
- [[rbac-category-menu-source-of-truth]] — 이 분류표의 카테고리 정본을 무엇으로 둘지
- [[rust-overview]]

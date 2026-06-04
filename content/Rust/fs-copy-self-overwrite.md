---
tags:
  - tech
created: 2026-06-04 (목)
---

# std::fs::copy 자기 덮어쓰기 위험

> **TL;DR**: `std::fs::copy(src, dst)`는 src==dst 가드가 없다 — 같은 경로로 복사하면 자기 자신을 덮어쓰며(truncate 후 복사) 파일 손상 위험이 있다. dest 존재 시 고유 이름 넘버링으로 방어할 것.

---

## 개요

- **무엇인가**: Rust 표준 라이브러리의 `fs::copy`는 dest를 truncate-open 후 src를 복사한다. src와 dst가 같은 파일이면 truncate가 원본을 먼저 비울 수 있다
- **언제 터지는가**: 파일 매니저류 기능에서 "같은 폴더로 복사" — dest 경로를 `dst_dir.join(src_filename)`으로 만들면 자연스럽게 src==dst가 됨
- **증상**: 사용자에겐 "복사했는데 아무 일도 안 일어남"으로 보임 (최악엔 0바이트 손상)

---

## 코드 / 사용 예시

```rust
/// dest가 이미 존재하면 "name (1).ext", "name (2).ext" … 식으로 빈 이름을 찾는다.
/// src==dest 자기 덮어쓰기도 함께 방지 (dest가 존재하므로 넘버링됨).
fn unique_dest_path(dest: &Path) -> PathBuf {
    if !dest.exists() { return dest.to_path_buf(); }
    let parent = dest.parent().map(|p| p.to_path_buf()).unwrap_or_default();
    let file_name = dest.file_name().map(|n| n.to_string_lossy().to_string()).unwrap_or_default();
    // 디렉토리는 이름 전체를 stem으로 ('v1.2' 같은 폴더명에서 확장자 오분리 방지)
    let (stem, ext) = if dest.is_dir() {
        (file_name.clone(), String::new())
    } else {
        match file_name.rsplit_once('.') {
            Some((s, e)) if !s.is_empty() => (s.to_string(), format!(".{}", e)),
            _ => (file_name.clone(), String::new()),
        }
    };
    for n in 1..=999 {
        let candidate = parent.join(format!("{} ({}){}", stem, n, ext));
        if !candidate.exists() { return candidate; }
    }
    parent.join(format!("{} (1000){}", stem, ext))
}

// 사용
let dest = unique_dest_path(&dst_dir.join(&name));
std::fs::copy(&src, &dest)?;
```

---

## 주의사항

> [!WARNING]
> 넘버링 없이 "dest 존재 시 거부"로 가면 동명 파일 덮어쓰기 의도까지 막힌다. 업로드처럼 conflictStrategy(overwrite/skip)가 있는 흐름과, 복사처럼 무조건 비파괴여야 하는 흐름을 구분해서 정책을 정할 것.

---

## 관련

- [[rust-overview]]

---
title: Path::exists() 는 stat 실패도 false 로 돌려준다
tags:
  - tech
  - troubleshooting
created: 2026-08-05 (수)
---

# Path::exists() 는 stat 실패도 false 로 돌려준다

> **TL;DR**: `Path::exists()` 는 내부적으로 `stat` 을 호출하고 **어떤 이유로 실패하든 `false`** 를 돌려준다 — 파일이 정말 없어서인지, 입출력 오류·권한 부족·저장소 무응답인지 구분되지 않는다. 삭제·복원 로직이 이걸 "없음"으로 읽으면 **파일을 남긴 채 "성공"** 이라고 답한다. `symlink_metadata()` 로 세 갈래(있음 / 없음 / 확인 실패)를 갈라라.

## 증상

- 지운 항목이 목록에서는 사라졌는데 **디스크에는 파일이 남아 있다**(용량을 계속 차지하고 백업도 계속 걸린다)
- 화면에서 손댈 방법이 없다 — 기록이 없으니 재시도할 대상이 없다
- 오류 로그가 없다. 요청은 200 이었다

## 원인

```rust
// std 구현 요약
pub fn exists(&self) -> bool { fs::metadata(self).is_ok() }
```

`is_ok()` 하나로 접히므로 아래가 전부 `false` 다.

| 실제 상황 | `exists()` |
|---|---|
| 파일이 없다 (`ENOENT`) | `false` |
| 입출력 오류 (`EIO`) — 손상된 블록·죽은 OST | `false` |
| 상위 경로 권한 없음 (`EACCES`) | `false` |
| 네트워크 파일시스템 무응답 → 오류 반환 | `false` |
| **끊어진 심볼릭 링크** (`metadata` 는 링크를 따라간다) | `false` |

여기에 순서 결함이 겹치면 유령 파일이 확정된다.

```rust
// 위험한 순서 — DB 행을 먼저 지운다
delete_row(id).await?;
if path.exists() {           // ← EIO 면 false
    fs::remove_file(&path)?; // ← 실행 안 됨
}
Ok(())                       // ← "성공"
```

## 해결

**세 갈래로 가른다.** `symlink_metadata` 는 링크를 따라가지 않아 끊어진 링크도 "있음"으로 본다.

```rust
enum Presence { Present, Absent, Unknown(std::io::Error) }

fn presence(p: &Path) -> Presence {
    match std::fs::symlink_metadata(p) {
        Ok(_) => Presence::Present,
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => Presence::Absent,
        Err(e) => Presence::Unknown(e),      // ★ 여기를 없음으로 접지 않는다
    }
}
```

**순서를 뒤집는다 — 파일을 먼저 지우고 성공한 것의 행만 삭제한다.**

```rust
match presence(&path) {
    Presence::Absent  => {}                                   // 지울 것이 없다
    Presence::Present => std::fs::remove_file(&path)?,        // 실패는 오류로 올린다
    Presence::Unknown(e) => return Err(e.into()),             // 판정 불가 → 아무것도 하지 않는다
}
delete_row(id).await?;   // 파일 처리가 성공한 뒤에만
```

못 지운 항목은 **행이 남아 목록에 보이고 재시도할 수 있다.** 이것이 유령 파일보다 낫다.

**"차 있다/비었다" 판정에도 같은 원칙을 적용한다.** 복원처럼 "빈 자리에 이름을 되돌리는" 동작은 판정
실패를 **"차 있음"** 으로 읽어야 안전하다 — 비었다고 오판하면 rename 이 **기존 파일을 조용히 대체**한다.

```rust
let occupied = !matches!(presence(&dest), Presence::Absent);  // Unknown → 차 있음
if occupied { dest = next_numbered_name(&dest); }
```

> [!WARNING]
> **삭제는 메타데이터 작업이라 데이터를 못 읽어도 성공한다.** 그래서 "상태를 확인할 수 없다"를 이유로
> 삭제를 거절하면 안 된다 — 확인 실패면 **거절하지 말고 삭제를 시도**하고 그 결과로 판정하라. 반대로
> "없다고 단정하고 건너뛰는 것"만 금지다.

> [!WARNING]
> 회귀 테스트를 **대상이 살아 있는 링크로 짜면 이 결함을 못 잡는다** — 재귀 삭제가 링크를 따라가지 않아
> `metadata` 와 `symlink_metadata` 의 결과가 같아진다. **끊어진 링크**로 짜야 한다.

> [!NOTE]
> 같은 함정이 다른 언어에도 있다: Python `os.path.exists()`(예외를 삼킨다 — `os.lstat()` 을 쓸 것),
> Go `os.Stat` + `os.IsNotExist`(다른 오류를 "존재함"으로 읽는 반대 실수가 흔하다).

---

## 관련

- [[unmounted-path-looks-absent]] — 마운트가 빠지면 하위 전체가 "없음"이 되는 상위 사례
- [[unknown-is-not-absent]] — 이 결함군의 일반형
- [[fs-copy-self-overwrite]]
- [[external-command-timeout-bulkhead]]
- [[rust-overview]]

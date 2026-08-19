---
title: /sys 순회에서 ENOTDIR 을 안 걸러내면 수집이 통째로 실패한다
tags:
  - tech
  - troubleshooting
created: 2026-07-31 (금)
---

# /sys 순회에서 ENOTDIR 을 안 걸러내면 수집이 통째로 실패한다

> **TL;DR**: `/sys/class/net` 같은 디렉터리에는 **장치가 아닌 일반 파일 항목**이 섞여 있다. 그 아래 경로를 조회하면 `NotFound`가 아니라 **`ENOTDIR`(디렉터리가 아님)** 이 난다. `NotFound`만 "해당 없음"으로 건너뛰고 나머지를 오류로 올리면, **항목 하나 때문에 수집 라운드 전체가 실패**한다.

## 증상

- 대상이 실존하는데 테이블·결과가 **0행**이다
- 로그에 같은 실패가 수집 주기마다 쌓인다(예: 5분에 100건)
- 개별 장치를 손으로 조회하면 잘 된다

## 원인

`/sys/class/net`에는 인터페이스 디렉터리 외에 **`bonding_masters` 같은 파일 항목**이 있다(내용은 본드 이름 목록).

```bash
ls -d /sys/class/net/bonding_masters/bonding
# ls: ... 디렉터리가 아닙니다          ← ENOTDIR

ls -d /sys/class/net/lo/bonding
# ls: ... 그런 파일이나 디렉터리가 없습니다   ← NotFound
```

판정 코드가 보통 이렇게 생겼다.

```rust
match fs::metadata(entry.join("bonding")) {
    Err(e) if e.kind() == ErrorKind::NotFound => continue,   // 본드 아님 → 건너뜀
    Err(e) => return Err(e.into()),                          // ← 여기서 ENOTDIR 이 걸린다
    Ok(_) => { /* 본드로 처리 */ }
}
```

`ENOTDIR`은 `NotFound`가 아니므로 두 번째 갈래로 떨어지고, **한 항목의 오류가 함수 전체를 실패시킨다.** 반환값을 그대로 위로 올리는 구조라면 라운드 전체가 죽는다.

## 해결

"대상이 아님"을 뜻하는 오류를 **한 곳에서 함께 판정**한다.

```rust
fn is_not_a_bond(e: &std::io::Error) -> bool {
    matches!(e.kind(), ErrorKind::NotFound)
        || e.raw_os_error() == Some(libc::ENOTDIR)
}
```

더 견고하게 하려면 순회 단계에서 **디렉터리(또는 심볼릭 링크)만 후보로 남긴다.**

```bash
# 셸에서 같은 발상
for d in /sys/class/net/*/; do ...; done    # 슬래시로 디렉터리만
```

## 주의

> [!WARNING]
> **항목 하나의 실패가 전체를 죽이는 구조인지 먼저 본다.** 순회 수집에서는 개별 항목 실패를 모아 보고하고 나머지를 진행하는 편이 맞다. 전체 실패로 올릴 것은 "디렉터리 자체를 못 읽음" 같은 상위 오류다.

> [!WARNING]
> `NotFound`만 특별 취급하는 코드는 `/sys`·`/proc` 순회에서 흔한 함정이다. 커널이 노출하는 디렉터리에는 **제어용 파일**이 섞이는 것이 정상이다.

---

## 관련

- [[debugfs-pseudo-file-read-buffer]] — 커널 의사 파일을 읽을 때의 인접 함정
- [[collector-orphan-cleanup]] — 수집기 설계에서 함께 보는 문제
- [[linux-permissions]]

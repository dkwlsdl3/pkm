---
title: rsync --delete 보호 목록은 경로 정규화 없이는 무력하다
tags:
  - tech
  - troubleshooting
created: 2026-08-04 (화)
---

# rsync --delete 보호 목록은 경로 정규화 없이는 무력하다

> **TL;DR**: `rsync --delete` 는 대상 디렉터리를 소스와 똑같이 만든다 — **대상의 기존 내용은 지워진다.** 보호 경로를 문자열 비교로만 막으면 `//`·`/.`·`/..` 로 뚫리고, **원격 경로는 대상 호스트의 셸을 거쳐 와일드카드가 확장된다.** 핵심 원칙은 **검사한 문자열과 실행할 문자열을 같게** 만드는 것이다.

## 증상

- 백업을 한 번 돌렸는데 대상 디렉터리의 기존 데이터가 **전부 사라졌다**(`exit 24` 가 함께 나오기도 한다)
- 보호 경로를 막아 뒀는데 설정 화면에서 그 경로가 저장된다
- 실행은 실패했는데 **사유가 엉뚱하다**("소스와 포함 관계입니다" 같은) → 검증 자체가 잘못된 문자열을 보고 있다

## 원인

**1) 검사한 문자열과 실행할 문자열이 다르다.** 보호 목록을 `dst == "/protected/base"` 같은 문자열 비교로
확인하면 아래가 전부 통과한다.

```
/protected//base        # 중복 슬래시
/protected/base/.       # 현재 디렉터리 참조
/protected/base/sub/..  # 상위 참조
```

통과한 뒤 **rsync 에는 원래 문자열이 그대로 넘어가고, 커널은 그것을 같은 디렉터리로 해석한다.**

**2) 원격 경로는 셸을 한 번 더 지난다.** rsync 는 원격 경로의 `* ? [ ]` 를 **일부러 이스케이프하지 않는다**
(구버전 인자 처리 관례 — `man rsync` 의 `--old-args` 항목 참조). 그래서 다음이 성립한다.

```
/protected/bas?   ← 문자열 비교 통과 (보호 목록에 없다)
                  → 원격 셸에서 /protected/base 로 확장
```

**3) 보호 목록이 갈려 있으면 한쪽만 보강된다.** "대상 검증용 목록"과 "원본 삭제용 목록"을 따로 두면
한쪽에 시스템 경로를 추가해도 다른 쪽은 뚫린 채 남는다.

**4) 원격 분기에 검증이 아예 없는 경우가 흔하다.** local 만 검사하고 remote 는 무검사로 나가는 코드는
"원격은 남의 서버니까"라는 암묵 가정에서 나온다 — 그런데 대개 키 인증이 이미 되어 있고 실행 주체는 root 다.

## 해결

```rust
/// 어휘적 정규화: 중복 슬래시·"."·".." 를 제거한다. 심볼릭 링크는 해결하지 않는다.
fn lexical_normalize(p: &str) -> Option<String> { /* … */ }

fn validate_target(raw: &str, protected: &[&str]) -> Result<String, Error> {
    if raw.contains(['*', '?', '[', ']']) {
        return Err(Error::Wildcard);          // 원격 셸 확장 차단 (소스·대상 양쪽)
    }
    let norm = lexical_normalize(raw).ok_or(Error::BadPath)?;
    if !norm.starts_with('/') { return Err(Error::NotAbsolute); }
    for base in protected {
        if norm == *base || norm.starts_with(&format!("{base}/")) {
            return Err(Error::Protected);
        }
    }
    Ok(norm)      // ★ 이 값을 그대로 rsync 인자로 넘긴다
}
```

지켜야 할 것:

- **정규화한 값을 실행에도 쓴다.** 검증만 정규화하고 원본 문자열로 실행하면 아무것도 막지 못한다.
- **보호 목록은 하나로 합친다.** 대상용/삭제용을 갈라 두면 한쪽만 보강된다. 시스템 경로
  (`/etc` `/boot` `/root` `/var/lib/<app>` — 특히 **이 도구의 설정 파일이 사는 곳**)를 반드시 넣는다.
- **local·remote 공통 검사와 분기별 검사를 나눈다.** 경로 자체 안전성(보호 목록·와일드카드·절대경로)은
  공통, **소스와의 포함관계 검사는 원격에 넣지 않는다** — 다른 호스트라 같은 문자열이 같은 저장소를
  뜻하지 않고, 넣으면 정당한 설정을 막는다.
- **저장 시점과 실행 직전 양쪽에서 검증한다.** 설정 파일은 손으로 편집될 수 있고 스케줄러도 같은 경로를 탄다.
- **연결 시험도 같은 검증을 통과시킨다.** 안 그러면 화면이 "접근 가능"이라 하고 실행은 "보호된 경로"라고
  답하는 모순된 신호를 준다.
- **먼저 `--dry-run` 으로 확인한다.**

```bash
rsync -az --delete --dry-run "$SRC/" "$DST/" | head -50
```

> [!WARNING]
> **어휘 정규화는 심볼릭 링크를 막지 못한다.** `/safe/link` → `/protected/base` 인 경우 문자열로는 안전해
> 보인다. 정공법은 `stat` 의 장치·inode 비교이거나 `realpath` 로 해결한 뒤 대조하는 것이다. 어휘 정규화로
> 끝냈다면 **그 한계를 문서에 명시**하라.

> [!NOTE]
> `--delete` 를 정말 써야 하는지 먼저 따져라. "증분 백업"이라는 말이 곧 미러링을 뜻하지는 않는다.
> 미러링이 필요 없으면 `--delete` 를 빼는 것이 가장 확실한 보호다.

---

## 관련

- [[rsync-checksum-verify-cost]] — 같은 백업 경로의 다른 함정: 안전 확인의 비용
- [[shell-heredoc-pitfall]] — 셸을 한 번 더 지나면서 해석이 달라지는 사례
- [[backup-strips-source-permissions]]
- [[credential-update-backup-first]]

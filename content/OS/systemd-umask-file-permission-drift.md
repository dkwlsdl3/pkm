---
title: systemd 서비스의 umask 는 대화형 셸과 다르다
tags:
  - tech
  - troubleshooting
created: 2026-08-04 (화)
---

# systemd 서비스의 umask 는 대화형 셸과 다르다

> **TL;DR**: 같은 코드가 대화형 셸(umask `0022` → 0644)과 systemd 서비스(umask `0077` → 0600)에서 **다른 권한의 파일을 만든다.** 설치 스크립트로 만들 때는 되고 서비스가 다시 쓰는 순간 깨지는 결함이 여기서 나온다. 다른 프로세스가 읽어야 하는 파일은 **umask 에 맡기지 말고 쓰기 직후·rename 직전에 모드를 명시**하라.

## 증상

"처음엔 됐는데 어느 순간부터 안 된다"의 전형이다.

- 설치 직후에는 정상 동작한다(설치 스크립트를 사람이 셸에서 돌렸다)
- 앱이 그 파일을 **한 번 다시 쓰는 순간** 다른 데몬이 못 읽게 된다
- 그 데몬은 오류를 화면에 올리지 않고 **직전 값을 계속 쓴다** → 아무 데도 오류가 없는데 결과만 틀리다

## 원인

`umask` 는 프로세스 속성이고 부모에게서 상속된다. 출처가 다르면 값이 다르다.

| 실행 주체 | umask | `0666` 요청 시 결과 |
|---|---|---|
| 로그인·대화형 셸 (`/etc/profile`, pam_umask) | `0022` | `0644` |
| systemd 서비스 (기본값) | `0077` | `0600` |
| cron 작업 | 보통 `0022` | `0644` |
| 컨테이너 엔트리포인트 | 이미지·런타임에 따라 갈림 | — |

```bash
# 서비스가 실제로 쓰는 umask 확인
systemctl show <unit> -p UMask
# 살아 있는 프로세스에서 직접
grep Umask /proc/$(pidof <bin>)/status
```

Rust `std::fs::write`, Python `open(..., 'w')`, Go `os.WriteFile(…, 0644)` **전부 umask 를 거친다.**
모드 인자는 "요청"이고 실제 값은 `요청 & ~umask` 다.

⚠️**`fs::write` 는 기존 파일의 모드를 보존한다.** 이미 0600 으로 만들어진 파일은 유닛의 `UMask=` 를
고쳐도 안 바뀐다 — 파일을 지우거나 명시적으로 `chmod` 해야 한다.

## 해결

**모드를 명시한다. rename 하는 경우 rename 전에 한다.**

```rust
use std::os::unix::fs::PermissionsExt;

fn write_world_readable(path: &Path, body: &str) -> std::io::Result<()> {
    let tmp = path.with_extension("tmp");
    std::fs::write(&tmp, body)?;
    // umask 를 거치지 않는 명시 설정. rename 전에 해야 원자 교체 후 곧바로 올바른 모드다.
    std::fs::set_permissions(&tmp, std::fs::Permissions::from_mode(0o644))?;
    std::fs::rename(&tmp, path)
}
```

```ini
# 유닛 차원으로 맞추는 방법 — 코드 명시와 병행할 때만 의미가 있다
[Service]
UMask=0022
```

**테스트에서 재현한다.** 개발 셸에서 도는 테스트는 0022 라 이 결함을 절대 못 잡는다.

```rust
#[test]
fn keeps_mode_under_service_umask() {
    let old = unsafe { libc::umask(0o077) };      // 서비스 조건 재현
    // … write_world_readable 호출 …
    assert_eq!(mode & 0o777, 0o644);
    unsafe { libc::umask(old) };
}
```

> [!WARNING]
> 반대 방향도 똑같이 위험하다. **비밀이 들어가는 파일은 umask 를 믿고 0600 을 기대하면 안 된다.**
> 대화형 셸에서 실행되는 복구·마이그레이션 경로가 있으면 그때 0644 로 만들어진다. 쓰는 쪽에서 명시하라.

> [!NOTE]
> 두 경로(설치 도구 · 런타임)가 같은 파일을 쓴다면 **양쪽 모두** 같은 방식으로 모드를 명시해야 한다.
> 한쪽만 고치면 다른 쪽이 다시 되돌린다.

---

## 관련

- [[prometheus-file-sd-stale-on-read-failure]] — 이 결함이 조용한 장애로 이어지는 대표 사례
- [[linux-permissions]]
- [[systemd-service]]
- [[backup-strips-source-permissions]] — 권한이 경로를 지나며 바뀌는 다른 사례
- [[tar-root-restores-archived-modes]] — 하드닝이 아카이브 해제로 되돌아가는 사례

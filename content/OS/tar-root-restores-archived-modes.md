---
title: GNU tar 는 root 에서 아카이브에 담긴 권한을 되살린다
tags:
  - tech
  - troubleshooting
created: 2026-08-05 (수)
---

# GNU tar 는 root 에서 아카이브에 담긴 권한을 되살린다

> **TL;DR**: GNU tar 는 **root 로 실행하면 `-p`(`--preserve-permissions`)와 `--same-owner` 가 기본값**이다. 임시 디렉터리를 `0700` 으로 조여 놓아도 그 안에 `0755` 를 담은 아카이브를 풀면 **파일이 0755 로 되살아난다.** 해제 전 하드닝은 해제로 되돌아간다 — `--no-same-owner --no-same-permissions` 를 주고, **해제 후 트리 전체를 다시** 조여라.

## 증상

- 복원·전개 경로에 비밀(비밀번호 해시·서명 키·인증서)이 평문으로 잠깐 풀리는데, **권한을 조여 놨는데도**
  다른 계정이 읽을 수 있다
- 과거에 고친 권한 유출이 **복원 경로에서만 재현**된다 — 하드닝 이전에 만든 아카이브가 그 시절 모드를
  그대로 담고 있기 때문이다
- 개발자 계정으로 테스트하면 재현되지 않는다(비-root 는 umask 가 적용된다)

## 원인

GNU tar 의 기본값이 **실행 사용자에 따라 다르다.**

| 실행 주체 | `-p` (권한 보존) | `--same-owner` |
|---|---|---|
| 일반 사용자 | 꺼짐 (umask 적용) | 꺼짐 |
| **root** | **켜짐 (기본)** | **켜짐 (기본)** |

`man tar`: *"This is the default when extracting as root."*

```bash
$ mkdir -p /tmp/hard && chmod 0700 /tmp/hard
$ sudo tar -xf archive.tar -C /tmp/hard
$ stat -c '%a %n' /tmp/hard/secret.json
755 /tmp/hard/secret.json          # ← 디렉터리는 0700 인데 파일이 0755
```

**디렉터리를 조이는 것으로는 부족하다.** 부모가 `0700` 이면 경로 탐색은 막히지만, 하드 링크·같은 uid 로
도는 다른 프로세스·부모 권한이 나중에 완화되는 경우에 파일 자체 모드가 그대로 드러난다. 게다가
`--same-owner` 는 **아카이브에 적힌 소유자로 파일을 만든다** — 아카이브를 만든 사람이 소유자를 정하는 셈이다.

## 해결

**두 겹으로 간다: 해제 옵션 + 해제 후 재하드닝.**

```bash
umask 077
work="$(mktemp -d)"            # 예측 불가 이름 + 배타 생성
chmod 0700 "$work"

tar -xf "$archive" -C "$work" \
    --no-same-owner \
    --no-same-permissions      # root 기본값을 명시적으로 끈다

# ★ 해제 후 트리 전체를 다시 조인다 (옵션을 신뢰하지 않는 두 번째 방어선)
chown -R root:root "$work"
find "$work" -type d -exec chmod 0700 {} +
find "$work" -type f -exec chmod 0600 {} +
```

```rust
// RAII 로 정리를 묶는다 — 손으로 붙이면 새 조기 반환 경로에서 또 빠진다
struct ScratchDir(PathBuf);
impl Drop for ScratchDir {
    fn drop(&mut self) { let _ = std::fs::remove_dir_all(&self.0); }
}
```

> [!WARNING]
> **임시 디렉터리 이름을 시각(초 단위)으로 만들지 마라.** 예측 가능하고 `create_dir_all` 은 기존 디렉터리도
> 성공시키므로, 비특권 사용자가 미리 만들어 두면 **소유자가 그쪽인 디렉터리에 root 가 비밀을 푼다.**
> UUID 이름 + 배타 생성(`create_new`, `mkdtemp`)으로 가라.

> [!WARNING]
> **정리를 조기 반환 경로마다 손으로 붙이지 마라.** 검증을 새로 추가하면 그 거부 경로가 정리를 빠뜨려
> 평문 비밀이 남는다. RAII(`Drop`)·`defer`·`try/finally` 로 한 곳에 묶어라.

> [!NOTE]
> `--no-same-permissions` 를 주면 umask 가 적용된다. 그래서 `umask 077` 을 함께 세워야 의도한 값이 나온다
> → [[systemd-umask-file-permission-drift]]

---

## 관련

- [[systemd-umask-file-permission-drift]] — umask 가 경로마다 다르다는 전제
- [[backup-strips-source-permissions]] — 백업이 권한을 바꾸는 반대 방향 사례
- [[psql-exit-code-zero-on-partial-restore]] — 같은 복원 경로의 다른 함정
- [[linux-permissions]]
- [[credential-update-backup-first]]

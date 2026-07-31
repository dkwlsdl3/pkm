---
title: 백업이 원본 파일의 권한 보호를 벗긴다
tags:
  - tech
  - troubleshooting
created: 2026-07-31 (금)
---

# 백업이 원본 파일의 권한 보호를 벗긴다

> **TL;DR**: 원본 설정 파일을 `640 root:app`으로 조여도, 백업 아카이브가 `644`면 그 안에 든 secret은 **누구나 읽는다**. 백업 코드는 대개 권한을 명시하지 않고 umask에 의존하는데, umask는 프로세스 환경에 좌우되고 `create_dir_all`은 **이미 있는 디렉터리 권한을 고치지 않는다**. 디렉터리 0700 / 아카이브 0600을 **명시 설정**하고, 임시 경로에서 만들 때는 **옮기기 전에** 조여라.

---

## 증상

```
/var/lib/app/backups/       drwxr-xr-x        ← 누구나 진입
  app-backup-*.tar.gz       -rw-r--r-- × 8   ← 누구나 읽음 (매일 자동 생성)
    ./database.sql                            ← DB 전체 덤프(계정·비밀번호 해시)
    ./configs/app.env                         ← DATABASE_URL · JWT_SECRET · SMTP_PASSWORD
```

원본 `/etc/app/app.env`는 배포 파이프라인이 `640 root:app`으로 조이는데, **백업이 그 보호를 벗겨버렸다.**

이론적 위험이 아니다 — 웹서버 워커나 DB 계정 같은 **비특권 서비스 계정이 실제로 644 파일을 읽는다.** 서명 키(JWT_SECRET)가 읽히면 임의 토큰을 위조할 수 있어 **애플리케이션의 인가 체계 전체가 무의미해진다.**

## 원인

1. 백업 코드에 `set_permissions` 호출이 **한 곳도 없어** umask에만 의존했다
2. umask는 **프로세스 환경에 좌우된다** — 서비스 유닛에 `UMask=0077`을 넣어도 그 유닛이 배포된 시점 이후 아카이브만 보호되고, 그전 아카이브는 644로 남는다. cron·수동 실행 경로는 또 다르다
3. `create_dir_all`(및 `mkdir -p`)은 **이미 존재하는 디렉터리의 권한을 바꾸지 않는다** — 과거에 755로 만들어진 디렉터리는 그대로 남는다
4. tar 산출물을 `/tmp`에 만들고 나중에 옮기는 구조면, **옮기기 전 구간**에 세계 읽기 가능한 창이 열린다(이름이 타임스탬프면 예측 가능하다)

## 해결

```rust
const BACKUP_DIR_MODE:  u32 = 0o700;
const BACKUP_FILE_MODE: u32 = 0o600;

// 매 호출마다 적용해 과거에 755로 만들어진 디렉터리를 수렴시킨다
fn ensure_backup_dir(p: &Path) -> io::Result<()> {
    fs::create_dir_all(p)?;
    fs::set_permissions(p, fs::Permissions::from_mode(BACKUP_DIR_MODE))
}
```

- **디렉터리 0700 / 아카이브 0600 명시**. umask에 기대지 않는다
- `ensure_*`를 **매 호출마다** 적용해 기존 디렉터리를 수렴시킨다
- 임시 경로 산출물은 **옮기기 전에** 0600으로 조여 창을 없앤다
- cross-device 폴백(copy)은 **대상 파일을 새로 만들어 umask를 타므로** 최종 경로에서 한 번 더 확정한다
- 압축 전 임시 작업 디렉터리도 0700 — 그 안에 DB 덤프와 설정 원본이 **평문으로** 들어간다

### 테스트는 불변식으로 쓴다

권한 상수 자체만 검사하는 테스트는 **호출 지점 값을 0755/0644로 되돌리는 뮤테이션이 그냥 통과한다**(장식이다). 값을 상수로 승격하고 **"group/other 비트가 0"이라는 불변식**을 검증하면 그 뮤테이션이 FAIL한다. 소유자 읽기 권한이 남는지도 함께 검사한다(복원 가능성).

### 코드 밖 조치를 잊지 말 것

수정 후에도 **이미 만들어진 아카이브는 자동으로 고쳐지지 않는다.** 다음 백업이 디렉터리는 수렴시키지만 기존 파일은 그대로다 — 별도 `chmod`로 소급 조임이 필요하고, 이미 노출됐다면 **secret 로테이션**까지 검토해야 한다.

---

## 관련

- [[linux-permissions]] · [[postgres-logical-backup]]
- [[credential-update-backup-first]]
- [[mutation-check-test-effectiveness]] — 권한 테스트가 장식인지 확인하는 방법
- [[systemd-service]]
- [[os-overview]]

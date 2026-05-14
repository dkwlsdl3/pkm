---
tags:
  - tech
created: 2026-05-14 (목)
---

# Linux 파일 권한

> **TL;DR**: rwx 3비트 × 3계층 + 특수 비트(setuid/setgid/sticky) — sticky bit가 공유 디렉토리 핵심

---

## 기본 구조

```
-rwxr-xr-- 1 admin admin 1234 May 14 file
 ↑↑↑↑↑↑↑↑↑
 │└──┴──┴── other (r--)
 │   └──── group (r-x)
 └──────── owner (rwx)
```

| 기호 | 숫자 | 의미 |
|---|---|---|
| r | 4 | 읽기 |
| w | 2 | 쓰기 |
| x | 1 | 실행/진입 |

---

## 특수 비트

### Sticky bit (1xxx)

공유 디렉토리에서 **본인 파일만 삭제 가능**하게 제한.

```bash
chmod 1777 /mnt/lustre/scratch   # rwxrwxrwt
ls -ld /tmp   # drwxrwxrwt — 대표적인 sticky bit 예시
```

`/tmp`가 sticky인 이유: 누구나 쓸 수 있지만 남의 파일은 삭제 못 하게.

### Setuid (4xxx)

실행 시 **파일 소유자 권한**으로 실행.

```bash
ls -l /usr/bin/passwd   # -rwsr-xr-x (root 소유, s = setuid)
```

일반 유저가 passwd 실행 → root 권한으로 /etc/shadow 수정 가능.

### Setgid (2xxx)

디렉토리에 설정 시 하위 파일이 **디렉토리 그룹 상속**.

---

## 주요 chmod 패턴

```bash
chmod 755 /dir      # rwxr-xr-x  일반 디렉토리
chmod 644 file      # rw-r--r--  일반 파일
chmod 600 ~/.ssh/authorized_keys  # 소유자만 읽기/쓰기
chmod 1777 /shared  # rwxrwxrwt  공유 디렉토리 (sticky)
chmod u+s binary    # setuid 설정
```

---

## 관련

- [[os-overview]]
- [[ssh-key-auth]]

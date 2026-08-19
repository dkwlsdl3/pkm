---
title: 파일 이름의 경계는 개행이 아니라 NUL 이다
tags:
  - tech
  - troubleshooting
created: 2026-08-18 (화)
---

# 파일 이름의 경계는 개행이 아니라 NUL 이다

> **TL;DR**: 파일 이름에는 개행이 들어갈 수 있다. 줄 단위로 목록을 다루면 항목 **하나가 여러 개로 갈라지고**, 갈라진 조각이 우연히 실제 항목과 이름이 같으면 **엉뚱한 것을 지운다**. 목록·정렬·대조·출력·삭제가 **전부 같은 경계(NUL)** 를 써야 한다. 하나라도 줄 단위면 그 지점에서 다시 깨진다.

---

## 증상

디스크의 파일 목록과 DB 기록을 대조해 "기록 없는 파일(고아)" 을 찾는 점검 스크립트가,
**살아 있는 파일을 고아로 올렸다.**

```
디스크: "report\n2026.pdf"   ← 이름 안에 개행 한 개
줄 단위 목록:
  report
  2026.pdf                   ← 두 항목으로 갈라짐
DB 기록: "report\n2026.pdf"  ← 한 항목
⇒ 대조 결과: report, 2026.pdf 둘 다 "기록에 없는 고아"
```

여기서 그치면 오탐이지만, 이 목록이 삭제로 이어지면 **`2026.pdf` 라는 다른 실제 파일을 지운다.**

## 원인

POSIX 파일 이름에 금지된 바이트는 `/`(경로 구분자)와 `\0` 두 개뿐이다.
**개행·탭·따옴표·공백은 전부 정상적인 이름 문자다.** 그런데 셸 도구의 기본 경계는 개행이다.

## 해결

파이프라인의 **모든 단계**를 NUL 경계로 바꾼다. 한 곳이라도 빠지면 그 지점에서 갈라진다.

```bash
# 생산: find 는 -print0, psql 은 -0(--record-separator-zero)
find "$DIR" -mindepth 1 -maxdepth 1 -printf '%f\0' | sort -z > disk.z
psql "$DB_URL" -At -0 -c "SELECT name FROM records" | sort -z > db.z

# 대조: comm 도 -z 가 필요하다 (coreutils 8.26+ / RHEL 8 = 8.30)
comm -z -23 disk.z db.z > orphans.z

# 세기: wc -l 은 개행을 센다 — 여기서는 쓸 수 없다. NUL 바이트를 센다
count_records() { tr -cd '\0' < "$1" | wc -c; }

# 읽기: read 는 -d '' 로 구분자를 NUL 로
while IFS= read -r -d '' name; do
  [ -n "$name" ] || continue
  # 사람에게 보일 때는 %q 로 이스케이프해 개행이 눈에 보이게 한다
  printf '  %q\n' "$name"
done < orphans.z

# 넘기기: xargs -0 (인자 개수 폭발도 함께 막는다)
xargs -0 du -sh --apparent-size -- < orphans.z
```

## 주의

> [!WARNING]
> **출력만 `%q` 로 바꾸는 것은 절반짜리 수정이다.** 화면에서 이름이 갈라져 보이는 것을 고칠 뿐,
> 판정 자체는 이미 갈라진 목록으로 이뤄졌다. 경계를 바꿔야 판정이 고쳐진다.

> [!WARNING]
> **`wc -l` 을 그대로 두는 것이 흔한 잔재다.** NUL 파일에는 개행이 없으므로 건수가 0 또는 1 로
> 나오고, "0건이면 조회 범위가 잘못된 것이니 지우지 않는다" 같은 안전장치가 **오작동**한다.

---

## 관련

- [[shell-heredoc-pitfall]]
- [[pipefail-grep-q-sigpipe]]
- [[collector-orphan-cleanup]]
- [[rsync-delete-path-normalization]]

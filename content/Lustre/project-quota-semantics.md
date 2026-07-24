---
title: Lustre 프로젝트 쿼터 의미론 — inode 집계와 project ID 잔류
tags:
  - tech
created: 2026-06-04 (목)
---

# Lustre 프로젝트 쿼터 의미론 — inode 집계와 project ID 잔류

> **TL;DR**: `lfs quota -p`의 파일 수는 **inode 수**(루트 디렉토리 자신 포함)이고, project ID는 `mv` 후에도 파일에 붙어 다닌다 — "파일 N개" UI 표기와 휴지통 설계에서 둘 다 함정이 된다.

---

## 개요

- **무엇인가**: Lustre 프로젝트 쿼터는 디렉토리에 project ID를 지정(`lfs project -p <id> -s`)하면 하위 파일이 상속(P 플래그)받아 용량·inode를 프로젝트 단위로 집계한다
- **왜 쓰는가**: 디렉토리(저장소) 단위 쿼터 제한 — 사용자/그룹 쿼터와 독립적
- **언제 함정인가**: inode 수를 "파일 수"로 화면에 표기할 때, 휴지통(이동 기반)을 설계할 때

---

## 핵심 개념

### inode 집계는 루트 자신을 포함

```
/shared/dev          ← inode 1 (자기 자신!)
├── folder/          ← inode 2
│   └── a.pdf        ← inode 3
├── b.png            ← inode 4
└── c.txt            ← inode 5   → lfs quota -p: files = 5
```

UI에서 "5개 파일"로 쓰면 사용자가 보는 4개(파일3+폴더1)와 불일치. → 루트 제외 후 "N개 항목"(파일+하위폴더) 표기가 정직하다.

### project ID는 mv를 따라간다

```bash
mv "/shared/dev/big.pdf" "/.trash/uuid-1234"   # 같은 fs 내 이동
lfs project /.trash/uuid-1234
#  106 P /.trash/uuid-1234   ← 여전히 dev의 project 106!
```

- 휴지통으로 옮겨도 **원 저장소 쿼터(용량+inode)를 계속 점유** — "휴지통 비워야 용량 확보" 의미론이 자동으로 성립 (Synology 등 상용 NAS와 동일)
- 반대로 휴지통 이동 시 쿼터를 즉시 해제하려면 `lfs project -p 0` 재지정 + 복원 시 재상속 처리가 필요 — 복잡도 대비 이득이 작아 보류가 합리적일 수 있음

---

## 코드 / 사용 예시

```bash
# 디렉토리에 프로젝트 지정 (상속 플래그 -s)
sudo lfs project -p 106 -s /mnt/lustre/nas/shared/dev

# 프로젝트 쿼터 설정 — -B는 기본 KB 단위! byte는 'b' suffix 필수
sudo lfs setquota -p 106 -B "${BYTES}b" /mnt/lustre

# 집계 확인 / 특정 파일의 project ID 확인
lfs quota -p 106 /mnt/lustre
lfs project /path/to/file
```

---

## 주의사항

> [!WARNING]
> `lfs setquota -B`에 byte 값을 suffix 없이 넘기면 KB로 해석돼 **쿼터가 1024배** 커진다(사실상 무제한). 생성·승인 등 setquota를 호출하는 모든 경로에서 `b` suffix를 일관되게 쓸 것 — 한 경로만 고치면 다른 경로에서 재발한다 (실사례 2회).

---

## 관련

- [[lustre-overview]]
- [[lustre-troubleshooting]]

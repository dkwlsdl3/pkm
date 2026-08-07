---
title: chezmoi 관리 파일
tags:
  - tech
  - dx
created: 2026-06-30 (화)
---

# chezmoi 관리 파일

> **TL;DR**: chezmoi가 관리하는 파일은 **타깃을 직접 고치면 `chezmoi apply` 때 소스 기준으로 다시 렌더링되며 덮어쓰여 사라진다.** 영구 변경은 반드시 **소스**를 고친 뒤 apply.

---

## 개념

chezmoi는 dotfiles를 **소스 디렉토리**에서 관리하고,
`chezmoi apply`로 홈의 **타깃 경로**에 렌더링해 내려보낸다.
소스 위치는 `chezmoi source-path`로 확인한다(기본값은 `~/.local/share/chezmoi`이지만 다른 경로일 수 있다).

```
소스: <source-path>/dot_config/foo/bar.conf
  │  chezmoi apply (렌더링·복사)
  ▼
타깃: ~/.config/foo/bar.conf   ← 실제 사용 파일 (소스의 복사본)
```

**심링크 방식과 다른 점**: 심링크로 관리하면 타깃이 소스를 가리키는 링크라서 타깃을 고치는 것이 곧 소스를 고치는 것이다. chezmoi의 타깃은 링크가 아니라 **실제 복사본**이라, 타깃을 직접 편집해도 소스엔 반영되지 않고 다음 apply에서 날아간다. 이 환경의 실제 구성은 [[dotfiles]] 참고.

---

## 함정 — 타깃 직접 편집은 소실된다

타깃 경로의 파일을 편집 → 얼마 뒤(다른 작업의 `chezmoi apply`, 또는 자동 동기화) **소스 기준으로 재렌더링**되며
편집분이 통째로 사라진다. "방금 고쳤는데 원복됐다"의 전형적 원인.

```bash
# 이 파일이 chezmoi 관리 대상인지
chezmoi managed ~/.config/foo/bar.conf

# 타깃에 대응하는 소스 경로 찾기
chezmoi source-path ~/.config/foo/bar.conf
# → ~/.local/share/chezmoi/dot_config/foo/bar.conf

# 소스를 편집한 뒤 타깃에 반영
$EDITOR "$(chezmoi source-path ~/.config/foo/bar.conf)"
chezmoi apply ~/.config/foo/bar.conf
```

- 소스 파일명은 속성 접두어로 인코딩됨: `dot_`(→`.`), `executable_`(실행권한), `*.tmpl`(템플릿).
  템플릿이면 소스가 Go 템플릿이라 리터럴 문자열이 아닐 수 있음 — 편집 시 주의.
- 반대로, 타깃에서 이미 고쳐버렸다면 `chezmoi add <타깃>`으로 소스에 역반영할 수도 있다(단 템플릿이면 깨질 수 있음).

---

## 언제 무엇을

| 상황 | 해야 할 일 |
|------|-----------|
| 관리 파일 영구 변경 | `chezmoi source-path`로 소스 찾아 편집 → `chezmoi apply` |
| 관리 여부 불확실 | `chezmoi managed <경로>`로 먼저 확인 |
| 타깃에서 이미 수정함 | `chezmoi add`로 소스 역반영(템플릿 주의) |

---

## 관련

- [[dotfiles]] — 이 환경의 dotfiles 관리 구성(소스 레포 구조·타깃 매핑·새 기기 세팅)
- [[git-workflow]]

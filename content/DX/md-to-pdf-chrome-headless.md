---
tags:
  - tech
created: 2026-06-18 (목)
---

# md-to-pdf (Chrome headless)

> **TL;DR**: pandoc/LaTeX 없이 Markdown을 HTML로 변환한 뒤, Chrome(Chromium) headless의 `--print-to-pdf`로 PDF를 만든다. 한글은 CSS에서 Noto 폰트를 지정해 깨짐을 방지한다.

---

## 개요

- **무엇인가**: Markdown → HTML → PDF 2단계 변환 파이프라인. PDF 렌더링을 브라우저 엔진(Blink)에 맡긴다.
- **왜 쓰는가**: pandoc + LaTeX(특히 한글용 XeLaTeX) 설치가 무겁고 폰트 설정이 까다롭다. 이미 설치돼 있는 Chrome/Chromium만으로 CSS 그대로 렌더된 PDF를 얻을 수 있다.
- **언제 쓰는가**: 보고서·검토 문서를 빠르게 PDF로 뽑을 때, CI 환경에 LaTeX를 넣고 싶지 않을 때.

---

## 핵심 개념

### 1. Markdown → HTML

- 임의의 Markdown 라이브러리로 변환한다. 예: Python `markdown`, Node `marked`.
- 변환 결과를 **CSS와 폰트가 포함된 HTML 템플릿**으로 감싸는 것이 핵심. 본문만 변환하면 폰트·여백이 빠진다.

### 2. 한글 폰트 지정

- 한글이 □(두부)로 깨지는 원인은 대부분 폰트 미지정 + headless 환경에 기본 한글 폰트가 없는 것.
- CSS `body { font-family: 'Noto Sans CJK KR', 'Noto Sans KR', sans-serif; }`로 명시하고, 시스템에 Noto CJK 폰트가 설치돼 있어야 한다(`fc-list | grep -i noto`로 확인).

### 3. HTML → PDF (Chrome headless)

- `--headless --print-to-pdf`로 출력. 입력 경로는 `file://` 절대경로가 안전하다.
- 최신 Chrome은 `--no-pdf-header-footer`로 날짜/URL 머리말·꼬리말을 제거한다(구버전은 `--print-to-pdf-no-header`).

---

## 코드 / 사용 예시

```bash
#!/usr/bin/env bash
# md2pdf.sh <input.md>  ->  input.html, input.pdf
set -euo pipefail
src="$1"; base="${src%.md}"

# 1) Markdown -> HTML 본문 (marked 또는 python -m markdown 등 택1)
body="$(marked "$src")"

# 2) 폰트/스타일 포함 HTML 템플릿으로 감싸기
cat > "$base.html" <<HTML
<!doctype html><html lang="ko"><head><meta charset="utf-8">
<style>
  body { font-family: 'Noto Sans CJK KR','Noto Sans KR',sans-serif;
         line-height:1.6; max-width:800px; margin:2rem auto; padding:0 1rem; }
  pre,code { font-family:'D2Coding','Noto Sans Mono CJK KR',monospace; }
  pre { background:#f5f5f5; padding:1rem; border-radius:6px; overflow:auto; }
  table { border-collapse:collapse; } th,td { border:1px solid #ccc; padding:.4rem .6rem; }
</style></head><body>
$body
</body></html>
HTML

# 3) Chrome headless로 PDF 출력 (file:// 절대경로)
google-chrome --headless --disable-gpu --no-pdf-header-footer \
  --print-to-pdf="$base.pdf" "file://$(readlink -f "$base.html")"
```

```bash
# 폰트 설치 확인 (없으면 깨짐)
fc-list | grep -i 'noto.*cjk'
# Ubuntu/Debian: sudo apt install fonts-noto-cjk
```

---

## 주의사항

> [!WARNING]
> - 실행 환경(headless 서버)에 한글 폰트가 없으면 PDF에서 한글이 깨진다. CSS 지정만으로는 부족하고 **시스템에 폰트가 설치**돼 있어야 한다.
> - `--print-to-pdf` 입력은 상대경로보다 `file://` 절대경로가 안정적이다. 로컬 이미지·CSS 링크도 절대경로로 두는 것이 안전하다.
> - 헤더/꼬리말 제거 플래그는 Chrome 버전에 따라 이름이 다르다(`--no-pdf-header-footer` vs `--print-to-pdf-no-header`).

---

## 관련

- [[terminal-setup]]
- [[github-actions]] — CI에서 문서 PDF 산출 시 LaTeX 대신 사용
- [[dx-overview]]

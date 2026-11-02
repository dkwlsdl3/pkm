---
title: wsl.exe 출력 인코딩이 PowerShell과 어긋나 한글이 깨진다
tags:
  - tech
  - troubleshooting
created: 2026-11-02 (월)
---

# wsl.exe 출력 인코딩이 PowerShell과 어긋나 한글이 깨진다

> **TL;DR**: PowerShell 스크립트에서 `wsl.exe`를 불러 출력을 받으면 한글(또는 전부)이 깨진다. `wsl.exe` **자체 메시지**는 UTF-16LE로 나오는데, WSL 안 Linux 명령의 출력은 UTF-8이기 때문이다. 둘이 섞인다. 받는 쪽 인코딩을 출력 종류에 맞추고, `WSL_UTF8=1`로 `wsl.exe` 자체 출력을 UTF-8로 통일한다.

## 증상

- Windows용 시제품의 메뉴·상태 출력에서 한글이 깨졌다.
- `wsl -l -v` 출력은 글자 사이에 공백·NUL이 끼어 보이고, 문자열 비교가 실패한다.
- 같은 스크립트에서 `wsl -- <linux 명령>`의 출력은 또 다르게 깨진다.

## 원인

- `wsl.exe`가 직접 내는 메시지(배포판 목록, 오류 등)는 기본이 UTF-16LE다.
- `wsl -- cmd`로 실행한 Linux 프로세스의 표준출력은 Linux 쪽 그대로 UTF-8이다.
- PowerShell은 외부 프로그램 출력을 `[Console]::OutputEncoding`으로 해석한다. 이 값이 한국어 Windows 기본(코드 페이지 949)이면 두 종류 모두 틀리게 읽는다.

## 해결

```powershell
# wsl.exe 자체 메시지도 UTF-8로 내보내게 한다
$env:WSL_UTF8 = "1"

# 외부 프로그램 출력을 UTF-8로 해석
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

$distros = wsl.exe -l -q          # 이제 정상 문자열
$out     = wsl.exe -- uname -r    # Linux 쪽 출력
```

- 보내는 쪽(WSL 출력)과 받는 쪽(PowerShell 해석)을 **둘 다** 맞춰야 한다. 한쪽만 고치면 다른 경로에서 다시 깨진다.
- 근거: 2026-10 Windows Lustre 시제품에서 실측 후 수정했다.

---

## 관련

- [[cli-output-locale-translated-header]] — CLI 출력을 파싱할 때의 다른 로케일 함정
- [[wsl-mirrored-lnet-kernel-socket]] — 같은 시제품의 네트워크 함정
- [[os-overview]]

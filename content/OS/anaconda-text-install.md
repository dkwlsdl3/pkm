---
tags:
  - tech
created: 2026-06-12 (금)
---

# Anaconda 텍스트 모드 설치 (Rocky/RHEL)

> **TL;DR**: 구형 GPU에서 그래픽 설치기가 "신호 없음"으로 죽으면 커널 옵션 `inst.text nomodeset`으로 텍스트 설치기를 띄운다. 화면이 멈춘 듯 보이면 `r`(refresh)이 답이다.

---

## 개요

- **무엇인가**: Rocky/RHEL 계열 설치기(Anaconda)의 텍스트 모드 사용법
- **왜 쓰는가**: 구형 서버 GPU(예: ATI ES1000)는 X 그래픽 모드 전환 시 모니터가 못 받는 신호를 쏴서 "신호 없음"이 됨. EDID 읽기 실패가 원인이라 모니터 탓이 아님
- **언제 쓰는가**: 헤드리스에 가까운 서버, VGA 직결 구형 장비 설치

---

## 핵심 개념

### 진입 — 커널 옵션

부팅 메뉴에서 "Install ..." 항목에 커서 → `Tab` → 줄 끝에 추가:

```
inst.text nomodeset
```

- `inst.text`: X 없이 번호 메뉴 기반 텍스트 설치기
- `nomodeset`: 커널 그래픽 모드 전환 차단 (보험)
- "Test this media & install"이 기본 선택인데, 미디어 검사 생략하려면 그냥 "Install" 항목 선택

### 텍스트 설치기 키

| 키 | 동작 |
|---|---|
| 항목 번호 | 메뉴 진입 / 체크박스 `[ ]`↔`[x]` 토글 |
| `c` | continue (다음/저장하고 메인 메뉴 복귀) |
| `r` | refresh — `[!] Processing...`이 안 사라질 때 (자동 갱신 안 함, 1~3분 걸리는 게 정상) |
| `b` | begin — 모든 `[!]` 해결 후에만 설치 시작 |
| `q` | **quit — 설치기 종료이니 주의** |

### 설치 소스 의미 (USB 부팅 시)

- **CD/DVD**: USB로 부팅해도 USB 미디어가 CD/DVD로 인식됨 → 이걸 선택
- local ISO: 하드디스크 안에 든 ISO 파일용
- Network: boot.iso(최소 부팅) + 미러 설치용

### 네트워크 설정

- **"Connect automatically after reboot" 체크가 핵심** — Rocky 기본값은 NIC 비활성이라 안 켜면 설치 후 첫 부팅에 네트워크 죽어 있음
- "Apply configuration in installer"는 설치 중 네트워크가 필요할 때만 (USB 소스면 미체크 무해)

### 기타

- 파티션: 기본 LVM 권장 (Standard는 크기 변경 불가, Thin은 오버커밋 모니터링 부담)
- 설치 중 쉘: Anaconda는 tmux 기반 — `Ctrl+b 2` 쉘, `Ctrl+b 1` 복귀

---

## 주의사항

> [!WARNING]
> 구형 BIOS 장비는 설치 후 재부팅 시 부트 순서가 USB로 남아 있거나, CMOS 배터리 방전으로 설정이 리셋될 수 있다. 설치 후 USB 제거 + 부트 디스크 1순위 확인까지가 설치다.

---

## 관련

- [[os-overview]]
- [[link-layer-debugging]] — 설치 직후 네트워크 안 붙을 때

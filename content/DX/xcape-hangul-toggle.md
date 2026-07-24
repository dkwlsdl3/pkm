---
title: xcape로 Ubuntu → Mac 한/영 전환 키 매핑
tags:
  - tech
created: 2026-05-12 (화)
---

# xcape로 Ubuntu → Mac 한/영 전환 키 매핑

> **TL;DR**: input-leap으로 Mac을 제어할 때 Ubuntu Alt_R 단독 입력을 xcape로 Mac 한/영 전환 단축키(Left Option + Q)로 변환

---

## 문제

input-leap으로 Mac을 제어할 때 Ubuntu의 한성 키보드에서 Alt_R(한/영 키)을 눌러도 Mac에서 한/영 전환이 안 됨.

**원인**: Karabiner-Elements는 물리 키보드 이벤트만 처리하고, input-leap이 주입하는 가상 키보드 이벤트는 인식하지 못함 (EventViewer에서 아무것도 안 잡힘으로 확인).

---

## 해결

**Step 1**: Mac 한/영 전환 단축키 확인
```
시스템 설정 → 키보드 → 키보드 단축키 → 입력 소스
→ "이전 입력 소스 선택" = Left Option + Q
```

**Step 2**: Ubuntu에 xcape 설치
```bash
sudo apt install xcape
```

**Step 3**: Alt_R 단독 입력 → Left Option + Q 변환
```bash
xcape -e 'Alt_R=Alt_L|q'
```

동작 흐름: Ubuntu Alt_R 단독 입력 → xcape가 Alt_L+Q로 변환 → input-leap이 Mac으로 전달 → Mac 한/영 전환

**Step 4**: 로그인 시 자동 실행
```bash
echo 'xcape -e "Alt_R=Alt_L|q"' >> ~/.xprofile
```

---

## Ubuntu 자체 한/영 전환

iBus 설정에서 Alt_R을 한/영 전환키로 등록:
```
iBus 설정 → 한글 → 한영전환키 → Alt_R 추가
```

---

## 관련

- [[input-leap-setup]]

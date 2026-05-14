---
title: Ubuntu ↔ Mac 키보드/마우스 공유 설정
tags:
  - tech
created: 2026-05-12 (화)
---

# Ubuntu ↔ Mac 키보드/마우스 공유 설정

> **TL;DR**: input-leap으로 Ubuntu(서버) ↔ Mac(클라이언트) 키보드·마우스 소프트웨어 공유 및 한/영 전환 설정

---

## 배경

블루투스 멀티페어링 키보드(한성 87키)를 사용해 Ubuntu PC와 MacBook Air 2018(JIS 배열) 두 대에서 키보드를 공유하려 했다. 초기에는 Karabiner-Elements로 Mac에서 가상 키보드(ANSI) 세팅, 한/영 전환 키 매핑 등을 시도했으나, 결국 input-leap으로 키보드/마우스를 소프트웨어로 공유하는 방식으로 해결하면서 Karabiner 설정은 불필요해졌다.

---

## 환경

| 항목          | 내용                               |
| ----------- | -------------------------------- |
| Ubuntu PC   | Ubuntu 22.04 LTS, 커널 5.15, 회사 PC |
| MacBook Air | 2018 인텔, macOS 14 Sonoma, JIS 배열 |
| 키보드         | 한성 87키, USB동글로 Ubuntu에 연결        |
| 마우스         | 로지텍 M650L, USB 동글로 Ubuntu에 연결    |
| 네트워크        | 같은 공유기 (30.30.30.x 대역)           |

---

## 1. 마우스 공유가 필요했던 이유

로지텍 M650L은 블루투스 멀티페어링을 **지원하지 않는다.** USB 동글로 Ubuntu에만 연결된 상태라 Mac에서는 마우스를 쓸 수 없었다. 이를 해결하기 위해 소프트웨어 KVM 스위치를 도입했다.

---

## 2. lan-mouse 시도 및 실패

양쪽에 config.toml 작성 후 daemon 실행, CLI로 클라이언트 등록 시도.

```toml
# Ubuntu: ~/.config/lan-mouse/config.toml
[client.mac]
hostname = "30.30.30.237"
port = 4242
position = "left"
```

```toml
# Mac: ~/.config/lan-mouse/config.toml
[client.ubuntu]
hostname = "30.30.30.226"
port = 4242
position = "right"
```

**실패 원인**: Ubuntu 데몬 로그에서 아래 에러 확인.

```
X11 input capture is not yet implemented :(
```

lan-mouse v0.10.0 기준 **X11 캡처 백엔드 미구현** 상태. Ubuntu가 X11 세션이라 마우스 캡처 자체가 불가능했다. Wayland로 전환하면 해결 가능하나 xmodmap 등 기존 설정이 깨지는 문제로 포기.

```bash
# 정리
rm ~/.local/bin/lan-mouse
rm -rf ~/.config/lan-mouse
```

---

## 3. SSH 연결 설정

Mac에서 Ubuntu로 SSH 접속 필요 (원격 명령 실행, input-leap 서버 제어 등).

```bash
# Ubuntu: openssh-server 설치
sudo apt install openssh-server
sudo systemctl enable --now ssh

# Mac: SSH 키 생성
ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519 -N ""

# 공개키 Ubuntu에 등록
ssh-copy-id admin@30.30.30.226
```

이후 `ssh admin@30.30.30.226` 으로 비밀번호 없이 접속 가능.

---

## 4. input-leap 설치

### Mac (v3.0.3, x86_64)

```bash
curl -L "https://github.com/input-leap/input-leap/releases/download/v3.0.3/macOS-x86_64-debug-v3.0.3.tar.gz" -o /tmp/input-leap.tar.gz
tar -xzf /tmp/input-leap.tar.gz -C /tmp/
tar -xzf /tmp/macOS-x86_64-debug/InputLeap-macOS-x86_64.tar.gz -C /tmp/
cp -r /tmp/InputLeap.app /Applications/
cp /tmp/InputLeap.app/Contents/MacOS/input-leapc ~/.local/bin/
```

> GUI(InputLeap.app)는 Qt5 라이브러리 누락으로 실행 불가. `input-leapc` CLI 바이너리만 사용.

### Ubuntu (v3.0.3, Ubuntu 22.04)

```bash
curl -L "https://github.com/input-leap/input-leap/releases/download/v3.0.3/input-leap-ubuntu-22-04-v3.0.3.tar.gz" -o /tmp/input-leap.tar.gz
tar -xf /tmp/input-leap.tar.gz -C /tmp/
tar -xf /tmp/input-leap-ubuntu-22-04/input-leap-ubuntu-22-04.tar.gz -C /tmp/input-leap-ubuntu-22-04/
cp /tmp/input-leap-ubuntu-22-04/input-leap-ubuntu-22-04/bin/* ~/bin/
```

---

## 5. input-leap 설정

- **Ubuntu = 서버** (물리 마우스/키보드가 연결된 쪽)
- **Mac = 클라이언트** (마우스/키보드를 받는 쪽)

### Ubuntu 서버 설정 파일

```bash
mkdir -p ~/.config/input-leap
cat > ~/.config/input-leap/input-leap.conf << EOF
section: screens
    skl-System-Product-Name:
    kthui-MacBookAir.local:
end

section: links
    skl-System-Product-Name:
        left = kthui-MacBookAir.local
    kthui-MacBookAir.local:
        right = skl-System-Product-Name
end
EOF
```

> Ubuntu 화면 왼쪽 끝으로 마우스를 밀면 Mac으로 전환.

### Ubuntu 서버 실행

```bash
DISPLAY=:1 nohup input-leaps --config ~/.config/input-leap/input-leap.conf --no-tray --disable-crypto > /tmp/input-leaps.log 2>&1 &
```

- `--disable-crypto`: TLS 없이 로컬 네트워크에서 간단히 연결
- `DISPLAY=:1`: SSH 환경에서 X11 디스플레이 명시 필요

### Mac 클라이언트 실행

```bash
input-leapc --name kthui-MacBookAir.local --disable-crypto --no-daemon 30.30.30.226
```

### Mac 손쉬운 사용 권한

`input-leapc`가 마우스/키보드를 제어하려면 Accessibility 권한 필요.

```
시스템 설정 → 개인 정보 보호 및 보안 → 손쉬운 사용
→ + 버튼 → ~/.local/bin/input-leapc 추가 후 토글 ON
```

> 바탕화면 앱(.app)으로 실행 시 앱 자체도 손쉬운 사용에 추가해야 함.

---

## 6. Mac 바탕화면 시작/종료 앱

매번 터미널 입력이 번거로워 AppleScript로 더블클릭 실행 앱 제작.

### InputLeap시작.app

```applescript
try
    do shell script "ssh admin@30.30.30.226 'pkill input-leaps 2>/dev/null; DISPLAY=:1 nohup /home/admin/bin/input-leaps --config ~/.config/input-leap/input-leap.conf --no-tray --disable-crypto > /tmp/input-leaps.log 2>&1 &'"
    delay 2
    do shell script "pkill input-leapc 2>/dev/null; /Users/kth/.local/bin/input-leapc --name kthui-MacBookAir.local --disable-crypto --no-daemon 30.30.30.226 > /tmp/input-leapc.log 2>&1 &"
    display dialog "Input Leap 시작됨 ✓" buttons {"확인"} default button "확인" with title "Input Leap"
on error errMsg
    display dialog "오류: " & errMsg buttons {"확인"} default button "확인" with title "Input Leap"
end try
```

### InputLeap종료.app

```applescript
try
    do shell script "pkill input-leapc 2>/dev/null; ssh admin@30.30.30.226 'pkill input-leaps 2>/dev/null'"
    display dialog "Input Leap 종료됨 ✓" buttons {"확인"} default button "확인" with title "Input Leap"
on error errMsg
    display dialog "오류: " & errMsg buttons {"확인"} default button "확인" with title "Input Leap"
end try
```

```bash
osacompile -o ~/Desktop/InputLeap시작.app start-input-leap.applescript
osacompile -o ~/Desktop/InputLeap종료.app stop-input-leap.applescript
```

---

## 7. Ubuntu ↔ Mac 한/영 전환 설정

### 문제

input-leap으로 Mac을 제어할 때 Ubuntu의 한성 키보드에서 Alt_R(한/영 키)을 눌러도 Mac에서 한/영 전환이 안 됨.

**원인**: Karabiner-Elements는 물리 키보드 이벤트만 처리하고, input-leap이 주입하는 가상 키보드 이벤트는 인식하지 못함 (EventViewer에서 아무것도 안 잡힘으로 확인).

### 해결

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

### Ubuntu 자체 한/영 전환

iBus 설정에서 Alt_R을 한/영 전환키로 등록:
```
iBus 설정 → 한글 → 한영전환키 → Alt_R 추가
```

---

## 최종 동작 상태

| 기능 | 상태 |
|---|---|
| Ubuntu 마우스 → Mac 전달 | ✅ |
| Ubuntu 키보드 → Mac 전달 | ✅ |
| 클립보드 공유 | ✅ |
| Ubuntu 한/영 전환 (Alt_R) | ✅ |
| Mac 한/영 전환 (Alt_R via input-leap) | ✅ |
| Mac 바탕화면 시작/종료 앱 | ✅ |
| SSH 비밀번호 없이 접속 | ✅ |

---

## 네트워크 정보

| 항목 | 값 |
|---|---|
| Ubuntu IP | `30.30.30.226` (enp4s0) |
| Mac IP | `30.30.30.237` (en0) |
| input-leap 포트 | `24800` (TCP) |

---

## 관련

- [[ssh-key-auth]]
- [[keyboard-fn-remap]]
- [[dx-overview]]

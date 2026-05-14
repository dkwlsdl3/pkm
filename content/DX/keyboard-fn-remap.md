---
tags:
  - tech
created: 2026-05-13 (수)
---

# Ubuntu 키보드 Fn키 리매핑 (keyd)

> **TL;DR**: MacBook Air 키보드 Fn키 리매핑 — `keyd`로 미디어 키 → F키 변환

---

## 문제

MacBook Air의 상단 키는 기본적으로 미디어 키(볼륨, 밝기 등)로 동작.  
Ubuntu에서 F11(전체화면) 등 Fn키로 써야 할 상황에서 미디어 키로 인식되는 문제.

---

## 해결 방법: keyd 설치 및 설정

### 설치

```bash
sudo apt install keyd
sudo systemctl enable keyd
sudo systemctl start keyd
```

### 설정 파일

`/etc/keyd/default.conf`

```ini
[ids]
05ac:024f

[main]
brightnessdown = f1
brightnessup = f2
scale = f3
dashboard = f4
kbdillumdown = f5
kbdillumup = f6
mute = f10
volumedown = f11
volumeup = f12
```

> `05ac:024f` 는 Apple 키보드의 USB 장치 ID.  
> `sudo keyd monitor` 로 현재 입력 장치 ID 확인 가능.

### 적용

```bash
sudo systemctl restart keyd
```

---

## 키 매핑 요약

| 물리적 키 | 리매핑 후 |
|---|---|
| 밝기 낮춤 | F1 |
| 밝기 높임 | F2 |
| 미션컨트롤 | F3 |
| 대시보드 | F4 |
| 키보드 백라이트 낮춤 | F5 |
| 키보드 백라이트 높임 | F6 |
| 음소거 | F10 |
| 볼륨 낮춤 | F11 |
| 볼륨 높임 | F12 |

---

## 관련

- keyd GitHub: https://github.com/rvaiya/keyd
- 설정 변경 후 `sudo systemctl restart keyd` 로 재적용
- 장치 ID 확인: `sudo keyd monitor`
- [[input-leap-setup]]

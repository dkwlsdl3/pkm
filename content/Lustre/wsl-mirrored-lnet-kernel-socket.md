---
title: WSL mirrored 네트워크에서 LNet 커널 소켓이 응답을 못 받는다
tags:
  - tech
  - lustre
  - troubleshooting
created: 2026-11-02 (월)
---

# WSL mirrored 네트워크에서 LNet 커널 소켓이 응답을 못 받는다

> **TL;DR**: WSL2 안에서 Lustre 클라이언트를 돌리면 mirrored 네트워크 모드에서 **TCP 연결은 되는데 `lnetctl discover`가 시간 초과**로 끝난다. 서버의 응답 패킷이 Windows까지는 오지만 WSL 안의 **커널 소켓(LNet)** 까지 전달되지 않기 때문이다(MS WSL issue #10842). LNet이 실제로 쓰는 포트를 Windows 쪽에 계속 등록해 주는 보조 프로세스를 두고, 방화벽은 512~1023 범위를 연다.

| 표기 | 원어 | 뜻 |
|---|---|---|
| WSL2 | Windows Subsystem for Linux 2 | Windows 안에서 실제 Linux 커널을 경량 VM으로 돌리는 기능 |
| mirrored 모드 | networkingMode=mirrored | WSL이 Windows의 네트워크 인터페이스를 그대로 비춰 쓰는 모드(기본은 NAT) |
| LNet | Lustre Networking | Lustre 전용 네트워크 계층. 사용자 공간이 아니라 **커널 안에서** 소켓을 연다 |

## 증상

- WSL2 안에 Lustre 클라이언트 모듈을 올리고 서버에 붙으려 했다.
- `nc`·`ssh` 같은 일반 TCP 연결은 서버까지 잘 된다.
- 그런데 `lnetctl discover <NID>`는 시간 초과로 끝나고 마운트도 실패한다.
- 서버 쪽 캡처를 보면 응답 패킷은 나가고 있다.

## 원인

- mirrored 모드는 사용자 공간 프로세스가 연 소켓에 대해서만 Windows ↔ WSL 패킷 전달을 맞춰 준다. **커널 모듈이 직접 연 소켓**(LNet)으로 오는 패킷은 Windows에서 멈춘다(MS WSL issue #10842).
- 게다가 처음에는 Windows 방화벽 규칙에 포트 3개만 열어 두었다. 그런데 LNet은 기본 수신 포트 988 외에 **512~1023 범위의 특권 출발 포트**를 쓴다.

## 해결

- 보조 프로세스가 LNet이 지금 실제로 쓰는 로컬 포트를 주기적으로 읽어 Windows 쪽에 등록한다. 구현은 시제품 코드를 참조한다.
- Windows 방화벽 인바운드 규칙에 TCP 512~1023과 988을 연다.
- **역검증**을 했다. 보조 프로세스를 빼면 실패하고 넣으면 성공한다. 우연히 된 것이 아님을 확인한 것이다.

```powershell
# 방화벽: LNet 특권 포트 범위
New-NetFirewallRule -DisplayName "LNet" -Direction Inbound -Protocol TCP -LocalPort 512-1023 -Action Allow
```

> [!WARNING]
> 이 방식은 시제품 수준의 우회다. 다른 대안은 NAT 모드 + 포트 프록시, 또는 WSL 대신 소형 Linux VM이다. 같은 노트북에서 SMB가 더 빨랐다는 측정도 있으니([[nested-vm-measurement-needs-same-host-control]]), 경로를 고르기 전에 실측한다.

---

## 관련

- [[lustre-second-lnet-for-external-clients]] — 서버 쪽에서 사내망 클라이언트를 받는 LNet 구성
- [[wsl-exe-output-encoding]] — 같은 시제품의 Windows 쪽 함정
- [[lustre-client-eviction-under-load]] — 방화벽이 Lustre 역방향 연결을 막는 다른 사례
- [[lustre-overview]]

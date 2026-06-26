---
tags:
  - tech
created: 2026-06-26 (금)
---

# openssl-sys vendored 빌드의 perl 의존성

> **TL;DR**: Rust `openssl-sys`의 `vendored` 기능은 OpenSSL을 소스에서 빌드하는데, 이 소스빌드에 perl 모듈이 필요하다. RHEL/Rocky 최소 perl엔 이게 없어 `Can't locate IPC/Cmd.pm`(이후 `Time::Piece` 등)로 빌드가 깨진다.

---

## 개요

- **무엇인가**: `openssl = { features = ["vendored"] }`(또는 의존성이 끌어오는 vendored openssl)가 빌드 시 OpenSSL을 소스 컴파일할 때 요구하는 perl 모듈들
- **왜 쓰는가**: 시스템 openssl이 없거나(musl 정적빌드), 이식성을 위해 정적 링크하려 할 때 vendored 사용 → 그 대가로 빌드머신에 perl 모듈 필요
- **언제 쓰는가**: CI 빌더 이미지(RHEL/Rocky 최소 설치)에서 openssl-sys vendored 빌드가 perl 에러로 실패할 때

---

## 핵심 개념

### 증상
```
cargo:warning=openssl-src: failed to build OpenSSL from source
Can't locate IPC/Cmd.pm in @INC (you may need to install the IPC::Cmd module)
# 하나 설치하면 다음으로: Can't locate Time/Piece.pm ...
```

### 필요한 perl 모듈 (OpenSSL 3.x 기준)
`IPC::Cmd`, `FindBin`, `Data::Dumper`, `Pod::Html`, `Time::Piece`, `Digest::SHA`, `Getopt::Std`, `Pod::Usage`, `File::Compare`, `File::Copy`.

### 설치 — `perl(모듈)` provides 문법
RHEL/Rocky에선 직접 패키지명(`perl-FindBin` 등)이 **없는** 모듈이 있다. dnf의 가상 provides로 설치하면 dnf가 알아서 올바른 패키지를 찾는다.
```bash
dnf install -y "perl(IPC::Cmd)" "perl(FindBin)" "perl(Data::Dumper)" \
  "perl(Pod::Html)" "perl(Time::Piece)" "perl(Digest::SHA)" \
  "perl(Getopt::Std)" "perl(Pod::Usage)" "perl(File::Compare)" "perl(File::Copy)"
```

### 모듈 집합 확정법 (추측 금지)
컨테이너에서 openssl 소스를 실제로 `Configure` + `make build_libs` 돌려 어디서 멈추는지로 확정한다. (한 번에 다 넣어 CI 왕복 줄임)
```bash
perl ./Configure no-shared no-tests linux-x86_64 ... && make build_libs
```

---

## 주의사항

> [!WARNING]
> 빌더 이미지에 conda가 있으면 런타임 `dnf`가 깨질 수 있다(libsolv 충돌) → [[conda-breaks-system-dnf]]. 그땐 `env -u LD_LIBRARY_PATH dnf ...`로 우회.
>
> 가장 깔끔한 해결은 **이미지 빌드 시점에** perl 모듈을 박는 것(런타임 install 워크어라운드 제거). 단 conda 설치 *전* dnf 구간에 넣을 것.

---

## 관련

- [[musl-cross-compile-openssl-libzfs]] — musl 정적빌드에서 openssl vendored로 해결(이 노트의 빌드시 perl 의존성과 짝)
- [[conda-breaks-system-dnf]]
- [[rust-overview]]

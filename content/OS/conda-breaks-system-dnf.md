---
tags:
  - tech
created: 2026-06-26 (금)
---

# conda가 시스템 dnf를 깨뜨림 (libsolv 충돌)

> **TL;DR**: conda를 설치하고 `LD_LIBRARY_PATH`에 `/opt/conda/lib`이 들어가면, 시스템 `dnf`가 conda의 libsolv를 잘못 로드해 `undefined symbol: repo_add_deltainfoxml`로 깨진다. `env -u LD_LIBRARY_PATH dnf ...`로 우회한다.

---

## 개요

- **무엇인가**: conda 설치 환경에서 시스템 패키지 매니저(dnf)가 동작 불능이 되는 현상
- **왜 쓰는가**: conda가 깔린 빌더/서버에서 `dnf install`이 갑자기 안 될 때
- **언제 쓰는가**: 한 머신에 conda(데이터 과학 스택)와 RPM 기반 시스템 도구가 공존할 때

---

## 핵심 개념

### 증상
```
$ dnf install ...
ImportError: /lib64/libdnf.so.2: undefined symbol: repo_add_deltainfoxml, version SOLV_1.0
ModuleNotFoundError: No module named '_error'
```

### 원인
conda는 자체 `libsolv`를 `/opt/conda/lib`에 둔다. `LD_LIBRARY_PATH=/opt/conda/lib:...`이 설정돼 있으면 시스템 `dnf`(python+libdnf)가 **시스템 libsolv 대신 conda의 것**을 로드 → ABI 불일치로 심볼 없음.

### 우회 (dnf만 conda 경로 제외)
```bash
env -u LD_LIBRARY_PATH dnf install -y <pkg>
# 또는
LD_LIBRARY_PATH= dnf install -y <pkg>
```
`dnf`는 conda 라이브러리가 필요 없으므로 안전.

### 이미지 빌드 시 원칙
Dockerfile에서 **모든 dnf 작업을 conda 설치 *전에* 끝내라.** conda 설치 후엔 dnf가 깨지므로, 이후 패키지를 추가하려면 빌드 순서를 바꾸거나 위 우회를 써야 한다. (`FROM <image>; RUN dnf install` 식 오버레이도 base에 이미 conda가 있으면 실패)

---

## 주의사항

> [!WARNING]
> 로컬에서 conda 깨짐을 재현해 워크어라운드를 검증할 수 있다: rockylinux:8 + miniconda 설치 + `LD_LIBRARY_PATH=/opt/conda/lib` → dnf 깨짐 / `env -u LD_LIBRARY_PATH dnf` → 정상.

---

## 관련

- [[openssl-sys-vendored-perl-deps]] — 이 충돌 때문에 CI 빌더에서 perl 모듈 런타임 설치가 막혔던 사례
- [[os-overview]]

---
tags:
  - tech
created: 2026-06-01 (월)
---

# Dockerfile: dnf install은 conda 이전에

> **TL;DR**: conda를 설치하면 `dnf`의 의존 라이브러리(libsolv 등)가 conda 환경 쪽으로 가려져 이후 `dnf install`이 깨질 수 있다. **모든 시스템 패키지(dnf/yum) 설치는 conda 설치 블록보다 앞**에 둔다.

---

## 개요

- **무엇인가**: conda가 포함된 Rocky/RHEL 계열 빌더 이미지에서 시스템 패키지 설치 순서 규칙
- **왜 쓰는가**: conda 설치 후 `dnf install`을 추가하면 libsolv 등 공유 라이브러리 충돌로 dnf가 동작하지 않는 경우가 있다
- **언제 쓰는가**: conda + 시스템 라이브러리(예: `libacl-devel`, `openssl-devel`)를 함께 쓰는 빌더 이미지를 만들 때

---

## 핵심 개념

### 순서 규칙

```dockerfile
# 1) 시스템 라이브러리 — conda 이전에 한 번에
RUN dnf install -y \
      openssl-devel pkg-config \
      libacl-devel \
      && dnf clean all

# 2) 그 다음에 conda 설치
RUN curl -L <miniconda-url> -o /tmp/miniconda.sh && bash /tmp/miniconda.sh -b -p /opt/conda
```

새 시스템 라이브러리가 필요해지면 conda 블록 뒤에 `dnf install`을 추가하지 말고, **위쪽 dnf 블록에 추가**한 뒤 재빌드한다.

### 빌드 의존성을 추가하게 되는 전형적 사례

- Rust 크레이트가 시스템 라이브러리에 링크 → `-lacl`(libacl-devel), `-lssl/-lcrypto`(openssl-devel) 등. 자세한 진단은 [[rust-build-system-deps]].

---

## 주의사항

> [!WARNING]
> 이미 conda가 설치된 이미지에서 `dnf install`이 라이브러리 오류로 실패한다면, dnf 자체가 망가진 게 아니라 **설치 순서** 문제일 수 있다. Dockerfile에서 dnf 블록을 conda 앞으로 옮겨 재빌드할 것.

---

## 관련

- [[rust-build-system-deps]] — 어떤 시스템 라이브러리가 왜 필요한지
- [[dockerd-dataroot-symlink]]
- [[docker-overview]]

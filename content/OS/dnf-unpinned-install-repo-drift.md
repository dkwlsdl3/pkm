---
title: 판을 고정하지 않은 dnf 설치는 장비마다 다른 판을 깐다
tags:
  - tech
  - troubleshooting
created: 2026-11-02 (월)
---

# 판을 고정하지 않은 dnf 설치는 장비마다 다른 판을 깐다

> **TL;DR**: `dnf install zfs`처럼 판을 지정하지 않으면, dnf는 **켜져 있는 저장소 전체에서 가장 높은 판**을 고른다. 손으로 저장소를 하나 더 붙인 장비만 다른 판이 깔린다. 같은 설치 도구를 돌렸는데 장비마다 ZFS가 2.3.2 / 2.2.9로 갈린 원인이 이것이었다. 설치 도구는 **이름-판으로 고정**하고, 판 비교는 RPM의 비교 규칙으로 한다.

## 증상

- 같은 설치 스크립트로 깐 장비들인데 `zfs version`이 서로 다르다.
- 한 장비에서만 testing 채널 판(2.3.x)이 깔려 있다.

## 원인

- 그 장비에는 lustre-server 저장소가 손으로 추가돼 있었다. 그 저장소가 더 높은 판의 `zfs` 패키지를 제공했다.
- 판을 지정하지 않은 설치는 저장소 우선순위가 같으면 가장 높은 판(NEVRA 비교)을 택한다.
- EL8용 OpenZFS의 안정(stable) 채널은 2.2 계열이다. 2.3/2.4는 testing 저장소에만 있다. 운영 장비는 안정 채널 최신을 쓰는 것이 정론이다.

## 해결

```bash
# 어느 저장소에서 왔는지 — 원인 추적
dnf info --installed zfs          # "From repo" 확인
dnf history list zfs; dnf history info <ID>
rpm -qf /usr/sbin/zpool
dnf repoquery --show-duplicates zfs   # 저장소별로 제공되는 판 목록

# 고정 설치
dnf install -y zfs-2.2.11
dnf versionlock add zfs          # (python3-dnf-plugin-versionlock) 이후 업데이트에서도 고정

# 판 비교는 손으로 짠 숫자 비교 대신 RPM 규칙으로
rpmdev-vercmp 2.2.11 2.2.9       # rpmdevtools
```

- 이미 설치된 장비도 설치 도구가 고정 판으로 맞춘다. 설치 확인만 하고 건너뛰면 판 차이가 남는다.
- `rpm` DB를 못 읽은 것을 "미설치"로 보고 판 확인 없이 설치하면 안 된다 → [[unknown-is-not-absent]]

---

## 관련

- [[install-rerun-idempotency]] — "이미 있으면 건너뛴다"가 구성 보장을 깨는 문제
- [[package-manager-exit-code-not-success]]
- [[conda-breaks-system-dnf]]
- [[os-overview]]

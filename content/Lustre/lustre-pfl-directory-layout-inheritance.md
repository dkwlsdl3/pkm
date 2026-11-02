---
title: Lustre 디렉터리 layout 상속과 PFL 기본값
tags:
  - tech
  - lustre
created: 2026-11-02 (월)
---

# Lustre 디렉터리 layout 상속과 PFL 기본값

> **TL;DR**: 디렉터리에 건 stripe 설정(layout)은 **그 뒤에 만드는 파일과 하위 디렉터리에만** 적용된다. 이미 있는 파일은 그대로다. 그리고 자기 layout이 없는 디렉터리는 부모가 아니라 **파일시스템 루트의 기본값**을 따른다. 관리형 Lustre 서비스는 루트에 PFL을 걸어 두는 방식으로 이 문제를 푼다.

| 표기 | 원어 | 뜻 |
|---|---|---|
| OST | Object Storage Target | 실제 파일 데이터가 저장되는 Lustre 저장 단위 |
| stripe count | — | 한 파일을 몇 개의 OST에 나눠 쓸지 정하는 값. `-1`이면 전체 OST |
| layout | — | 파일·디렉터리에 붙은 stripe 배치 정보 |
| PFL | Progressive File Layout | 파일 크기 구간마다 다른 stripe count를 주는 배치. 작을 땐 1개, 커지면 여러 OST |

## 개요

- **무엇**: Lustre는 디렉터리의 layout을 "새로 생길 것의 기본값"으로 쓴다. 이미 존재하는 파일의 배치는 바꾸지 않는다.
- **왜 / 언제**: "stripe 1을 바꿀 수 있나" 같은 요청을 받았을 때 설계가 갈린다. 지금 설정만 바꿀지, 기존 하위 폴더까지 일괄 적용할지, 기존 파일까지 옮길지를 정해야 한다.

## 동작 / 예시

```bash
# 새 파일 기본값만 바뀐다 — 기존 파일은 그대로
lfs setstripe -c 4 /mnt/lustre/nas/shared

# PFL: 64MiB까지 1개, 1GiB까지 4개, 그 이상은 전체 OST
lfs setstripe -E 64M -c 1 -E 1G -c 4 -E -1 -c -1 /mnt/lustre/nas/shared

lfs getstripe -d /mnt/lustre/nas/shared/sub   # 출력이 없으면 자기 layout 없음 → 루트 기본값을 따름
lfs migrate -c 4 /mnt/lustre/nas/shared/big.bin   # 기존 파일 배치를 바꾸려면 따로 옮긴다
```

상속 규칙을 정리하면 이렇다.

| 대상 | 적용되는 layout |
|---|---|
| 설정 후 새로 만든 파일 | 부모 디렉터리의 layout |
| 설정 후 새로 만든 하위 디렉터리 | 부모 layout을 복사해 받음 |
| **설정 전부터 있던** 하위 디렉터리(자기 layout 없음) | 부모가 아니라 **파일시스템 루트 기본값** |
| 이미 있는 파일 | 변하지 않음(`lfs migrate` 필요) |

- 그래서 상위 폴더에만 걸면 **기존 하위 폴더 아래에 새로 생기는 파일**은 여전히 루트 기본값(흔히 count 1)을 받는다. 일괄 적용하려면 하위 디렉터리를 순회하며 각각 걸어야 한다. 파일이 많으면 백그라운드 작업이 필요하다.
- AWS FSx for Lustre, Azure Managed Lustre 같은 관리형 서비스는 **루트에 크기별 PFL 기본값**을 둔다. 그래서 사용자가 아무것도 안 해도 큰 파일은 넓게 퍼진다(구체 값은 각 서비스 문서 확인).
- **O_APPEND로 만든 파일은 PFL을 쓰지 않고 count 1로 고정**된다(LU-12738, 2.15.8에서 실측). 로그처럼 append로 쌓는 파일은 PFL을 걸어도 한 OST에 몰린다.

## 주의

> [!WARNING]
> - 기존 장비의 layout을 업그레이드가 자동으로 바꾸게 하지 말 것. 이미 쓰는 경로의 배치가 운영 중에 바뀐다. 관리형 서비스도 기존 파일시스템은 자동 변경하지 않고 관리자가 고르게 한다.
> - 설치 스크립트에서 `lfs setstripe ... 2>/dev/null || true`처럼 실패를 삼키면, 기본 폴더에 layout이 안 걸린 채로 설치가 "성공"한다. 실패하면 설치를 멈춘다.
> - 순회 적용 중에 폴더가 사라지면 setstripe가 그 자리에 빈 파일을 만든다 → [[lfs-setstripe-missing-dir-creates-file]]

---

## 관련

- [[lfs-setstripe-missing-dir-creates-file]] — 순회 적용 때 반드시 같이 막아야 할 함정
- [[lustre-ost-add-no-rebalance]] — OST를 추가해도 기존 데이터는 옮겨지지 않는다(같은 "기존 것은 그대로" 원리)
- [[lustre-overview]]

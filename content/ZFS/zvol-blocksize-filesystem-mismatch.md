---
title: zvol 블록 크기와 파일시스템 블록 크기 불일치
tags:
  - tech
  - troubleshooting
created: 2026-08-13 (목)
---

# zvol 블록 크기와 파일시스템 블록 크기 불일치

> **TL;DR**: zvol(ZFS가 블록 장치로 노출하는 볼륨) 위에 파일시스템을 만들 때, **볼륨의 블록 크기와 파일시스템 블록 크기가 다르면 쓰기 증폭이 생긴다.** 볼륨 64K에 ext4 기본 4K를 얹으면 4K를 쓰려고 64K를 읽고 고쳐 쓴다. 성능 측정 전에 이것부터 맞춰야 한다.

## 용어

| 표기 | 원어 | 뜻 |
|---|---|---|
| zvol | ZFS volume | ZFS가 파일시스템이 아니라 **블록 장치**로 내보내는 볼륨. VM 디스크로 흔히 쓴다 |
| volblocksize | — | zvol의 블록 크기. **생성 시 정해지고 나중에 못 바꾼다** |
| RMW | Read-Modify-Write | 한 블록 일부만 바꾸려고 블록 전체를 읽고 고쳐 다시 쓰는 것 |
| 쓰기 증폭 | write amplification | 애플리케이션이 쓴 양보다 실제 장치에 쓰이는 양이 많아지는 것 |

## 증상

- 같은 디스크인데 zvol을 거치면 작은 쓰기 성능이 크게 떨어진다
- "가상화 계층 비용"을 재면 비상식적으로 큰 값(수십 %)이 나온다
- 대용량 순차 쓰기는 멀쩡한데 작은 쓰기만 나쁘다

## 원인

zvol의 `volblocksize`가 64K이고 그 위 파일시스템이 4K 블록을 쓴다면, 파일시스템이 4K를 갱신할 때마다 ZFS는 **64K를 읽어 4K를 고치고 64K를 다시 쓴다**(RMW). ZFS는 COW(Copy-On-Write)라 제자리 갱신이 없어 이 비용이 그대로 드러난다.

반대 방향(볼륨 8K, 파일시스템 64K)도 이상적이지 않지만, 여러 블록을 묶어 쓰는 쪽이라 손해가 작다. **작은 쪽이 위에 오는 조합이 나쁘다.**

## 확인

```bash
# 볼륨 블록 크기
zfs get volblocksize <POOL>/<VOLUME>

# 게스트(또는 호스트)에서 파일시스템 블록 크기
tune2fs -l /dev/<DEVICE> | grep -i 'block size'    # ext4
xfs_info /<MOUNTPOINT> | grep bsize                # xfs

# 장치가 보고하는 물리/논리 블록 크기
lsblk -o NAME,PHY-SEC,LOG-SEC /dev/<DEVICE>
```

## 해결

```bash
# ① 파일시스템 쪽을 볼륨에 맞춘다 (재포맷 필요)
mkfs.ext4 -b 4096 -E stride=...,stripe-width=... /dev/<DEVICE>
#   ext4 블록은 최대 4K다. 볼륨이 64K면 완전히 맞출 수 없으므로,
#   볼륨 쪽을 낮추는 ②가 보통 더 낫다

# ② 볼륨을 다시 만든다 — volblocksize 는 사후 변경 불가
zfs create -V <SIZE> -o volblocksize=16K <POOL>/<VOLUME>
```

경험적으로 **16K 부근이 일반적인 절충점**이다. 실측에서 작은 쓰기가 64K 대비 **+36%** 나온 사례가 있다(SSD 기준 — 회전 디스크에서는 다를 수 있다).

## 주의

> [!WARNING]
> **이 불일치를 모른 채 잰 "가상화 계층 비용"은 계층 비용이 아니다.** 계층 비용과 쓰기 증폭이 한 값에 섞여 있다. 블록 크기를 맞춘 뒤 다시 재기 전까지는 그 수치를 인용하면 안 된다.

> [!WARNING]
> `volblocksize`는 **생성 시에만 정할 수 있다.** 운영 중인 볼륨은 데이터를 옮기고 다시 만들어야 하므로, 구축 단계에서 정하는 것이 유일하게 싼 시점이다.

---

## 관련

- [[lustre-zvol-vm-layering-overhead]] — zvol + VM 다층 스택의 오버헤드
- [[zfs-sync-write-weakness]] — ZFS 동기 쓰기 약점
- [[zfs-overview]]

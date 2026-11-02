---
title: raidz의 작은 블록은 패딩 때문에 명목 효율보다 낮다
tags:
  - tech
  - zfs
created: 2026-11-02 (월)
---

# raidz의 작은 블록은 패딩 때문에 명목 효율보다 낮다

> **TL;DR**: raidz2를 디스크 12개로 묶으면 명목 효율은 10/12 = 83.3%다. 하지만 4K 섹터 디스크 위의 64K·128K 블록은 실제로 **76.2%** 만 데이터로 쓴다. 블록마다 붙는 패리티와 패딩 때문이다. zvol을 여러 개 얹는 용량 산정에서 이 차이를 빼먹으면 디스크 수가 모자란다.

| 표기 | 원어 | 뜻 |
|---|---|---|
| raidz2 | RAID-Z2 | 패리티 2개를 두는 ZFS의 패리티 RAID → [[zfs-raidz-levels]] |
| zvol | ZFS volume | ZFS가 블록 장치로 내보내는 볼륨 |
| volblocksize | — | zvol 블록 크기. 만들 때 정하며 나중에 바꿀 수 없다 |
| ashift | — | 섹터 크기의 log2. 12면 4KiB 섹터 |

## 개요

- **무엇**: raidz는 블록마다 따로 패리티를 붙인다. 이때 "디스크 폭 - 패리티" 단위로 행을 나누고, 행마다 패리티를 둔다. 그리고 전체 할당량을 (패리티+1)의 배수로 올린다(패딩). 블록이 작을수록 이 고정 비용의 비중이 커진다.
- **왜 / 언제**: Lustre OST처럼 zvol 위에 다른 파일시스템을 얹는 구성으로 1PB급 용량을 산정할 때 쓴다. 명목 효율로 계산하면 몇 %p가 모자란다.

## 동작 / 예시

계산식은 OpenZFS `vdev_raidz_asize()`를 따른다(2.2.6과 2.3.2의 식이 같음).

```text
s     = 블록 / 섹터            (64K / 4K = 16)
rows  = ceil(s / (폭 - p))     (ceil(16/10) = 2)
alloc = s + rows × p           (16 + 4 = 20)
alloc = (p+1)의 배수로 올림     (20 → 21)
효율  = s / alloc              (16/21 = 76.2%)
```

ashift=12에서 계산한 값:

| 구성 | 16K | 64K | 128K | 1M | 명목 |
|---|---:|---:|---:|---:|---:|
| raidz2, 12개 | 66.7% | 76.2% | 76.2% | 82.8% | 83.3% |
| raidz2, 10개 | 66.7% | 76.2% | 76.2% | 79.8% | 80.0% |
| raidz2, 6개 | 66.7% | 66.7% | 66.7% | 66.7% | 66.7% |

- **폭이 넓을수록 명목과 실효의 차이가 커진다.** 6개 폭은 우연히 손실이 없지만 12개 폭은 7%p 넘게 잃는다.
- 큰 레코드(1M)는 명목에 가깝다. 파일시스템 데이터셋에 큰 `recordsize`를 쓰면 손실이 작다. 반면 zvol은 volblocksize가 작아 손실을 그대로 진다.

## 주의

> [!WARNING]
> - `zfs list`의 사용 가능 용량은 128K 블록 기준 비율로 환산한 값이다. 실제 블록 크기가 다르면 실사용과 어긋난다 → [[zpool-vs-zfs-capacity-basis]]
> - volblocksize를 키우면 패딩 손실은 줄지만, 그 위 파일시스템 블록과 어긋나 쓰기 증폭이 생긴다 → [[zvol-blocksize-filesystem-mismatch]]. 두 노트를 함께 보고 정한다.
> - 대용량 디스크는 재구축이 길어 raidz2 이상을 쓴다. SMR(Shingled Magnetic Recording, 기록 트랙을 겹쳐 쓰는 고밀도 방식) 디스크는 재구축이 극도로 느려 ZFS에 맞지 않으므로 CMR(Conventional Magnetic Recording, 일반 기록 방식)을 고른다.

---

## 관련

- [[zfs-raidz-levels]]
- [[zvol-blocksize-filesystem-mismatch]]
- [[zpool-vs-zfs-capacity-basis]]
- [[lustre-zvol-vm-layering-overhead]]
- [[zfs-overview]]

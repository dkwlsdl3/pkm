---
title: Lustre 클라이언트와 OSS를 같은 커널에 두면 메모리 압박에서 교착한다
tags:
  - tech
  - lustre
created: 2026-11-02 (월)
---

# Lustre 클라이언트와 OSS를 같은 커널에 두면 메모리 압박에서 교착한다

> **TL;DR**: 한 서버에서 Lustre 클라이언트(마운트해서 쓰는 쪽)와 OSS(데이터를 저장하는 쪽)를 **같은 커널**로 돌리면 메모리가 모자랄 때 교착할 수 있다. 매뉴얼도 경고하는 구성이다. OSS를 VM으로 떼어 내면 피할 수 있다. 다만 VM 메모리를 고정하지 않으면 스왑 때문에 "멈춘 듯한 지연"이 남는다.

| 표기 | 원어 | 뜻 |
|---|---|---|
| OSS | Object Storage Server | OST를 서비스하는 Lustre 서버 |
| ARC | Adaptive Replacement Cache | ZFS의 메모리 캐시 |
| balloon | memory ballooning | 호스트가 VM 메모리를 실행 중에 회수해 가는 기능 |

## 개요

- **무엇**: 클라이언트가 더러운 페이지(dirty page, 아직 디스크에 안 쓴 데이터)를 내보내려면 OSS가 그것을 받아 줘야 한다. 그런데 같은 커널의 OSS가 바로 그 메모리 부족 때문에 할당을 못 하면, 서로를 기다리며 멈춘다.
- **왜 / 언제**: 단일 서버로 Keeper 같은 NAS를 구성하면서 호스트에 Lustre를 마운트해 SMB·웹으로 다시 내보내고, 같은 호스트에서 OSS까지 돌리려 할 때 부딪힌다. 대용량 견적 검토(서버 1대 + JBOD 구성)에서 구조 결정의 근거가 됐다.

## 동작 / 예시

권장 구조: 호스트 = 클라이언트, OSS·MDS = VM

```text
[호스트 커널]  Lustre 클라이언트 → SMB/웹 재공유
     │ virtio
[OSS VM 커널]  OSS + ZFS(zvol/OST)   ← 커널이 분리돼 교착 고리가 끊긴다
```

VM으로 떼어 낼 때 같이 챙길 것:

```xml
<!-- libvirt: OSS VM 메모리를 고정 — balloon 회수·호스트 스왑 방지 -->
<memoryBacking><locked/><hugepages/></memoryBacking>
<devices><memballoon model='none'/></devices>
```

```bash
# VM 안 ZFS ARC 상한 — VM 메모리를 ARC가 다 먹지 않게
echo "options zfs zfs_arc_max=$((32*1024**3))" > /etc/modprobe.d/zfs.conf
```

## 주의

> [!WARNING]
> - VM으로 분리해도 메모리를 고정하지 않으면(balloon 있음, locked·hugepages 없음) 호스트가 압박받을 때 OSS VM이 스왑으로 밀린다. 교착은 아니지만 **I/O가 멈춘 듯 길게 지연**된다.
> - 근거는 Lustre 매뉴얼의 경고와 구조 검토다. 이 구성에서 교착을 직접 재현한 기록은 아니다.

---

## 관련

- [[lustre-node-topology]] — 논리 노드(역할 VM)와 물리 노드 구분
- [[lustre-zvol-vm-layering-overhead]] — VM·zvol 계층을 얹는 비용
- [[zfs-arc-and-lustre-overhead]]
- [[lustre-overview]]

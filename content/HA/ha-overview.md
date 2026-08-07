---
title: HA / 클러스터 개요 (MOC)
tags:
  - tech
  - moc
  - ha
created: 2026-07-24 (금)
---

# HA / 클러스터 개요 (MOC)

> 고가용성(High Availability) 클러스터 — 노드 이중화·데이터 복제·페일오버로 단일 장애점 제거

---

## 용어

| 표기 | 원어 | 뜻 |
|---|---|---|
| HA | High Availability | 고가용성. 한 노드가 죽어도 서비스가 이어지는 구성 |
| DRBD | Distributed Replicated Block Device | 노드 간 블록 장치를 실시간 복제해 "공유 디스크"를 흉내 내는 소프트웨어 |
| STONITH | Shoot The Other Node In The Head | 응답 없는 노드를 강제로 차단·정지시키는 펜싱 기법. 이름 그대로 "확실히 죽인다"는 뜻이며, 두 노드가 동시에 자원을 쥐는 사태(split-brain)를 막는다 |
| HBA | Host Bus Adapter | RAID 로직 없이 디스크를 호스트에 연결만 하는 컨트롤러 → [[zfs-hba-vs-hwraid]] |
| 정족수(quorum) | — | 클러스터가 "내가 정상 다수"라고 판단하는 데 필요한 과반 표 → [[quorum-witness-odd-rule]] |

Pacemaker(클러스터 자원 관리자), Corosync(노드 간 하트비트·멤버십 계층)는 제품 이름이다.

---

## 핵심 개념

- [[ha-cluster-fundamentals]] — Pacemaker/Corosync/DRBD 3대 요소 (입문)
- [[quorum-witness-odd-rule]] — 정족수(과반)와 witness 홀수화 규칙

---

## 관련

- [[lustre-ha-drbd-zfs]] — 공유스토리지 없는 2노드 Lustre HA 실제 구성 (운영 심화)
- [[lustre-servicenode-failover]] — Lustre servicenode 페일오버
- [[zfs-hba-vs-hwraid]] — 공유 스토리지/HBA 패스스루 관점

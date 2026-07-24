---
tags:
  - ha
  - cluster
  - pacemaker
  - corosync
  - drbd
---

# HA 클러스터 3대 요소 — Pacemaker / Corosync / DRBD (입문)

고가용성(HA, High Availability) 클러스터의 핵심 3부품과 정족수 개념. 실제 2노드 Lustre HA 구성 등 운영 심화는 [[lustre-ha-drbd-zfs]].

## 한 줄 요약

| 이름 | 약자 | 역할 | 비유 |
|---|---|---|---|
| **Corosync** | (고유명, 약자 아님) | 노드끼리 통신·생존확인·정족수 | 신경 / 심장박동 |
| **Pacemaker** | (고유명, 약자 아님) | 뭘 어디서 돌릴지 결정 + 페일오버 실행 | 두뇌 / 관리자 |
| **DRBD** | **D**istributed **R**eplicated **B**lock **D**evice | 디스크 데이터를 네트워크로 실시간 복제 | 쌍둥이 디스크 |

## 각 역할

- **Corosync** — 하트비트로 노드 생존 확인, 멤버십, 정족수(quorum) 판정. **데이터 복제나 서비스 이동은 안 한다.**
- **Pacemaker** — Corosync 위에 얹혀 리소스(가상IP·파일시스템 마운트·DB·VM 등)를 관리. 노드가 죽으면 살아있는 노드로 리소스를 옮겨 재기동(페일오버). STONITH 지시.
- **DRBD** — 블록 장치를 네트워크 너머 노드로 실시간 미러링(= "네트워크 RAID1"). **Protocol C(동기)** = 양쪽 디스크 기록 확인 후 성공 처리 → 데이터 손실 0이지만 느린 링크(1GbE)면 그게 병목.

## 3부품이 세트인 이유

```
[ Pacemaker ]  ← 두뇌: 장애 시 서비스를 산 노드로 옮김
     │ (얹혀있음)
[ Corosync ]   ← 신경: 노드 생존/정족수 통신
     │
[ DRBD ]       ← 데이터: 두 노드 디스크를 실시간 동일하게 유지
```
DRBD가 데이터를 양쪽에 준비 + Corosync가 사망 감지 + Pacemaker가 산 노드에서 재기동. **하나만 빠져도 HA 성립 안 함.**

## 판단 주체 — 외부 심판이 아니라 노드들의 합의

Corosync·Pacemaker는 **모든 데이터 노드에 각각** 설치돼 돌고, 자기들끼리 **과반 합의**로 판단한다. 밖에서 지켜보는 단일 감시자는 없다.

## 정족수(quorum)와 witness — 홀수 규칙

정족수 = 과반(총표의 절반 초과). 짝수면 반반 분할로 동점 위험 → **witness(투표권 1표)로 총합을 홀수로** 만든다.

| 노드 수 | 과반(필요표) | 견딜 수 있는 사망 | 반반 분할 위험 | witness |
|---|---|---|---|---|
| 2 | 2 | 0대 | 1:1 위험 | ✅ 필요 → 3표 |
| 3 | 2 | 1대 | 없음 | ❌ 불필요 |
| 4 | 3 | 1대 | 2:2 위험 | ✅ 필요 → 5표 |
| 5 | 3 | 2대 | 없음 | ❌ 불필요 |

- 설계 정석: **3 → 5 → 7 홀수로** 늘림(짝수 4·6은 건너뜀 — 4는 3보다 사망 견딤이 안 늘고 분할 위험만 추가).
- witness엔 보통 **Corosync(또는 corosync-qdevice)만** 올린다. DRBD·서비스·데이터는 안 올림 → 사양 낮아도 됨. **클러스터 노드 위의 VM은 중재자 자격 없음**(독립 장비여야).

## STONITH / split-brain

- **split-brain** — 노드 간 통신만 끊기고 둘 다 살아있을 때 서로 주인 행세 → 같은 데이터에 양쪽이 써서 깨짐.
- **STONITH** (**S**hoot **T**he **O**ther **N**ode **I**n **T**he **H**ead) — 애매하게 살아있는(응답 없는) 노드를 강제 전원 차단(펜싱). 정족수 + STONITH로 split-brain 방지.
- 펜싱은 **실검증 필요**(`pcs stonith fence <peer>`). status=ON은 검증이 아니다.

## 관련
- [[lustre-ha-drbd-zfs]] · [[lustre-servicenode-failover]]

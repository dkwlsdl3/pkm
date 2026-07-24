---
title: 링크 레이어 단계 진단 (L1→L2→L3)
tags:
  - tech
created: 2026-06-12 (금)
---

# 링크 레이어 단계 진단 (L1→L2→L3)

> **TL;DR**: "네트워크 안 됨"은 케이블(L1) → 스위치/VLAN(L2) → IP/게이트웨이(L3) 순서로 한 층씩 판별한다. 각 층마다 명확한 판별 명령이 있다.

---

## 개요

- **무엇인가**: IP가 안 붙거나 핑이 안 갈 때, 원인이 어느 계층인지 좁혀가는 진단 순서
- **왜 쓰는가**: 원인이 여러 개 겹쳐 있을 수 있음 (실사례: 불량 랜선 + 잘못된 스위치 — 케이블을 교체해도 안 되니 케이블 문제가 아니라고 착각하기 쉬움)
- **언제 쓰는가**: 새 장비 연결, 재부팅 후 네트워크 미동작, 간헐적 끊김

---

## 핵심 개념

### L1 — 케이블/링크 품질

```bash
cat /sys/class/net/<iface>/carrier   # 1 = 링크 살아있음
cat /sys/class/net/<iface>/speed     # 1000 기대인데 100이면 의심
ethtool <iface> | grep -E "Speed|Duplex|Link"
```

- 기가비트는 **4페어 전부** 필요. 페어 일부가 죽은 불량 랜선은 100Mbps로 강등 협상됨 → `speed`가 100이면 케이블부터 교체
- 스위치 LED 읽는 법: **LNK만 점등 + SPD 꺼짐 = 100Mbps 협상** (기종마다 다르나 SPD/속도 LED 소등은 저속 신호)

### L2 — 스위치 포트/VLAN

```bash
# RX 카운터 비교 — 10초 간격으로 두 번 실행
ip -s link show <iface>
```

- **TX만 증가하고 RX가 0** = 내 송신은 나가는데 아무것도 안 들어옴 → 죽은 포트이거나 VLAN이 다른 포트
- 같은 스위치에서 포트를 옮겨가며 RX가 증가하는 포트를 찾는다 (실사례: 13·15·17·19번 RX 0, 21번에서 정상)

```bash
ip neigh    # 게이트웨이가 FAILED/INCOMPLETE면 같은 L2에 게이트웨이가 없다는 뜻
```

### L3 — IP/게이트웨이

```bash
nmcli connection modify <con> ipv4.method manual \
  ipv4.addresses <IP>/24 ipv4.gateway <GW> ipv4.dns "8.8.8.8" \
  connection.autoconnect yes
nmcli connection up <con>
```

- DHCP 타임아웃 = 그 대역에 DHCP 서버가 없을 수 있음 (서버 대역은 고정 IP 운용이 흔함)
- DHCP 시도 과정에서 기존 게이트웨이 설정이 날아갈 수 있음 → 최종 설정을 다시 적용하고 검증

---

## 주의사항

> [!WARNING]
> - 스위치 포트를 옮긴 직후 잠깐 통신이 안 되는 것은 STP/MAC 학습 지연으로 정상 (수십 초 대기)
> - 사내에 용도가 다른 스위치가 여러 대면(예: 공장 라인용 vs 서버용) 물리적으로 어느 스위치인지부터 확인 — 케이블·포트를 아무리 바꿔도 스위치가 틀리면 헛수고

---

## 관련

- [[network-overview]]
- [[nic-bonding]]

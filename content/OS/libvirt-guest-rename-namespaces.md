---
title: libvirt VM 리네임 시 이름 공간 4개
tags:
  - tech
  - os
  - virtualization
created: 2026-07-03 (금)
---

# libvirt VM 리네임 시 이름 공간 4개

> `virsh domrename`은 libvirt 도메인 이름 **하나만** 바꾼다. 이름은 최소 4곳에 산다.

| # | 이름 공간 | 바꾸는 법 | 안 바꾸면 |
|---|---|---|---|
| 1 | libvirt 도메인 | `virsh domrename` (shut off 상태에서) | — |
| 2 | 게스트 hostname | 게스트 안 `hostnamectl set-hostname` + /etc/hosts | 게스트가 옛 이름으로 자신을 보고 |
| 3 | 게스트 내 서비스 설정 | 에이전트/모니터링의 env·config (예: `NODE_NAME=` — **보통 hostname보다 우선**) | 모니터링이 옛 이름으로 데이터 push |
| 4 | 관리 시스템 DB | 관리 앱의 노드/VM 테이블 + 이름으로 쌓인 시계열·상세 stale 행 | 이름 조인이 깨져 유령/이중 표시 |

## 실측 증상
- 도메인만 바꾸면: 관리 화면에 **옛 이름 + shut off**(도메인 조회 실패)로 유령 표시, 새 이름은 실종.
- 2·4까지 바꿔도 3(NODE_NAME env)을 놓치면 모니터링 데이터가 계속 옛 이름으로 유입 — env가 hostname을 이기는 구현이 흔하므로 **에이전트의 이름 결정 우선순위를 소스에서 확인**할 것.

## 체크리스트
VM 이름 변경 = ①domrename ②hostnamectl(+/etc/hosts) ③에이전트 env/config ④관리 DB(레코드 갱신 + 옛 이름 시계열/상세 stale 삭제) ⑤디스크 경로(zvol 등)를 VM XML이 참조하면 그 경로 갱신까지.

## 관련
- [[os-overview]] · [[dev-script-restart-vs-rebuild]]

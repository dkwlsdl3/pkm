---
title: "Grafana 패널 타입 & 대시보드 저장 방식"
tags:
  - tech
created: 2026-06-25 (목)
---

# Grafana 패널 타입 & 대시보드 저장 방식

> **TL;DR**: 상태(up/down) 시계열은 status-history가 아니라 state timeline으로. provisioning 없이 UI로 만든 대시보드는 DB(grafana.db)에 저장되어, repo의 json 수정이 자동 반영되지 않는다.

---

## 개요

- **무엇인가**: Grafana 상태 시각화 패널 선택 + 대시보드 저장 위치
- **왜 쓰는가**: 긴 시간범위에서 안 깨지는 패널 + json 수정이 왜 화면에 안 뜨는지 이해
- **언제 쓰는가**: 노드 up/down 타임라인 구성, 대시보드 코드 관리

---

## 핵심 개념

### status-history vs state timeline

상태(up/down) 시계열 패널 선택 기준은 [[grafana-panel-status-history-vs-state-timeline]] 참고.

### 대시보드 저장: provisioning(파일) vs DB

provisioning 활성 여부에 따라 json 수정이 반영되는지가 갈린다. 자세한 확인 방법과 주의사항은 [[grafana-dashboard-storage-provisioning-vs-db]] 참고.

---

## 관련

- [[monitoring-overview]]
- [[prometheus-exporter-port]]
- [[grafana-panel-status-history-vs-state-timeline]]
- [[grafana-dashboard-storage-provisioning-vs-db]]

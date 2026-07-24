---
title: 모니터링 (Grafana/Prometheus) 개요 (MOC)
tags:
  - tech
  - moc
created: 2026-06-25 (목)
---

# 모니터링 (Grafana/Prometheus) 개요 (MOC)

> Prometheus 수집 + Grafana 시각화 기반 관측성 스택

---

## 핵심 개념

- [[grafana-panels-and-storage]] — Grafana 패널·저장 방식 개요(인덱스)
- [[grafana-panel-status-history-vs-state-timeline]] — 상태 시계열은 state timeline을 써야 하는 이유
- [[grafana-dashboard-storage-provisioning-vs-db]] — 대시보드 provisioning vs grafana.db 저장, json 미반영
- [[prometheus-exporter-port]] — exporter listen 포트 vs scrape target 정합성

---

## 관련

- [[gitlab-ci-deploy-runner]] — 모니터링 스택을 CI로 배포할 때
- [[lustre-troubleshooting]] — node/lustre exporter 메트릭 트러블슈팅

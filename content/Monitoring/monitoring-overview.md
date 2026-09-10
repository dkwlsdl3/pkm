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
- [[prometheus-file-sd-stale-on-read-failure]] — file_sd 읽기 실패 시 직전 목록 유지 → 새 대상만 조용히 누락
- [[derived-metric-recomputed-at-consumer]] — 화면이 `여유 = 전체 − 사용` 으로 되만들면 수집기 정의 수정이 그 자리에서 되돌아간다
- [[loss-rate-zero-denominator]] — 유입이 0 이면 손실률도 0 이라 「정상」으로 보인다, 비율에는 분모와 관측 가능 여부를 함께 실어라
- [[health-metric-blind-to-connect-failure]] — 건강값·축출 기록은 맺어진 연결의 열화만 본다, 연결 수립 실패는 능동 탐침으로 따로 재라

---

## 관련

- [[gitlab-ci-deploy-runner]] — 모니터링 스택을 CI로 배포할 때
- [[lustre-troubleshooting]] — node/lustre exporter 메트릭 트러블슈팅

---
tags:
  - tech
created: 2026-06-25 (목)
---

# Prometheus exporter 포트 정합성

> **TL;DR**: exporter 실행 포트(`--web.listen-address`)와 Prometheus scrape target 포트가 다르면 connection refused로 메트릭이 0이 된다. 한 곳에서 정의·통일하라.

---

## 개요

- **무엇인가**: exporter 실행 포트와 scrape config target 포트의 일치
- **왜 쓰는가**: "타겟은 살아있는데 메트릭이 안 들어옴" 디버깅
- **언제 쓰는가**: 새 exporter 추가, 포트 변경 시

---

## 핵심 개념

### 증상과 원인
- exporter 서비스는 `active`인데 Prometheus targets에서 `health: down`, `lastError: connection refused`.
- 원인: exporter는 포트 A에 listen(`--web.listen-address=":A"`)인데 scrape target은 포트 B → B엔 아무도 없어 refused. (exporter listen ≠ scrape target)

### 진단
```bash
# Prometheus 타겟 상태/에러
curl -s localhost:9090/api/v1/targets | grep -E 'scrapeUrl|lastError|health'
# exporter 실제 listen 포트
ss -tlnp | grep <exporter>     # 또는 pgrep -af <exporter> 로 --web.listen-address 확인
```

### 해결
exporter 실행 인자와 scrape target을 **같은 포트**로. 표준 포트(예: node_exporter 9100)에 맞추고, 한 코드/설정에서 둘 다 생성하면 어긋날 일이 없다.

---

## 주의사항

> [!WARNING]
> exporter가 떠 있고(active) 자체 메타 메트릭만 보여도 실제 데이터가 0이면 scrape가 아예 도달 못 하는 것. 포트뿐 아니라 방화벽 개방도 확인.

---

## 관련

- [[monitoring-overview]]
- [[grafana-panels-and-storage]]

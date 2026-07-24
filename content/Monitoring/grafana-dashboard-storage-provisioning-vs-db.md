---
title: "Grafana 대시보드 저장 방식: provisioning vs DB"
tags:
  - tech
created: 2026-06-25 (목)
---

# Grafana 대시보드 저장 방식: provisioning vs DB

> **TL;DR**: provisioning 없이 UI로 만든 대시보드는 DB(grafana.db)에 저장되어, repo의 json 수정이 자동 반영되지 않는다.

---

## provisioning(파일) vs DB

- **provisioning provider**(`/etc/grafana/provisioning/dashboards/*.yaml`)가 활성이면 json 파일이 단일 출처 → repo json 수정이 반영됨.
- provider가 비활성(주석)이면 대시보드는 **`grafana.db`(SQLite)** 에 저장(UI로 만든 것) → **repo json 수정은 자동 반영 안 됨.** UI 또는 HTTP API로 직접 수정해야 함.

```bash
# provisioning 활성 여부
cat /etc/grafana/provisioning/dashboards/*.yaml   # providers가 주석이면 DB 사용
# 대시보드가 DB에 있는지
grep -rl <uid> /var/lib/grafana/grafana.db
```

---

## 주의사항

> [!WARNING]
> DB 저장 대시보드를 API로 수정하면 대시보드 전체 JSON을 다뤄야 해서 위험. 패널 하나면 UI 직접 수정이 안전하다. Save 시 grafana가 버전을 기록하므로 Settings → Versions에서 복원할 수 있다.

---

## 관련

- [[grafana-panels-and-storage]]
- [[monitoring-overview]]

---
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

| | status-history | state timeline |
|---|---|---|
| 그리는 방식 | 모든 데이터 포인트를 칸으로 | 상태가 바뀌는 구간만 막대로 |
| 포인트 많을 때 | "Too many points to visualize" 에러 | 정상 (구간만 그림) |
| 적합 | 짧은 범위 이산 상태 | up/down 등 상태 타임라인 (시간범위 무관) |

예: scrape 15초 × 3시간 = 720 포인트 → status-history는 한계 초과로 에러. state timeline은 무관.

### 대시보드 저장: provisioning(파일) vs DB

- **provisioning provider**(`/etc/grafana/provisioning/dashboards/*.yaml`)가 활성이면 json 파일이 단일 출처 → repo json 수정이 반영됨.
- provider가 비활성(주석)이면 대시보드는 **`grafana.db`(SQLite)** 에 저장(UI로 만든 것) → **repo json 수정은 자동 반영 안 됨.** UI 또는 HTTP API로 직접 수정해야 함.

---

## 코드 / 사용 예시

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

- [[monitoring-overview]]
- [[prometheus-exporter-port]]

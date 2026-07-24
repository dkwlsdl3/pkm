---
title: BMC 웹 UI - Redfish 교차검증
tags:
  - tech
created: 2026-05-14 (목)
---

# BMC 웹 UI - Redfish 교차검증

> **TL;DR**: BMC 웹 UI 상태를 못 믿을 때 Redfish API로 실제 상태를 조회해 교차검증하는 절차

---

Redfish는 서버 하드웨어 관리용 표준 HTTP API다. 전원, 부팅, 스토리지 같은 최종 상태를 구조화된 JSON으로 읽을 수 있어 웹 UI 자동화보다 검증에 유리하다.

```bash
# 시스템 전원 상태
curl -sk -u '<USER>:<PASSWORD>' \
  https://<BMC>/redfish/v1/Systems/1

# 예시: 스토리지 컨트롤러와 물리 디스크 링크
curl -sk -u '<USER>:<PASSWORD>' \
  https://<BMC>/redfish/v1/Systems/1/Storage
```

웹 UI는 클라이언트 캐시, 다중선택 상태, 비동기 재조회가 꼬여 실제로 성공한 작업을 실패로 표시할 수 있다. 이때 같은 버튼을 반복해서 누르지 말고 다음 순서로 확인한다.

1. UI 오류 메시지와 현재 표시 상태를 기록한다.
2. Redfish GET으로 모든 대상 리소스의 실제 상태를 개별 조회한다.
3. 가상 디스크 수, 물리 디스크 상태, 전원 상태처럼 서로 독립된 후조건을 확인한다.
4. 이미 목표 상태라면 재실행하지 않는다. 목표 상태가 아니면 지원 액션과 허용값을 조회한 뒤 변경한다.

> [!WARNING]
> BMC 자격증명을 명령 이력, 문서, savelog에 남기지 않는다. 자동화에서는 제한 권한 계정과 임시 credential 전달 방식을 사용한다.

---

## 관련

- [[idrac-ipmi]]

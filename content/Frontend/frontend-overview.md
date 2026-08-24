---
title: Frontend 개요 (MOC)
tags:
  - tech
  - moc
created: 2026-06-04 (목)
---

# Frontend 개요 (MOC)

> 웹 프론트엔드(Vue/Nuxt 중심) — UI 패턴, 이벤트 처리, 트러블슈팅 모음

---

## 노트

- [[modal-click-outside-capture]] — 모달 `@click.stop`이 내부 컴포넌트 click-outside를 죽이는 문제와 capture 단계 리스너 해법
- [[detect-page-backend-wiring]] — 페이지가 목업인지 실백엔드 연동인지 `~/services/*` import로 판별(`/api` grep 함정)
- [[sidebar-active-menu-longest-match]] — 활성 메뉴는 startsWith가 아니라 최장 경로 매칭 단일 활성(접두어 관계 메뉴 오매칭 방지)
- [[websocket-reconnect-budget-stability]] — 재연결 예산은 "붙었다"가 아니라 "안정 유지"로 리셋 + CONNECTING 영구 정지 해소
- [[flex-min-height-auto-blocks-scroll]] — flex 자식의 `min-height:auto`가 스크롤바 생성 조건 자체를 없앤다(`min-h-0`)
- [[query-failure-vs-empty-state]] — 조회 실패를 빈 목록·0으로 그리면 사용자가 그것을 사실로 읽는다(토스트만으로는 부족)
- [[clipboard-api-secure-context-fallback]] — `navigator.clipboard` 는 http 에서 undefined, await 없는 호출 + 성공 토스트가 거짓 성공을 만든다(불리언 반환 + execCommand 폴백)

---

## 관련

- [[dx-overview]] — 개발환경·도구

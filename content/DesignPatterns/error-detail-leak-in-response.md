---
title: 오류 원문을 응답에서 빼려면 판정부터 값으로 올려야 한다
tags:
  - tech
created: 2026-09-15 (화)
---

# 오류 원문을 응답에서 빼려면 판정부터 값으로 올려야 한다

> **TL;DR**: 외부 명령 stderr, DB 오류 원문, 내부 호스트 주소가 사용자 응답·작업 기록·CSV 내보내기로 새는 것을 고치려 하면, **그 문자열로 분기하던 코드가 같이 끌려 나온다.** 유출 제거와 판정 리팩터링은 사실 한 작업이다 — 먼저 판정을 **사유코드·열거형**으로 올리고, 그 다음에 문구를 뺀다.

## 개요

- **무엇**: 실패를 `message: <명령 출력 그대로>` 로 나르던 구조를, `reason_code` 같은 **값**으로 나르고 원문은 서버 로그에만 남기는 구조로 바꾼다.
- **왜 / 언제**: 오류 원문에는 내부 경로·호스트·SQL·계정 존재 여부가 섞여 들어간다. 그런데 문구를 지우는 순간 `if err.contains("not found")` 류의 분기가 무너지므로, **순서를 지키지 않으면 기능이 깨진다.**

## 동작 / 예시

새는 자리는 응답 본문만이 아니다. 실제로 확인해야 할 싱크:

- API 응답 `message` / `detail`
- **성공 응답 안에 들어 있는 오류 필드** (부분 실패 보고용)
- 작업 기록(job history) · 이벤트 로그 · 통합 로그 화면
- **CSV·리포트 내보내기** — 화면에서 안 보여도 파일로 나간다
- 알림 메일 본문

```text
// 전 — 문구가 곧 판정이자 표시
Err(format!("zfs destroy failed: {}", stderr))
  → 화면: "zfs destroy failed: cannot open 'tank/vol1': dataset is busy"

// 후 — 판정은 값, 원문은 로그
log::warn!(target: "storage", "zfs destroy failed: {}", stderr);
Err(JobError::ResourceBusy)
  → 화면: "대상이 사용 중이라 삭제하지 못했습니다"
```

## 주의

> [!WARNING]
> **문자열 부분일치로 판정하던 것을 그대로 두면, 문구를 조금만 다듬어도 판정이 뒤집힌다.** → [[error-marker-substring-overreach]]

> [!WARNING]
> 판정표를 호출부에 흩어 두면 변이(mutation) 시험이 못 잡는다. **순수 함수로 분리**해야 입력→분류가 시험 대상이 된다. → [[mutation-check-test-effectiveness]]

> [!WARNING]
> 판정에 쓰이지 않는 원문 필드는 구조체에서 아예 **삭제**한다. 남겨두면 언젠가 다시 응답에 실린다. 배선까지 검사하는 시험(응답에 원문이 실리지 않는지)을 함께 둔다.

---

## 관련

- [[error-marker-substring-overreach]] — 오류 문구 부분일치 판정의 취약함
- [[mutation-check-test-effectiveness]] — 판정 로직을 순수 함수로 빼야 시험이 잡는다
- [[query-failure-vs-empty-state]] — 조회 실패를 빈 상태로 뭉개는 반대편 함정
- [[observation-failure-recorded-as-value]] — 관측 실패를 값으로 기록하기

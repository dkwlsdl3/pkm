---
title: 시간 초과는 실패가 아니라 "결과를 모름" 이다
tags:
  - tech
  - troubleshooting
created: 2026-08-18 (화)
---

# 시간 초과는 실패가 아니라 "결과를 모름" 이다

> **TL;DR**: 상한(timeout)은 **호출자가 기다리기를 접는 시각**일 뿐, 상대의 작업을 멈추지 않는다. 그런데도 결과를 성공/실패 두 값으로 접으면 시간 초과가 "실패" 가 되고, 실패 처리(기록 삭제·재시도)가 **아직 돌고 있는 작업 위에서** 벌어진다. 결과는 유령 데이터와 중복 실행이다. 판정을 **`성공` / `확정 실패` / `미지`** 세 값으로 가른다.

---

## 증상

휴지통으로 옮기는 작업이 상한을 넘겨 "실패" 로 처리됐다. 실패 처리는 기록을 지운다.
그런데 **그 시점에 복사는 아직 돌고 있었다.**

```
t=0    이동 시작 (상한 30초)
t=30   호출자: 상한 초과 → "실패" → DB 기록 삭제
t=45   복사 완료 ⇒ 디스크에 파일은 있는데 기록이 없다 (유령 파일)
```

화면에 안 보이니 아무도 지울 수 없고, 용량만 계속 먹는다.
재시도 쪽에서는 반대 사고가 난다 — 상한 초과를 실패로 보고 같은 명령을 다시 보내면
**같은 대상이 두 번 처리된다.**

## 원인

세 가지가 서로 다른 사건인데 두 값으로 접혔다.

| 결과 | 상대의 작업 | 안전한 사후 처리 |
|---|---|---|
| 성공 | 끝났고 성공 | 정상 진행 |
| **확정 실패** | **끝났고** 실패 (프로세스 종료, 비정상 종료코드) | 정리·재시도 안전 |
| **미지** | **계속 돌고 있을 수 있음** (상한 초과) | 정리 금지 · 재시도 금지 · 사람에게 알림 |

"확정 실패" 가 안전한 이유는 실패 자체가 아니라 **상대가 더 이상 목적지를 건드리지 않는다**는 것이다.
미지에는 그 보장이 없다.

## 해결

```rust
enum Outcome {
    Done,
    /// 프로세스가 끝났고 실패했다 — 더 이상 목적지를 건드리지 않는다.
    Failed(String),
    /// 상한을 넘겼다 — 작업은 계속 돈다. 결과를 모른다.
    Unknown(String),
}

fn classify(result: std::io::Result<std::process::Output>) -> Outcome {
    match result {
        Ok(o) if o.status.success() => Outcome::Done,
        Ok(o) => Outcome::Failed(stderr_of(&o)),          // 끝났다
        Err(e) if e.kind() == ErrorKind::TimedOut => Outcome::Unknown(e.to_string()),
        Err(e) => Outcome::Failed(e.to_string()),          // 실행 자체가 안 됐다
    }
}
```

정리 여부는 **목적지를 실제로 확인해서** 정하고, 그 확인조차 `Unknown` 에는 부르지 않는다 —
지금 비어 있어도 곧 채워지기 때문이다.

```rust
match classify(result) {
    Outcome::Done      => commit(),
    Outcome::Failed(e) => if destination_confirmed_absent().await { rollback_record() }
                          else { keep_record_and_report(e) },   // 부분 산출물이 있을 수 있다
    Outcome::Unknown(e) => keep_record_and_report(e),           // 확인도 하지 않는다
}
```

## 주의

> [!WARNING]
> **"없는 것을 확인했다" 와 "확인하지 못했다" 도 다른 값이다.** 마운트가 끊겼거나 표식 파일이
> 안 보여 조회 자체가 실패한 것을 "없음" 으로 읽으면 같은 사고가 한 겹 아래에서 재현된다.

> [!WARNING]
> **원격 호출에도 그대로 적용된다.** 상대가 상한 초과 문구를 내려보낸다면 그것은 실패 응답이 아니라
> 미지 응답이다 → [[error-marker-substring-overreach]]

---

## 관련

- [[external-command-timeout-bulkhead]]
- [[connect-timeout-vs-total-timeout]]
- [[error-marker-substring-overreach]]
- [[partial-failure-reported-as-success]]
- [[verdict-missing-value-fail-open]]

---
title: 파생 이름에서 되계산하지 말고 정본을 읽는다
tags:
  - tech
  - troubleshooting
created: 2026-08-18 (화)
---

# 파생 이름에서 되계산하지 말고 정본을 읽는다

> **TL;DR**: `식별자 = f(이름)` 으로 만든 값을, 나중에 다시 `f(이름)` 을 돌려 되찾으면 안 된다. **이름이 바뀌거나 `f` 가 바뀌는 순간 되계산 결과는 실제 값과 어긋나고**, 대상을 못 찾거나 엉뚱한 것을 가리킨다. 붙일 때 쓴 값은 **어딘가에 실제로 기록돼 있으니 그것을 읽는다.**

---

## 증상

볼륨을 삭제할 때, 붙어 있는 장치를 시리얼로 찾아 떼야 한다.
코드는 **볼륨 이름에서 시리얼을 다시 계산**해 대상을 찾았고, **찾지 못했다.**

```
붙일 때:  serial = f("volume-old-name")  → "volume-old-name" 을 장치 정의에 기록
이름 변경: volume-old-name → volume-new-name
뗄 때:    serial = f("volume-new-name")  → 장치 정의에는 없는 값 ⇒ 대상 없음
```

`f` 를 고치는 경우에도 같은 일이 난다. 위 [[truncated-identifier-collision]] 처럼
충돌을 막으려 해시 꼬리를 도입하면, **그 변경 전에 붙은 장치는 전부 못 찾게 된다.**

## 원인

파생값은 **생성 시점의 입력**에 묶인 스냅숏이다. 그런데 되계산은 **조회 시점의 입력**을 쓴다.
둘 사이에 이름 변경이나 함수 변경이 끼면 값이 갈라진다.

```
정본(canonical)   = 장치 정의에 실제로 기록된 시리얼
파생값(derived)   = f(현재 이름)
```

이름은 사람이 바꿀 수 있는 표시용 값이고, 정본은 시스템이 붙인 값이다.
**표시용 값에서 시스템 값을 유도하려 한 것**이 문제의 본질이다.

## 해결

읽는 경로와 만드는 경로를 **함수 두 개로 분리하고**, 이름으로 문서화한다.

```rust
/// 새로 붙일 때 시리얼을 "만든다".
/// ⚠️ 이 값으로 이미 붙어 있는 디스크를 되찾지 마라 — 이름이 바뀌면 값이 달라진다.
fn generate_disk_serial(full_name: &str) -> String { ... }

/// 이미 붙어 있는 디스크의 시리얼을 "읽는다". 정본은 장치 정의다.
async fn get_disk_serial_from_vm(vm: &str, device_path: &str) -> Result<String> {
    let xml = dump_domain_xml(vm).await?;
    parse_disk_serial_from_xml(&xml, device_path)
        .ok_or_else(|| format!("{} 의 시리얼을 찾을 수 없습니다", device_path))
}
```

같은 원칙이 이름 규칙 결정에도 적용된다 —
**정본은 대상 자체(디스크·장치)이고, 이름은 서버가 확정 인덱스로 짓는 표시값**이다.
이름에서 대상을 역산하는 경로를 아예 만들지 않는다.

## 주의

> [!WARNING]
> **"못 찾으면 없는 것" 으로 처리하지 마라.** 되계산이 어긋나 못 찾은 것인지, 정말 없는 것인지
> 구분되지 않으면 **붙어 있는 장치를 남긴 채 볼륨을 지운다** → [[collector-orphan-cleanup]]

> [!WARNING]
> **정제·자르기·해시가 낀 파생값은 되돌릴 수 없다.** 되계산은 "역함수" 가 아니라 "같은 입력이면
> 같은 출력" 에만 기대는 것이고, 그 전제가 깨지기 쉽다.

---

## 관련

- [[truncated-identifier-collision]]
- [[dual-writer-no-owner-of-record]]
- [[lease-derived-from-ledger]]
- [[disk-by-id-canonicalize-pitfall]]

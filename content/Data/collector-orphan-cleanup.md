---
title: upsert 만 하는 수집기는 사라진 자원을 영원히 쌓는다
tags:
  - tech
  - troubleshooting
created: 2026-07-31 (금)
---

# upsert 만 하는 수집기는 사라진 자원을 영원히 쌓는다

> **TL;DR**: 주기적으로 현재 상태를 읽어 DB에 반영하는 수집기가 **upsert만 하고 삭제 경로가 없으면**, 사라진 자원의 행이 영구히 남는다. 화면은 존재하지 않는 장치를 계속 보여 준다. 삭제를 넣을 때는 **"지우면 안 되는 라운드"를 반드시 가려야 한다** — 부분 실패와 빈 목록이 그것이다.

## 증상

- 실제 자원은 13개인데 테이블에는 **123행**이 있다
- 남은 행이 수명주기가 짧은 자원(가상 NIC, 임시 볼륨, 컨테이너)에 몰려 있다
- 확인해 보면 전부 존재하지 않는 장치다

```bash
ip link show vnet1424    # Device "vnet1424" does not exist
```

## 원인

수집 코드가 이렇게 생겼다.

```rust
for iface in read_current_interfaces()? {
    upsert_interface(&iface).await?;      // 있으면 갱신, 없으면 삽입
}
// 끝. 사라진 것을 지우는 코드가 없다
```

**upsert는 "지금 있는 것"만 다룬다.** 목록에서 빠진 자원은 손대지 않으므로 마지막 관측 상태 그대로 남는다. 레포 전체에 그 테이블의 `DELETE`가 한 건도 없다면 이 결함이다.

같은 코드베이스의 다른 수집기(본드·볼륨·풀)가 이미 고아 정리를 하고 있는 경우가 많다. **그 패턴을 찾아 그대로 따르는 것이 가장 안전하다.**

## 해결

라운드 끝에 "이번에 본 이름"을 제외한 나머지를 지운다.

```sql
-- delete_stale_interfaces.sql
DELETE FROM infra_network_interfaces_info
WHERE owner_id = $1
  AND interface_name <> ALL($2::text[]);   -- $2 = 이번 라운드에 upsert 성공한 이름들
```

```rust
let mut seen = Vec::new();
let mut all_ok = true;

for iface in read_current_interfaces()? {
    match upsert_interface(&iface).await {
        Ok(_)  => seen.push(iface.name.clone()),
        Err(e) => { all_ok = false; log::warn!("upsert 실패: {e:#}"); }
    }
}

// ★ 지워도 되는 라운드인지 판정
if all_ok && !seen.is_empty() {
    delete_stale_interfaces(owner_id, &seen).await?;
}
```

## 🔴 지우면 안 되는 라운드 둘

이 변경의 핵심 위험은 삭제 자체가 아니라 **언제 삭제하면 안 되는지**다.

| 상황 | 왜 위험한가 |
|---|---|
| **upsert가 하나라도 실패** | 실패한 자원이 `seen`에서 빠진다 → 그대로 지우면 **살아 있는 행이 사라진다** |
| **목록이 빔** | `<> ALL('{}')`는 **참**이다 → 해당 소유자의 **전 행이 삭제된다.** 수집이 일시적으로 실패해 빈 목록이 온 경우 테이블이 통째로 비워진다 |

빈 목록이 정상인 경우(자원이 실제로 0개)와 수집 실패로 빈 경우를 **코드에서 구분할 수 없다면 지우지 않는 쪽이 맞다.** 다음 라운드에 정리된다.

## 주의

> [!WARNING]
> **외래 키 자식이 있으면 삭제가 실패한다.** 자식 참조를 같은 문장(또는 같은 트랜잭션)에서 함께 정리하거나 `ON DELETE CASCADE`를 검토한다. 고아 정리를 넣자마자 FK 오류로 라운드가 실패하는 것이 흔한 후속 증상이다.

> [!WARNING]
> 소유자(owner) 조건을 빼면 **다른 노드의 행까지 지운다.** 멀티 노드 수집에서는 삭제 범위를 항상 자기 소유로 한정한다.

---

## 관련

- [[unique-index-null-semantics]] — 같은 테이블이 중복으로 불어나던 인접 결함
- [[dual-writer-no-owner-of-record]] — 두 서비스가 같은 테이블에 쓸 때 정본이 없으면 생기는 문제
- [[sysfs-enotdir-vs-notfound]] — 수집 목록을 만드는 단계의 함정
- [[data-observability]]

---
tags:
  - tech
created: 2026-06-05 (금)
---

# systemd automount watchdog

> **TL;DR**: automount 환경의 watchdog은 `mountpoint`만 보지 말고 timeout이 걸린 I/O probe까지 확인해야 한다. stale mount면 `.mount` 직접 재시작보다 `.automount` 우선 복구가 더 안전하다.

---

## 개요

- **무엇인가**: systemd timer/oneshot service로 주기적으로 마운트 상태를 확인하고, stale mount를 감지하면 복구하는 패턴
- **왜 쓰는가**: 재부팅·네트워크 흔들림·스토리지 eviction 뒤에 mountpoint는 남아 있는데 실제 I/O만 멈추는 상태를 자동 복구하기 위해
- **언제 쓰는가**: Lustre/NFS처럼 원격 스토리지 마운트를 systemd automount와 함께 운용하고, 서비스 시작 전에 마운트 가용성이 필요한 경우

---

## 핵심 개념

### mountpoint만으로는 부족함

`mountpoint -q /path`는 해당 경로가 마운트 포인트인지 확인할 뿐, 그 아래 파일시스템 I/O가 정상인지까지 보장하지 않는다.

```bash
mountpoint -q /mnt/data && timeout 5 stat /mnt/data >/dev/null
```

정상 판정은 "마운트되어 있음"과 "짧은 제한 시간 안에 I/O가 끝남"을 같이 만족해야 한다.

### automount 우선 복구

`x-systemd.automount` 구성에서는 `.automount` 유닛이 실제 `.mount` 생명주기를 트리거한다. stale 상태에서 바로 `.mount`를 restart하면 automount와 충돌하거나 hang이 길어질 수 있다.

복구 순서는 다음처럼 잡는다.

1. `timeout`이 걸린 I/O probe 실패
2. `timeout 30 umount -l /mnt/data`
3. automount 유닛이 있으면 `.automount` 재시작
4. automount가 없을 때만 `.mount` 재시작

---

## 코드 / 사용 예시

```ini
[Service]
Type=oneshot
ExecStart=/usr/local/sbin/mnt-data-watchdog.sh
TimeoutStartSec=180
```

```bash
#!/usr/bin/env bash
set -euo pipefail

MOUNTPOINT="/mnt/data"
AUTOMOUNT_UNIT="mnt-data.automount"
MOUNT_UNIT="mnt-data.mount"

if mountpoint -q "$MOUNTPOINT" && timeout 5 stat "$MOUNTPOINT" >/dev/null; then
  exit 0
fi

timeout 30 umount -l "$MOUNTPOINT" || true

if systemctl list-units --all "$AUTOMOUNT_UNIT" --no-legend | grep -q "$AUTOMOUNT_UNIT"; then
  systemctl restart "$AUTOMOUNT_UNIT"
else
  systemctl restart "$MOUNT_UNIT"
fi
```

---

## 주의사항

> [!WARNING]
> watchdog service 자체에도 `TimeoutStartSec`를 둔다. 내부 명령에 timeout을 걸어도 service unit 제한 시간이 없으면 복구 스크립트가 hang 상태로 timer를 막을 수 있다.

---

## 관련

- [[os-overview]]
- [[systemd-service]]
- [[lustre-overview]]

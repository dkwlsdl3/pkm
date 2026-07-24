---
title: Lustre 클라이언트 자동 마운트와 부팅 레이스
tags:
  - tech
created: 2026-05-12 (화)
---

# Lustre 클라이언트 자동 마운트와 부팅 레이스

> **TL;DR**: 클라이언트 재부팅 시 MGS(VM)가 아직 안 떠 있으면 마운트가 실패하므로 대기 로직이 필요하다. systemd 스크립트 방식과 fstab `x-systemd.automount` 방식이 있고, 이때 나오는 `rc=-16/-5` 노이즈는 대개 자가 회복되는 정상 레이스다.

## 재부팅 후 자동 마운트 (systemd)

클라이언트 호스트가 재부팅될 때 MGS가 준비되기 전에 마운트를 시도하면 실패함. MGS 가용 여부를 확인하며 대기하는 스크립트가 필요.

### 마운트 스크립트

```bash
sudo tee /usr/local/bin/lustre-mount.sh > /dev/null << 'EOF'
#!/bin/bash
MOUNT_POINT="/mnt/lustre"
MGS="<MGS_IP>@tcp:/<fsname>"
MAX_WAIT=120
INTERVAL=5

mkdir -p "$MOUNT_POINT"

elapsed=0
while ! ping -c 1 -W 2 <MGS_IP> &>/dev/null; do
    [ $elapsed -ge $MAX_WAIT ] && echo "Timeout: MGS not reachable" && exit 1
    sleep $INTERVAL && elapsed=$((elapsed + INTERVAL))
done

elapsed=0
while ! mount -t lustre "$MGS" "$MOUNT_POINT" 2>/dev/null; do
    [ $elapsed -ge $MAX_WAIT ] && echo "Timeout: Lustre mount failed" && exit 1
    sleep $INTERVAL && elapsed=$((elapsed + INTERVAL))
done

echo "Lustre mounted at $MOUNT_POINT"
EOF
sudo chmod +x /usr/local/bin/lustre-mount.sh
```

### systemd 서비스 등록

```bash
sudo tee /etc/systemd/system/lustre-mount.service > /dev/null << 'EOF'
[Unit]
Description=Lustre Client Mount
After=network-online.target libvirtd.service
Wants=network-online.target

[Service]
Type=oneshot
ExecStart=/usr/local/bin/lustre-mount.sh
RemainAfterExit=yes
TimeoutStartSec=300

[Install]
WantedBy=multi-user.target
EOF
sudo systemctl daemon-reload
sudo systemctl enable lustre-mount.service
```

**부팅 순서:** 호스트 부팅 → (VM 자동 시작) → `lustre-mount.service` → MGS ping 대기 → 마운트

### 대안: fstab x-systemd.automount (스크립트 불필요)

ping 대기 스크립트 없이 fstab 옵션만으로 같은 문제를 푸는 패턴 (일부 운영 환경에서 쓰는 방식):

```
<MGS_IP>@tcp:/<fsname> /mnt/lustre lustre defaults,_netdev,flock,nofail,noauto,x-systemd.automount,x-systemd.requires=lnet.service,x-systemd.mount-timeout=300 0 0
```

- `noauto` + `x-systemd.automount`: 부팅 시 즉시 마운트하지 않고 첫 접근 시 트리거, 최대 300초 대기
- 마운트에 의존하는 서비스는 drop-in(`/etc/systemd/system/<svc>.service.d/*.conf`)에 `[Unit] RequiresMountsFor=/mnt/lustre`를 넣어 마운트 전 시작을 차단
- 기능은 ping 대기 스크립트와 동등. 차이는 기다리는 동안 콘솔에 LustreError가 찍힌다는 것뿐

## 부팅 직후 mds_connect rc=-16/-5 노이즈 — 레이스 vs 실제 장애

**증상** (MGS/MDS가 같은 호스트 위 VM일 때 부팅 직후 콘솔 폭주):

```
LustreError: 11-0: <fsname>-MDT0000-mdc-...: operation mds_connect to node <MGS_IP>@tcp failed: rc = -16
LustreError: (super25.c:183:lustre_fill_super()) llite: Unable to mount <unknown>: rc = -5
LustreError: 15c-8: MGC<MGS_IP>@tcp: Configuration from log <fsname>-client failed from MGS -5
```

- `rc = -16` (EBUSY): MDS가 응답은 하지만 아직 기동/recovery 중
- `rc = -5` (EIO): MGS 설정 로그 수신 실패 — VM 또는 VM 쪽 LNet이 아직 안 떠 있음

**원인**: 호스트의 자동 마운트 시도가 VM(MGS/MDS) 부팅 완료보다 빠른 레이스. 호스트 OS가 VM보다 먼저 뜨므로 매 부팅 수 분간 나올 수 있는 정상 노이즈.

**판별법**: 마지막 에러 타임스탬프와 현재 상태를 비교 — 에러가 멈췄고 마운트가 살아 있으면 조치 불요(자가 회복).

```bash
journalctl -b -k | grep LustreError | tail   # 마지막 에러 시각
mount -t lustre && lfs df                    # 현재 마운트·MDT/OST 상태
virsh list --all                             # MGS/OSS VM 기동 여부
```

## user session VM autostart (qemu:///session)

VM이 `qemu:///session`에 등록된 경우, 시스템 서비스가 실행될 때 user 세션이 없어 VM이 자동 시작되지 않음. 위 레이스의 근본 원인이 "VM이 애초에 자동으로 안 떴다"인 경우 이 설정을 확인한다.

```bash
# user linger 활성화 (로그인 없이도 user 서비스 실행)
loginctl enable-linger <username>

# VM autostart 등록
virsh --connect qemu:///session autostart meta
virsh --connect qemu:///session autostart oss1
virsh --connect qemu:///session autostart oss2
```

## 관련

- [[lustre-troubleshooting]]

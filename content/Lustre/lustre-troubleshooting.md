---
title: Lustre 트러블슈팅
tags:
  - tech
created: 2026-05-12 (화)
---

# Lustre 트러블슈팅 & 운영 자동화

> **TL;DR**: Lustre 운영에서 자주 만나는 문제와 재부팅 후 자동 마운트 설정

---

## identity_upcall — 비root 접근 권한 거부

**증상:** 일반 사용자로 Lustre 마운트 경로 접근 시 Permission denied. `sudo`로는 성공.

**원인:** Lustre MDT가 비root 클라이언트 접근 시 `l_getidentity`로 UID 조회를 시도하는데, MDT 서버에 해당 UID가 없으면 접근을 거부함.

**확인:**
```bash
# MDT 서버에서
/usr/sbin/l_getidentity <fsname>-MDT0000 <UID>
# → no such user <UID>
```

**해결 (개발 환경):**
```bash
# MDT 서버에서
lctl set_param mdt.<fsname>-MDT0000.identity_upcall=NONE    # 즉시 적용
lctl conf_param <fsname>-MDT0000.mdt.identity_upcall=NONE   # 재부팅 후도 유지
```

> [!WARNING]
> 운영 환경에서 `NONE` 설정은 보안 위험. 운영 환경에서는 LDAP으로 모든 노드(MGS/MDS/OSS/클라이언트)의 UID/GID를 동기화해야 함.

---

## OST 마운트 타임아웃

**원인:** firewalld가 LNET 포트를 차단하거나, LNET 모듈이 로드되지 않은 경우.

**해결:**
```bash
# firewalld 비활성화 (개발 환경)
systemctl stop firewalld && systemctl disable firewalld

# LNET 수동 로드
modprobe lnet
lctl network up

# 마운트 재시도
mount -t lustre /dev/vdb /mnt/ost0
```

---

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

---

## user session VM autostart (qemu:///session)

VM이 `qemu:///session`에 등록된 경우, 시스템 서비스가 실행될 때 user 세션이 없어 VM이 자동 시작되지 않음.

```bash
# user linger 활성화 (로그인 없이도 user 서비스 실행)
loginctl enable-linger <username>

# VM autostart 등록
virsh --connect qemu:///session autostart meta
virsh --connect qemu:///session autostart oss1
virsh --connect qemu:///session autostart oss2
```

---

## LNET NIC 자동감지 오설정

**증상**: `lfs df` 실행 시 MDT만 나오고 OST에서 hang. `lctl list_nids`가 외부망 NIC IP 반환.

```bash
sudo lctl list_nids
# 30.30.30.226@tcp  ← enp4s0 (외부망, 잘못됨)
# 올바른 값: 172.25.0.1@tcp (br-lnet)
```

**원인**: `/etc/lnet.conf`가 비어있거나 `net:` 최상위 키가 누락되면 LNET이 임의 NIC 선택. VM들이 br-lnet(172.25.0.x) 망 안에 있어서 외부망 IP로는 응답 도달 불가.

VM 측 dmesg 증거:
```
lustrefs-OST0000: Export already connecting from 30.30.30.226@tcp
```

**해결**:
```bash
sudo tee /etc/lnet.conf << 'EOF'
net:
    - net type: tcp
      local NI(s):
        - nid: 172.25.0.1@tcp
          interfaces:
              0: br-lnet
EOF
# 이미 로드된 LNET에는 수동 적용
sudo lnetctl net add --net tcp --if br-lnet
sudo lctl list_nids  # 172.25.0.1@tcp 확인
```

> [!WARNING]
> `net:` 최상위 키가 없으면 파싱 전체가 무시됨. yaml 들여쓰기도 정확히 맞춰야 함.

---

## OBD 디바이스 커널 잔존 (재부팅 필요)

**증상**: `umount /mnt/lustre` 후에도 `lnetctl lnet unconfigure` 실패.

```bash
sudo lnetctl lnet unconfigure
# errno: -16 "LNet unconfigure error: Device or resource busy"

sudo lctl dl
# MGC, LOV, LMV, MDC, OSC×2 — 모두 UP 상태
```

**원인**: `umount -l` (lazy umount)로 경로만 분리해도 OBD 디바이스들이 커널에 잔존. `kill -9`도 안 먹히는 `I (idle)` 상태 프로세스가 커널 uninterruptible wait 중.

**해결**: 수동 정리 불가 → **재부팅 필요**.

| 디바이스 | 역할 |
|---------|------|
| MGC | Management Client — MGS와 통신 |
| MDC | Metadata Client — 파일명/권한/크기 |
| OSC × 2 | Object Storage Client — 실제 데이터 (oss별 1개) |
| LOV | OSC들을 하나로 묶는 집합체 |
| LMV | MDC들을 묶는 집합체 |

---

## 서버 타겟 fstab `nofail` 불가

**증상**: MDT/OST VM 재부팅 후 Lustre 타겟 마운트 실패.

```
LDISKFS-fs (sda): Unrecognized mount option "nofail" or missing value
LustreError: osd_mount()) keeperfs-MDT0000-osd: can't mount /dev/sda: -22
```

**원인**: ldiskfs(OSD)는 `nofail` 옵션을 인식하지 못함. 클라이언트 fstab에는 사용 가능하지만 서버 타겟(MDT/OST) fstab에는 사용 불가.

**해결**:
```bash
# 각 VM에서 (meta, oss1, oss2)
sed -i 's/,nofail//' /etc/fstab
mount -a
```

---

## MDT recovery hang

**증상**: 클라이언트에서 `mount /mnt/lustre` 실행 시 무한 대기.

**원인**: MDT가 recovery 모드에서 클라이언트 재연결을 기다리는 중.

**해결**:
```bash
# MDT 서버에서 recovery 강제 완료
ssh root@172.25.0.3 "lctl set_param mdt.keeperfs-MDT0000.recovery_time_soft=0"
# 이후 클라이언트에서 마운트 재시도
mount /mnt/lustre
```

---

## 관련

- [[lustre-overview]]
- [[lustre-server-setup]]
- [[lustre-client-setup]]

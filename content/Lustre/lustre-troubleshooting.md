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

### 대안: fstab x-systemd.automount (스크립트 불필요)

ping 대기 스크립트 없이 fstab 옵션만으로 같은 문제를 푸는 패턴 (keeper-config가 쓰는 방식):

```
<MGS_IP>@tcp:/<fsname> /mnt/lustre lustre defaults,_netdev,flock,nofail,noauto,x-systemd.automount,x-systemd.requires=lnet.service,x-systemd.mount-timeout=300 0 0
```

- `noauto` + `x-systemd.automount`: 부팅 시 즉시 마운트하지 않고 첫 접근 시 트리거, 최대 300초 대기
- 마운트에 의존하는 서비스는 drop-in(`/etc/systemd/system/<svc>.service.d/*.conf`)에 `[Unit] RequiresMountsFor=/mnt/lustre`를 넣어 마운트 전 시작을 차단
- 기능은 ping 대기 스크립트와 동등. 차이는 기다리는 동안 콘솔에 LustreError가 찍힌다는 것뿐

---

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
# <UBUNTU_IP>@tcp  ← enp4s0 (외부망, 잘못됨)
# 올바른 값: <HOST_LNET_IP>@tcp (br-lnet)
```

**원인**: `/etc/lnet.conf`가 비어있거나 `net:` 최상위 키가 누락되면 LNET이 임의 NIC 선택. VM들이 br-lnet(172.25.0.x) 망 안에 있어서 외부망 IP로는 응답 도달 불가.

VM 측 dmesg 증거:
```
lustrefs-OST0000: Export already connecting from <UBUNTU_IP>@tcp
```

**해결**:
```bash
sudo tee /etc/lnet.conf << 'EOF'
net:
    - net type: tcp
      local NI(s):
        - nid: <HOST_LNET_IP>@tcp
          interfaces:
              0: br-lnet
EOF
# 이미 로드된 LNET에는 수동 적용
sudo lnetctl net add --net tcp --if br-lnet
sudo lctl list_nids  # <HOST_LNET_IP>@tcp 확인
```

> [!WARNING]
> `net:` 최상위 키가 없으면 파싱 전체가 무시됨. yaml 들여쓰기도 정확히 맞춰야 함.

---

## lnet.service 부팅 실패 — `lnetctl export` 산출 lnet.conf의 불량 NI

**증상**: 재부팅 후 `lnet.service`가 `failed`(exit-code)로 죽고 lnet이 안 올라옴 → MDT/OST·클라이언트 마운트 전부 막힘.

**원인**: `lnetctl export --backup > /etc/lnet.conf`로 만든 설정에 **인터페이스 없는 NI 항목**(`local NI(s)`에 tunables/CPT만 있고 `interfaces:` 누락)이 섞여, 부팅 시 lnet.service가 import하다 실패. 설치 때 `lnetctl`로 수동 구성하면서 lnet.service를 우회했다면 재부팅에서야 표면화(앞의 'LNET NIC 자동감지 오설정'과 다른 실패 모드).

**해결**: export 대신 **결정적(최소) lnet.conf를 직접 작성**.
```yaml
net:
    - net type: tcp
      local NI(s):
        - interfaces:
              0: <iface>   # 호스트=브리지, VM=내부 NIC
```
- 인터페이스명은 검증(영숫자·`._-`만, 길이 제한) 후 기록 — heredoc 셸 인젝션 방지.
- 클라이언트 마운트 워치독은 **호스트 클라이언트만** 감시 → 서버(VM)측 lnet 실패는 못 고침. 부팅 자동복구는 서버측 lnet 기동까지 보장해야 완성.
- 전 노드 동시 콜드부팅 시 MDT recovery 윈도우(기본 300s) 동안 클라 마운트 timeout → recovery COMPLETE 후 automount self-heal(정상, 부팅 시간에 포함).

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
ssh root@<MDS_IP> "lctl set_param mdt.keeperfs-MDT0000.recovery_time_soft=0"
# 이후 클라이언트에서 마운트 재시도
mount /mnt/lustre
```

---

## 관련

- [[lustre-overview]]
- [[lustre-server-setup]]
- [[lustre-client-setup]]

---

## Lustre 노드 식별 — VM 이름 패턴 의존 금물

**배경**: VM 이름 LIKE 패턴(`keeper-%meta%`, `keeper-%oss%`)으로 Lustre 노드를 식별하면 일반 VM 추가 시 오인식 위험.

**해결**: DB 테이블에 전용 컬럼 추가로 명시적 식별.

```sql
-- migration: infra_owners_info 테이블에 컬럼 추가
ALTER TABLE infra_owners_info
  ADD COLUMN is_lustre_node BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN lustre_role TEXT;

-- 기존 데이터 백필
UPDATE infra_owners_info SET is_lustre_node = TRUE, lustre_role = 'mgs_mdt'
  WHERE vm_name LIKE '%meta%';
UPDATE infra_owners_info SET is_lustre_node = TRUE, lustre_role = 'oss'
  WHERE vm_name LIKE '%oss%';
```

**쿼리 변경**:
```rust
// 변경 전 (패턴 의존 — 취약)
WHERE vm_name LIKE 'keeper-%meta%' OR vm_name LIKE 'keeper-%oss%'

// 변경 후 (컬럼 기반 — 명시적)
WHERE is_lustre_node = TRUE
```

> 운영 서버 적용 시 migration 실행 필수 (is_lustre_node/lustre_role 컬럼 추가).

---
title: Lustre 트러블슈팅
tags:
  - tech
created: 2026-05-12 (화)
---

# Lustre 트러블슈팅 & 운영 자동화

> **TL;DR**: Lustre 운영에서 자주 만나는 문제와 재부팅 후 자동 마운트 설정

> 역할 약어(MGS·MDS·OSS·MDT·OST·LNET)는 [[lustre-overview]]의 용어 표 참고.

---

## identity_upcall — 비root 접근 권한 거부

비root 클라이언트 Permission denied는 MDT의 `l_getidentity` UID 조회 실패가 원인. 자세한 증상·확인·해결은 [[lustre-identity-upcall]] 참고.

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

## 재부팅 후 자동 마운트 & 부팅 레이스

클라이언트 재부팅 시 MGS(VM)가 아직 안 떠 있으면 마운트가 실패한다. systemd 대기 스크립트·fstab `x-systemd.automount` 방식, 이때 나오는 `rc=-16/-5` 노이즈 판별법, VM `qemu:///session` autostart 설정까지 [[lustre-client-automount-systemd]]에 정리.

---

## LNET NIC 오설정 & lnet.service 부팅 실패

`/etc/lnet.conf`에 `net:` 최상위 키가 없으면 LNET이 잘못된 NIC(외부망)을 골라 OST hang이 나고, `lnetctl export`로 만든 설정에 `interfaces:` 없는 NI 항목이 섞이면 재부팅 후 `lnet.service` 자체가 죽는다. 증상·원인·결정적 lnet.conf 작성법은 [[lustre-lnet-nic-misdetection]] 참고.

---

## OBD 디바이스 커널 잔존 (재부팅 필요)

OBD(Object-Based Device)는 Lustre가 커널 안에 만드는 장치 추상화다. `lctl dl`로 나열되는 항목들이 그것이며, 이름 끝의 `C`는 Client 측 장치를 뜻한다.

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
LustreError: osd_mount()) <fsname>-MDT0000-osd: can't mount /dev/sda: -22
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
ssh root@<MDS_IP> "lctl set_param mdt.<fsname>-MDT0000.recovery_time_soft=0"
# 이후 클라이언트에서 마운트 재시도
mount /mnt/lustre
```

---

## 관련

- [[lustre-overview]]
- [[lustre-server-setup]]
- [[lustre-client-setup]]
- [[lustre-identity-upcall]]
- [[lustre-client-automount-systemd]]
- [[lustre-lnet-nic-misdetection]]

---

## Lustre 노드 식별 — VM 이름 패턴 의존 금물

**배경**: VM 이름 LIKE 패턴(`<prefix>-%meta%`, `<prefix>-%oss%`)으로 Lustre 노드를 식별하면 일반 VM 추가 시 오인식 위험.

**해결**: DB 테이블에 전용 컬럼 추가로 명시적 식별.

```sql
-- migration: VM 인벤토리 테이블에 컬럼 추가
ALTER TABLE <vm_inventory>
  ADD COLUMN is_lustre_node BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN lustre_role TEXT;

-- 기존 데이터 백필
UPDATE <vm_inventory> SET is_lustre_node = TRUE, lustre_role = 'mgs_mdt'
  WHERE vm_name LIKE '%meta%';
UPDATE <vm_inventory> SET is_lustre_node = TRUE, lustre_role = 'oss'
  WHERE vm_name LIKE '%oss%';
```

**쿼리 변경**:
```rust
// 변경 전 (패턴 의존 — 취약)
WHERE vm_name LIKE '<prefix>-%meta%' OR vm_name LIKE '<prefix>-%oss%'

// 변경 후 (컬럼 기반 — 명시적)
WHERE is_lustre_node = TRUE
```

> 운영 서버 적용 시 migration 실행 필수 (is_lustre_node/lustre_role 컬럼 추가).

---

## 단일 OST DISCONN이 전체 서비스로 전파 — 집계 RPC hang

**증상**: OSS 한 대(또는 OST 하나)가 죽었을 뿐인데 NAS(Network Attached Storage, 네트워크 연결 스토리지)/상위 서비스 전체가 마비된 것처럼 보인다. 특정 파일이 아니라 쿼터 조회·용량 표시·업로드까지 광범위하게 실패/hang.

**원인**: OST가 내려가면 클라이언트 osc가 `DISCONN`(disconnected, 연결 끊김)으로 방치되는데, **모든 OST를 순회하는 집계성 RPC**(Remote Procedure Call, 원격 프로시저 호출 — `lfs quota`, 쿼터 enforcement, 일부 `lfs df`)가 죽은 OST 응답을 기다리다 `-EIO`(rc=-5)로 실패하거나 무기한 hang한다. Lustre는 OST 간 복제가 없으므로 "그 OST의 파일 접근 불가"는 설계상 정상이지만, **집계 경로가 부분 장애를 전면 장애로 증폭**시킨다.

```
LustreError: ...osc_quota.c:...:osc_quotactl()) ptlrpc_queue_wait failed, rc: -5
osc.<fs>-OST000N-osc-...state=  current_state: DISCONN
```

**판별**: `lctl get_param osc.*.state`로 어느 OST가 `FULL`이 아닌지 확인. `IDLE`은 유휴 연결 자동 격하(idle_timeout, 기본 20초)라 정상 — `DISCONN`/`CONNECTING`만 비정상.

**대응**:
1. 즉시 복구 가능하면 OSS/OST를 되살린다(자동 재연결 → `FULL`).
2. 즉시 복구 불가면 MDS에서 **명시적 격리**: `lctl --device <OSC> deactivate`(또는 `lctl set_param osc.<...>.active=0`) — 죽은 OST를 신규 할당·집계에서 빼서 "부분 장애"로 국한. 방치(DISCONN)보다 격리가 낫다.
3. 상위 서비스(백엔드)는 러스터 CLI 호출에 **timeout을 강제**하고, 그 호출이 커넥션 풀·워커를 오래 쥐지 않게 **격벽(bulkhead)**을 둔다 — 한 OST hang이 전체 요청 처리를 굶기지 않도록.

> [!WARNING]
> "OST 하나 죽으면 전체가 마비"는 정상 동작이 아니라 **degraded 모드 부재**다. 부분 장애를 감지→격리→상위 timeout 3단으로 막지 않으면, 단일 디스크/노드 장애가 서비스 전면 장애로 번진다.

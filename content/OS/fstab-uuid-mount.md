---
title: fstab은 UUID로 (raw 디바이스명 금지)
tags:
  - tech
created: 2026-06-01 (월)
---

# fstab은 UUID로 (raw 디바이스명 금지)

> **TL;DR**: fstab에 `/dev/nvme1n1` 같은 raw 디바이스명을 쓰면, 재부팅 시 디바이스 열거 순서가 바뀌어 엉뚱한 디스크에 마운트되거나 마운트 실패한다. 특히 NVMe(클라우드 Nitro 포함)는 번호가 잘 바뀐다. **항상 `UUID=`로 지정**한다.

---

## 개요

- **무엇인가**: `/etc/fstab` 마운트 항목을 안정적인 식별자(UUID)로 작성하는 규칙
- **왜 쓰는가**: 커널의 디바이스 열거 순서는 보장되지 않는다. `/dev/nvme0n1`, `/dev/sdb` 같은 이름은 재부팅·디스크 추가로 다른 디스크를 가리킬 수 있다
- **언제 쓰는가**: 데이터 볼륨을 fstab에 등록할 때 (특히 NVMe, 오래 재부팅하지 않는 서버)

---

## 핵심 개념

### 무엇이 잘못되나

- raw 디바이스명 기반 항목은 디바이스 번호가 바뀌면 **마운트 실패**한다.
- `nofail` 옵션이 있으면 부팅은 그대로 진행되어 **조용히 미마운트** 상태가 된다 → 그 볼륨에 의존하던 서비스(예: data-root 심링크를 둔 도커)가 뒤늦게 깨진다.

### UUID로 교체

```bash
# 1. 볼륨 UUID 확인
lsblk -f          # 또는: blkid

# 2. fstab을 UUID 기반으로 작성
#    <UUID>  <마운트포인트>  <fs>  <옵션>  <dump>  <pass>
UUID=<VOLUME_UUID_A> /build-cache ext4 defaults,nofail 0 2
UUID=<VOLUME_UUID_B> /var/www     ext4 defaults,nofail 0 2

# 3. 적용 + 정합성 검증
systemctl daemon-reload
findmnt --verify --verbose     # "Success, no errors" 확인
```

`label`(`LABEL=`)도 안정적이지만, 클라우드 스냅샷 복제 시 라벨이 중복될 수 있어 UUID가 가장 안전하다.

### 클라우드(Nitro) NVMe 주의

- AWS Nitro 등에서 EBS 볼륨은 `/dev/nvmeXn1`로 노출되며, **부팅마다 X 번호가 달라질 수 있다**. 콘솔의 블록 디바이스 매핑(`/dev/sdf` 등)과도 일치하지 않는다 → 반드시 UUID.

---

## 주의사항

> [!WARNING]
> `nofail`은 부팅 안정성을 위해 유용하지만, 마운트 실패를 **숨긴다**. raw 디바이스명 + `nofail` 조합은 "부팅은 되는데 볼륨만 빠진" 가장 진단하기 어려운 상태를 만든다. UUID로 바꾸고 `findmnt --verify`로 사전 점검할 것.

---

## by-id도 가능 — 단, canonicalize하면 안정성이 사라진다

UUID 외에 `/dev/disk/by-id/`(디스크 시리얼/WWN 기반 심링크)도 안정 식별자다. 단, 코드에서 이 심링크를 canonicalize로 풀어 실디바이스 노드를 저장하면 안정성이 사라지는 함정이 있다 → [[disk-by-id-canonicalize-pitfall]]

## systemd가 생성한 `.mount` 유닛의 수동 마운트 간섭

`/etc/fstab`의 각 항목은 systemd-fstab-generator가 `<path>.mount` 유닛으로 자동 변환한다. 이때 fstab 항목이 **없는 장치**(예: 재부팅으로 뒤바뀐 `/dev/sdX`)를 가리키면 그 `.mount` 유닛은 `failed` 상태가 되고, **그 마운트포인트에 수동으로 mount하면 systemd가 즉시 걷어찬다**(유닛 정의와 불일치로 판단해 umount).

```bash
# 증상: 수동 mount가 exit 0인데 2초 뒤 사라짐. 범인 추적:
journalctl _COMM=umount -o verbose | grep _SYSTEMD_UNIT   # → mnt-xxx.mount
systemctl status mnt-xxx.mount                            # failed (Result: exit-code)

# 해결: 잘못된 fstab 라인 제거 후 재로드 → 생성 유닛 사라져 수동 마운트가 유지됨
sed -i '\#/mnt/xxx#d' /etc/fstab
systemctl daemon-reload && systemctl reset-failed mnt-xxx.mount
mount ... /mnt/xxx   # 이제 유지됨
```

근본 해결은 fstab을 안정 식별자로 고치는 것(위 참조). → [[systemd-automount-watchdog]]

## 재부팅 안전 스토리지 노드 체크리스트 (2026-07 실증)

분산 스토리지 노드(예: Lustre OSS/MDS)가 "지금은 잘 돌지만 재부팅하면 죽는" 시한폭탄이 되는 것을 막는 최소 점검 3가지:

1. **fstab은 안정 식별자만** — 데이터 타겟 마운트가 `/dev/sdX`로 적혀 있으면 재부팅 시 오마운트(위 참조). `UUID=` 또는 by-id 심링크 원본으로.
2. **네트워크 스택 설정 영구화** — 런타임에 명령으로 넣은 설정(예: 커널 모듈 네트워크 설정, 라우팅)은 재부팅 시 증발한다. 영구 설정 파일 + 해당 서비스 `enabled` 상태까지 확인(파일만 있고 서비스가 disabled인 경우가 실제로 있었음).
3. **검증은 실제 재부팅 리허설로만 인정** — 설정 파일을 눈으로 확인한 것과 재부팅 후 자동 복구되는 것은 다르다. 노드 1대를 실제로 재부팅해 마운트·네트워크·서비스가 무개입 복구되는지 보고 나서야 "재부팅 안전"이라고 말한다. 롤아웃은 리허설 통과본을 무중단으로 전파.

---

## 관련

- [[disk-by-id-canonicalize-pitfall]] — by-id 심링크 canonicalize 안티패턴
- [[dockerd-dataroot-symlink]] — 미마운트 볼륨이 유발한 도커 데몬 장애
- [[ec2-ssm-access-no-key]] — 재부팅이 동반 장애를 드러낸 사례
- [[systemd-automount-watchdog]] — automount watchdog / stale mount 복구
- [[lustre-troubleshooting]] — Lustre 타겟 fstab·재부팅 마운트
- [[smartctl]] · [[os-overview]]

---
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

## 관련

- [[dockerd-dataroot-symlink]] — 미마운트 볼륨이 유발한 도커 데몬 장애
- [[ec2-ssm-access-no-key]] — 재부팅이 동반 장애를 드러낸 사례
- [[smartctl]] · [[os-overview]]

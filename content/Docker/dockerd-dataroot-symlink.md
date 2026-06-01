---
tags:
  - tech
created: 2026-06-01 (월)
---

# dockerd / containerd `mkdir: file exists`

> **TL;DR**: 재부팅 후 `dockerd: mkdir /var/lib/docker: file exists`로 데몬이 안 뜨면, data-root가 **심볼릭 링크**인데 링크 대상 볼륨이 **미마운트**됐을 가능성이 높다. 볼륨을 마운트하고 `reset-failed` 후 재기동하면 복구된다.

---

## 개요

- **무엇인가**: Docker/containerd 데이터 디렉터리를 별도 볼륨에 심링크로 둔 환경에서, 그 볼륨이 안 붙었을 때 나는 기동 실패 진단
- **왜 발생**: `/var/lib/docker`가 다른 디스크(예: `/build-cache/docker`)로의 심링크일 때, 대상 볼륨이 미마운트면 심링크가 깨진 경로를 가리켜 데몬이 디렉터리를 만들지 못함
- **언제 마주치나**: 오랜만의 재부팅 직후 모든 CI(도커 executor)가 멈췄을 때

---

## 핵심 개념

### 증상

```
dockerd:    mkdir /var/lib/docker: file exists
containerd: mkdir /var/lib/containerd: file exists
```

`docker.service`·`containerd.service` 모두 start 실패.

### 원인 체인

1. `/var/lib/docker` → `/build-cache/docker` 심볼릭 링크
2. `/build-cache` 볼륨이 미마운트 (예: fstab이 raw 디바이스명을 써서 재부팅 후 디바이스 번호가 바뀜 → 마운트 실패. `nofail` 옵션이라 부팅은 조용히 진행)
3. 심링크 대상 부재 → 데몬이 data-root를 생성하지 못해 `file exists`성 오류

> 데이터 손실이 아니다. 볼륨은 그대로 있고 **마운트 이름만 어긋난** 상태다.

### 복구

```bash
# 1. 미마운트된 볼륨을 UUID로 마운트
mount UUID=<VOLUME_UUID> /build-cache

# 2. 실패 상태 초기화 후 순서대로 기동
systemctl reset-failed containerd docker docker.socket
systemctl start containerd && systemctl start docker
```

### 재발 방지

- fstab을 raw 디바이스명 대신 **UUID 기반**으로 교체한다 → [[fstab-uuid-mount]]
- `findmnt --verify --verbose`로 fstab 정합성을 사전 점검한다.

---

## 주의사항

> [!WARNING]
> `file exists`라는 문구 때문에 "디렉터리를 지우면 되나" 오해하기 쉽다. 실제 원인은 **심링크 대상 미마운트**이므로, `/var/lib/docker` 심링크나 데이터를 지우지 말 것 — 데이터 유실로 이어진다. 먼저 `ls -l /var/lib/docker`와 `findmnt`로 마운트 상태를 확인한다.

---

## 관련

- [[fstab-uuid-mount]] — 근본 원인(디바이스명 변동) 방지
- [[ec2-ssm-access-no-key]] — 재부팅이 유발한 동반 장애
- [[docker-overview]]

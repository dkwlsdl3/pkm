---
tags:
  - tech
created: 2026-06-18 (목)
---

# Proxmox VE

> **TL;DR**: KVM + ZFS 기반의 오픈소스(AGPL v3) 가상화 플랫폼. REST API를 제공해 외부 도구가 VM/스토리지를 프로그래밍 방식으로 제어할 수 있고, Ansible/Terraform과 연동해 프로비저닝·스케일아웃 공수를 줄일 수 있다.

---

## 개요

- **무엇인가**: Debian 기반 가상화 배포판. 하이퍼바이저로 **KVM**(전가상화), 컨테이너로 **LXC**를 함께 제공하고 웹 UI·CLI·REST API로 관리한다.
- **왜 쓰는가**: 라이선스가 무료(AGPL v3, 유료는 지원 구독뿐)이고, KVM·ZFS라는 리눅스 표준 기반 위에 동작해 별도 스토리지 스택을 배우지 않아도 된다.
- **언제 쓰는가**: 자체 KVM/libvirt 관리 도구를 직접 만드는 대신 검증된 관리 레이어를 빌려 쓰고 싶을 때. VM 수명주기·스냅샷·스토리지 풀 관리가 필요할 때.

---

## 핵심 개념

### REST API로 외부 제어

- Proxmox는 `https://<host>:8006/api2/json/` 형태의 REST API를 제공한다.
- API 토큰(권한 분리 가능)으로 인증하며, VM 생성/시작/정지/스냅샷/스토리지 조회를 모두 호출로 수행할 수 있다.
- 즉 자체 UI에서 KVM을 직접 제어하는 코드를 짜는 대신, **Proxmox API를 백엔드로 호출**하는 방식으로 관리 기능을 대체할 수 있다.

### IaC 연동

- `Telmate/proxmox`(Terraform provider), `community.general.proxmox*`(Ansible) 모듈로 VM 프로비저닝·스케일아웃을 코드화한다.
- 노드 추가·VM 템플릿 클론 같은 반복 작업의 공수를 크게 줄인다.

### 대안 지형

| 플랫폼 | 기반 | 특징 |
|--------|------|------|
| **Proxmox VE** | KVM + ZFS/LVM | 무료(AGPL), 리눅스 표준 스택, REST API |
| XCP-ng | Xen | XenServer 오픈소스 포크, Xen Orchestra로 관리 |
| Harvester | KubeVirt(K8s HCI) | 쿠버네티스 네이티브 HCI, 클라우드 지향 |
| oVirt | KVM | RHV의 업스트림, **상용 RHV는 EOL 수순** — 신규 채택 비권장 |

---

## 코드 / 사용 예시

```bash
# API 토큰으로 노드 목록 조회 (토큰 값은 절대 공개 문서/레포에 넣지 말 것)
curl -s -k \
  -H "Authorization: PVEAPIToken=<USER>@<REALM>!<TOKEN_ID>=<YOUR_TOKEN>" \
  "https://<HOST_IP>:8006/api2/json/nodes"

# 특정 노드의 VM 목록
curl -s -k -H "Authorization: PVEAPIToken=..." \
  "https://<HOST_IP>:8006/api2/json/nodes/<NODE>/qemu"
```

---

## 주의사항

> [!WARNING]
> - Proxmox 자체는 무료지만 **엔터프라이즈 업데이트 저장소는 구독**이 필요하다. 무료 환경은 `no-subscription` 저장소를 쓴다.
> - 위 스토리지/HA 등 특정 워크로드를 Proxmox 위에서 운영하는 것은 별도 검증(PoC)이 필요하다. **VM 관리 레이어로만 쓰는 것**과 그 위에 파일시스템을 얹는 것은 난이도가 다르다.
> - API 토큰·인증 정보는 운영 기록(비공개)에만 남기고, 공개 문서에는 `<HOST_IP>`·`<YOUR_TOKEN>` 같은 플레이스홀더를 쓴다.

---

## 관리 범위 — 단일 호스트 VM 관리 vs 멀티노드 HA 클러스터

"Proxmox 같은 관리 도구"를 직접 만들 때, 범위를 두 축으로 갈라야 난이도를 오해하지 않는다.

| 축 | 내용 | 난이도 |
|---|---|---|
| A. 단일 호스트 웹 VM 관리 | 화면에서 VM 생성·OS 설치(템플릿 클론)·디스크/NIC 부착·시작/정지 | 중 — 이미 `virsh`/libvirt를 셸링하는 웹 백엔드가 있으면 **확장**으로 도달 |
| B. 멀티노드 VM-HA 클러스터 | corosync/쿼럼·라이브 마이그레이션·VM 페일오버 | 상 — Proxmox를 "Proxmox답게" 만드는 영역. 소수 인력·단기엔 비현실 |

- **A는 기존 자산의 일반화**(VM provisioning을 파라미터화 + UI), **B는 사실상 별도 플랫폼**이다.
- VM 레벨 HA(B)와 그 위 분산파일시스템의 물리 이중화는 **또 다른 층위**다 → [[lustre-node-topology]].

---

## 관련

- [[kvm-libvirt]] — Proxmox가 추상화하는 하위 KVM/libvirt 계층
- [[network-bridge]] — VM 네트워킹용 브리지 구성
- [[os-overview]]

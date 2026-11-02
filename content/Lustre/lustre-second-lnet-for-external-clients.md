---
title: 다른 IP망 클라이언트는 별도 LNet 망으로 붙인다
tags:
  - tech
  - lustre
  - troubleshooting
created: 2026-11-02 (월)
---

# 다른 IP망 클라이언트는 별도 LNet 망으로 붙인다

> **TL;DR**: 사설망 위에서 도는 Lustre 서버(VM)에 사내망 클라이언트를 붙이려고 서버에 사내망 IP를 추가했다. 그런데 그 IP를 기존 LNet 망 `tcp`에 섞으면 경로가 꼬여 재접속 오류가 난다. 새 IP는 **별도 LNet 망 `tcp1`** 으로 나누고, MGS에 남은 타겟 주소(NID)에 새 주소를 `lctl replace_nids`로 추가한다(서비스 정지 필요).

| 표기 | 원어 | 뜻 |
|---|---|---|
| LNet | Lustre Networking | Lustre 전용 네트워크 계층. IP 위에 자기 "망" 이름(`tcp`, `tcp1`…)을 따로 둔다 |
| NID | Network Identifier | LNet 주소. `IP@망이름` 형식(예: `<IP>@tcp1`) |
| MGS | Management Server | 파일시스템 설정을 보관·배포하는 Lustre 서버 |
| OSS / MDS | Object / Metadata Storage Server | 데이터 / 메타데이터를 서비스하는 Lustre 서버 |

## 증상

- 서버 VM에 사내망 NIC·IP를 추가하고 같은 LNet `tcp`에 넣었다. 그 뒤 기존 클라이언트와 새 클라이언트 모두에서 재접속 오류가 났다.
- IP 수준(ping, TCP 연결)은 양쪽 다 된다.

## 원인

- LNet은 **같은 망 이름 안의 NID끼리는 서로 닿는다**고 가정하고 경로를 고른다. 한 망에 서로 라우팅되지 않는 두 IP 대역을 섞으면, 실제로는 닿지 않는 인터페이스·주소 조합을 고르는 경우가 생긴다.
- 클라이언트는 MGS 설정 로그에 적힌 타겟 NID로 접속한다. 새 IP를 서버에 올리기만 해서는 설정 로그의 NID 목록이 바뀌지 않는다.

## 해결

```bash
# 서버(각 MGS/MDS/OSS VM): 사내망 NIC를 별도 LNet 망으로
lnetctl net add --net tcp1 --if <LAN_IF>
lnetctl net show                       # tcp(사설) / tcp1(사내) 둘 다 보이는지

# 파일시스템을 내린 상태에서 MGS: 타겟마다 기존 NID + 새 NID 등록
lctl replace_nids <FSNAME>-OST0000 <PRIV_IP>@tcp,<LAN_IP>@tcp1

# 사내망 클라이언트: tcp1 로 MGS 지정해 마운트
mount -t lustre <MGS_LAN_IP>@tcp1:/<FSNAME> /mnt/lustre
```

- 기존 사설망 클라이언트(호스트)는 `tcp` 그대로 쓰므로 영향이 없다.
- 적용 후 Linux PC 2대에서 실제로 마운트하고, 전송 파일의 해시가 일치하는 것까지 확인했다.

> [!WARNING]
> `replace_nids`는 파일시스템 타겟을 내린 상태에서만 할 수 있다. 서비스 중단 승인을 먼저 받는다.

---

## 관련

- [[private-vm-subnet-unreachable-from-lan]] — 이 작업이 필요해진 앞단 원인(사설 대역에 사내망이 닿지 않음)
- [[lustre-lnet-nic-misdetection]] — LNet NIC 자동 감지 문제(별개 주제)
- [[wsl-mirrored-lnet-kernel-socket]] — 같은 프로젝트에서 이어진 Windows 클라이언트 함정
- [[lustre-overview]]

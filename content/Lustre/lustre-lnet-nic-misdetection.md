---
title: Lustre LNET NIC 오설정과 lnet.service 부팅 실패
tags:
  - tech
created: 2026-05-12 (화)
---

# Lustre LNET NIC 오설정과 lnet.service 부팅 실패

> **TL;DR**: `/etc/lnet.conf`에 `net:` 최상위 키가 없거나 `interfaces:`가 빠진 NI 항목이 있으면 LNET이 잘못된 NIC을 선택하거나 `lnet.service`가 부팅 시 죽는다. 결정적(최소) `lnet.conf`를 직접 작성해 해결한다.

## LNET NIC 자동감지 오설정

**증상**: `lfs df` 실행 시 MDT만 나오고 OST에서 hang. `lctl list_nids`가 외부망 NIC IP 반환.

```bash
sudo lctl list_nids
# <UBUNTU_IP>@tcp  ← enp4s0 (외부망, 잘못됨)
# 올바른 값: <HOST_LNET_IP>@tcp (br-lnet)
```

**원인**: `/etc/lnet.conf`가 비어있거나 `net:` 최상위 키가 누락되면 LNET이 임의 NIC 선택. VM들이 br-lnet(<VM_CIDR>) 망 안에 있어서 외부망 IP로는 응답 도달 불가.

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

## 관련

- [[lustre-troubleshooting]]

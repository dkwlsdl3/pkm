---
tags:
  - os
  - selinux
  - pacemaker
  - troubleshooting
---

# confined SELinux 도메인이 실행하는 OCF/RA가 rc=1로 실패할 때

## 증상
Pacemaker(또는 다른 관리자)가 리소스 에이전트를 실행하면 `start`가 rc=1로 실패하는데, **같은 명령을 셸에서 수동으로 하면 성공**한다. 로그에 `Permission denied`가 뜨지만 프로세스는 root다.

## 핵심 원인
- 관리 데몬이 RA를 **confined 도메인**(예: `drbd_t`)에서 실행한다. 반면 사람이 ssh 셸에서 치면 **`unconfined_t`** 라 통과된다. → "수동은 되는데 자동은 안 됨"의 정체.
- **root인데 `Permission denied`** = DAC(유닉스 권한)가 아니라 **SELinux 거부** 신호(root는 DAC 무시, SELinux는 아님). `dac_override` capability 거부가 대표적.

## 진단
```bash
getenforce                       # Enforcing?
ausearch -m avc -ts recent | grep denied     # 최근 거부
# ⚠️ 거부 일부는 dontaudit 규칙으로 감춰져 audit2allow가 못 본다:
semodule -DB                     # dontaudit 비활성(전체 거부 노출)
#   → 문제 동작 재현 → 이제 모든 AVC가 audit.log에 남음
```

## 해결 (enforcing 유지)
1. 관련 불린 먼저 확인 — 표준 시나리오는 대개 불린 하나로 해결됨. audit2allow가 `#!!!! This avc can be allowed using the boolean '<name>'` 로 알려준다.
   예: 클러스터 데몬 → `setsebool -P daemons_enable_cluster_mode 1`.
2. 남는 거부는 **최소권한 로컬 모듈**:
```bash
grep <도메인>_t /var/log/audit/audit.log | grep denied | audit2allow -M my_local
semodule -i my_local.pp          # 영속(재부팅/리셋 후 유지)
semodule -B                      # dontaudit 복원
setenforce 1                     # (진단 중 permissive 했다면) 복귀
```
3. **permissive로 도망가지 말 것** — 원인 파악용 일시 전환은 OK지만 운영은 enforcing + 타깃 모듈.

## 교훈
- "수동은 되는데 자동만 실패" → 실행 주체의 **SELinux 도메인 차이**부터 의심.
- `audit2allow` 결과가 빈약하면 **dontaudit 때문**. `semodule -DB` 없이는 반쪽만 본다.

## 관련
- [[lustre-ha-drbd-zfs]] · [[dkms]]

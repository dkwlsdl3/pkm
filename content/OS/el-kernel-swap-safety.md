---
tags:
  - os
  - kernel
  - rhel
  - boot
---

# EL8/9 커널 스왑 안전수칙 (벤더 패치커널 함정)

원격/물리 서버에서 새 커널(특히 벤더 패치커널 — Lustre `*_lustre`, DRBD, GPU 등)로 부팅하기 전 반드시 확인. 안 지키면 **부팅 불능(dracut emergency)** 으로 원격 접근이 전부 끊긴다.

## 실패 사례
Lustre ldiskfs용 패치커널 설치 시 의존성이 **`kernel-core`만** 끌어오고 **`kernel-modules`**(스토리지 컨트롤러 megaraid_sas/mpt3sas·NIC 드라이버 다수 포함)를 누락 → 그 커널의 initramfs가 부팅 디스크(HBA/RAID) 드라이버를 못 담아 **루트 LVM(`/dev/mapper/*-root`)을 못 찾고 dracut 응급셸**. 네트워크도 NIC 드라이버 없어 죽음.

## 부팅 전 체크리스트
1. **커널 패키지 완결성**: `rpm -q kernel-core kernel-modules`로 **둘 다** 같은 버전인지. 벤더 커널은 `kernel-core`만 딸려오는 경우 있음.
2. **initramfs에 부팅 스토리지 드라이버 포함**:
   `lsinitrd /boot/initramfs-<kver>.img | grep -E 'megaraid_sas|mpt3sas|nvme'` — 없으면 `kernel-modules` 설치 후 `dracut -f --kver <kver>`.
3. **fallback 유지**: 새 커널을 **유일 기본값으로 박고 곧장 재부팅 금지**. 1회성 검증은 `grub2-reboot <entry>`(다음 부팅만 적용), 또는 기존 커널을 기본으로 남긴 채 콘솔로 검증 후 전환.
4. **BMC 콘솔 준비**: 원격이면 iDRAC/XCC 등 BMC 콘솔·전원제어 접근을 미리 확보(네트워크 죽어도 복구 경로).

## 함정
- BMC의 BootProgress `OSRunning`은 **stale일 수 있다** — 실제로는 dracut에 멈췄는데 그렇게 표시됨. ping/콘솔로 교차확인.
- kmod(ELRepo 등)는 kABI weak-updates로 다른 커널에도 링크될 수 있으나, **initramfs 포함 여부는 별개** — 모듈 파일 존재 ≠ 부팅 시 로드.

## 복구
BMC 콘솔 → grub 메뉴에서 **직전 stock 커널 선택** → 부팅 → `grubby --set-default=<stock vmlinuz>`로 기본값 원복 → 문제 커널은 kernel-modules 보강+initramfs 재생성 후 재시도(또는 그 경로 폐기).

## 관련
- [[lustre-ha-drbd-zfs]] · [[lustre-server-setup]]

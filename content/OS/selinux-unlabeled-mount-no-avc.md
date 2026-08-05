---
title: 라벨 없는 마운트 접근 차단은 AVC 로그를 남기지 않는다
tags:
  - tech
  - troubleshooting
created: 2026-08-04 (화)
---

# 라벨 없는 마운트 접근 차단은 AVC 로그를 남기지 않는다

> **TL;DR**: xattr 을 지원하지 않는 파일시스템은 SELinux 라벨이 `unlabeled_t` 가 되고, confined 도메인(smbd·httpd 등)이 그 아래를 읽으면 거부된다. **그런데 AVC 거부 기록이 남지 않는 경우가 있어** `ausearch` 로는 원인을 못 찾는다. **경로만 바꿔서 갈라라** — 일반 디스크 경로면 되고 그 마운트 경로면 실패하면 SELinux 다. 확정은 `setenforce 0` 으로 하고, 해결은 `setsebool` 예외.

## 증상

서비스 인증은 성공하는데 **실제 자원 접근 순간** 실패한다.

- Samba: 공유 목록에는 보이는데 접속 시 `NT_STATUS_BAD_NETWORK_NAME`, `log.smbd` 에 `canonicalize_connect_path failed`
- 파일 권한·ACL 은 정상이고, 같은 uid 로 **호스트에서 직접 접근하면 된다**
- `ausearch -m AVC -ts recent` → **아무것도 안 나온다.** `semodule -DB` 로 dontaudit 을 풀어도 없다

## 원인

분산·네트워크 파일시스템 상당수가 SELinux **보안 xattr 을 저장하지 못한다**. 마운트되면 그 아래 전체가
`unlabeled_t` 로 보인다.

```bash
$ ls -Zd /mnt/<parallel-fs>
system_u:object_r:unlabeled_t:s0 /mnt/<parallel-fs>
```

confined 도메인은 자기 정책에 명시된 타입만 만질 수 있고 `unlabeled_t` 는 거기 없다. 그래서 거부된다.

**로그가 안 남는 이유는 두 갈래다.**

1. 정책이 그 조합에 `dontaudit` 을 걸어 둔 경우 — 이건 `semodule -DB` 로 풀린다
2. **거부가 커널 감사 계층에 도달하기 전에** 파일시스템 계층에서 걸리거나, 클라이언트 모듈이 자체 오류로
   되돌려 주는 경우 — 이건 `semodule -DB` 로도 안 나온다. 로그가 없다고 SELinux 가 아니라고 결론짓지 마라

## 해결

**1단계 — 경로만 바꿔서 가른다.** 이게 가장 확실한 분리 실험이다.

```bash
# 같은 서비스, 같은 계정, 같은 권한. 경로만 로컬 디스크로.
mkdir -p /srv/selinux-probe && chmod 0777 /srv/selinux-probe
# → 서비스 설정의 공유 경로만 /srv/selinux-probe 로 바꿔 재적용 후 접속
```

로컬 경로로 성공하고 마운트 경로로 실패하면 **파일 권한 문제가 아니다.**

**2단계 — permissive 로 확정한다.**

```bash
sudo setenforce 0     # 확정용. 원인을 확인하면 즉시 되돌린다
# → 접속 성공하면 SELinux 확정
sudo setenforce 1
```

**3단계 — boolean 예외를 영구 적용한다.** 마운트 전체를 relabel 할 수 없으므로 도메인 쪽을 연다.

```bash
# Samba 가 자기 정책 밖 경로를 읽고 쓰도록
sudo setsebool -P samba_export_all_rw on
sudo setsebool -P samba_enable_home_dirs on

# 확인
getsebool -a | grep samba_
```

> [!WARNING]
> `samba_export_all_rw` 는 **smbd 가 파일시스템 어디든 읽고 쓸 수 있게** 만든다. 마운트에 라벨을 붙일 수
> 없어서 고르는 차선책이지, 좁은 해법이 아니다. 이 예외를 켰다는 사실과 이유를 설치 도구·구성 문서에
> 남겨라 — 안 남기면 다음 사람이 "왜 이게 켜져 있지" 하고 끈다.

> [!NOTE]
> 마운트 옵션으로 `context=` 를 줄 수 있는 파일시스템이라면 그쪽이 더 좁은 해법이다
> (`mount -o context=system_u:object_r:samba_share_t:s0 …`). 다만 파일시스템별로 지원 여부가 갈리고,
> 클라이언트 모듈이 무시하는 경우도 있으니 마운트 후 `ls -Zd` 로 실제 반영을 확인할 것.

---

## 관련

- [[selinux-confined-daemon-ocf-ra]] — confined 도메인이 실행한 스크립트가 rc=1 로 죽는 다른 사례
- [[lustre-identity-upcall]] — 같은 증상(접속 순간 거부)의 다른 원인: 권한 판정 주체가 서버 쪽에 있다
- [[linux-permissions]]
- [[unknown-is-not-absent]] — "로그가 없다"를 "원인이 아니다"로 읽는 함정

---
title: Lustre identity_upcall 비root 접근 권한 거부
tags:
  - tech
created: 2026-05-12 (화)
---

# Lustre identity_upcall 비root 접근 권한 거부

> **TL;DR**: 비root 클라이언트가 Lustre 마운트에서 Permission denied를 겪는 원인은 MDT의 UID 조회(`l_getidentity`) 실패이며, 개발 환경에서는 `identity_upcall=NONE`으로 우회하고 운영에서는 LDAP UID/GID 동기화가 필요하다.

**증상:** 일반 사용자로 Lustre 마운트 경로 접근 시 Permission denied. `sudo`로는 성공.

**원인:** Lustre MDT가 비root 클라이언트 접근 시 `l_getidentity`로 UID 조회를 시도하는데, MDT 서버에 해당 UID가 없으면 접근을 거부함.

**확인:**
```bash
# MDT 서버에서
/usr/sbin/l_getidentity <fsname>-MDT0000 <UID>
# → no such user <UID>
```

**해결 (개발 환경):**
```bash
# MDT 서버에서
lctl set_param mdt.<fsname>-MDT0000.identity_upcall=NONE    # 즉시 적용
lctl conf_param <fsname>-MDT0000.mdt.identity_upcall=NONE   # 재부팅 후도 유지
```

> [!WARNING]
> 운영 환경에서 `NONE` 설정은 보안 위험. 운영 환경에서는 LDAP으로 모든 노드(MGS/MDS/OSS/클라이언트)의 UID/GID를 동기화해야 함.

## 관련

- [[lustre-troubleshooting]]

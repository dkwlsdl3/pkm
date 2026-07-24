---
title: SSH Config Alias 설정
tags:
  - tech
created: 2026-05-13 (수)
---

# SSH Config Alias 설정

> **TL;DR**: `~/.ssh/config`에 alias 등록해 반복 입력 없이 `ssh <alias>`로 접속

---

반복 입력 줄이기 위해 `~/.ssh/config`에 alias 등록.

```
Host <alias> <ip>
  HostName <ip>
  User <username>
```

이후 `ssh <alias>`로 접속 가능.

---

## 관련

- [[ssh-key-auth]]

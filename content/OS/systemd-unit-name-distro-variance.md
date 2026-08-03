---
title: systemd 유닛 이름은 배포판마다 다르다
tags:
  - tech
  - troubleshooting
created: 2026-08-03 (월)
---

# systemd 유닛 이름은 배포판마다 다르다

> **TL;DR**: 같은 서비스인데 유닛 이름이 배포판마다 갈린다(RHEL 계열 `smb.service` ↔ Debian·Ubuntu `smbd.service`). 유닛명을 하드코딩하면 `systemctl is-active`가 **항상 inactive**를 돌려주고, 화면은 "꺼져 있는데 켜지지도 않는다"가 된다. `systemctl show -p LoadState --value`로 **실제 로드된 유닛**을 골라 쓰고, 그 결과를 **캐시하지 않는다**.

## 증상

관리 화면이 서비스 상태를 거짓으로 말한다. 하나의 하드코딩이 세 갈래로 번진다.

1. 실제로는 돌고 있는데 화면이 **"비활성"이라고 단정**한다
2. 비활성 판정이면 접속 수·열린 파일 파싱을 건너뛰므로 사용자가 붙어 있어도 **0으로 보인다**
3. [시작] 버튼은 `systemctl start <없는 유닛>`으로 실패한다 → 관리자는 "꺼져 있는데 켜지지도 않는다"로 판단한다

결과적으로 특정 배포판 설치본에서 **그 서비스 관리 기능이 통째로 작동하지 않는다.** 개발·검증을 다른 배포판에서 했다면 끝까지 안 보인다.

## 원인

유닛 이름을 문자열로 박아두었다. 배포판마다 패키징 관례가 다르다.

| 서비스 | RHEL/Rocky/Fedora | Debian/Ubuntu |
|---|---|---|
| Samba (파일 공유) | `smb.service` | `smbd.service` |
| Samba (NetBIOS) | `nmb.service` | `nmbd.service` |
| Apache | `httpd.service` | `apache2.service` |
| MariaDB/MySQL | `mariadb.service` | `mysql.service` / `mariadb.service` |
| NTP | `chronyd.service` | `chrony.service` |
| Cron | `crond.service` | `cron.service` |

실측:

```bash
$ systemctl show -p LoadState --value smb
not-found
$ systemctl show -p LoadState --value smbd
loaded
$ systemctl is-active smbd
active
```

`systemctl is-active <없는 유닛>`은 오류가 아니라 **`inactive`를 돌려준다**. 그래서 "유닛이 없다"와 "서비스가 꺼져 있다"가 구분되지 않는다 — 코드가 후자로 오해한다.

## 해결

실제 로드된 유닛을 후보 중에서 고르는 해석 단계를 둔다.

```bash
resolve_unit() {
  for u in "$@"; do
    if [ "$(systemctl show -p LoadState --value "$u")" = "loaded" ]; then
      printf '%s\n' "$u"; return 0
    fi
  done
  return 1
}

UNIT="$(resolve_unit smb smbd)" || {
  echo "Samba systemd 유닛(smb/smbd)을 찾을 수 없습니다" >&2; exit 1
}
systemctl is-active "$UNIT"
```

- **시작·중지와 활성 판정 양쪽 모두**에 적용한다. 한쪽만 고치면 "상태는 맞는데 시작이 안 되는" 상태가 남는다.
- 유닛을 못 찾으면 systemd 원문 오류가 아니라 **후보를 밝히는 메시지**로 실패한다("smb/smbd를 찾을 수 없습니다"). 미설치 안내로 이어지게 된다.

> [!WARNING]
> **해석 결과를 캐시하지 말라.** 프로세스 기동 뒤에 패키지를 설치하는 경로가 흔히 있다(미설치 안내 → 사용자가 설치 → 재시도). 캐시하면 정확히 그때 틀린다. 호출 지점이 사용자 조작뿐이라면 매번 확인해도 부담이 없다.

> [!NOTE]
> `is-active`가 `inactive`를 돌려준다고 서비스가 꺼진 것이 아니다. **"유닛 없음"과 "꺼짐"을 먼저 갈라야** 이 결함군이 사라진다.

---

## 관련

- [[systemd-service]] — 유닛 기본 구조와 상태 조회
- [[systemd-automount-watchdog]] — 유닛 상태 오판의 다른 사례
- [[unknown-is-not-absent]] — "확인 실패"를 "정상·없음"으로 접는 결함군
- [[linux-permissions]]

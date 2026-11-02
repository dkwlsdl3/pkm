---
title: conf_param 레코드를 클라이언트가 다시 읽기 전에 지우면 비활성화가 전달되지 않는다
tags:
  - tech
  - lustre
  - troubleshooting
created: 2026-11-02 (월)
---

# conf_param 레코드를 클라이언트가 다시 읽기 전에 지우면 비활성화가 전달되지 않는다

> **TL;DR**: `lctl conf_param <OST>.osc.active=0`으로 OST를 비활성화한 직후 그 설정 레코드를 지우면, 아직 설정 로그를 다시 읽지 않은 클라이언트는 **비활성화를 영영 받지 못한다.** 클라이언트마다 결과가 무작위로 갈린다. 레코드를 지우기 전에 클라이언트의 재읽기 창(약 12초)만큼 기다린다.

| 표기 | 원어 | 뜻 |
|---|---|---|
| MGS | Management Server | 파일시스템 설정을 보관·배포하는 Lustre 서버 |
| OST | Object Storage Target | 실제 파일 데이터가 저장되는 Lustre 저장 단위 |
| OSC | Object Storage Client | 클라이언트 쪽에서 OST 하나와 통신하는 장치 |
| llog | Lustre log | MGS가 설정 변경을 쌓아 두는 로그. 클라이언트가 이를 읽어 설정을 맞춘다 |
| MGC | Management Client | 클라이언트 쪽에서 MGS 설정을 받아오는 구성요소 |

## 증상

- OST 3개를 영구 제거했는데 클라이언트에서 `active=0`이 된 것은 **1개뿐**이었다.
- 클라이언트에서 `lfs df`가 남은 OST를 계속 붙잡고 멈춰, 멈춘 프로세스가 13개 쌓였다.
- 같은 절차를 손으로 천천히 밟으면 모든 클라이언트에 반영된다. 그래서 재현이 들쭉날쭉하다.

## 원인

- 클라이언트의 MGC는 설정이 바뀐 것을 알아챈 뒤 **바로 읽지 않는다.** 일정 시간(5~10초) 기다렸다가 config llog를 다시 읽는다(Lustre 2.15 `mgc_request.c`의 requeue 동작).
- 제품은 `conf_param ... active=0`을 걸고 **약 3초 만에** 그 레코드를 지웠다.
- 지워진 레코드는 다시 읽을 때 건너뛴다. 그래서 그 사이에 아직 읽지 않은 클라이언트는 비활성화 지시를 보지 못한다.
- 레코드를 남겨 두는 대안도 안 된다. **그 OST 장치가 없는 클라이언트**(나중에 새로 붙은 클라이언트 등)는 그 레코드를 처리하다 설정 처리가 멈춘다. 실제로 그렇게 됐다.

## 해결

```bash
lctl conf_param <FSNAME>-OST0003.osc.active=0   # 1) 비활성화
sleep 12                                        # 2) 클라이언트 재읽기 창: 2 × mgc_requeue_timeout_min(기본 5) + 2
# 3) 그 다음 설정 레코드 정리 (llog_print → llog_cancel 등, 판에 따라 절차 다름)
lctl get_param osc.*OST0003*.active             # 4) 각 클라이언트에서 0인지 확인
```

- 12초는 업스트림 `lctl`이 같은 상황에서 쓰는 대기 상한과 같다.
- 배포 후 두 번 재실측했고, 모든 클라이언트에 반영되기까지 약 9초가 걸렸다.
- 원인은 소스(`mgc_request.c`, `llog.c`, `obd.c`)를 읽고 찾았다. 그 뒤 MGS에서 "비활성화 → 대기 → 삭제"를 손으로 밟아 클라이언트 3곳 모두 반영되는 것을 확인했다.
- 미해결: 삭제 직후 `lfs df`가 한 번 종료코드 108(ESHUTDOWN)을 냈다. 원인은 확인하지 못했다.

> [!NOTE]
> 일반화하면 이렇다. **비동기로 전파되는 설정은 "썼다"와 "모두가 읽었다" 사이에 창이 있다.** 전파 수단(레코드)을 지우는 정리는 그 창이 지난 뒤에 한다.

---

## 관련

- [[lustre-ost-permanent-removal]] — conf_param 영구 비활성화 절차 본문
- [[lfs-df-exit-code-partial-failure]] — 비활성 OST가 남긴 `lfs df` 종료코드
- [[lfs-dstate-circuit-breaker]] — 멈춘 `lfs` 호출을 격리하는 방법
- [[lustre-overview]]

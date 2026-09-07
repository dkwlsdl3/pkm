---
title: dnf 종료코드 0 은 업그레이드 성공이 아니다
tags:
  - tech
  - troubleshooting
created: 2026-09-07 (일)
---

# dnf 종료코드 0 은 업그레이드 성공이 아니다

> **TL;DR**: rpm 은 `%post` 스크립틀릿이 실패해도 **트랜잭션을 되돌리지 못한다**. 그래서 마이그레이션이나 기동이 `%post` 에서 깨져도 **`dnf` 는 0 을 낸다**(화면에는 `Error in POSTIN scriptlet` 이 찍히는데 종료코드는 성공이다). 종료코드는 "트랜잭션이 끝까지 돌았는가"이지 "서비스가 새 버전으로 살아났는가"가 아니다. 성공 판정을 **갱신 후 상태 확인**으로 옮겨라.

## 증상

- 자동 업데이트가 "성공"으로 끝났는데 서비스가 `inactive` 다.
- 새 바이너리는 깔렸는데 스키마가 옛날 그대로다.
- 로그를 뒤지면 `Error in POSTIN scriptlet` 이 있는데 아무도 못 봤다 — 종료코드가 0 이었기 때문이다.

## 원인

Rocky Linux 8.9(rpm 4.14.3 / dnf 4.7.0)와 9.8(rpm 4.16.1.3 / dnf 4.14.0) 컨테이너에서 최소 spec 으로 직접 재 봤을 때 두 환경의 결과가 같다.

| scriptlet | `rpm -Uvh` | `dnf` | 결과 |
|---|---|---|---|
| `%post` 가 exit 1 (업그레이드) | **0** | **0** | 새 버전 설치 완료, 구 버전 제거 |
| `%pre` 가 exit 1 (업그레이드) | 1 | 1 | 옛 버전 유지, 파일이 안 바뀜 |

`rpm-scriptlets(7)` 도 같은 내용이다 — `%pre` 만 "Non-zero exit prevents the installation of the containing package" 이고 `%post` 에는 그런 규정이 없다. **rpm 은 트랜잭션을 롤백하지 못한다.**

## 해결

갱신 명령의 종료코드 대신 **결과 상태를 따로 확인한다**.

```bash
sudo dnf upgrade myapp-backend
sudo -u postgres myapp-config migrate    # 적용 이력이 최신인지 본다
systemctl is-active myapp-backend        # %post 가 실패했다면 여기가 inactive 다
```

- 배포를 **막아야** 하는 검사는 `%pre` 로 옮긴다 — 파일이 바뀌기 전이라 그 자리만 멈춘다 → [[rpm-scriptlet-pre-vs-post]]
- 자동화된 갱신 경로라면 갱신 후 확인을 스크립트에 붙이고, 그 결과로 성공/실패를 판정한다.

> [!WARNING]
> **문서에 spec 예시를 복사해 두지 마라.** 복사본은 원본이 바뀌어도 안 따라가서 **실제와 반대되는 내용을 가르치게 된다**. 정본은 spec 파일 하나로 두고 문서는 "무엇을 하는가"만 적는다.

---

## 관련

- [[rpm-scriptlet-pre-vs-post]] — 막아야 할 검사를 어디에 둘 것인가
- [[self-update-killed-by-own-cgroup]] — 갱신이 중간에 죽는 다른 원인
- [[psql-exit-code-zero-on-partial-restore]] — 같은 계열(종료코드가 성공을 뜻하지 않음)
- [[smartctl-exit-status-bitmask]] · [[lfs-df-exit-code-partial-failure]]

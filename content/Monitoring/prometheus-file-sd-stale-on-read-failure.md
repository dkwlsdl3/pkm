---
title: Prometheus file_sd 는 읽기 실패 시 직전 목록을 유지한다
tags:
  - tech
  - troubleshooting
created: 2026-08-04 (화)
---

# Prometheus file_sd 는 읽기 실패 시 직전 목록을 유지한다

> **TL;DR**: `file_sd_configs` 대상 파일을 읽지 못하면 Prometheus 는 **오류를 내고 직전에 성공적으로 읽은 목록을 그대로 유지한다.** 그래서 새로 추가한 대상만 조용히 빠지고 화면에는 어떤 오류도 뜨지 않는다. 파일 권한을 명시하고, **파일 내용 ↔ `/api/v1/targets` 를 대조**해야 이 상태를 잡을 수 있다.

## 증상

- 새로 만든 인스턴스가 모니터링 화면에 **영원히 나타나지 않는다.** 기다려도 안 나온다
- 기존 대상은 전부 정상 수집된다 → "수집 자체는 되는데 이것만 안 잡힌다"
- exporter 는 살아 있다 (`curl <host>:9100/metrics` 200)
- 대상 파일에는 그 인스턴스가 **분명히 적혀 있다**

## 원인

Prometheus 는 `file_sd` 대상 파일을 주기적으로(기본 5분, `refresh_interval`) 다시 읽는다. 읽기가 실패하면
**그 갱신을 버리고 이전 대상 집합을 유지한다.** 이것은 설계된 동작이다 — 파일이 잠깐 깨졌다고 전체 대상을
잃는 것보다 낫기 때문이다. 부작용은 **실패가 최종 사용자에게 전혀 보이지 않는다**는 것이다.

가장 흔한 실패 원인은 권한이다. 파일을 쓰는 쪽이 systemd 서비스(umask `0077`)면 `0600` 이 되고
Prometheus 는 자기 계정으로 돌아 읽지 못한다 → [[systemd-umask-file-permission-drift]]

```bash
$ journalctl -u prometheus | grep -i "error reading"
… level=error component="discovery manager scrape" \
  msg="Error reading file" path=/etc/prometheus/targets/nodes.json err="permission denied"

$ sudo -u prometheus cat /etc/prometheus/targets/nodes.json
cat: … : 허가 거부

$ stat -c '%a %U:%G' /etc/prometheus/targets/nodes.json
600 root:root
```

★결정적 단서: **파일에는 있는데 `/api/v1/targets` 에는 없다.**

```bash
jq -r '.[].targets[]' /etc/prometheus/targets/nodes.json | sort > /tmp/a
curl -s localhost:9090/api/v1/targets \
  | jq -r '.data.activeTargets[].discoveredLabels.__address__' | sort > /tmp/b
diff /tmp/a /tmp/b        # 차이가 있으면 file_sd 가 갱신을 못 받고 있다
```

## 해결

**쓰는 쪽에서 모드를 명시한다.** rename 으로 원자 교체한다면 **rename 전에** 설정해야 한다.

```rust
let tmp = path.with_extension("tmp");
std::fs::write(&tmp, &json)?;
std::fs::set_permissions(&tmp, Permissions::from_mode(0o644))?;   // umask 무시
std::fs::rename(&tmp, path)?;
```

내용이 인스턴스명과 내부 주소뿐이면 0644 로 두어도 무방하다. 비밀이 섞인다면 파일을 나누고 Prometheus
계정 그룹에 0640 을 준다.

**회귀 테스트는 서비스 umask 를 재현해야 한다.** 개발 셸(0022)에서 도는 테스트는 이 결함을 못 잡는다.

```rust
let old = unsafe { libc::umask(0o077) };
write_targets_file(&path, &targets)?;
assert_eq!(mode_of(&path) & 0o777, 0o644);
unsafe { libc::umask(old) };
```

> [!WARNING]
> **삭제 경로도 같은 함수를 타야 한다.** 생성 쪽만 고치면 대상을 하나 지우는 순간 파일이 다시 0600 으로
> 쓰여 같은 상태로 돌아간다.

> [!NOTE]
> 정상 경로의 반영 지연은 **인스턴스 기동 시간 + `refresh_interval`** 이다(5분 기본). "5분 지나도 안 보이면
> 이상"이라는 기준선을 문서에 적어 두면, 조용한 실패와 정상 지연을 사람이 구분할 수 있다.

---

## 관련

- [[systemd-umask-file-permission-drift]] — 파일이 0600 으로 만들어지는 근본 원인
- [[prometheus-exporter-port]] — exporter 쪽 확인 절차
- [[monitoring-overview]]
- [[unknown-is-not-absent]] — 실패를 "직전 값 유지"로 접는 결함군

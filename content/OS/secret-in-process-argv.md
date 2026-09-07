---
title: 비밀값을 명령 인자로 넘기면 같은 호스트의 남이 읽는다
tags:
  - tech
  - troubleshooting
created: 2026-09-07 (일)
---

# 비밀값을 명령 인자로 넘기면 같은 호스트의 남이 읽는다

> **TL;DR**: `sshpass -p <비밀번호>`, `curl -u user:token`, `psql "postgresql://user:pw@..."` 처럼 비밀값을 **인자로** 주면 그 값이 프로세스 인자 목록(`/proc/<pid>/cmdline`)에 실려 **같은 호스트의 다른 사용자까지** `ps` 로 읽는다. 게다가 실행 헬퍼가 실패 시 명령 문자열 전체를 오류에 싣는 순간 로그에도 남는다. 전달 경로를 **표준입력·환경변수·설정 파일**로 옮기고, 그 방법을 한 모듈에 가둬라.

## 증상

- 설치·배포 도중 `ps auxww` 를 걸어 두면 토큰·DB 비밀번호가 그대로 보인다.
- 명령이 실패했을 때 오류 메시지에 **명령 문자열 전체**가 실려 비밀값이 로그로 흘러간다.
- 한 곳을 고쳐도 다른 모듈에 같은 호출이 복사돼 남아 있다.

## 원인

프로세스의 인자 목록은 커널이 `/proc/<pid>/cmdline` 으로 노출하고, 이 파일은 **다른 사용자도 읽을 수 있다**. 환경변수(`/proc/<pid>/environ`)는 같은 사용자(와 root)만 읽으므로 등급이 다르다 — 완전한 비밀은 아니지만 **남에게 보이지 않는다**는 차이가 크다.

| 전달 경로 | 같은 사용자 | 다른 사용자 | 비고 |
|---|---|---|---|
| 명령 인자 | 보임 | **보임** | 가장 나쁨 |
| 환경변수 | 보임 | 안 보임 | `sshpass -e` 가 쓰는 방식 |
| 표준입력 | 안 보임 | 안 보임 | `curl -K -`, `psql` 프롬프트 |

`sshpass` 자신의 설명서도 `-p` 를 **가장 덜 안전한 방법**으로 적는다.

## 해결

도구마다 인자를 피하는 경로가 이미 있다.

```bash
# ❌ 인자에 남는다
sshpass -p "$PASSWORD" ssh user@host 'cmd'
curl -u "token:$TOKEN" https://registry.example/api

# ✅ 환경변수 — 다른 사용자에게는 안 보인다
SSHPASS="$PASSWORD" sshpass -e ssh user@host 'cmd'

# ✅ 표준입력 — 설정을 본문으로 넘긴다
printf 'user = "token:%s"\n' "$TOKEN" | curl -K - https://registry.example/api
```

Rust 쪽에서는 비밀값을 받는 실행 함수를 **한 모듈에 가두고** 밖으로는 연산만 내보낸다.

```rust
/// 셸 명령을 돌리되 비밀값은 표준입력으로 넘긴다.
pub fn shell_with_secret_stdin(cmd: &str, secret_stdin: &str) -> Result<String> {
    let mut child = Command::new("bash").arg("-c").arg(cmd)
        .stdin(Stdio::piped()).stdout(Stdio::piped()).stderr(Stdio::piped())
        .spawn()?;
    child.stdin.as_mut().unwrap().write_all(secret_stdin.as_bytes())?;
    let output = child.wait_with_output()?;
    if !output.status.success() {
        // ⚠️오류에 명령을 싣지 않는다. 표준오류로 되돌아온 비밀값도 지운다.
        anyhow::bail!("종료코드 {:?}: {}", output.status.code(),
                      redact(&String::from_utf8_lossy(&output.stderr), secret_stdin));
    }
    Ok(String::from_utf8_lossy(&output.stdout).to_string())
}
```

> [!WARNING]
> **인자에서 뺐다고 끝이 아니다.** 실행 헬퍼가 실패할 때 명령 문자열을 오류에 싣거나, 원격·외부 프로그램이 받은 값을 **표준오류로 되돌려 보내면** 그 경로로 다시 샌다. 오류에는 명령을 싣지 말고, 되돌아온 값은 마스킹해야 한다 → [[secret-masking-escape-gaps]]

> [!NOTE]
> 방법이 모듈마다 복사되면 한 곳만 고쳐지고 나머지는 남는다. 실제로 한 사이클 안에서 같은 사본이 둘 생겼다. **인자 조립을 한 자리에 모으는 것**이 이 계열 결함의 공통 처방이다 → [[argv-assembly-single-gate]]

---

## 관련

- [[secret-masking-escape-gaps]] — 새는 값을 지우는 쪽의 함정
- [[argv-assembly-single-gate]] — 인자 조립을 한 모듈에 가두기
- [[partial-failure-reported-as-success]] — 실패를 오류로 싣다 비밀이 새는 계열

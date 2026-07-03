---
title: dev 스크립트의 restart ≠ rebuild
tags:
  - tech
  - dx
created: 2026-07-03 (금)
---

# dev 스크립트의 restart ≠ rebuild

> 서비스 관리 스크립트의 `restart`가 빌드를 포함한다고 가정하지 말 것.

## 증상
컴파일 언어(Rust/Go 등) 백엔드를 수정하고 `./dev.sh restart`를 돌렸는데 **수정이 반영되지 않는다.** 코드를 의심하며 디버깅하지만 사실은 **몇 주 전 바이너리**가 계속 실행 중이다.

## 원인
많은 dev 스크립트에서 `restart` = `stop + start`일 뿐이고, 빌드는 별도 커맨드(`build`)다. 스크립트 소스에서 restart 분기가 `cargo build`/`go build`를 호출하는지 직접 확인해야 한다.

## 진단법 (가정 대신 확인)
```bash
stat -c '%y' target/release/<binary>     # 바이너리 mtime
stat -c '%y' src/<수정한 파일>            # 소스 mtime
ps -o lstart -C <binary>                 # 프로세스 시작 시각
```
소스 mtime > 바이너리 mtime 이면 반영 안 된 것. `build && restart`가 정답.

## 교훈
- "재시작했는데 왜 안 바뀌지"의 단골 원인 1순위.
- 인터프리터/HMR(프론트)과 컴파일 서비스(백엔드)가 한 스크립트에 섞여 있으면 프론트만 갱신되어 착각이 강화된다.

## 관련
- [[dx-overview]]

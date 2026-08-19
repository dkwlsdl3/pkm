---
title: debugfs 의사 파일은 작은 버퍼로 읽으면 EINVAL 로 실패한다
tags:
  - tech
  - troubleshooting
created: 2026-07-31 (금)
---

# debugfs 의사 파일은 작은 버퍼로 읽으면 EINVAL 로 실패한다

> **TL;DR**: `/sys/kernel/debug/` 아래 의사 파일은 **크기가 0으로 보고**된다. 크기 0인 파일을 통째로 읽는 API(예: Rust `fs::read_to_string`)는 **작은 탐색 읽기**를 먼저 내는데, 커널 핸들러는 read 한 번에 레코드 한 줄을 통째로 담으므로 **버퍼가 그 줄보다 작으면 부분 전달이 아니라 `EINVAL`로 실패**한다. `cat`은 큰 버퍼를 써서 잘 되기 때문에 "명령으로는 되는데 코드로는 안 되는" 모양이 된다.

## 증상

- 명령줄에서 `cat`으로 읽으면 잘 되는 파일을, 프로그램에서 읽으면 항상 `Invalid argument`(EINVAL)
- 파일이 없거나 권한이 없는 것도 아니다
- 커널·드라이버 버전 문제로 오해하기 쉽다

## 원인

두 가지가 겹친다.

**① 의사 파일의 크기는 0이다.** `stat`이 0을 돌려주므로, "파일 크기만큼 버퍼를 잡는" 최적화가 있는 API는 **작은 탐색용 읽기를 먼저 낸다.** Rust std의 `read_to_string`은 크기 0인 파일에 대해 32바이트 읽기를 먼저 낸다(strace로 확인 가능).

**② 커널 핸들러가 부분 전달을 안 한다.** debugfs 핸들러 상당수는 레코드 한 줄을 통째로 담으며, 호출자 버퍼가 그보다 작으면 잘라 주는 대신 실패시킨다.

```c
/* 예: lustre lnet/lnet/lnet_debugfs.c  proc_lnet_nis */
if (len > *lenp) {    /* linux-supplied buffer is too small */
        rc = -EINVAL;
```

헤더 한 줄이 71바이트라면 32바이트 읽기는 **첫 시도에서 바로 실패**한다.

### 경계 확인

```bash
dd if=/sys/kernel/debug/lnet/nis bs=70 count=1   # dd: error reading ...: Invalid argument
dd if=/sys/kernel/debug/lnet/nis bs=71 count=1   # 성공
```

`bs`를 한 바이트 올리고 내리며 재면 **버퍼 크기 문제라는 것이 즉시 확정된다.** 커널 버전이나 도구 이관을 의심하기 전에 이 확인이 먼저다.

## 해결

충분히 큰 버퍼로 EOF까지 반복해서 읽는다.

```rust
use std::fs::File;
use std::io::Read;

let mut f = File::open(path)?;
let mut buf = Vec::new();
let mut chunk = [0u8; 65536];          // 레코드 한 줄보다 확실히 크게
loop {
    let n = f.read(&mut chunk)?;       // 커널이 한 줄씩 채워 준다
    if n == 0 { break; }
    buf.extend_from_slice(&chunk[..n]);
}
```

버퍼 크기는 **커널 쪽 임시 버퍼 산정식을 근거로 정한다**(예: CPU 파티션 수에 비례하는 경우 최대 구성까지 덮는 값). 상수를 감으로 박으면 장비가 커질 때 같은 실패가 재발한다.

## 주의

> [!WARNING]
> **같은 읽기 코드가 여러 곳에 복사돼 있는지 확인하라.** 수집기와 감시 데몬처럼 같은 파일을 읽는 경로가 둘이면, 한쪽만 고쳤을 때 다른 쪽이 계속 조용히 실패한다.

> [!WARNING]
> 이 실패를 "해당 기능이 없는 호스트"로 삼켜 처리하면 **장애가 정상으로 보인다.** "없다"와 "못 읽었다"는 반드시 구분한다 → [[query-failure-vs-empty-state]]

테스트에서 버퍼 크기를 하드코딩하면 회귀를 못 잡는다. 근거가 되는 **계산식으로 검증**한다.

---

## 관련

- [[lustre-lnet-nic-misdetection]] — LNET 관련 다른 오설정 유형
- [[sysfs-enotdir-vs-notfound]] — `/sys` 순회에서 오류 종류를 잘못 걸러내는 인접 함정
- [[lustre-performance-metrics]] — proc/sysfs 기반 지표 수집

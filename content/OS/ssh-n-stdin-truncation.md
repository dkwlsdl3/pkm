---
title: ssh -n 이 표준입력을 끊어 파일이 빈 채로 전달된다
tags:
  - tech
  - troubleshooting
created: 2026-08-13 (목)
---

# ssh -n 이 표준입력을 끊어 파일이 빈 채로 전달된다

> **TL;DR**: 원격에 파일을 표준입력으로 밀어 넣는 배포에 `ssh -n`을 붙이면 **입력이 `/dev/null`로 바뀌어 0바이트 파일이 만들어진다.** 명령은 성공(종료 코드 0)하므로 배포는 정상으로 보이고, 그 파일을 쓰는 쪽에서야 이상이 드러난다.

## 증상

원격 호스트에 스크립트를 배포하고 실행했는데 아무 일도 일어나지 않는다. 배포 단계는 성공으로 기록돼 있다.

```bash
# 배포는 "성공"한다
ssh -n <HOST> 'cat > /tmp/sampler.sh' < ./sampler.sh
echo $?    # 0

# 그런데 원격 파일이 비어 있다
ssh <HOST> 'wc -c /tmp/sampler.sh'
# 0 /tmp/sampler.sh
```

## 원인

`ssh -n`은 **표준입력을 `/dev/null`로 리다이렉트**한다. 원래 목적은 백그라운드로 띄운 `ssh`가 로컬 터미널의 입력을 훔쳐 가는 것을 막는 것이다.

문제는 그 옵션이 **파일 전달 경로와 정확히 같은 통로를 쓴다**는 점이다. `< ./sampler.sh`로 밀어 넣은 내용이 `-n`에 의해 덮여, 원격의 `cat`은 빈 입력을 받는다. `cat`은 빈 입력을 정상적으로 처리하므로 **종료 코드는 0**이다.

> 실패가 조용한 이유: 전송이 끊긴 것도, 권한이 없는 것도 아니다. **빈 파일을 성공적으로 만든 것**이다.

## 해결

```bash
# 파일을 stdin으로 넘길 때는 -n 을 쓰지 않는다
ssh <HOST> 'cat > /tmp/sampler.sh' < ./sampler.sh

# 배포 직후 크기를 검증한다 (성공 여부를 종료 코드에만 맡기지 않는다)
ssh <HOST> 'test -s /tmp/sampler.sh' || { echo "배포 실패: 빈 파일"; exit 1; }

# 백그라운드 실행에서 stdin 도둑질을 막고 싶다면, 파일 전달과 실행을 분리한다
scp ./sampler.sh <HOST>:/tmp/sampler.sh
ssh -n <HOST> 'setsid /tmp/sampler.sh >/tmp/sampler.log 2>&1 &'
```

## 주의

> [!WARNING]
> `-n`은 백그라운드 `ssh` 호출에 관용적으로 붙이는 옵션이라, 스크립트를 훑어보며 복사하다 파일 전달 줄에 딸려 붙기 쉽다. **stdin으로 무언가를 넘기는 `ssh` 줄에는 `-n`이 있으면 안 된다**는 것만 기억하면 된다.

배포·전달 단계는 **종료 코드가 아니라 산출물로 검증한다.** 크기 0 확인 한 줄이면 이 유형 전체가 걸린다.

---

## 관련

- [[shell-sigtstp-background]] — 백그라운드 SSH가 stdout을 잡아 끝나지 않는 인접 함정
- [[benchmark-harness-run-isolation]] — 계측 하네스가 실패를 성공으로 보고하던 다른 자리

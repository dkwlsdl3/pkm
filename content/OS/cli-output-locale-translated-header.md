---
title: CLI 출력 헤더는 로케일 번역된다 — 컬럼명 매칭 금지
tags:
  - tech
  - troubleshooting
created: 2026-07-31 (금)
---

# CLI 출력 헤더는 로케일 번역된다 — 컬럼명 매칭 금지

> **TL;DR**: `virsh`·`systemctl`·`ip` 등 많은 CLI가 **헤더와 상태 문자열을 로케일에 따라 번역**한다. 헤더 컬럼명으로 파싱하면 한국어 로케일 서버에서 조용히 실패한다. **구분선 이후 위치 기반 파싱**을 쓰거나, 가능하면 `LC_ALL=C`로 고정하거나 기계 판독용 출력(`--format json` 등)을 쓴다.

---

## 증상

개발 박스에서는 되던 파서가 실제 서버에서 0건을 반환한다. 오류도 없다.

```console
$ virsh domiflist vm-01           # 영문 로케일
 Interface   Type     Source    Model    MAC
------------------------------------------------------
 vnet5       bridge   br-lnet   virtio   52:54:00:xx:xx:xx

$ virsh domiflist vm-01           # 한국어 로케일
 인터페이스   유형     소스      모델     MAC
------------------------------------------------------
 vnet5        bridge   br-lnet   virtio   52:54:00:xx:xx:xx
```

`"Interface"`·`"Source"`로 컬럼 인덱스를 찾는 코드는 **헤더를 못 찾아 전부 건너뛴다.**

## 원인

CLI 도구는 사람이 읽는 출력을 gettext로 번역한다. 번역 대상은 헤더만이 아니다:

- 헤더 컬럼명 (`Interface` → `인터페이스`)
- 상태 문자열 (`running` → `실행 중`, `active` → `활성`)
- 오류 메시지 (grep으로 오류를 판별하는 코드가 깨진다)

컬럼 **값**(장치명·MAC·타입 키워드)은 보통 번역되지 않지만, 그것도 도구마다 다르다.

## 해결

### 1순위 — 기계 판독용 출력을 쓴다

```bash
virsh --version                       # 지원 여부 확인 후
systemctl show -p ActiveState --value unit   # show/--value 는 번역 대상 아님
ip -json addr                          # JSON
nmcli -t -f NAME,UUID connection show  # terse + 필드 지정
```

### 2순위 — 로케일을 고정한다

```bash
LC_ALL=C virsh domiflist "$dom"
```

프로세스로 실행할 때는 환경변수를 직접 세팅한다. 다만 **호출 경로가 여러 개면 하나를 놓친다** — 라이브러리 함수 안에서 고정하는 편이 안전하다.

### 3순위 — 구분선 이후 위치 기반 파싱

헤더 문자열에 의존하지 않는다. 표 형식 CLI는 대개 `---` 구분선을 낸다.

```rust
// 구분선을 찾고, 그 뒤 행을 공백 분할해 5필드 위치로 읽는다
let body = out.lines().skip_while(|l| !l.trim_start().starts_with("---")).skip(1);
for line in body {
    let f: Vec<&str> = line.split_whitespace().collect();
    if f.len() < 5 { continue }
    let (iface, kind, source, model, mac) = (f[0], f[1], f[2], f[3], f[4]);
    ...
}
```

★ **언어별 실측 출력을 픽스처로 고정한다.** 영문 1종만 두면 이 함정이 회귀로 다시 들어온다. 실제 서버에서 뽑은 한국어 출력도 테스트에 넣는다.

## 함께 지킬 파싱 원칙

- **추측하지 말고 실제 샘플로 파싱한다** — 마지막 토큰 자르기 같은 방식은 형식이 안정적임을 증명한 뒤에만
- **모르는 값은 단정하지 않는다** — 열거 실패·예상 밖 형식은 `unknown`으로 두고, 폴백 기본값을 "정상적인 값"으로 잡지 마라(미지 장치가 'Physical'로 표시되는 식의 오표시가 생긴다)
- **불완전 관찰로 정상 데이터를 지우지 마라** — 여러 명령을 조합해 스냅샷을 만들 때는 **전부 성공했을 때만** 한 트랜잭션으로 교체한다. 일부 실패 상태에서 교체하면 살아 있는 레코드가 삭제된다
- **판정 근거를 문서에 남긴다** — "이 값이 이렇게 나오는 걸 어느 장비에서 실측했다"를 적어두면 다음 사람이 재조사하지 않는다. 실기기 샘플을 못 구한 항목은 "커널 규약 기준, 미실측"으로 구분해 적는다

---

## 관련

- [[kvm-libvirt]] · [[libvirt-guest-rename-namespaces]]
- [[smartctl-raw-value-parsing]] · [[smartctl-device-type-sat-cciss]] — 같은 계열의 CLI 출력 파싱 함정
- [[unknown-is-not-absent]] — 미지값을 정상값으로 접지 않기
- [[lustre-lnet-nic-misdetection]]
- [[os-overview]]

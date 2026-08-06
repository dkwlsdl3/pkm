---
title: 마운트가 빠지면 그 아래 모든 경로가 "없음"으로 보인다
tags:
  - tech
  - troubleshooting
created: 2026-08-05 (수)
---

# 마운트가 빠지면 그 아래 모든 경로가 "없음"으로 보인다

> **TL;DR**: 마운트포인트가 언마운트되면 그 아래 경로는 **오류가 아니라 "존재하지 않음"** 으로 응답한다. "파일이 없으니 기록을 지운다" 식의 정리 작업이 그 창에 돌면 **기록을 전량 삭제**하고, 재마운트 뒤 파일 전체가 손댈 수 없는 상태로 남는다. 정리·삭제 경로는 **fail-closed** 여야 한다 — 저장소가 진짜 붙어 있다는 **적극적 증거**를 먼저 요구하라.

## 증상

- 재마운트한 뒤 보니 목록이 **텅 비어 있는데 디스크에는 파일이 그대로** 있다
- 언마운트된 사실을 아무도 몰랐다. 오류 로그가 없다 — 정리 작업은 "정상 완료"로 끝났다
- 발동 창이 좁지 않다: 정리 스케줄은 보통 **기동 직후 + 매시간** 돈다(부팅 순서 경합이 정확히 이 창이다)

## 원인

언마운트된 마운트포인트는 **빈 로컬 디렉터리**로 되돌아간다. 그 아래를 `stat` 하면 `ENOENT` 다 —
"저장소가 없다"가 아니라 **"파일이 없다"** 로 보인다.

```
정상:   /mnt/store/.trash/<uuid>   → 있음
언마운트: /mnt/store/.trash/<uuid> → ENOENT (파일이 지워진 것과 구분 불가)
```

여기에 두 가지가 겹치면 데이터 손실이 확정된다.

**① "없으면 기록도 지운다" 로직**

```rust
if !path.exists() { delete_row(id).await?; }   // 언마운트 창에서 전량 삭제
```

**② 가드를 무력화하는 다른 창구.** "부모 디렉터리가 보이면 신뢰한다"로 고쳐도, **업로드·폴더 생성·복원
창구가 마운트 상태를 보지 않고 `create_dir_all` 을 호출**하면 언마운트된 상태에서 **로컬 디스크에 그
디렉터리가 생긴다.** 그때부터 "부모가 보이므로 파일이 정말 없다"가 **항상 참**이 된다.

## 해결

**저장소가 붙어 있다는 적극적 증거를 요구한다.** 표식 파일이 가장 이식성 있다 — 저장소 위에만 존재하므로
로컬에 새로 생긴 디렉터리와 구분된다.

```bash
# 프로비저닝 때 저장소 위에 한 번 만든다
touch /mnt/store/.storage-marker
```

```rust
fn storage_online(base: &Path) -> bool {
    base.join(".storage-marker").symlink_metadata().is_ok()
}

// 정리·삭제 진입점에서 fail-closed
if !storage_online(&base) {
    return Err(Error::StorageOffline);   // 아무것도 지우지 않는다
}
```

**디렉터리 준비도 fail-closed 로.** 기반 디렉터리가 없으면 **만들지 말고 거절**한다. 두 창구 이상이
같은 준비 함수를 쓰게 모아라 — 한 곳이라도 조건 없이 만들면 가드 전체가 무너진다.

```rust
fn ensure_trash_dir(base: &Path) -> Result<PathBuf, Error> {
    if !base.exists() { return Err(Error::StorageOffline); }  // ★ 여기서 만들지 않는다
    let d = base.join(".trash");
    std::fs::create_dir_all(&d)?;
    Ok(d)
}
```

**마운트 판정(`mountpoint -q`, `/proc/self/mountinfo`)을 쓸지는 배치에 달렸다.** 그 저장소 없이도 도는
배치가 있다면 마운트 판정은 그 배치의 기능을 통째로 막는다 — 그래서 표식 파일이 더 넓게 쓰인다.

```bash
mountpoint -q /mnt/store || exit 1                       # 저장소가 필수인 배치
findmnt -rno TARGET /mnt/store >/dev/null || exit 1
```

> [!WARNING]
> **판정을 신뢰할 수 없는 조건에서는 아무 말도 하지 않는다.** "기록 없이 디스크에만 남은 파일"을 세어
> 보고하는 기능도 언마운트 상태에서는 **전량이 고아로 보인다.** 자동 삭제는 물론이고 **경고 발송도** 하지
> 말아야 한다. 전제가 어긋나면 중단하고, 실제 정리는 사람이 확인하며 돌리는 스크립트로 남긴다.

> [!WARNING]
> "기록을 먼저 만들고 파일을 나중에 옮기는" 설계(롤백 안전성 때문에 흔하다)에서는 **그 사이 기록은 파일이
> 없는 것이 정상**이다. 정리 작업에 **생성 후 N분 유예**를 두지 않으면 그 창에서 지워 버린다. 만료 정리는
> 물론이고 **비우기·계정 데이터 삭제처럼 전 기록을 훑는 경로 전부**에 적용해야 한다.

---

## 관련

- [[path-exists-conflates-stat-failure]] — 같은 결함의 함수 단위 형태
- [[unknown-is-not-absent]]
- [[systemd-automount-watchdog]] — 마운트 상태를 감시하는 쪽
- [[fstab-uuid-mount]]
- [[lfs-dstate-circuit-breaker]] — 마운트가 살아 있으나 응답하지 않는 다른 상태

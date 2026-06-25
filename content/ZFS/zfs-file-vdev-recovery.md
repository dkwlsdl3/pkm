---
tags:
  - tech
created: 2026-06-25 (목)
---

# ZFS 파일/loop vdev 재부팅 복구

> **TL;DR**: 파일(루프백 이미지) vdev로 만든 zpool은 재부팅 시 loop 연결이 풀려 사라진다. `losetup` 재연결 후 import해야 하며, 파일을 직접 import하면 vdev 타입이 `disk`일 때 실패한다.

---

## 개요

- **무엇인가**: 실물 디스크 대신 파일(sparse 이미지)을 loop 디바이스로 붙여 만든 ZFS 풀의 재부팅 복구
- **왜 쓰는가**: 개발/테스트 환경에서 디스크 없이 ZFS 풀 구성(fakedisk)
- **언제 쓰는가**: 재부팅·커널 변경 후 zpool이 사라졌을 때

---

## 핵심 개념

### 재부팅 시 loop 연결 소실
파일 vdev는 `losetup`으로 loop 디바이스(`/dev/loopN`)에 붙인 뒤 `zpool create` 한다. 재부팅하면 loop 연결이 풀려 `zpool list`에 풀이 안 보이고, `zpool import`(기본은 `/dev`만 스캔)로도 안 잡힌다.

### losetup 재연결이 선행
```bash
losetup --find --show /path/to/disk.img   # loop 재연결
zpool import -d /dev <pool>                 # 그 후 import
```

### 파일 직접 import의 함정
loop 디바이스로 `zpool create` 했으면 vdev label의 타입이 `disk`(path=`/dev/loopN`)다. 이때 `zpool import -d <파일디렉터리>`로 파일을 직접 열려 하면:
```
internal error: cannot import: 블럭 장치가 필요함 (block device required)
```
→ 반드시 `losetup`으로 블록 디바이스에 붙인 뒤 import.

---

## 코드 / 사용 예시

```bash
# 재부팅 후 복구 (멱등)
for img in a b c; do
  losetup -j /path/$img.img | grep -q . || losetup --find --show /path/$img.img
done
zpool import -d /dev <pool>      # 또는 -a
zpool status                      # ONLINE + "errors: No known data errors" 확인
```

---

## 주의사항

> [!WARNING]
> `zdb -l`로 label 4개가 멀쩡해도 import가 "corrupted"처럼 보일 수 있는데, 실제론 파일을 블록 디바이스로 못 열어서다. losetup 후 재시도하면 정상 import된다.

---

## 관련

- [[zfs-overview]]
- [[lustre-troubleshooting]] — 파일 vdev zpool 위 zvol을 분산 파일시스템 VM 백킹으로 쓸 때

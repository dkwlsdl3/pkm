---
title: Lustre 성능 지표 수집 (proc/sysfs 기반, 에이전트리스)
tags:
  - lustre
  - monitoring
---

# Lustre 성능 지표 수집 (proc/sysfs 기반, 에이전트리스)

Lustre 서버 노드에서 IOPS·처리량·지연·클라이언트 수를 **외부 도구 없이 파일 읽기만으로** 수집하는 방법. (실측 검증: Lustre 2.15 계열, ldiskfs 백엔드)

## 소스 맵 — 어디에 뭐가 있나

| 지표 | 경로 | 비고 |
|---|---|---|
| OST I/O 통계 | `/proc/fs/lustre/obdfilter/<target>/stats` | 누적 카운터 |
| MDT 메타데이터 통계 | `/proc/fs/lustre/mdt/<target>/md_stats` | open/close/getattr 등 op별 |
| 클라이언트(익스포트) 수 | `/sys/fs/lustre/{obdfilter,mdt}/<target>/num_exports` | ⚠️ proc이 아니라 **sysfs** |
| 디그레이드 플래그 | `/sys/fs/lustre/obdfilter/<target>/degraded` | 0/1 |
| 복구 상태 | `/proc/fs/lustre/*/<target>/recovery_status` | 첫 줄 `status: X` |
| 노드 건강 | `/sys/fs/lustre/health_check` | `healthy` 등 |
| OST 활성(MDS 관점) | `/sys/fs/lustre/osp/<fs>-OST####-osc-MDT0000/active` | MDS에만 존재 |
| ~~brw_stats~~ | 최신 빌드에선 debugfs로 이동 — 지연은 stats의 usecs로 대체 가능 | |

전부 world-readable — **sudo/lctl 불필요** (lctl get_param은 같은 파일의 래퍼일 뿐).

## stats 파일 포맷 (파서 계약)

```
snapshot_time             1783379877.321620943 secs.nsecs
read_bytes                50 samples [bytes] 1048576 1048576 52428800
write                     13 samples [usecs] 3124 10285 63814
```

- 통계 줄: `<name> <count> samples [<unit>] <min> <max> <sum> [<sumsq>]` — sumsq가 없는 빌드도 있으므로 **뒤에서 세지 말고 앞 인덱스 기준** 파싱
- I/O가 없던 타겟은 `read_bytes` 줄 자체가 없음 → 0 처리
- `read`/`write` `[usecs]` 줄 = 지연 누적(sum/count로 평균)

## rate 계산은 소비자 몫

값이 전부 **부팅 이후 누적 카운터**라서 IOPS/MB/s는 두 샘플의 delta로 계산해야 한다. 서버를 무상태로 유지하려면:

- 수집기: 누적값 + `snapshot_time` 그대로 반환
- 소비자(대시보드): 직전 폴 대비 `Δcount/Δt`, `Δsum_bytes/Δt` — 브라우저 5초 폴링이면 충분
- 음수 delta = 카운터 리셋(서비스 재시작) → 그 점은 버리고 기준점 갱신
- 평균 지연 = `Δlat_sum_usecs / Δlat_count / 1000` (ms), 분모 0 방어

## 함정

- 타겟 디렉토리명(`<fs>-OST0000`)의 인덱스는 **16진수**
- MGS+MDT 겸용 노드는 mdt 디렉토리만 보임 — MGS 존재는 `/sys/fs/lustre/mgs/MGS` 디렉토리로 별도 판별
- 클러스터 뷰가 필요하면 각 노드 수집분을 집계 계층에서 팬아웃 병합 (OST active는 MDS의 osp 맵을 조인)

관련: [[lustre-overview]] [[lustre-ost-drain]] [[lustre-node-topology]]

---

## 관련

- [[lustre-overview]]
- [[lustre-single-node-benchmark]]
- [[storage-performance-testing]]

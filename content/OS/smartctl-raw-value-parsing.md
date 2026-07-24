---
title: smartctl RAW_VALUE 파싱 주의
tags:
  - tech
created: 2026-05-26 (화)
---

# smartctl RAW_VALUE 파싱 주의

> **TL;DR**: `smartctl -A` 출력의 RAW_VALUE는 마지막 토큰이 아니라 고정 9번째 컬럼(parts[9])으로 파싱해야 한다.

---

`smartctl -A` 출력의 RAW_VALUE는 **9번째 컬럼(parts[9])**. 뒤에 괄호 부가정보가 붙는 경우 last index 파싱은 실패.

```
ID# ATTRIBUTE_NAME  FLAG  VALUE WORST THRESH TYPE    UPDATED WHEN_FAILED RAW_VALUE
194 Temperature     0x22  038   046   000    Old_age Always  -           38 (0 15 0 0 0)
  9 Power_On_Hours  0x32  080   080   000    Old_age Always  -           18216 (42 215 0)
```

```rust
// 올바른 파싱
let raw_value = parts[9].replace(',', "").parse::<u64>().unwrap_or(0);

// 잘못된 파싱 — "0)" → parse 실패 → 0
let raw_value = parts[parts.len() - 1].parse::<u64>().unwrap_or(0);
```

---

## 관련

- [[smartctl]]

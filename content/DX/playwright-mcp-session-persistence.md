---
title: Playwright MCP Session Persistence
tags:
  - tech
  - dx
created: 2026-06-02 (화)
---

# Playwright MCP Session Persistence

> **TL;DR**: 세션 쿠키 기반 사이트는 `user-data-dir`만으로 로그인 유지가 안 될 수 있으므로 Playwright `storageState`를 캡처해 `--isolated --storage-state`로 재사용한다.

---

## 개요

- **무엇인가**: Playwright MCP나 자동화 브라우저에서 로그인 세션을 다음 실행으로 넘기는 방식.
- **왜 쓰는가**: 매번 수동 로그인하면 QA·업무 자동화 흐름이 끊기고, 에이전트가 같은 상태에서 작업을 이어가기 어렵다.
- **언제 쓰는가**: 인증 쿠키가 persistent cookie가 아니라 브라우저 프로세스 메모리에만 남는 세션 쿠키일 때.

---

## 핵심 개념

### user-data-dir의 한계

`--user-data-dir`는 브라우저 프로필을 고정하지만, 모든 인증 정보가 디스크 쿠키 DB에 영구 저장된다는 뜻은 아니다. 사이트가 httpOnly 세션 쿠키를 사용하고 persistent 만료 정보를 디스크에 남기지 않으면 새 브라우저 프로세스에서 로그인 상태가 사라질 수 있다.

확인할 때는 쿠키 값이 아니라 메타데이터만 본다.

```bash
sqlite3 ~/.pw-profiles/example/Default/Cookies \
  "select name,is_persistent,has_expires from cookies where host_key like '%example%'"
```

### storageState 재주입

Playwright의 `storageState`는 현재 컨텍스트의 쿠키와 localStorage 상태를 JSON으로 저장한다. 세션 쿠키도 포함할 수 있으므로, 한 번 로그인한 뒤 저장하고 다음 MCP 실행에서 재주입하면 로그인 상태를 이어갈 수 있다.

MCP에서는 isolated context와 함께 쓰는 구성이 명확하다.

```bash
npx @playwright/mcp@latest \
  --isolated \
  --storage-state=/path/to/auth-state.json
```

---

## 코드 / 사용 예시

```javascript
import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: false });
const context = await browser.newContext();
const page = await context.newPage();

await page.goto('https://example.com/login');
// 여기서 수동 로그인
await page.waitForURL('**/dashboard');

await context.storageState({ path: '/secure/path/auth-state.json' });
await browser.close();
```

```bash
chmod 600 /secure/path/auth-state.json
```

---

## 주의사항

> [!WARNING]
> `storageState` 파일에는 쿠키가 들어간다. 토큰 값, 쿠키 값, 사내 도메인별 민감 정보를 공개 노트나 커밋에 남기지 않는다.

- 세션 만료는 사이트 정책을 따른다. refresh cookie가 만료되면 다시 캡처해야 한다.
- MCP 설정에 상태 파일 경로를 넣을 때는 실제 토큰 값이 아니라 경로만 기록한다.
- persistent profile과 isolated storageState는 목적이 다르므로 섞어 쓰기 전에 MCP 옵션 적용 방식을 확인한다.

---

## 관련

- [[playwright-e2e]]
- [[agent-skill-sharing-symlink]]

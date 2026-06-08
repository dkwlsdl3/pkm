---
tags:
  - tech
created: 2026-06-08 (월)
---

# GitLab npm Package Registry

> **TL;DR**: GitLab npm package registry는 npmjs를 기본 registry로 두고 사내 scope만 GitLab registry에 매핑해야 공개 의존성 설치와 내부 패키지 인증을 동시에 안정화할 수 있다.

---

## 개요

- **무엇인가**: GitLab project/package registry에 npm package를 publish하고, npm client에서 scope별 registry와 token을 설정해 설치하는 방식.
- **왜 쓰는가**: 회사 내부 CLI나 공용 라이브러리를 npm 패키지처럼 배포하되, 접근 권한은 GitLab 멤버십/토큰으로 관리하기 위해.
- **언제 쓰는가**: 내부 패키지는 private registry에서 받고, 공개 의존성은 npmjs에서 받아야 하는 Node CLI/라이브러리 배포에서.

---

## 핵심 개념

### 전역 registry로 바꾸지 않는다

`--registry`를 GitLab project registry로 바꾸면 패키지의 모든 의존성까지 GitLab에서 찾으려 한다. 내부 패키지 scope만 GitLab에 매핑하고 기본 registry는 npmjs로 둔다.

### pull 공개 옵션은 프로젝트 visibility와 별개다

프로젝트가 private이어도 package registry의 익명 pull 옵션이 켜져 있으면 package manager API로 패키지를 받을 수 있다. 내부용이면 이 옵션을 끄고 token 기반 접근을 확인한다.

### publish token과 install token을 분리한다

배포 머신이나 개발자 Mac에는 최소 권한의 read token을 두고, publish는 write 권한이 있는 별도 token으로 제한한다.

---

## 코드 / 사용 예시

```bash
# 프로젝트 로컬 또는 사용자 npmrc에 scope registry 지정
npm config set @my-scope:registry https://gitlab.example.com/api/v4/projects/<project-id>/packages/npm/

# token은 secret에서 읽어 설정한다. 값을 쉘 기록이나 문서에 남기지 않는다.
npm config set //gitlab.example.com/api/v4/projects/<project-id>/packages/npm/:_authToken \"$NPM_READ_TOKEN\"
```

```bash
# 설치 시 기본 registry는 npmjs, 내부 scope만 GitLab로 둔다.
npm install -g @my-scope/my-cli \
  --registry=https://registry.npmjs.org/ \
  --@my-scope:registry=https://gitlab.example.com/api/v4/projects/<project-id>/packages/npm/
```

```bash
# 익명 pull 차단 확인: 빈 HOME/userconfig/globalconfig/cache로 조회했을 때 401/403/404 계열이어야 한다.
HOME=/tmp/npm-empty-home \
npm --userconfig=/tmp/npm-empty-userconfig \
    --globalconfig=/tmp/npm-empty-globalconfig \
    view @my-scope/my-cli version \
    --registry=https://gitlab.example.com/api/v4/projects/<project-id>/packages/npm/ \
    --prefer-online
```

---

## 주의사항

> [!WARNING]
> 내부 registry URL, project id, token 값은 공개 노트에 그대로 남기지 않는다. 예시는 placeholder로 두고 실제 값은 secret 파일이나 CI variable에서 관리한다.

- npm cache 때문에 권한 변경 직후에도 이전 결과를 보는 듯 보일 수 있으므로 빈 HOME/cache로 검증한다.
- Mac 원격 검증 시 로그인 shell과 비로그인 shell의 PATH가 달라 `npm`을 못 찾을 수 있다.
- package `bin` 경로는 npm publish 전에 canonical path로 정리해 publish 시 metadata가 바뀌지 않게 한다.

---

## 관련

- [[gitlab-cicd]]
- [[pnpm]]
- [[dx-overview]]

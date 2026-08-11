import { PageLayout, SharedLayout } from "./quartz/cfg"
import * as Component from "./quartz/components"

// components shared across all pages
export const sharedPageComponents: SharedLayout = {
  head: Component.Head(),
  // 좌상단 고정 툴바. 사이드바 밖이라 접어도 쓸 수 있고,
  // header 는 본문보다 앞이라 Tab·스크린리더 순서도 자연스럽다.
  header: [
    Component.Flex({
      gap: "0.4rem",
      components: [
        { Component: Component.SidebarToggle() },
        { Component: Component.Search() },
        { Component: Component.Darkmode() },
      ],
    }),
  ],
  afterBody: [
    // all-notes 페이지에서만 전체 노트를 날짜 내림차순으로 나열한다
    Component.ConditionalRender({
      component: Component.RecentNotes({
        limit: Number.MAX_SAFE_INTEGER,
        title: "전체 노트 (날짜순)",
        showTags: true,
        filter: (f) => {
          const slug = f.slug ?? ""
          return slug !== "all-notes" && slug !== "index" && !slug.endsWith("/index")
        },
      }),
      condition: (page) => page.fileData.slug === "all-notes",
    }),
    // 아래는 모두 사이드바 '밖'에 있어야 한다.
    // 사이드바를 접으면 display:none 이 되어 그 안의 요소는 전부 죽는다
    // (모달이 안 열리고, 토글 버튼이 사라지고, 검색·다크모드도 못 쓴다).
    // 그래프 모달 DOM. 사이드바가 접히면(display:none) 모달까지 죽으므로 밖에 둔다.
    // 모달을 여는 버튼은 header 툴바(SidebarToggle)에 있다.
    Component.Graph(),
  ],
  footer: Component.SiteFooter(),
}

// components for pages that display a single page (e.g. a single note)
export const defaultContentPageLayout: PageLayout = {
  beforeBody: [
    Component.ConditionalRender({
      component: Component.Breadcrumbs(),
      condition: (page) => page.fileData.slug !== "index",
    }),
    Component.ArticleTitle(),
    // 읽기 시간(“5 min read”)은 끈다. 개인 지식 노트에서 큰 의미가 없고,
    // Quartz 는 세그먼트 사이 구분자를 `.content-meta[show-comma="true"]` CSS 로
    // 넣는데 서버 렌더링에서 그 boolean 속성이 HTML 로 나오지 않아
    // 날짜와 붙어 "2026.08.045 min read" 처럼 보였다. 날짜만 남기면 사라진다.
    Component.ContentMeta({ showReadingTime: false }),
    Component.TagList(),
  ],
  left: [
    Component.PageTitle(),
    Component.MobileOnly(Component.Spacer()),
    Component.NavShortcuts(),
    Component.Explorer({
      // all-notes 는 위 "일자별 노트" 바로가기와 같은 페이지라 목록에서 뺀다
      filterFn: (node) => node.slugSegment !== "tags" && node.slugSegment !== "all-notes",
    }),
  ],
  // 우측 사이드바를 없애고 본문 폭을 넓힌다.
  right: [],
}

// components for pages that display lists of pages  (e.g. tags or folders)
export const defaultListPageLayout: PageLayout = {
  beforeBody: [
    Component.Breadcrumbs(),
    Component.ArticleTitle(),
    Component.ContentMeta({ showReadingTime: false }),
  ],
  left: [
    Component.PageTitle(),
    Component.MobileOnly(Component.Spacer()),
    Component.NavShortcuts(),
    Component.Explorer({
      // all-notes 는 위 "일자별 노트" 바로가기와 같은 페이지라 목록에서 뺀다
      filterFn: (node) => node.slugSegment !== "tags" && node.slugSegment !== "all-notes",
    }),
  ],
  right: [],
}

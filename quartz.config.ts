import { QuartzConfig } from "./quartz/cfg"
import * as Plugin from "./quartz/plugins"

/**
 * Quartz 4 Configuration
 *
 * See https://quartz.jzhao.xyz/configuration for more information.
 */
const config: QuartzConfig = {
  configuration: {
    pageTitle: "kth's PKM",
    pageTitleSuffix: " | kth",
    enableSPA: true,
    enablePopovers: true,
    analytics: {
      provider: "plausible",
    },
    locale: "ko-KR",
    baseUrl: "dkwlsdl3.github.io/pkm",
    ignorePatterns: ["private", "templates", ".obsidian"],
    defaultDateType: "modified",
    theme: {
      // 화면 표시 폰트는 Pretendard(jsDelivr)로, Head.tsx에서 직접 링크하고
      // custom.scss에서 --headerFont/--bodyFont 를 덮어쓴다.
      // 여기 typography 는 OG 소셜 이미지(satori)가 Google Fonts API로 받아 쓰는
      // 폰트라서 Google에 실제로 있는 이름이어야 한다 — Pretendard는 없다.
      // Noto Sans KR 로 두면 소셜 카드의 한글도 깨지지 않는다.
      fontOrigin: "local",
      cdnCaching: true,
      typography: {
        header: "Noto Sans KR",
        body: "Noto Sans KR",
        code: "JetBrains Mono",
      },
      // design.md §5.2 — 뉴트럴 그레이 + 블루 액센트.
      // 라이트/다크 모두 본문·제목·링크·메타가 WCAG AA(4.5:1)를 넘는다.
      colors: {
        lightMode: {
          light: "#f7f8fa", // 순백(#fff)은 오래 읽으면 눈이 부시다 — 한 단계 낮춤
          lightgray: "#e4e7ec",
          gray: "#6b7280", // 메타. 4.55:1
          darkgray: "#4b5563", // 본문. 7.11:1
          dark: "#111827", // 제목. 16.69:1
          secondary: "#2456c9", // 링크. 채도를 한 단계 낮춰 자극을 줄임. 6.08:1
          tertiary: "#5b87e0",
          highlight: "rgba(36, 86, 201, 0.07)",
          textHighlight: "#fde68a88",
        },
        darkMode: {
          light: "#1e2128", // 기존 #0f1115 는 너무 어두워 대비가 과했다
          lightgray: "#2e323b",
          gray: "#8b929e", // 5.1:1
          darkgray: "#c8cdd6", // 본문. 10.1:1
          dark: "#e9ecf1", // 제목. 13.6:1
          secondary: "#7aa2f7", // 링크. 6.4:1
          tertiary: "#93b4ff",
          highlight: "rgba(122, 162, 247, 0.12)",
          textHighlight: "#b3aa0288",
        },
      },
    },
  },
  plugins: {
    transformers: [
      Plugin.FrontMatter(),
      Plugin.CreatedModifiedDate({
        priority: ["frontmatter", "git", "filesystem"],
      }),
      Plugin.SyntaxHighlighting({
        theme: {
          light: "github-light",
          dark: "github-dark",
        },
        keepBackground: false,
      }),
      Plugin.ObsidianFlavoredMarkdown({ enableInHtmlEmbed: false }),
      Plugin.GitHubFlavoredMarkdown(),
      Plugin.TableOfContents(),
      Plugin.CrawlLinks({ markdownLinkResolution: "shortest" }),
      Plugin.Description(),
      Plugin.Latex({ renderEngine: "katex" }),
    ],
    filters: [Plugin.RemoveDrafts()],
    emitters: [
      Plugin.AliasRedirects(),
      Plugin.ComponentResources(),
      Plugin.ContentPage(),
      Plugin.FolderPage(),
      Plugin.TagPage(),
      Plugin.ContentIndex({
        enableSiteMap: true,
        enableRSS: true,
      }),
      Plugin.Assets(),
      Plugin.Static(),
      Plugin.Favicon(),
      Plugin.NotFoundPage(),
      // Comment out CustomOgImages to speed up build time
      Plugin.CustomOgImages(),
    ],
  },
}

export default config

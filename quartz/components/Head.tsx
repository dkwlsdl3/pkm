import { i18n } from "../i18n"
import { FullSlug, getFileExtension, joinSegments, pathToRoot, simplifySlug } from "../util/path"
import { CSSResourceToStyleElement, JSResourceToScriptElement } from "../util/resources"
import { googleFontHref, googleFontSubsetHref } from "../util/theme"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { unescapeHTML } from "../util/escape"
import { CustomOgImagesEmitterName } from "../plugins/emitters/ogImage"
export default (() => {
  const Head: QuartzComponent = ({
    cfg,
    fileData,
    externalResources,
    ctx,
  }: QuartzComponentProps) => {
    const titleSuffix = cfg.pageTitleSuffix ?? ""
    const title =
      (fileData.frontmatter?.title ?? i18n(cfg.locale).propertyDefaults.title) + titleSuffix
    const description =
      fileData.frontmatter?.socialDescription ??
      fileData.frontmatter?.description ??
      unescapeHTML(fileData.description?.trim() ?? i18n(cfg.locale).propertyDefaults.description)

    const { css, js, additionalHead } = externalResources

    const url = new URL(`https://${cfg.baseUrl ?? "example.com"}`)
    const path = url.pathname as FullSlug
    const baseDir = fileData.slug === "404" ? path : pathToRoot(fileData.slug!)
    const iconPath = joinSegments(baseDir, "static/icon.png")

    // 이 문서의 대표(canonical) URL.
    //
    // 원시 slug 를 그대로 쓰면 폴더 인덱스가 `/AI/index` 로 기록되고,
    // 같은 문서가 `/AI/x` 와 `/AI/x.html` 두 URL 로 모두 200 을 반환하는데
    // 검색엔진에는 어느 쪽이 대표인지 알려 줄 근거가 없다.
    // simplifySlug 가 `AI/index` → `AI`, `index` → `/` 로 정리해 준다.
    // 루트는 sitemap 이 `…/pkm/` 로 등재하므로 canonical 도 슬래시를 맞춘다.
    // 둘이 다른 URL 을 가리키면 대표 URL 신호가 갈린다.
    const rootUrl = url.toString().endsWith("/") ? url.toString() : `${url.toString()}/`
    const simpleSlug = simplifySlug(fileData.slug!)
    const socialUrl =
      fileData.slug === "404" || simpleSlug === "/"
        ? rootUrl
        : joinSegments(url.toString(), simpleSlug)

    const usesCustomOgImage = ctx.cfg.plugins.emitters.some(
      (e) => e.name === CustomOgImagesEmitterName,
    )
    const ogImageDefaultPath = `https://${cfg.baseUrl}/static/og-image.png`

    return (
      <head>
        <title>{title}</title>
        <meta charSet="utf-8" />
        {cfg.theme.cdnCaching && cfg.theme.fontOrigin === "googleFonts" && (
          <>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" />
            <link rel="stylesheet" href={googleFontHref(cfg.theme)} />
            {cfg.theme.typography.title && (
              <link rel="stylesheet" href={googleFontSubsetHref(cfg.theme, cfg.pageTitle)} />
            )}
          </>
        )}
        {/* 사이드바 접힘 상태를 DOM 파싱 전에 복원한다.
            JS(afterDOMLoaded)에서 붙이면 펼쳐진 사이드바가 잠깐 보였다 사라진다(FOUC). */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem("sidebar-collapsed")==="true"){document.documentElement.classList.add("sidebar-collapsed")}}catch(e){}`,
          }}
        />
        {/* 한글 본문 폰트. Google Fonts에 없어 jsDelivr에서 직접 받는다.
            Pretendard는 동적 서브셋이라 페이지에 실제 쓰인 글자만 내려받는다.
            CSS @import 는 @use 뒤에 올 수 없어 SCSS 대신 여기서 링크한다. */}
        {/* data-persist 를 붙여 SPA 이동에도 살려 둔다.
            spa.inline.ts 가 페이지를 옮길 때 head 의 :not([data-persist]) 를 모두
            지우고 새 head 를 붙이는데, 폰트 스타일시트가 그때 잠깐 사라지면
            이동마다 글꼴이 시스템 폰트로 튀고 스타일 재계산이 다시 일어난다. */}
        <link
          rel="preconnect"
          href="https://cdn.jsdelivr.net"
          crossOrigin="anonymous"
          data-persist
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css"
          data-persist
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/@fontsource/jetbrains-mono@5/400.css"
          data-persist
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/@fontsource/jetbrains-mono@5/600.css"
          data-persist
        />
        <link rel="preconnect" href="https://cdnjs.cloudflare.com" crossOrigin="anonymous" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />

        <meta name="og:site_name" content={cfg.pageTitle}></meta>
        <meta property="og:title" content={title} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta property="og:description" content={description} />
        <meta property="og:image:alt" content={description} />

        {!usesCustomOgImage && (
          <>
            <meta property="og:image" content={ogImageDefaultPath} />
            <meta property="og:image:url" content={ogImageDefaultPath} />
            <meta name="twitter:image" content={ogImageDefaultPath} />
            <meta
              property="og:image:type"
              content={`image/${getFileExtension(ogImageDefaultPath) ?? "png"}`}
            />
          </>
        )}

        {/* 404 에는 og:url/twitter:url 을 주지 않는다. 홈 URL 을 그대로 쓰면
            noindex 를 준 페이지가 소셜 크롤러에게는 홈페이지라고 주장하는
            셈이 되어 같은 문서의 메타데이터가 서로 다른 정체성을 말한다. */}
        {cfg.baseUrl && (
          <>
            <meta property="twitter:domain" content={cfg.baseUrl}></meta>
            {fileData.slug !== "404" && (
              <>
                <meta property="og:url" content={socialUrl}></meta>
                <meta property="twitter:url" content={socialUrl}></meta>
              </>
            )}
          </>
        )}

        {/* 404 는 색인 대상이 아니다. 실제 없는 경로는 서버가 404 를 주지만
            `/404.html` 자체는 200 으로 열리므로, 그 페이지를 홈페이지의
            복제본처럼 canonical 로 선언하면 신호가 어긋난다. noindex 를 준다. */}
        {fileData.slug === "404" ? (
          <meta name="robots" content="noindex" />
        ) : (
          <link rel="canonical" href={socialUrl} />
        )}
        <link rel="icon" href={iconPath} />
        <meta name="description" content={description} />
        <meta name="generator" content="Quartz" />

        {css.map((resource) => CSSResourceToStyleElement(resource, true))}
        {js
          .filter((resource) => resource.loadTime === "beforeDOMReady")
          .map((res) => JSResourceToScriptElement(res, true))}
        {additionalHead.map((resource) => {
          if (typeof resource === "function") {
            return resource(fileData)
          } else {
            return resource
          }
        })}
      </head>
    )
  }

  return Head
}) satisfies QuartzComponentConstructor

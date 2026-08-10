import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import style from "./styles/siteFooter.scss"

// 기본 Footer 는 "Created with Quartz vX © 년도 / GitHub / Discord" 를 렌더한다.
// 개인 지식 사이트라 도구 크레딧은 걷어내고 내 GitHub 링크만 남긴다.
// Quartz 는 MIT 라이선스라 크레딧 표기 의무가 없고, 저작권 고지는 레포의
// LICENSE.txt 로 유지된다.
export default (() => {
  const SiteFooter: QuartzComponent = ({ displayClass }: QuartzComponentProps) => (
    <footer class={`${displayClass ?? ""} site-footer`}>
      {/* 본문과 같은 폭·같은 선에 맞추기 위한 래퍼 */}
      <div class="footer-inner">
        <a href="https://github.com/dkwlsdl3" target="_blank" rel="noopener noreferrer">
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
            focusable="false"
          >
            <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56v-2c-3.2.7-3.88-1.54-3.88-1.54-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.71 1.26 3.37.96.1-.75.4-1.26.73-1.55-2.56-.29-5.25-1.28-5.25-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.79 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.12 3.05.74.81 1.19 1.84 1.19 3.1 0 4.43-2.7 5.4-5.27 5.69.41.36.78 1.06.78 2.14v3.17c0 .31.21.68.8.56A11.51 11.51 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5Z" />
          </svg>
          <span>github.com/dkwlsdl3</span>
        </a>
      </div>
    </footer>
  )

  SiteFooter.css = style
  return SiteFooter
}) satisfies QuartzComponentConstructor

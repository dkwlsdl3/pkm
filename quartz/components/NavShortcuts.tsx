import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"
import { resolveRelative, FullSlug } from "../util/path"
import style from "./styles/navShortcuts.scss"

// 좌측 사이드바 상단에 두는 바로가기.
// - 일자별 노트: all-notes 페이지(전체 노트 날짜순)
// - 그래프 뷰: Graph 컴포넌트가 렌더한 전역 그래프 모달을 연다.
//   graph.inline.ts 가 `global-graph-icon` 클래스를 가진 요소를 모두 찾아
//   클릭 핸들러를 붙이므로, 이 버튼에 같은 클래스를 주면 그대로 동작한다.
export default (() => {
  const NavShortcuts: QuartzComponent = ({ fileData, displayClass }: QuartzComponentProps) => {
    const allNotesHref = resolveRelative(fileData.slug!, "all-notes" as FullSlug)
    return (
      <nav class={classNames(displayClass, "nav-shortcuts")}>
        <a href={allNotesHref} class="nav-shortcut">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
          </svg>
          <span>일자별 노트</span>
        </a>
        <button type="button" class="nav-shortcut global-graph-icon" aria-label="그래프 뷰 열기">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="12" cy="5" r="2.4" />
            <circle cx="5" cy="18" r="2.4" />
            <circle cx="19" cy="18" r="2.4" />
            <path d="M12 7.4 6.6 15.8M12 7.4l5.4 8.4M7.4 18h9.2" />
          </svg>
          <span>그래프 뷰</span>
        </button>
      </nav>
    )
  }

  NavShortcuts.css = style
  return NavShortcuts
}) satisfies QuartzComponentConstructor

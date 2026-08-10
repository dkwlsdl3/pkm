import { QuartzComponent, QuartzComponentConstructor } from "./types"
// @ts-ignore
import script from "./scripts/sidebarToggle.inline"
import style from "./styles/sidebarToggle.scss"

// 좌상단 고정 툴바에 들어가는 버튼 묶음: 사이드바 여닫기 + 그래프 뷰.
//
// 사이드바 '안'에 두면 접었을 때(display:none) 같이 사라져
// 다시 펼 수도, 그래프를 열 수도 없다. 그래서 사이드바 밖(header)에 둔다.
// 그래프 버튼은 `global-graph-icon` 클래스를 달아 graph.inline.ts 의
// 기존 핸들러가 그대로 잡아가게 한다.
export default (() => {
  const SidebarToggle: QuartzComponent = () => (
    <div class="toolbar-buttons">
      <button
        type="button"
        class="sidebar-toggle toolbar-btn"
        aria-label="사이드바 여닫기"
        aria-expanded="true"
        title="사이드바 닫기"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M9 4v16" />
        </svg>
      </button>
      <button
        type="button"
        class="global-graph-icon toolbar-btn"
        aria-label="그래프 뷰 열기"
        title="그래프 뷰"
      >
        <svg
          width="18"
          height="18"
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
      </button>
    </div>
  )

  SidebarToggle.css = style
  SidebarToggle.afterDOMLoaded = script
  return SidebarToggle
}) satisfies QuartzComponentConstructor

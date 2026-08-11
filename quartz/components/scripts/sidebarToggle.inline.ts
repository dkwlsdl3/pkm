const STORAGE_KEY = "sidebar-collapsed"

// localStorage 가 막힌 환경(프라이빗 모드, 저장소 차단)을 위한 세션 폴백.
//
// 모듈 스코프 변수로는 안 된다. spa.inline.ts 는 페이지를 옮길 때
// `document.head` 를 비우고 새 head 를 붙이면서 스크립트를 재실행하므로
// (해당 코드의 주석: "now, patch head, re-executing scripts")
// 모듈 스코프가 매 이동마다 초기화된다. window 에 얹으면 살아남는다.
const store = window as Window & { __sidebarCollapsed?: boolean }

function readSaved(): boolean {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v !== null) return v === "true"
  } catch {
    // 저장소 접근 자체가 막힌 경우 아래 세션 폴백으로 내려간다
  }
  return store.__sidebarCollapsed ?? false
}

function save(collapsed: boolean) {
  // 저장소보다 먼저 세션 상태를 갱신한다.
  // setItem 이 던져도 이번 세션의 SPA 이동에서는 상태가 유지되어야 한다.
  store.__sidebarCollapsed = collapsed
  try {
    localStorage.setItem(STORAGE_KEY, String(collapsed))
  } catch {
    // 세션 폴백으로 충분하다
  }
}

function apply(collapsed: boolean) {
  document.documentElement.classList.toggle("sidebar-collapsed", collapsed)
  for (const btn of document.getElementsByClassName("sidebar-toggle")) {
    btn.setAttribute("aria-expanded", String(!collapsed))
    btn.setAttribute("title", collapsed ? "사이드바 열기" : "사이드바 닫기")
  }
}

// 토글 버튼과 사이드바를 aria-controls 로 연결한다.
// 사이드바에 id 를 붙이는 일이라 renderPage.tsx 를 고쳐도 되지만,
// 업스트림 파일 수정은 병합 충돌 지점만 늘리므로 런타임에 처리한다.
function linkControls() {
  const sidebar = document.querySelector(".sidebar.left")
  if (!sidebar) return
  if (!sidebar.id) sidebar.id = "left-sidebar"

  // 404 처럼 탐색기가 없는 페이지에는 여닫을 대상이 없다. renderPage 는
  // left 가 비어도 사이드바 컨테이너를 항상 출력하므로 버튼만 남는다.
  // CSS 로 숨기면 .toolbar-btn 규칙과 특이성 싸움이 되므로 hidden 속성을 쓴다.
  const hasExplorer = !!document.querySelector(".explorer")
  for (const btn of document.getElementsByClassName("sidebar-toggle")) {
    btn.setAttribute("aria-controls", sidebar.id)
    if (hasExplorer) {
      btn.removeAttribute("hidden")
    } else {
      btn.setAttribute("hidden", "")
    }
  }
}

// 모바일 위 폭에서는 탐색기를 CSS 로 항상 펼쳐 두는데,
// Explorer.tsx 는 aria-expanded 를 false 로 하드코딩하고 explorer.inline.ts 는
// `collapsed` 클래스를 남긴다. 화면은 열려 있고 접근성 트리·클래스는 닫힘이라고
// 말하는 모순을 맞춘다.
//
// 판별 기준은 '모바일 토글 버튼이 보이는지' 다.
// 데스크톱 라벨(button.desktop-explorer)의 display 로 판단하면 안 된다 —
// 그 버튼은 모바일에서도 CSS 로 숨겨지므로, 닫혀 있는 모바일 탐색기를
// 펼쳐진 것으로 오판해 aria-expanded="true" 를 잘못 씌운다.
// 브레이크포인트 숫자를 JS 에 다시 적지 않으려고 CSS 상태를 읽는 방식은
// 유지하되, 모바일에서만 보이는 요소를 기준으로 삼는다.
function isAlwaysOpen(): boolean {
  const mobileToggle = document.querySelector(".explorer button.mobile-explorer")
  if (!mobileToggle) return false
  return getComputedStyle(mobileToggle).display === "none"
}

function syncExplorerAria() {
  const explorer = document.querySelector(".explorer")
  if (!explorer) return // 404 처럼 탐색기가 없는 레이아웃

  const open = isAlwaysOpen()

  // 양방향으로 맞춰야 한다. 데스크톱 쪽만 처리하면 900px→375px 로 좁혔을 때
  // 우리가 펼쳐 둔 목록이 그대로 남아 본문을 덮는다(전체 화면 오버레이).
  // 모바일로 들어가면 Quartz 기본 상태(접힘)로 돌려놓는다.
  explorer.classList.toggle("collapsed", !open)
  for (const el of document.querySelectorAll(".explorer, .explorer-content")) {
    el.setAttribute("aria-expanded", String(open))
  }
}

function setup() {
  // 저장된 상태 복원 (SPA 전환 후에도 유지).
  // 첫 로드의 클래스 자체는 Head.tsx 인라인 스크립트가 이미 붙여 뒀고,
  // 여기서는 aria-expanded 같은 DOM 상태를 실제 값과 맞춘다.
  apply(readSaved())
  linkControls()
  syncExplorerAria()

  // 브레이크포인트를 넘는 리사이즈도 따라간다. nav 에서만 맞추면
  // 800px 로 열었다가 900px 로 넓혔을 때 CSS 는 펼치는데 클래스·ARIA 는
  // 모바일 상태로 남아 시각 상태와 어긋난다.
  //
  // resize 마다 getComputedStyle 을 부르지 않도록 브레이크포인트 전환
  // 시점에만 반응한다. 값은 CSS 가 알려 주는 게 아니어서 여기서만
  // 예외적으로 쓰지만, 판정 자체는 syncExplorerAria 가 CSS 상태로 한다.
  const bp = window.matchMedia("(max-width: 800px)")
  const onChange = () => syncExplorerAria()
  bp.addEventListener("change", onChange)
  window.addCleanup?.(() => bp.removeEventListener("change", onChange))

  for (const btn of document.getElementsByClassName("sidebar-toggle")) {
    const handler = () => {
      const next = !document.documentElement.classList.contains("sidebar-collapsed")
      // 화면부터 바꾸고 저장은 그 다음에 한다.
      // 순서가 반대면 저장이 막힌 환경에서 버튼이 통째로 먹통이 된다.
      apply(next)
      save(next)
    }
    btn.addEventListener("click", handler)
    window.addCleanup?.(() => btn.removeEventListener("click", handler))
  }
}

document.addEventListener("nav", setup)

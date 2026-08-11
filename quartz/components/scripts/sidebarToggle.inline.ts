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
  for (const btn of document.getElementsByClassName("sidebar-toggle")) {
    btn.setAttribute("aria-controls", sidebar.id)
  }
}

// 모바일 위 폭에서는 탐색기를 CSS 로 항상 펼쳐 두는데,
// Explorer.tsx 는 aria-expanded 를 false 로 하드코딩해 둔다.
// 화면은 열려 있고 접근성 트리는 닫힘이라고 말하는 불일치를 맞춘다.
//
// 브레이크포인트 값을 여기 다시 적지 않는다. CSS 가 라벨 버튼을 숨겼는지로
// 판단하면 variables.scss 의 경계가 바뀌어도 따라가고, 이중 관리가 없다.
function syncExplorerAria() {
  const label = document.querySelector(".explorer button.desktop-explorer")
  if (!label || getComputedStyle(label).display !== "none") return
  for (const el of document.querySelectorAll(".explorer, .explorer-content")) {
    el.setAttribute("aria-expanded", "true")
  }
}

function setup() {
  // 저장된 상태 복원 (SPA 전환 후에도 유지).
  // 첫 로드의 클래스 자체는 Head.tsx 인라인 스크립트가 이미 붙여 뒀고,
  // 여기서는 aria-expanded 같은 DOM 상태를 실제 값과 맞춘다.
  apply(readSaved())
  linkControls()
  syncExplorerAria()

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

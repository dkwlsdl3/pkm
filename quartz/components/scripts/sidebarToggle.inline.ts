const STORAGE_KEY = "sidebar-collapsed"

function readSaved(): boolean {
  // 프라이빗 모드·저장소 차단 환경에서 getItem 이 던질 수 있다
  try {
    return localStorage.getItem(STORAGE_KEY) === "true"
  } catch {
    return false
  }
}

function save(collapsed: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, String(collapsed))
  } catch {
    // 저장에 실패해도 이번 세션의 조작은 계속 동작해야 한다
  }
}

function apply(collapsed: boolean) {
  document.documentElement.classList.toggle("sidebar-collapsed", collapsed)
  for (const btn of document.getElementsByClassName("sidebar-toggle")) {
    btn.setAttribute("aria-expanded", String(!collapsed))
    btn.setAttribute("title", collapsed ? "사이드바 열기" : "사이드바 닫기")
  }
}

function setup() {
  // 저장된 상태 복원 (SPA 전환 후에도 유지).
  // 첫 로드의 클래스 자체는 Head.tsx 인라인 스크립트가 이미 붙여 뒀고,
  // 여기서는 aria-expanded 같은 DOM 상태를 실제 값과 맞춘다.
  apply(readSaved())

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

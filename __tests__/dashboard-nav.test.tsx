// @vitest-environment happy-dom
//
// The mobile drawer had no coverage, and that is exactly how Import went
// missing on phones: the topbar hides it with `hidden sm:block` and nothing
// else rendered it, so the feature was unreachable below 640px with no test to
// notice.
import { describe, it, expect, vi } from "vitest"
import { createRoot } from "react-dom/client"
import * as React from "react"
import type { ReactElement } from "react"

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let pathname = "/en/dashboard/resumes"

vi.mock("next-intl", () => ({
  useTranslations: () => (k: string) => k,
  useLocale: () => "en",
}))
vi.mock("next/navigation", () => ({
  usePathname: () => pathname,
  useRouter: () => ({ push: () => {}, refresh: () => {} }),
}))
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) =>
    React.createElement("a", { href }, children),
  // Nav links carry NavPendingOverlay, which reads the in-flight navigation from
  // this hook. Idle is the state this test renders in.
  useLinkStatus: () => ({ pending: false }),
}))
vi.mock("sonner", () => ({
  toast: Object.assign(() => {}, { success: () => {}, error: () => {}, info: () => {}, warning: () => {} }),
}))
vi.mock("@/lib/apiFetch", () => ({ apiFetch: async () => new Response("{}") }))
vi.mock("next-auth/react", () => ({ signOut: async () => {} }))
// The locale switcher calls a Server Action that persists the choice on the account.
// That action reaches auth + db, which drag next-auth's server entrypoint into this
// jsdom run. The nav test only cares that the switch renders and navigates.
vi.mock("@/lib/actions/locale", () => ({ setLocaleCookie: async () => {} }))
vi.mock("@/lib/actions/logout", () => ({ clearSessionToken: async () => {} }))

import DashboardNav from "@/components/dashboard/DashboardNav"

function mount(el: ReactElement): string {
  const host = document.createElement("div")
  document.body.appendChild(host)
  const root = createRoot(host)
  React.act(() => { root.render(el) })
  const html = document.body.innerHTML
  React.act(() => { root.unmount() })
  host.remove()
  return html
}

const USER = { name: "Ana Rivas", email: "ana@example.com" }

describe("DashboardNav — mobile drawer", () => {
  it("offers Import on the resumes page", () => {
    pathname = "/en/dashboard/resumes"
    const html = mount(<DashboardNav user={USER} isPro drawerOpen />)
    expect(html).toContain("section_import")
  })

  /**
   * EL IDIOMA SE FUE DEL MENÚ, A PROPÓSITO.
   *
   * «El idioma está en el menú, sacalo de ahí; quiero que esté visible arriba
   * como en escritorio» (CEO, 2026-08-22).
   *
   * Antes vivía en los dos lados sólo en escritorio: la barra lo escondía por
   * debajo de 640px (`hidden sm:flex`), así que en teléfono la única forma de
   * cambiarlo era abrir el cajón y bajar hasta una sección al final de todo.
   * Ahora la barra lo muestra siempre y el cajón no lo repite — el mismo control
   * en dos sitios deja uno que nadie encuentra.
   *
   * Este test se invirtió: antes exigía que estuviera acá, ahora exige que NO.
   * Importar CV sigue en el cajón y su test sigue arriba, porque ése sí es el
   * único lugar donde vive en teléfono.
   */
  it("ya no lleva el selector de idioma: vive en la barra superior", () => {
    pathname = "/en/dashboard/resumes"
    const html = mount(<DashboardNav user={USER} isPro drawerOpen />)
    expect(html).not.toContain("section_language")
  })

  // Import only makes sense where the topbar shows it — the resumes list.
  it("does not offer Import outside the resumes page", () => {
    pathname = "/en/dashboard/cover-letters"
    const html = mount(<DashboardNav user={USER} isPro drawerOpen />)
    expect(html).not.toContain("section_import")
  })

  it("renders for a non-Pro user without crashing", () => {
    pathname = "/en/dashboard/resumes"
    const html = mount(<DashboardNav user={USER} isPro={false} drawerOpen />)
    expect(html).toContain("section_import")
  })
})

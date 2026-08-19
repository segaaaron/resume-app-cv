// @vitest-environment happy-dom
//
// The only test in the suite that mounts React. Everything else runs in node and
// never touches a component, so the sparse-suggestion UI (a bullet's real index
// vs its row position) and the chained tailor panel had no coverage at all.
import { describe, it, expect, vi } from "vitest"
import { renderToString } from "react-dom/server"
import { createRoot } from "react-dom/client"
// Namespace import, not `{ act }`: react is CJS and the named binding stops
// resolving once the panel graph is in play.
import * as React from "react"
import type { ReactElement } from "react"

// React 19 requires this before act() outside a test renderer.
;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

/** Radix Dialog portals, so renderToString yields "". Mount into a real DOM. */
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

vi.mock("next-intl", () => ({
  useTranslations: () => Object.assign((k: string, v?: Record<string, unknown>) => v ? `${k}:${JSON.stringify(v)}` : k, { rich: (k: string) => k }),
  useLocale: () => "en",
}))
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: () => {} }) }))
vi.mock("sonner", () => ({ toast: Object.assign(() => {}, { success: () => {}, error: () => {}, info: () => {}, warning: () => {} }) }))
vi.mock("@/lib/apiFetch", () => ({ apiFetch: async () => new Response("{}") }))
vi.mock("@/hooks/useAICall", () => ({ useAICall: () => ({ preCheck: () => {}, onSuccess: async () => {} }) }))
vi.mock("@/contexts/UpgradeModalContext", () => ({ useUpgradeModal: () => ({ open: () => {} }) }))
vi.mock("@/lib/upgrade-modal-handler", () => ({ handleApiError: async () => false }))
vi.mock("@/stores/resumeStore", () => ({
  useResumeStore: (sel: (s: unknown) => unknown) => sel({
    sectionData: { summary: "s", workExperience: [{ id: "w1", jobTitle: "Dev", employer: "Co", description: "• a\n• b" }], skills: [{ name: "Swift" }] },
    updateSectionData: () => {},
    save: async () => {},
  }),
}))
vi.mock("zustand/react/shallow", () => ({ useShallow: (f: unknown) => f }))
vi.mock("@/components/editor/EditorContext", () => ({ useEditorPro: () => ({ isPro: true, openUpgrade: () => {} }) }))

import ATSScorePanel from "@/components/editor/ATSScorePanel"
import WorkExperienceSection from "@/components/resume/sections/WorkExperience"

describe("UI smoke", () => {
  // ATSScorePanel is the whole chained flow: one job-description textarea and the
  // score. Every other test here mounts a leaf in isolation; this is the only one
  // that proves the composition itself renders — which is exactly where the
  // duplicated apply logic hid.
  it("ATSScorePanel mounts the whole chained flow", () => {
    const html = mount(<ATSScorePanel />)
    expect(html).toContain("placeholder")          // the single JD textarea
    expect((html.match(/<textarea/g) ?? []).length).toBe(1)
    expect(html).toContain("pro_badge")
  })

  it("ATSScorePanel shows no tailor section before there is a score", () => {
    // Tailor's output is part of the report, not a step the user drives: with no
    // result there is nothing of it to show, and there is no §③ header any more.
    const html = mount(<ATSScorePanel />)
    expect(html).not.toContain("cta")
    expect(html).not.toContain("section_rewrites")
  })

  // The bullet AI was removed from this tab: the ATS panel already rewrites
  // bullets and the assistant writes them, so a third entry point was three
  // places to keep in step. What the section still owes is the form itself.
  it("WorkExperience mounts with an expanded job", () => {
    const html = mount(<WorkExperienceSection />)
    expect(html).toContain("work.bullets")
    expect(html).not.toContain("improve_bullet")
  })

  // One box per bullet, parsed out of the single `description` string. The
  // store gives this job "• a\n• b", so two boxes carrying "a" and "b" — with
  // the marker nowhere in the editable text — is the whole contract.
  it("splits the description into one box per bullet, markers stripped", () => {
    const html = mount(<WorkExperienceSection />)
    const boxes = html.match(/<textarea[^>]*>([^<]*)<\/textarea>/g) ?? []
    expect(boxes.length).toBe(2)
    expect(boxes.join(" ")).toContain(">a<")
    expect(boxes.join(" ")).toContain(">b<")
    expect(boxes.join(" ")).not.toContain("•")
    // The count is shown against the cap the rest of the product enforces.
    expect(html).toContain("2/6")
  })
})

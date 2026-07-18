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

import BulletsImprovementModal, { type BulletPair } from "@/components/resume/sections/BulletsImprovementModal"
import TailorCVPanel from "@/components/editor/TailorCVPanel"
import ATSScorePanel from "@/components/editor/ATSScorePanel"
import WorkExperienceSection from "@/components/resume/sections/WorkExperience"

describe("UI smoke", () => {
  it("BulletsImprovementModal renders sparse suggestions (2 of 8)", () => {
    const pairs: BulletPair[] = [
      { index: 3, original: "• Delta work", improved: "• Rebuilt the Delta flow" },
      { index: 6, original: "• Eta work", improved: "• Rewrote the Eta pipeline" },
    ]
    const html = mount(
      <BulletsImprovementModal open onClose={() => {}} jobTitle="iOS Developer"
        pairs={pairs} total={8} onApplyBullet={() => {}} onApplyAll={() => {}} />
    )
    // The bullet's REAL position must be shown, not the row index.
    expect(html).toContain("bullet_label_of")
    expect(html).toContain('"n":4')   // index 3 -> "Bullet 4 of 8"
    expect(html).toContain('"total":8')
    expect(html).toContain("bullets_untouched")
    expect(html).not.toContain("metrics_disclaimer")
  })

  it("BulletsImprovementModal renders a single suggestion without the untouched note", () => {
    const pairs: BulletPair[] = [{ index: 0, original: "• A", improved: "• Better A" }]
    const html = mount(
      <BulletsImprovementModal open onClose={() => {}} jobTitle="Dev"
        pairs={pairs} total={1} onApplyBullet={() => {}} onApplyAll={() => {}} />
    )
    expect(html).toContain("bullet_label_of")
    expect(html).not.toContain("bullets_untouched")
  })

  it("TailorCVPanel renders chained, with no textarea of its own", () => {
    const html = renderToString(<TailorCVPanel jobDescription={"x".repeat(60)} />)
    expect(html).not.toContain("<textarea")
    expect(html).toContain("cta")
  })

  it("TailorCVPanel disables its CTA when the shared job description is too short", () => {
    const html = renderToString(<TailorCVPanel jobDescription="short" />)
    expect(html).toContain("disabled")
  })

  // ATSScorePanel is the whole chained flow: one job-description textarea, the
  // score, and TailorCVPanel nested inside it. Every other test here mounts a
  // leaf in isolation; this is the only one that proves the composition itself
  // renders — which is exactly where the duplicated apply logic hid.
  it("ATSScorePanel mounts the whole chained flow", () => {
    const html = mount(<ATSScorePanel />)
    expect(html).toContain("placeholder")          // the single JD textarea
    expect((html.match(/<textarea/g) ?? []).length).toBe(1)
    expect(html).toContain("pro_badge")
  })

  it("ATSScorePanel does not render the tailor step before there is a score", () => {
    // TailorCVPanel is step 2: it only appears once the ATS result exists.
    const html = mount(<ATSScorePanel />)
    expect(html).not.toContain("cta")
  })

  // The AI card lives inside a non-exported item component, so it only mounts
  // through the whole section.
  it("WorkExperience mounts with an expanded job", () => {
    const html = mount(<WorkExperienceSection />)
    expect(html).toContain("description")
    expect(html).toContain("improve_bullet")   // the AI button the card hangs off
  })
})

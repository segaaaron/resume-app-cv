"use client"

/**
 * Full-size (A4), NON-lazy render of the REAL template with mock persona data.
 * Consumed only by /templates/[id]/thumb-print, which the screenshot service
 * captures to a WebP → cached by /api/thumbnails/[id]. Because it renders the
 * genuine template (same ResumePreview path as the editor), the card thumbnail
 * matches exactly what the user gets on selection — not a hand-drawn *Thumb.
 *
 * Unlike MockTemplatePreview this is NOT lazy and NOT scaled: the capture needs
 * the whole page painted at real A4 width immediately.
 */

import { useState } from "react"
import ResumePreview from "@/components/resume/ResumePreview"
import { createIsolatedResumeStore, ResumeStoreProvider } from "@/stores/resumeStore"
import { MOCK_PROFILES, profileIndexFor } from "@/lib/mock-resume"
import type { TemplateId } from "@/types/resume"

// A4 width at 96dpi (210mm) — ResumePreview renders at this width.
const A4_WIDTH_PX = 794
const A4_HEIGHT_PX = 1123

export default function TemplateThumbPrint({ templateId }: { templateId: string }) {
  const [store] = useState(() => {
    const s = createIsolatedResumeStore()
    const profile = MOCK_PROFILES[profileIndexFor(templateId)]
    s.setState((st) => {
      st.sectionData = profile.sectionData
      st.config = { ...st.config, ...profile.config, templateId: templateId as TemplateId }
    })
    return s
  })

  return (
    <div
      style={{
        width: A4_WIDTH_PX,
        height: A4_HEIGHT_PX,
        overflow: "hidden",
        background: "#fff",
      }}
    >
      <ResumeStoreProvider store={store}>
        <ResumePreview overrideTemplateId={templateId} />
      </ResumeStoreProvider>
    </div>
  )
}

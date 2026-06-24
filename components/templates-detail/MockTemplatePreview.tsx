"use client"

/**
 * Renders the REAL resume template for a given templateId, filled with one of
 * five fictitious mock personas (mixed gender/profession), scaled to fit its
 * parent card. Visitors see the genuine, unique design of each template — and
 * the gallery shows realistic variety, not the same person everywhere.
 *
 * How it works:
 * - Reuses ResumePreview (overrideTemplateId) → the actual template component.
 * - Each persona gets its OWN isolated resume store, provided via context, so
 *   different personas can render side by side without sharing one global state.
 * - Lazy-mounts via IntersectionObserver and scales an A4 render down with CSS,
 *   so a page of 100+ previews stays performant.
 *
 * Must be placed inside a positioned, sized parent (e.g. aspect-[3/4] box).
 */

import { useEffect, useRef, useState } from "react"
import ResumePreview from "@/components/resume/ResumePreview"
import { createIsolatedResumeStore, ResumeStoreProvider } from "@/stores/resumeStore"
import { MOCK_PROFILES, profileIndexFor } from "@/lib/mock-resume"

// A4 width at 96dpi (210mm). ResumePreview renders at this width.
const A4_WIDTH_PX = 794

// One isolated, mock-seeded store per persona — created lazily, reused across
// all cards that share that persona.
type Store = ReturnType<typeof createIsolatedResumeStore>
const personaStores: (Store | null)[] = MOCK_PROFILES.map(() => null)

function getPersonaStore(index: number): Store {
  const existing = personaStores[index]
  if (existing) return existing
  const store = createIsolatedResumeStore()
  const profile = MOCK_PROFILES[index]
  store.setState((s) => {
    s.sectionData = profile.sectionData
    s.config = { ...s.config, ...profile.config }
  })
  personaStores[index] = store
  return store
}

export default function MockTemplatePreview({ templateId }: { templateId: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.26)
  const [visible, setVisible] = useState(false)

  const store = getPersonaStore(profileIndexFor(templateId))

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const measure = () => {
      const w = el.clientWidth
      if (w > 0) setScale(w / A4_WIDTH_PX)
    }
    measure()

    const ro = new ResizeObserver(measure)
    ro.observe(el)

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          io.disconnect()
        }
      },
      { rootMargin: "400px 0px" },
    )
    io.observe(el)

    return () => {
      ro.disconnect()
      io.disconnect()
    }
  }, [])

  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden bg-white" aria-hidden>
      {visible ? (
        <div style={{ width: A4_WIDTH_PX, transform: `scale(${scale})`, transformOrigin: "top left" }}>
          <ResumeStoreProvider store={store}>
            <ResumePreview overrideTemplateId={templateId} />
          </ResumeStoreProvider>
        </div>
      ) : (
        <div className="w-full h-full bg-slate-100 animate-pulse" />
      )}
    </div>
  )
}

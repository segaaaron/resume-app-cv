import { useMemo } from "react"
import { create } from "zustand"
import { immer } from "zustand/middleware/immer"
import { devtools } from "zustand/middleware"
import { toast } from "sonner"
import { apiFetch } from "@/lib/apiFetch"
import { createLogger } from "@/lib/logger"

const logger = createLogger("resumeStore")
import {
  ResumeSection,
  ResumeSections,
  ResumeConfig,
  TemplateId,
  TEMPLATES,
  DEFAULT_SECTIONS,
  ResumeSectionsSchema,
} from "@/types/resume"

/** Parse a free-text date like "04/2023", "2023", "2021 - 2022" → numeric value for sorting */
function parseDateValue(d: string): number {
  if (!d) return 0
  const clean = d.trim().split(/[\s–\-→]+/)[0] // take first part if range
  const parts = clean.split("/")
  if (parts.length === 2) {
    const [month, year] = parts
    return parseInt(year) * 12 + parseInt(month)
  }
  return parseInt(clean) * 12
}

/** Sort work experience and education chronologically (oldest first) */
function sortChronological<T extends { startDate?: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => parseDateValue(a.startDate ?? "") - parseDateValue(b.startDate ?? ""))
}

/**
 * Adapts section columns when switching templates.
 * - single-column template: move all "side" sections to "main"
 * - double-column template: restore DEFAULT_SECTIONS column layout for known sections
 * Photo is never deleted — templates that don't use it simply ignore config.photoUrl.
 */
export function adaptSectionsForTemplate(sections: ResumeSection[], targetId: TemplateId): ResumeSection[] {
  const meta = TEMPLATES.find((t) => t.id === targetId)
  if (!meta) return sections

  if (meta.columns === "single") {
    return sections.map((s) => s.column === "side" ? { ...s, column: "main" as const } : s)
  }

  // double: restore default column assignments
  const defaultColumnMap = new Map(DEFAULT_SECTIONS.map((s) => [s.type, s.column]))
  return sections.map((s) => {
    const defaultCol = defaultColumnMap.get(s.type)
    return defaultCol ? { ...s, column: defaultCol } : s
  })
}

export function applySectionOrder(data: ResumeSections): ResumeSections {
  return {
    ...data,
    workExperience: sortChronological(data.workExperience ?? []),
    education:      sortChronological(data.education ?? []),
  }
}

interface ResumeState {
  resumeId: string | null
  title: string
  sections: ResumeSection[]
  sectionData: ResumeSections
  config: ResumeConfig
  isSaving: boolean
  lastSaved: Date | null
  isDirty: boolean
  lastThumbnailAt: number | null
}

interface ResumeActions {
  init: (resumeId: string, title: string, sections: ResumeSection[], sectionData: ResumeSections, config: ResumeConfig) => void
  reset: () => void
  setTitle: (title: string) => void
  setTemplate: (id: TemplateId) => void
  setTemplateWithAdapt: (id: TemplateId) => void
  setColor: (hex: string) => void
  setFont: (family: string) => void
  setFontSize: (size: number) => void
  setSpacing: (spacing: number) => void
  setPhoto: (url: string | null) => void
  setPhotoPosition: (position: number) => void
  updateSectionData: <K extends keyof ResumeSections>(key: K, value: ResumeSections[K]) => void
  reorderSections: (fromIndex: number, toIndex: number) => void
  toggleSection: (id: string) => void
  togglePageBreak: (id: string) => void
  moveSectionToColumn: (id: string, column: "main" | "side") => void
  save: (opts?: { skipThumbnail?: boolean }) => Promise<void>
  triggerThumbnail: (force?: boolean) => void
}

const defaultConfig: ResumeConfig = {
  templateId: "classic",
  colorScheme: "#2a72d7",
  fontFamily: "Poppins",
  fontSize: 14,
  spacing: 1.0,
  photoUrl: null,
  photoPosition: 15,
  language: "es",
}

const defaultSectionData: ResumeSections = ResumeSectionsSchema.parse({})

/** Hook for templates: returns sectionData sorted chronologically */
export function useTemplateSectionData() {
  const raw = useResumeStore((s) => s.sectionData)
  return useMemo(() => applySectionOrder(raw), [raw])
}

/**
 * Cross-tab dedupe for thumbnail jobs.
 * Lazy singleton BroadcastChannel — multiple tabs editing the same resume
 * sync their `lastThumbnailAt` so only one tab dispatches the server job
 * within the 60s window. Best-effort: race between simultaneous tabs is
 * accepted (the dedupe is not mutual exclusion).
 *
 * Fallback graceful: SSR or browsers without BroadcastChannel → returns null
 * and triggerThumbnail behaves exactly as before.
 */
let thumbChannel: BroadcastChannel | null = null
function getThumbChannel(): BroadcastChannel | null {
  if (typeof window === "undefined") return null
  if (typeof BroadcastChannel === "undefined") return null
  if (!thumbChannel) {
    thumbChannel = new BroadcastChannel("readycv.thumbnail")
    thumbChannel.onmessage = (e: MessageEvent) => {
      const data = (e?.data ?? {}) as { resumeId?: string; ts?: number }
      const { resumeId, ts } = data
      if (!resumeId || typeof ts !== "number") return
      // Only adopt the timestamp if the other tab is editing the same resume.
      try {
        const current = useResumeStore.getState()
        if (current.resumeId !== resumeId) return
        // Take the max — never go backwards.
        const local = current.lastThumbnailAt ?? 0
        if (ts > local) {
          useResumeStore.setState((s) => {
            s.lastThumbnailAt = ts
          })
        }
      } catch {
        // Defensive: never let cross-tab message break the store.
      }
    }
  }
  return thumbChannel
}

export const useResumeStore = create<ResumeState & ResumeActions>()(
  devtools(
    immer((set, get) => ({
      resumeId: null,
      title: "Mi CV",
      sections: DEFAULT_SECTIONS,
      sectionData: defaultSectionData,
      config: defaultConfig,
      isSaving: false,
      lastSaved: null,
      isDirty: false,
      lastThumbnailAt: null,

      init: (resumeId, title, sections, sectionData, config) => {
        set((state) => {
          state.resumeId = resumeId
          state.title = title
          state.sections = sections.length > 0 ? sections : DEFAULT_SECTIONS
          state.sectionData = sectionData
          state.config = config
          state.isDirty = false
        })
      },

      reset: () => {
        set((state) => {
          state.resumeId = null
          state.title = "Mi CV"
          state.sections = DEFAULT_SECTIONS
          state.sectionData = defaultSectionData
          state.config = defaultConfig
          state.isDirty = false
        })
      },

      setTitle: (title) => set((state) => { state.title = title; state.isDirty = true }),
      setTemplate: (id) => set((state) => { state.config.templateId = id; state.isDirty = true }),
      setTemplateWithAdapt: (id) => set((state) => {
        state.sections = adaptSectionsForTemplate(state.sections, id)
        state.config.templateId = id
        state.isDirty = true
      }),
      setColor: (hex) => set((state) => { state.config.colorScheme = hex; state.isDirty = true }),
      setFont: (family) => set((state) => { state.config.fontFamily = family; state.isDirty = true }),
      setFontSize: (size) => set((state) => { state.config.fontSize = size; state.isDirty = true }),
      setSpacing: (spacing) => set((state) => { state.config.spacing = spacing; state.isDirty = true }),
      setPhoto: (url) => set((state) => { state.config.photoUrl = url; state.isDirty = true }),
      setPhotoPosition: (position) => set((state) => { state.config.photoPosition = position; state.isDirty = true }),

      updateSectionData: (key, value) => {
        set((state) => {
          ;(state.sectionData as ResumeSections)[key] = value
          state.isDirty = true
        })
      },

      reorderSections: (fromIndex, toIndex) => {
        set((state) => {
          const sections = [...state.sections]
          const [moved] = sections.splice(fromIndex, 1)
          sections.splice(toIndex, 0, moved)
          state.sections = sections
          state.isDirty = true
        })
      },

      toggleSection: (id) => {
        set((state) => {
          const section = state.sections.find((s) => s.id === id)
          if (section) { section.visible = !section.visible; state.isDirty = true }
        })
      },

      togglePageBreak: (id) => {
        set((state) => {
          const section = state.sections.find((s) => s.id === id)
          if (section) { section.pageBreakBefore = !section.pageBreakBefore; state.isDirty = true }
        })
      },

      moveSectionToColumn: (id, column) => {
        set((state) => {
          const section = state.sections.find((s) => s.id === id)
          if (section) { section.column = column; state.isDirty = true }
        })
      },

      triggerThumbnail: (force = false) => {
        const { resumeId, lastThumbnailAt } = get()
        if (!resumeId) return
        const now = Date.now()
        if (!force && lastThumbnailAt && now - lastThumbnailAt < 60_000) return
        set((state) => { state.lastThumbnailAt = now })
        // Cross-tab dedupe: notify peers so other tabs editing the same
        // resume skip their next 60s window. Best-effort; no-op on SSR or
        // browsers without BroadcastChannel.
        try {
          getThumbChannel()?.postMessage({ resumeId, ts: now })
        } catch {
          // Swallow — broadcast failure must never block the thumbnail job.
        }
        const locale = typeof window !== "undefined"
          ? (["es", "en"].includes(window.location.pathname.split("/")[1]) ? window.location.pathname.split("/")[1] : "es")
          : "es"
        fetch(`/api/resumes/${resumeId}/thumbnail?locale=${locale}`, { method: "POST" })
          .then(async (r) => {
            if (!r.ok) {
              set((state) => { state.lastThumbnailAt = lastThumbnailAt })
              if (r.status === 503) {
                logger.warn("thumbnail.service_unavailable", { status: 503 })
              } else {
                const body = await r.json().catch(() => ({})) as { error?: string }
                if (body.error) toast.error(body.error)
              }
            }
          })
          .catch((err) => { set((state) => { state.lastThumbnailAt = lastThumbnailAt }); logger.warn("thumbnail.network_error", { error: err instanceof Error ? err.message : String(err) }) })
      },

      save: async (opts) => {
        const { resumeId, isSaving: alreadySaving } = get()
        if (!resumeId) return
        if (alreadySaving) return
        const { title, sections, sectionData, config } = get()
        set((state) => { state.isSaving = true })
        try {
          const res = await apiFetch(`/api/resumes/${resumeId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title, sections, sectionData, config }),
          })
          if (!res.ok) {
            await res.json().catch(() => ({}))
            set((state) => {
              state.isSaving = false
              // Resume deleted or forbidden — stop autosave loop
              if (res.status === 404 || res.status === 403) state.isDirty = false
            })
            return
          }
          set((state) => {
            state.isSaving = false
            state.lastSaved = new Date()
            state.isDirty = false
          })
          if (!opts?.skipThumbnail) {
            get().triggerThumbnail()
          }
        } catch {
          set((state) => { state.isSaving = false })
        }
      },
    })),
    // M4: disable devtools serialization overhead in production
    { name: "resume-store", enabled: process.env.NODE_ENV === "development" }
  )
)

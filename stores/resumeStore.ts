import { create } from "zustand"
import { immer } from "zustand/middleware/immer"
import { devtools } from "zustand/middleware"
import {
  ResumeSection,
  ResumeSections,
  ResumeConfig,
  TemplateId,
  DEFAULT_SECTIONS,
  ResumeSectionsSchema,
} from "@/types/resume"

interface ResumeState {
  resumeId: string | null
  title: string
  sections: ResumeSection[]
  sectionData: ResumeSections
  config: ResumeConfig
  isSaving: boolean
  lastSaved: Date | null
  isDirty: boolean
}

interface ResumeActions {
  init: (resumeId: string, title: string, sections: ResumeSection[], sectionData: ResumeSections, config: ResumeConfig) => void
  reset: () => void
  setTitle: (title: string) => void
  setTemplate: (id: TemplateId) => void
  setColor: (hex: string) => void
  setFont: (family: string) => void
  setFontSize: (size: number) => void
  setSpacing: (spacing: number) => void
  setPhoto: (url: string | null) => void
  updateSectionData: <K extends keyof ResumeSections>(key: K, value: ResumeSections[K]) => void
  reorderSections: (fromIndex: number, toIndex: number) => void
  toggleSection: (id: string) => void
  togglePageBreak: (id: string) => void
  moveSectionToColumn: (id: string, column: "main" | "side") => void
  save: () => Promise<void>
}

const defaultConfig: ResumeConfig = {
  templateId: "classic",
  colorScheme: "#2a72d7",
  fontFamily: "Poppins",
  fontSize: 14,
  spacing: 1.0,
  photoUrl: null,
  language: "es",
}

const defaultSectionData: ResumeSections = ResumeSectionsSchema.parse({})

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
      setColor: (hex) => set((state) => { state.config.colorScheme = hex; state.isDirty = true }),
      setFont: (family) => set((state) => { state.config.fontFamily = family; state.isDirty = true }),
      setFontSize: (size) => set((state) => { state.config.fontSize = size; state.isDirty = true }),
      setSpacing: (spacing) => set((state) => { state.config.spacing = spacing; state.isDirty = true }),
      setPhoto: (url) => set((state) => { state.config.photoUrl = url; state.isDirty = true }),

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

      save: async () => {
        const { resumeId, title, sections, sectionData, config } = get()
        if (!resumeId) return
        set((state) => { state.isSaving = true })
        try {
          const res = await fetch(`/api/resumes/${resumeId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title, sections, sectionData, config }),
          })
          if (!res.ok) {
            const err = await res.json().catch(() => ({}))
            console.error("[save] server error:", res.status, err)
            set((state) => { state.isSaving = false })
            return
          }
          set((state) => {
            state.isSaving = false
            state.lastSaved = new Date()
            state.isDirty = false
          })
        } catch (err) {
          console.error("[save] network error:", err)
          set((state) => { state.isSaving = false })
        }
      },
    })),
    { name: "resume-store" }
  )
)

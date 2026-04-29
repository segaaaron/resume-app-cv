"use client"

import { useEffect, useRef } from "react"
import { useResumeStore } from "@/stores/resumeStore"
import type { ResumeSection, ResumeSections, ResumeConfig } from "@/types/resume"
import FormPanel from "./FormPanel"
import PreviewPanel from "./PreviewPanel"
import EditorTopBar from "./EditorTopBar"
import { EditorProvider } from "./EditorContext"
import { isActive, isSuperAdmin } from "@/lib/plans"

interface Props {
  resumeId: string
  title: string
  sections: ResumeSection[]
  sectionData: ResumeSections
  config: ResumeConfig
  plan: string
  subscriptionStatus?: string | null
  subscriptionEndsAt?: string | null
  trialEndsAt?: string | null
  role?: string
  isNew?: boolean
}

const AUTOSAVE_DELAY = 2500 // ms after last change

export default function EditorLayout({ resumeId, title, sections, sectionData, config, plan, subscriptionStatus, subscriptionEndsAt, trialEndsAt, role, isNew = false }: Props) {
  const init = useResumeStore((s) => s.init)
  const isDirty = useResumeStore((s) => s.isDirty)
  const isSaving = useResumeStore((s) => s.isSaving)
  const save = useResumeStore((s) => s.save)

  const propsRef = useRef({ resumeId, title, sections, sectionData, config })
  propsRef.current = { resumeId, title, sections, sectionData, config }

  const isDirtyRef = useRef(isDirty)
  useEffect(() => { isDirtyRef.current = isDirty }, [isDirty])

  useEffect(() => {
    const { resumeId, title, sections, sectionData, config } = propsRef.current
    init(resumeId, title, sections, sectionData, config)
  }, [resumeId, init])


  // Autosave: debounce 2.5s after last change
  useEffect(() => {
    if (!isDirty || isSaving) return
    const timer = setTimeout(() => { save() }, AUTOSAVE_DELAY)
    return () => clearTimeout(timer)
  }, [isDirty, isSaving, save])

  const hasAccess = isSuperAdmin(role) || isActive(
    plan,
    trialEndsAt ? new Date(trialEndsAt) : null,
    subscriptionEndsAt ? new Date(subscriptionEndsAt) : null,
    subscriptionStatus
  )

  return (
    <EditorProvider isPro={hasAccess}>
      <div className="h-screen flex flex-col overflow-hidden bg-background">
        <EditorTopBar hasAccess={hasAccess} />
        <div className="flex flex-1 overflow-hidden">
          <FormPanel />
          <PreviewPanel
            plan={plan}
            subscriptionStatus={subscriptionStatus}
            subscriptionEndsAt={subscriptionEndsAt}
            trialEndsAt={trialEndsAt}
            role={role}
          />
        </div>
      </div>
    </EditorProvider>
  )
}

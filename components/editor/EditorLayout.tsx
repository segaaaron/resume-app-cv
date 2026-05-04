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
  role?: string
  isNew?: boolean
}


export default function EditorLayout({ resumeId, title, sections, sectionData, config, plan, subscriptionStatus, subscriptionEndsAt, role, isNew = false }: Props) {
  const init = useResumeStore((s) => s.init)
  const propsRef = useRef({ resumeId, title, sections, sectionData, config })
  propsRef.current = { resumeId, title, sections, sectionData, config }

  useEffect(() => {
    const { resumeId, title, sections, sectionData, config } = propsRef.current
    init(resumeId, title, sections, sectionData, config)
  }, [resumeId, init])

  const hasAccess = isSuperAdmin(role) || isActive(
    plan,
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
            role={role}
          />
        </div>
      </div>
    </EditorProvider>
  )
}

"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useResumeStore } from "@/stores/resumeStore"
import type { ResumeSection, ResumeSections, ResumeConfig } from "@/types/resume"
import FormPanel from "./FormPanel"
import PreviewPanel from "./PreviewPanel"
import EditorTopBar from "./EditorTopBar"
import { EditorProvider } from "./EditorContext"
import { isActive, isSuperAdmin } from "@/lib/plans"
import { FileText, Eye } from "lucide-react"

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

type MobileView = "form" | "preview"

export default function EditorLayout({ resumeId, title, sections, sectionData, config, plan, subscriptionStatus, subscriptionEndsAt, role, isNew = false }: Props) {
  const init = useResumeStore((s) => s.init)
  const router = useRouter()
  const propsRef = useRef({ resumeId, title, sections, sectionData, config })
  propsRef.current = { resumeId, title, sections, sectionData, config }
  useEffect(() => {
    const { resumeId, title, sections, sectionData, config } = propsRef.current
    init(resumeId, title, sections, sectionData, config)
  }, [resumeId, init])

  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return
    const channel = new BroadcastChannel("billing")
    channel.onmessage = (e) => {
      if (e.data?.type === "BILLING_SYNCED") router.refresh()
    }
    return () => channel.close()
  }, [router])

  const hasAccess = isSuperAdmin(role) || isActive(
    plan,
    subscriptionEndsAt ? new Date(subscriptionEndsAt) : null,
    subscriptionStatus
  )

  const [mobileView, setMobileView] = useState<MobileView>("form")

  const TAB_CLS = (active: boolean) =>
    `flex-1 h-full flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold tracking-[0.05em] uppercase bg-transparent border-t-0 border-l-0 border-r-0 border-b-2 cursor-pointer touch-manipulation transition-[color,border-bottom-color] duration-200 ${
      active ? "text-[#00E5FF] border-b-[#00E5FF]" : "text-[rgba(255,255,255,0.45)] border-b-transparent"
    }`

  return (
    <EditorProvider isPro={hasAccess}>
      <div className="flex flex-col overflow-hidden h-dvh bg-[#FAFCFF] text-[#0F172A]">
        <EditorTopBar hasAccess={hasAccess} />

        {/* Main body */}
        <div className="flex flex-1 overflow-hidden h-[calc(100dvh-64px)]">

          {/* Form panel */}
          <div className={`${mobileView === "form" ? "flex" : "hidden"} md:flex w-full md:w-[380px] shrink-0 flex-col overflow-hidden pb-14 md:pb-0`}>
            <FormPanel
              plan={plan}
              subscriptionStatus={subscriptionStatus}
              subscriptionEndsAt={subscriptionEndsAt}
              role={role}
            />
          </div>

          {/* Preview panel */}
          <div className={`${mobileView === "preview" ? "flex" : "hidden"} md:flex flex-1 flex-col overflow-hidden pb-14 md:pb-0`}>
            <PreviewPanel />
          </div>

        </div>

        {/* Mobile bottom bar */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 flex h-14 bg-[#0B1B3D] border-t border-[rgba(0,229,255,0.15)] shadow-[0_-4px_24px_rgba(11,27,61,0.35)] z-50">
          <button type="button" onClick={() => setMobileView("form")} style={{ WebkitTapHighlightColor: "rgba(0,229,255,0.1)" }} className={TAB_CLS(mobileView === "form")}>
            <FileText className="w-[16px] h-[16px] pointer-events-none" strokeWidth={2} />
            <span className="pointer-events-none">Editar</span>
          </button>
          <button type="button" onClick={() => setMobileView("preview")} style={{ WebkitTapHighlightColor: "rgba(0,229,255,0.1)" }} className={TAB_CLS(mobileView === "preview")}>
            <Eye className="w-[16px] h-[16px] pointer-events-none" strokeWidth={2} />
            <span className="pointer-events-none">Preview</span>
          </button>
        </div>
      </div>
    </EditorProvider>
  )
}

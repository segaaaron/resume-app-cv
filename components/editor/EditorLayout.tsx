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

  const [mobileView, setMobileView] = useState<"form" | "preview">("form")

  return (
    <EditorProvider isPro={hasAccess}>
      {/* Root shell: full dynamic viewport height, navy-tinted off-white bg */}
      <div className="flex flex-col overflow-hidden h-dvh bg-[#FAFCFF] text-[#0F172A]">
        <EditorTopBar hasAccess={hasAccess} />

        {/* Main body — fills remaining height below 64px top bar */}
        <div className="flex flex-1 overflow-hidden h-[calc(100dvh-64px)]">
          {/* Form panel — full width on mobile, fixed 380px on md+ */}
          <div
            className={`${
              mobileView === "preview" ? "hidden" : "flex"
            } md:flex w-full md:w-[380px] shrink-0 flex-col overflow-hidden pb-14 md:pb-0`}
          >
            <FormPanel />
          </div>

          {/* Preview panel — hidden on mobile, flex-1 on md+ */}
          <div
            className={`${
              mobileView === "form" ? "hidden" : "flex"
            } md:flex flex-1 flex-col overflow-hidden pb-14 md:pb-0`}
          >
            <PreviewPanel
              plan={plan}
              subscriptionStatus={subscriptionStatus}
              subscriptionEndsAt={subscriptionEndsAt}
              role={role}
            />
          </div>
        </div>

        {/* Mobile bottom toggle bar — hidden on md+ */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 flex h-14 bg-[#0B1B3D] border-t border-[rgba(0,229,255,0.15)] shadow-[0_-4px_24px_rgba(11,27,61,0.35)] z-50">
          <button
            type="button"
            onClick={() => setMobileView("form")}
            style={{ WebkitTapHighlightColor: "rgba(0,229,255,0.1)" }}
            className={`flex-1 h-full flex items-center justify-center gap-2 text-[13px] font-bold tracking-[0.06em] uppercase bg-transparent border-t-0 border-l-0 border-r-0 border-b-2 cursor-pointer touch-manipulation px-4 transition-[color,border-bottom-color] duration-200 ${
              mobileView === "form"
                ? "text-[#00E5FF] border-b-[#00E5FF]"
                : "text-[rgba(255,255,255,0.45)] border-b-transparent"
            }`}
          >
            <FileText className="w-[18px] h-[18px] pointer-events-none" strokeWidth={2} />
            <span className="pointer-events-none">Editar</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileView("preview")}
            style={{ WebkitTapHighlightColor: "rgba(0,229,255,0.1)" }}
            className={`flex-1 h-full flex items-center justify-center gap-2 text-[13px] font-bold tracking-[0.06em] uppercase bg-transparent border-t-0 border-l-0 border-r-0 border-b-2 cursor-pointer touch-manipulation px-4 transition-[color,border-bottom-color] duration-200 ${
              mobileView === "preview"
                ? "text-[#00E5FF] border-b-[#00E5FF]"
                : "text-[rgba(255,255,255,0.45)] border-b-transparent"
            }`}
          >
            <Eye className="w-[18px] h-[18px] pointer-events-none" strokeWidth={2} />
            <span className="pointer-events-none">Vista previa</span>
          </button>
        </div>
      </div>
    </EditorProvider>
  )
}

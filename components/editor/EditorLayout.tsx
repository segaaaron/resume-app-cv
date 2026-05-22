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
      <div
        className="flex flex-col overflow-hidden"
        style={{
          height: "100dvh",
          background: "#FAFCFF",
          color: "#0F172A",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        <EditorTopBar hasAccess={hasAccess} />

        {/* Main body */}
        <div
          className="flex flex-1 overflow-hidden"
          style={{ height: "calc(100dvh - 64px)" }}
        >
          {/* Form panel — full width on mobile, fixed 380px on md+ */}
          <div
            className={`${
              mobileView === "preview" ? "hidden" : "flex"
            } md:flex w-full md:w-[380px] flex-shrink-0 flex-col overflow-hidden pb-14 md:pb-0`}
          >
            <FormPanel />
          </div>

          {/* Preview panel — full width on mobile, flex-1 on md+ */}
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
        <div
          className="md:hidden fixed bottom-0 left-0 right-0 flex"
          style={{
            height: 56,
            background: "#0B1B3D",
            borderTop: "1px solid rgba(0,229,255,0.15)",
            boxShadow: "0 -4px 24px rgba(11,27,61,0.35)",
            zIndex: 50,
            cursor: "pointer",
          }}
        >
          <button
            type="button"
            onClick={() => setMobileView("form")}
            style={{
              flex: 1,
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: mobileView === "form" ? "#00E5FF" : "rgba(255,255,255,0.45)",
              background: "transparent",
              borderTop: "none",
              borderLeft: "none",
              borderRight: "none",
              borderBottomWidth: 2,
              borderBottomStyle: "solid",
              borderBottomColor: mobileView === "form" ? "#00E5FF" : "transparent",
              cursor: "pointer",
              touchAction: "manipulation",
              WebkitTapHighlightColor: "rgba(0,229,255,0.1)",
              transition: "color 0.2s ease, border-bottom-color 0.2s ease",
              padding: "0 16px",
            }}
          >
            <FileText style={{ width: 18, height: 18, strokeWidth: 2, pointerEvents: "none" }} />
            <span style={{ pointerEvents: "none" }}>Editar</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileView("preview")}
            style={{
              flex: 1,
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: mobileView === "preview" ? "#00E5FF" : "rgba(255,255,255,0.45)",
              background: "transparent",
              borderTop: "none",
              borderLeft: "none",
              borderRight: "none",
              borderBottomWidth: 2,
              borderBottomStyle: "solid",
              borderBottomColor: mobileView === "preview" ? "#00E5FF" : "transparent",
              cursor: "pointer",
              touchAction: "manipulation",
              WebkitTapHighlightColor: "rgba(0,229,255,0.1)",
              transition: "color 0.2s ease, border-bottom-color 0.2s ease",
              padding: "0 16px",
            }}
          >
            <Eye style={{ width: 18, height: 18, strokeWidth: 2, pointerEvents: "none" }} />
            <span style={{ pointerEvents: "none" }}>Vista previa</span>
          </button>
        </div>
      </div>
    </EditorProvider>
  )
}

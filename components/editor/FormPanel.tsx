"use client"

import { useState, type CSSProperties, type ReactNode } from "react"
import { useTranslations } from "next-intl"
import { useResumeStore } from "@/stores/resumeStore"
import SectionBlock, { SectionDropdownProvider } from "./SectionBlock"
import DesignPanel from "./DesignPanel"
import ATSScorePanel from "./ATSScorePanel"
import CVReviewPanel from "./CVReviewPanel"
import AIProGate from "./AIProGate"
import AIProfileFillPanel from "./AIProfileFillPanel"
import { LayoutTemplate, Settings2, Target, MessageSquare } from "lucide-react"

// Tokens (kept for sidebar container)
const BORDER = "#E2E8F0"

type TabKey = "content" | "design" | "ats" | "review"

interface TabDef {
  key: TabKey
  label: string
  icon: ReactNode
}

export default function FormPanel() {
  const t = useTranslations("editor")
  const { sections } = useResumeStore()
  const visibleSections = sections.filter((s) => s.visible)
  const hiddenSections = sections.filter((s) => !s.visible)
  const [activeTab, setActiveTab] = useState<TabKey>("content")

  const tabs: TabDef[] = [
    {
      key: "content",
      label: t("form.content_tab") || "Content",
      icon: <LayoutTemplate className="h-[18px] w-[18px]" strokeWidth={1.8} />,
    },
    {
      key: "design",
      label: t("form.design_tab") || "Design",
      icon: <Settings2 className="h-[18px] w-[18px]" strokeWidth={1.8} />,
    },
    {
      key: "ats",
      label: t("form.ats_tab") || "ATS",
      icon: <Target className="h-[18px] w-[18px]" strokeWidth={1.8} />,
    },
    {
      key: "review",
      label: t("form.review_tab") || "AI Review",
      icon: <MessageSquare className="h-[18px] w-[18px]" strokeWidth={1.8} />,
    },
  ]

  // Sidebar container
  const sidebarStyle: CSSProperties = {
    width: "100%",
    background: "#FFFFFF",
    borderRight: `1px solid ${BORDER}`,
    display: "flex",
    flexDirection: "column",
    flexShrink: 0,
    boxShadow: "2px 0 12px rgba(0,0,0,0.02)",
    height: "100%",
    overflow: "hidden",
  }

  const scrollAreaStyle: CSSProperties = {
    flex: 1,
    overflowY: "auto",
    overflowX: "hidden",
    scrollbarWidth: "thin",
    scrollbarColor: `${BORDER} transparent`,
    minHeight: 0,
  }

  const otherPadStyle: CSSProperties = { padding: "6px 24px 20px" }

  return (
    <aside style={sidebarStyle}>
      {/* Tab bar */}
      <div className="flex border-b border-slate-100 bg-white shrink-0 relative" role="tablist">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.key)}
              className={`relative flex-1 flex flex-col items-center justify-center gap-1.5 px-1 py-3.5 text-[9px] font-black tracking-widest uppercase transition-all duration-200 outline-none
                ${isActive
                  ? "text-[#1a2e4a]"
                  : "text-slate-400 hover:text-slate-600"
                }`}
            >
              <span className={`relative z-10 transition-colors duration-200 ${isActive ? "text-[#00D4FF]" : ""}`}>
                {tab.icon}
              </span>
              <span className="relative z-10">{tab.label}</span>
              {isActive && (
                <>
                  <span className="absolute inset-x-1 bottom-0 top-0 rounded-t-xl bg-gradient-to-b from-cyan-50/60 to-transparent" />
                  <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-gradient-to-r from-[#00D4FF] to-blue-400 z-10" />
                </>
              )}
            </button>
          )
        })}
      </div>

      {/* Scrollable content */}
      <div style={scrollAreaStyle}>
        {activeTab === "content" && (
          <div className="px-5 pt-4 pb-6">
            <SectionDropdownProvider>
              <div>
                {visibleSections.map((section) => (
                  <SectionBlock key={section.id} section={section} />
                ))}
              </div>

              {hiddenSections.length > 0 && (
                <div className="mt-6">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent" />
                    <span className="text-[9px] font-black tracking-widest uppercase text-slate-400 px-2">
                      {t("form.hidden_sections")}
                    </span>
                    <div className="h-px flex-1 bg-gradient-to-l from-slate-200 to-transparent" />
                  </div>
                  <div>
                    {hiddenSections.map((section) => (
                      <SectionBlock key={section.id} section={section} />
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-5 rounded-2xl border border-dashed border-violet-200 bg-violet-50/40 overflow-hidden">
                <AIProGate>
                  <AIProfileFillPanel />
                </AIProGate>
              </div>
            </SectionDropdownProvider>
          </div>
        )}

        {activeTab === "design" && (
          <div style={otherPadStyle}>
            <DesignPanel />
          </div>
        )}

        {activeTab === "ats" && (
          <div style={otherPadStyle}>
            <AIProGate>
              <ATSScorePanel />
            </AIProGate>
          </div>
        )}

        {activeTab === "review" && (
          <div style={otherPadStyle}>
            <AIProGate>
              <CVReviewPanel />
            </AIProGate>
          </div>
        )}
      </div>
    </aside>
  )
}

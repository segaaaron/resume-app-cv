"use client"

import { useState, useEffect, type CSSProperties, type ReactNode } from "react"
import { useTranslations } from "next-intl"
import { useResumeStore } from "@/stores/resumeStore"
import { useShallow } from "zustand/react/shallow"
import SectionBlock, { SectionDropdownProvider } from "./SectionBlock"
import DesignPanel from "./DesignPanel"
import Ats3Panel from "./ats3/Ats3Panel"
import AIProGate from "./AIProGate"
import AIProfileFillPanel from "./AIProfileFillPanel"
import CVCompletenessWidget from "./CVCompletenessWidget"
import CVLanguageNotice from "./CVLanguageNotice"
import EmploymentGapAdvisory from "./EmploymentGapAdvisory"
import ProvenSkillsCard from "./ProvenSkillsCard"
import TemplateSwitcher from "./template-switcher"
import { LayoutTemplate, Settings2, Target, Sparkles, Layers } from "lucide-react"

// Tokens (kept for sidebar container)
const BORDER = "#E2E8F0"

// "review" (the standalone AI-Review tab) was folded into the ATS panel: its CV
// health score, Q&A and strength/improvement cards all render there now, so there
// is ONE place that judges the CV instead of two overlapping ones.
type TabKey = "content" | "design" | "ats" | "ai" | "planillas"

interface TabDef {
  key: TabKey
  label: string
  icon: ReactNode
}

interface Props {
  plan?: string
  subscriptionStatus?: string | null
  subscriptionEndsAt?: string | null
  role?: string
  onAfterTemplateSwitch?: () => void
}

export default function FormPanel({ plan = "", subscriptionStatus, subscriptionEndsAt, role, onAfterTemplateSwitch }: Props) {
  const t = useTranslations("editor")
  const { sections } = useResumeStore(
    useShallow((s) => ({ sections: s.sections }))
  )
  const visibleSections = sections.filter((s) => s.visible)
  const hiddenSections = sections.filter((s) => !s.visible)
  const [activeTab, setActiveTab] = useState<TabKey>("content")

  // Allow other editor panels (e.g. the ATS "change template" nudge) to switch tabs.
  useEffect(() => {
    const VALID: TabKey[] = ["content", "design", "ats", "ai", "planillas"]
    const onSwitch = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (typeof detail === "string" && (VALID as string[]).includes(detail)) {
        setActiveTab(detail as TabKey)
      }
    }
    window.addEventListener("editor-switch-tab", onSwitch)
    return () => window.removeEventListener("editor-switch-tab", onSwitch)
  }, [])

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
      key: "ai",
      label: t("form.ai_tab") || "AI Fill",
      icon: <Sparkles className="h-[18px] w-[18px]" strokeWidth={1.8} />,
    },
    {
      key: "planillas",
      label: t("form.templates_tab") || "Templates",
      icon: <Layers className="h-[18px] w-[18px]" strokeWidth={1.8} />,
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
      {/* suppressHydrationWarning: extensiones de navegador (p. ej. Bitdefender)
          inyectan atributos como bis_skin_checked en este div antes de la
          hidratación, provocando un falso mismatch. El contenido es estático. */}
      <div className="flex border-b border-slate-100 bg-white shrink-0 relative" role="tablist" suppressHydrationWarning>
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

      {/* Planillas tab — full height, no scroll wrapper */}
      {activeTab === "planillas" && (
        <div className="flex-1 min-h-0 overflow-hidden">
          <TemplateSwitcher
            plan={plan}
            subscriptionStatus={subscriptionStatus}
            subscriptionEndsAt={subscriptionEndsAt}
            role={role}
            fullscreen
            onAfterSwitch={onAfterTemplateSwitch}
          />
        </div>
      )}

      {/* Scrollable content.
          Every tab below stays MOUNTED and is toggled with display:none instead
          of being conditionally rendered. Unmounting wiped each panel's local
          state on tab switch — the pasted job posting + ATS result, the AI-fill
          suggestions and applied flags all vanished when the user navigated away
          and back. Keep-alive preserves them. Safe: none of these panels fetches
          on mount (DesignPanel/AIProfileFill only call APIs from user actions),
          and the gated ones don't mount their children for non-Pro users. */}
      <div style={{ ...scrollAreaStyle, display: activeTab === "planillas" ? "none" : undefined }}>
        <div className="px-5 pt-4 pb-6" style={{ display: activeTab === "content" ? undefined : "none" }}>
            <CVLanguageNotice />
            <CVCompletenessWidget />
            <EmploymentGapAdvisory />
            <ProvenSkillsCard />
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

            </SectionDropdownProvider>
        </div>

        <div style={{ ...otherPadStyle, display: activeTab === "design" ? undefined : "none" }}>
          <DesignPanel />
        </div>

        <div style={{ ...otherPadStyle, display: activeTab === "ats" ? undefined : "none" }}>
          <AIProGate feature="ATS Checker" endpoint="ats-score">
            <Ats3Panel />
          </AIProGate>
        </div>

        <div style={{ ...otherPadStyle, display: activeTab === "ai" ? undefined : "none" }}>
          <AIProGate feature="AI Profile Fill" endpoint="fill-profile">
            <AIProfileFillPanel inTab />
          </AIProGate>
        </div>
      </div>
    </aside>
  )
}

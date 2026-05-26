"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { TEMPLATES } from "@/types/resume"
import { cn } from "@/lib/utils"
import TemplateSwitchModal from "@/components/editor/TemplateSwitchModal"
import UpgradeModal from "@/components/editor/UpgradeModal"
import { TemplateCard } from "./TemplateCard"
import { useTemplateSwitcher } from "./hooks/useTemplateSwitcher"

const proTemplates = TEMPLATES.filter((t) =>
  ["aurora", "lumiere", "consul", "rose", "minimal", "wave", "banner", "vertex",
    "prestige", "kyoto", "geneva", "windsor", "vienna", "berlin", "seoul",
    "copenhagen", "genevanoir", "reykjavik", "apex", "nova", "cascade", "onyx",
    "mosaic", "larsson", "thompson", "classicmono", "editorialserif", "boldblock",
    "timelinevertical", "swissgrid", "charcoalclassic", "navyexecutive",
    "coralsidebar", "neobrutalist", "sagebotanical", "terminalcv", "iosappcv",
    "datadriven", "boardingpass", "magazinespread", "legalbrief", "engraved",
    "chalkboard", "academiccv", "psychologist", "chefmenu", "sommelier", "hotelcv",
    "bartendercv", "postcardcv", "frontpage", "vinylcv", "callsheet", "copywritermag",
    "animatorcv", "codeeditor", "civileng", "mechanical", "devopsterminal",
    "processflow", "pilotlog", "onboardingform", "athletecard", "translatorcv",
    "herbariumcv", "risodesigner", "uxtokens", "sketchbookillustrator", "blueprintcv",
    "contactsheet", "annualreport", "financeterminal", "campaignposter", "salespitch",
    "ledgercv", "neon", "medicalchart", "vitalsigns", "vetcv", "fieldjournal",
    "sharp", "bauhaus", "cobalt", "duality", "havana", "helix", "lisbon", "nautical",
    "obsidian", "prism", "tokyo", "vitae",
  ].includes(t.id)
)

const regularTemplates = TEMPLATES.filter(
  (t) => !proTemplates.some((p) => p.id === t.id)
)

interface Props {
  plan: string
  subscriptionStatus?: string | null
  subscriptionEndsAt?: string | null
  role?: string
  fullscreen?: boolean
}

export default function TemplateSwitcher({ plan, subscriptionStatus, subscriptionEndsAt, role, fullscreen = false }: Props) {
  const t = useTranslations("editor")
  const {
    config,
    hasAccess,
    upgradeOpen,
    setUpgradeOpen,
    pendingTemplate,
    handleSelectTemplate,
    confirmSwitch,
    cancelSwitch,
  } = useTemplateSwitcher({ plan, subscriptionStatus, subscriptionEndsAt, role })

  const [activeTab, setActiveTab] = useState<"regular" | "pro">("regular")
  const activeTemplates = activeTab === "regular" ? regularTemplates : proTemplates

  return (
    <>
      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
      <TemplateSwitchModal
        pendingTemplateId={pendingTemplate}
        onConfirm={confirmSwitch}
        onCancel={cancelSwitch}
      />

      {/* Sidebar (desktop) or fullscreen panel (mobile) */}
      <div className={cn(
        "flex flex-col overflow-hidden z-50",
        "bg-[linear-gradient(180deg,#f0f8ff_0%,#e8f4fb_60%,#edf6fb_100%)]",
        fullscreen
          ? "w-full h-full"
          : "hidden md:flex shrink-0 w-[228px] border-l border-dash-cyan/[0.18] shadow-[-4px_0_20px_rgba(0,212,255,0.06)]"
      )}>

        {/* Tabs */}
        <div className="flex shrink-0 border-b border-dash-cyan/[0.15] bg-white/60">
          <button
            type="button"
            onClick={() => setActiveTab("regular")}
            className={cn(
              "flex-1 py-3 text-[11px] font-bold tracking-wide transition-all duration-150 border-b-2",
              activeTab === "regular"
                ? "text-[#1a2e4a] border-[#00D4FF] bg-white/80"
                : "text-[#7A9BB5] border-transparent hover:text-[#1a2e4a] hover:bg-white/40"
            )}
          >
            {t("regular_designs_label")}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("pro")}
            className={cn(
              "flex-1 py-3 text-[11px] font-bold tracking-wide transition-all duration-150 border-b-2",
              activeTab === "pro"
                ? "border-[#7C3AED] bg-white/80"
                : "text-[#7A9BB5] border-transparent hover:text-[#7C3AED] hover:bg-white/40"
            )}
            style={activeTab === "pro" ? { background: "linear-gradient(135deg,#7C3AED,#6D28D9)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" } : {}}
          >
            Pro Designs
          </button>
        </div>

        {/* Count */}
        <div className="px-3 py-2 shrink-0">
          <span className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#7A9BB5]">
            {activeTemplates.length} {t("regular_designs_label2") ?? "Templates"}
          </span>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto scrollbar-hide px-2 pb-4">
          <div className="grid grid-cols-2 gap-3">
            {activeTemplates.map((tmpl) => (
              <TemplateCard
                key={tmpl.id}
                template={tmpl}
                locked={activeTab === "pro" && !hasAccess}
                isSelected={tmpl.id === config.templateId}
                colorScheme={config.colorScheme}
                onSelect={handleSelectTemplate}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

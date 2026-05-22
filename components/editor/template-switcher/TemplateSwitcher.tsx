"use client"

import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"
import { TEMPLATES } from "@/types/resume"
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
}

export default function TemplateSwitcher({
  plan,
  subscriptionStatus,
  subscriptionEndsAt,
  role,
}: Props) {
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

  // Responsive: detect mobile (<=768px) for compact strip
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    if (typeof window === "undefined") return
    const mq = window.matchMedia("(max-width: 768px)")
    const apply = () => setIsMobile(mq.matches)
    apply()
    mq.addEventListener("change", apply)
    return () => mq.removeEventListener("change", apply)
  }, [])

  const stripHeight = isMobile ? 220 : 250
  const labelsWidth = isMobile ? 76 : 140
  const labelsGap = isMobile ? 20 : 40

  return (
    <>
      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
      <TemplateSwitchModal
        pendingTemplateId={pendingTemplate}
        onConfirm={confirmSwitch}
        onCancel={cancelSwitch}
      />

      {/* hide horizontal scrollbar inside strip rows */}
      <style>{`
        .templates-strip-row::-webkit-scrollbar { display: none; }
        .templates-strip-row { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div
        className="templates-strip-wrapper"
        style={{
          flexShrink: 0,
          height: stripHeight,
          background: "rgba(255,255,255,0.9)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderTop: "1px solid #E2E8F0",
          display: "flex",
          zIndex: 50,
          boxShadow: "0 -8px 32px rgba(11,27,61,0.06)",
        }}
      >
        {/* Labels column */}
        <div
          style={{
            width: labelsWidth,
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: labelsGap,
            padding: "0 16px",
            borderRight: "1px solid #E2E8F0",
            background: "rgba(244,250,255,0.4)",
          }}
        >
          <span
            style={{
              fontSize: 9,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "#475569",
              textAlign: "center",
              lineHeight: 1.35,
              whiteSpace: "pre-line",
            }}
          >
            {`${t("regular_designs_label")}\n${t("regular_designs_label2")}`}
          </span>
          <span
            style={{
              fontSize: 9,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "#6D28D9",
              textAlign: "center",
              lineHeight: 1.35,
              whiteSpace: "pre-line",
            }}
          >
            {`${t("pro_designs_label")}\n${t("pro_designs_label2")}`}
          </span>
        </div>

        {/* Content area: two rows */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            padding: "20px 0 10px",
            gap: 16,
          }}
        >
          {/* Regular row */}
          <div
            className="templates-strip-row"
            suppressHydrationWarning
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "0 20px",
              overflowX: "auto",
            }}
          >
            {regularTemplates.map((tmpl) => (
              <TemplateCard
                key={tmpl.id}
                template={tmpl}
                locked={false}
                isSelected={tmpl.id === config.templateId}
                colorScheme={config.colorScheme}
                onSelect={handleSelectTemplate}
                compact={isMobile}
              />
            ))}
          </div>

          {/* Pro row */}
          <div
            className="templates-strip-row"
            suppressHydrationWarning
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "0 20px",
              overflowX: "auto",
            }}
          >
            {proTemplates.map((tmpl) => (
              <TemplateCard
                key={tmpl.id}
                template={tmpl}
                locked={!hasAccess}
                isSelected={tmpl.id === config.templateId}
                colorScheme={config.colorScheme}
                onSelect={handleSelectTemplate}
                compact={isMobile}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

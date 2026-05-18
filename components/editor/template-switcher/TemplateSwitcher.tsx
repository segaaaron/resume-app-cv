"use client"

import { useTranslations } from "next-intl"
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

  return (
    <>
      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
      <TemplateSwitchModal
        pendingTemplateId={pendingTemplate}
        onConfirm={confirmSwitch}
        onCancel={cancelSwitch}
      />
      <div className="shrink-0 bg-card/95 backdrop-blur border-t border-border px-4 py-3">
        <div className="flex flex-col gap-3">

          {/* Regular designs */}
          <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide">
            <div className="shrink-0 flex flex-col items-center gap-0.5">
              <span className="text-[8px] font-extrabold uppercase tracking-widest text-muted-foreground whitespace-nowrap">
                {t("regular_designs_label")}
              </span>
              <span className="text-[8px] font-extrabold uppercase tracking-widest text-muted-foreground whitespace-nowrap">
                {t("regular_designs_label2")}
              </span>
            </div>
            <div className="w-px self-stretch bg-border shrink-0" />
            {regularTemplates.map((tmpl) => (
              <TemplateCard
                key={tmpl.id}
                template={tmpl}
                locked={false}
                isSelected={tmpl.id === config.templateId}
                colorScheme={config.colorScheme}
                onSelect={handleSelectTemplate}
              />
            ))}
          </div>

          {/* Pro designs */}
          <div className="flex items-center gap-3 pt-2 border-t border-border overflow-x-auto scrollbar-hide">
            <div className="shrink-0 flex flex-col items-center gap-0.5">
              <span className="text-[8px] font-extrabold uppercase tracking-widest bg-gradient-to-r from-violet-500 to-cyan-500 bg-clip-text text-transparent whitespace-nowrap">
                {t("pro_designs_label")}
              </span>
              <span className="text-[8px] font-extrabold uppercase tracking-widest bg-gradient-to-r from-violet-500 to-cyan-500 bg-clip-text text-transparent whitespace-nowrap">
                {t("pro_designs_label2")}
              </span>
            </div>
            {proTemplates.map((tmpl) => (
              <TemplateCard
                key={tmpl.id}
                template={tmpl}
                locked={!hasAccess}
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

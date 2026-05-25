"use client"

import { useTranslations } from "next-intl"
import { useEffect, useRef, useState, useCallback, type ReactNode } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { TEMPLATES } from "@/types/resume"
import { cn } from "@/lib/utils"
import TemplateSwitchModal from "@/components/editor/TemplateSwitchModal"
import UpgradeModal from "@/components/editor/UpgradeModal"
import { TemplateCard } from "./TemplateCard"
import { useTemplateSwitcher } from "./hooks/useTemplateSwitcher"

const ARROW_CLS = [
  "absolute z-[3] w-9 h-[30px] rounded-[8px]",
  "bg-[linear-gradient(135deg,#1a2e4a_0%,#0f2040_100%)]",
  "backdrop-blur-md",
  "border border-dash-cyan/30",
  "shadow-[0_4px_16px_rgba(0,0,0,0.35),0_0_0_1px_rgba(0,212,255,0.2),0_2px_8px_rgba(0,212,255,0.18)]",
  "cursor-pointer text-dash-cyan",
  "transition-[transform,opacity] duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
  "touch-manipulation",
].join(" ")

function CarouselRow({ children, compact }: { children: ReactNode; compact: boolean }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canLeft, setCanLeft] = useState(false)
  const [canRight, setCanRight] = useState(true)

  const update = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setCanLeft(el.scrollLeft > 6)
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 6)
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    update()
    el.addEventListener("scroll", update, { passive: true })
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => { el.removeEventListener("scroll", update); ro.disconnect() }
  }, [update])

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current
    if (!el) return
    const amount = (compact ? 48 : 60) * 4
    el.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" })
  }

  return (
    <div suppressHydrationWarning className="relative flex-1 flex items-center min-w-0">
      {/* Left fade — desktop only */}
      <div suppressHydrationWarning className={cn(
        "hidden md:block absolute left-0 top-0 bottom-0 w-16 z-[2] pointer-events-none",
        "bg-[linear-gradient(to_right,rgba(240,248,255,0.98)_35%,transparent)]",
        "transition-opacity duration-200",
        canLeft ? "opacity-100" : "opacity-0"
      )} />

      {/* Left arrow — desktop only */}
      <button
        type="button"
        onClick={() => scroll("left")}
        aria-label="Scroll left"
        className={cn(
          "hidden md:flex items-center justify-center",
          ARROW_CLS,
          "left-2",
          canLeft ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-[0.6] pointer-events-none"
        )}
      >
        <ChevronLeft className="w-[15px] h-[15px] pointer-events-none" strokeWidth={2.5} />
      </button>

      {/* Scroll content */}
      <div
        ref={scrollRef}
        suppressHydrationWarning
        className="scrollbar-hide flex-1 flex items-center gap-3 px-5 overflow-x-auto"
      >
        {children}
      </div>

      {/* Right fade — desktop only */}
      <div suppressHydrationWarning className={cn(
        "hidden md:block absolute right-0 top-0 bottom-0 w-16 z-[2] pointer-events-none",
        "bg-[linear-gradient(to_left,rgba(237,246,251,0.98)_35%,transparent)]",
        "transition-opacity duration-200",
        canRight ? "opacity-100" : "opacity-0"
      )} />

      {/* Right arrow — desktop only */}
      <button
        type="button"
        onClick={() => scroll("right")}
        aria-label="Scroll right"
        className={cn(
          "hidden md:flex items-center justify-center",
          ARROW_CLS,
          "right-2",
          canRight ? "opacity-100 scale-100 pointer-events-auto arrow-hint-pulse" : "opacity-0 scale-[0.6] pointer-events-none"
        )}
        onMouseLeave={(e) => { e.currentTarget.style.transform = "" }}
      >
        <ChevronRight className="w-[15px] h-[15px] pointer-events-none" strokeWidth={2.5} />
      </button>
    </div>
  )
}

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

  return (
    <>
      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
      <TemplateSwitchModal
        pendingTemplateId={pendingTemplate}
        onConfirm={confirmSwitch}
        onCancel={cancelSwitch}
      />

      <div
        className={cn(
          "templates-strip-wrapper shrink-0 flex z-50",
          "border-t border-dash-cyan/[0.18]",
          "backdrop-blur-[24px]",
          "bg-[linear-gradient(180deg,#f0f8ff_0%,#e8f4fb_50%,#edf6fb_100%)]",
          "shadow-[0_-4px_24px_rgba(0,212,255,0.08),0_-1px_0_rgba(0,212,255,0.12)]"
        )}
        style={{ height: stripHeight }}
      >
        {/* Labels column */}
        <div
          className={cn(
            "shrink-0 flex flex-col items-center justify-evenly",
            "border-r border-dash-cyan/15",
            "bg-[linear-gradient(180deg,rgba(240,248,255,0.8)_0%,rgba(232,244,251,0.6)_100%)]",
            isMobile ? "w-[76px] gap-5 px-1.5" : "w-[140px] gap-10 px-4"
          )}
        >
          <span className={cn(
            "font-extrabold uppercase text-center leading-[1.35] whitespace-pre-line overflow-hidden break-words text-dash-navy",
            isMobile ? "text-[7.5px] tracking-[0.04em]" : "text-[9px] tracking-[0.1em]"
          )}>
            {`${t("regular_designs_label")}\n${t("regular_designs_label2")}`}
          </span>
          <span className={cn(
            "text-gradient-purple font-extrabold uppercase text-center leading-[1.35] whitespace-pre-line overflow-hidden break-words",
            isMobile ? "text-[7.5px] tracking-[0.04em]" : "text-[9px] tracking-[0.1em]"
          )}>
            {`${t("pro_designs_label")}\n${t("pro_designs_label2")}`}
          </span>
        </div>

        {/* Content: two rows */}
        <div className="flex-1 flex flex-col overflow-hidden pt-5 pb-2.5 gap-4">
          <CarouselRow compact={isMobile}>
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
          </CarouselRow>

          <CarouselRow compact={isMobile}>
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
          </CarouselRow>
        </div>
      </div>
    </>
  )
}

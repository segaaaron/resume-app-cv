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

// ── Arrow shared style ──────────────────────────────────────────────
const ARROW_BASE: React.CSSProperties = {
  position: "absolute",
  zIndex: 3,
  width: 44,
  height: 34,
  borderRadius: 10,
  background: "rgba(239,80,48,0.82)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  borderWidth: 1,
  borderStyle: "solid",
  borderColor: "rgba(255,120,80,0.5)",
  boxShadow: "none",
  cursor: "pointer",
  color: "#FFFFFF",
  transition: "background 0.2s ease, transform 0.2s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s ease, border-color 0.2s ease, color 0.2s ease",
  touchAction: "manipulation",
}

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
    <div suppressHydrationWarning style={{ position: "relative", flex: 1, display: "flex", alignItems: "center", minWidth: 0 }}>
      {/* Left fade — desktop only */}
      <div suppressHydrationWarning className="hidden md:block" style={{
        position: "absolute", left: 0, top: 0, bottom: 0, width: 64, zIndex: 2,
        background: "linear-gradient(to right, rgba(255,255,255,0.98) 35%, transparent)",
        pointerEvents: "none", opacity: canLeft ? 1 : 0, transition: "opacity 0.2s ease",
      }} />

      {/* Left arrow — desktop only */}
      <button
        type="button"
        onClick={() => scroll("left")}
        aria-label="Scroll left"
        className="hidden md:flex items-center justify-center"
        style={{ ...ARROW_BASE, left: 8, opacity: canLeft ? 1 : 0, pointerEvents: canLeft ? "auto" : "none", transform: canLeft ? "scale(1)" : "scale(0.6)" }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(239,80,48,1)"
          e.currentTarget.style.borderColor = "rgba(255,140,100,0.7)"
          e.currentTarget.style.color = "#FFFFFF"
          e.currentTarget.style.boxShadow = "none"
          e.currentTarget.style.transform = "scale(1.06)"
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "rgba(239,80,48,0.82)"
          e.currentTarget.style.borderColor = "rgba(255,120,80,0.5)"
          e.currentTarget.style.color = "#FFFFFF"
          e.currentTarget.style.boxShadow = "none"
          e.currentTarget.style.transform = canLeft ? "scale(1)" : "scale(0.6)"
        }}
      >
        <ChevronLeft style={{ width: 15, height: 15, strokeWidth: 2.5, pointerEvents: "none" }} />
      </button>

      {/* Scroll content */}
      <div
        ref={scrollRef}
        suppressHydrationWarning
        className="templates-strip-row"
        style={{ flex: 1, display: "flex", alignItems: "center", gap: 12, padding: "0 20px", overflowX: "auto" }}
      >
        {children}
      </div>

      {/* Right fade — desktop only */}
      <div suppressHydrationWarning className="hidden md:block" style={{
        position: "absolute", right: 0, top: 0, bottom: 0, width: 64, zIndex: 2,
        background: "linear-gradient(to left, rgba(255,255,255,0.98) 35%, transparent)",
        pointerEvents: "none", opacity: canRight ? 1 : 0, transition: "opacity 0.2s ease",
      }} />

      {/* Right arrow — desktop only */}
      <button
        type="button"
        onClick={() => scroll("right")}
        aria-label="Scroll right"
        className={`hidden md:flex items-center justify-center${canRight ? " arrow-hint-pulse" : ""}`}
        style={{ ...ARROW_BASE, right: 8, opacity: canRight ? 1 : 0, pointerEvents: canRight ? "auto" : "none", transform: canRight ? "scale(1)" : "scale(0.6)" }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(239,80,48,1)"
          e.currentTarget.style.borderColor = "rgba(255,140,100,0.7)"
          e.currentTarget.style.color = "#FFFFFF"
          e.currentTarget.style.boxShadow = "none"
          e.currentTarget.style.transform = "scale(1.06)"
          e.currentTarget.style.animation = "none"
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "rgba(239,80,48,0.82)"
          e.currentTarget.style.borderColor = "rgba(255,120,80,0.5)"
          e.currentTarget.style.color = "#FFFFFF"
          e.currentTarget.style.boxShadow = "none"
          e.currentTarget.style.transform = canRight ? "scale(1)" : "scale(0.6)"
          e.currentTarget.style.animation = ""
        }}
      >
        <ChevronRight style={{ width: 15, height: 15, strokeWidth: 2.5, pointerEvents: "none" }} />
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

        @keyframes arrowPulse {
          0%, 100% { border-color: rgba(255,120,80,0.5); }
          50%       { border-color: rgba(255,160,120,0.9); }
        }
        .arrow-hint-pulse { animation: arrowPulse 2.2s ease-in-out infinite; }
        .arrow-hint-pulse:hover { animation: none !important; }
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
          className={cn(
            "shrink-0 flex flex-col items-center md:justify-center justify-around border-r border-[#E2E8F0] bg-[rgba(244,250,255,0.4)]",
            isMobile ? "w-[76px] gap-5 px-1.5" : "w-[140px] gap-10 px-4"
          )}
        >
          <span
            style={{
              fontSize: isMobile ? 7.5 : 9,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: isMobile ? "0.04em" : "0.1em",
              color: "#475569",
              textAlign: "center",
              lineHeight: 1.35,
              whiteSpace: "pre-line",
              overflow: "hidden",
              wordBreak: "break-word",
            }}
          >
            {`${t("regular_designs_label")}\n${t("regular_designs_label2")}`}
          </span>
          <span
            style={{
              fontSize: isMobile ? 7.5 : 9,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: isMobile ? "0.04em" : "0.1em",
              color: "#6D28D9",
              textAlign: "center",
              lineHeight: 1.35,
              whiteSpace: "pre-line",
              overflow: "hidden",
              wordBreak: "break-word",
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

          {/* Pro row */}
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

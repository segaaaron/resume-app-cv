"use client"

import { useEffect, useRef, useState, useCallback, type ReactNode } from "react"
import { ChevronLeft, ChevronRight, Lock } from "lucide-react"
import { useTranslations } from "next-intl"
import { CoverLetterThumbnail } from "./thumbnails"

type TemplateId =
  | "classic" | "sidebar" | "elegant" | "split" | "executive" | "material"
  | "gradient" | "minimal" | "twotone" | "timeline" | "monogram"
  | "architect" | "diagonal" | "newspaper"
  | "echo" | "lumen"
  | "atlas" | "consul" | "sterling" | "fortis"
  | "prism" | "ember" | "vantage" | "mosaic"
  | "vertex"
  | "folio" | "gazette" | "verso"
  | "aurum" | "onyx" | "velvet"
  | "signal" | "meridian" | "nova" | "obsidian" | "codex" | "axiom" | "terra"
  | "flare" | "herald" | "bloom"

const FREE_TEMPLATES: { id: TemplateId; labelKey: string }[] = [
  { id: "elegant", labelKey: "template_elegant" },
]

// Alphabetical by `id` for consistency with the sidebar grid in CoverLetterEditor.tsx.
const PRO_TEMPLATES: { id: TemplateId; labelKey: string }[] = [
  { id: "architect", labelKey: "template_architect" },
  { id: "atlas",     labelKey: "template_atlas" },
  { id: "aurum",     labelKey: "template_aurum" },
  { id: "axiom",     labelKey: "template_axiom" },
  { id: "bloom",     labelKey: "template_bloom" },
  { id: "codex",     labelKey: "template_codex" },
  { id: "consul",    labelKey: "template_consul" },
  { id: "diagonal",  labelKey: "template_diagonal" },
  { id: "echo",      labelKey: "template_echo" },
  { id: "ember",     labelKey: "template_ember" },
  { id: "executive", labelKey: "template_executive" },
  { id: "flare",     labelKey: "template_flare" },
  { id: "folio",     labelKey: "template_folio" },
  { id: "fortis",    labelKey: "template_fortis" },
  { id: "gazette",   labelKey: "template_gazette" },
  { id: "gradient",  labelKey: "template_gradient" },
  { id: "herald",    labelKey: "template_herald" },
  { id: "lumen",     labelKey: "template_lumen" },
  { id: "material",  labelKey: "template_material" },
  { id: "meridian",  labelKey: "template_meridian" },
  { id: "minimal",   labelKey: "template_minimal" },
  { id: "monogram",  labelKey: "template_monogram" },
  { id: "mosaic",    labelKey: "template_mosaic" },
  { id: "newspaper", labelKey: "template_newspaper" },
  { id: "nova",      labelKey: "template_nova" },
  { id: "obsidian",  labelKey: "template_obsidian" },
  { id: "onyx",      labelKey: "template_onyx" },
  { id: "prism",     labelKey: "template_prism" },
  { id: "sidebar",   labelKey: "template_sidebar" },
  { id: "signal",    labelKey: "template_signal" },
  { id: "split",     labelKey: "template_split" },
  { id: "sterling",  labelKey: "template_sterling" },
  { id: "terra",     labelKey: "template_terra" },
  { id: "timeline",  labelKey: "template_timeline" },
  { id: "twotone",   labelKey: "template_twotone" },
  { id: "vantage",   labelKey: "template_vantage" },
  { id: "velvet",    labelKey: "template_velvet" },
  { id: "verso",     labelKey: "template_verso" },
  { id: "vertex",    labelKey: "template_vertex" },
]

const ARROW_STYLE: React.CSSProperties = {
  position: "absolute",
  zIndex: 3,
  width: 36,
  height: 30,
  borderRadius: 8,
  background: "linear-gradient(135deg, #1a2e4a 0%, #0f2040 100%)",
  border: "1px solid rgba(0,212,255,0.3)",
  boxShadow: "0 4px 16px rgba(0,0,0,0.35), 0 0 0 1px rgba(0,212,255,0.2)",
  cursor: "pointer",
  color: "#00D4FF",
  transition: "transform 0.2s cubic-bezier(0.34,1.56,0.64,1), opacity 0.2s ease",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
}

function CarouselRow({ children }: { children: ReactNode }) {
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
    scrollRef.current?.scrollBy({ left: dir === "left" ? -240 : 240, behavior: "smooth" })
  }

  return (
    <div suppressHydrationWarning style={{ position: "relative", flex: 1, display: "flex", alignItems: "center", minWidth: 0 }}>
      {/* Left fade */}
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 56, zIndex: 2, background: "linear-gradient(to right, rgba(240,248,255,0.98) 35%, transparent)", pointerEvents: "none", opacity: canLeft ? 1 : 0, transition: "opacity 0.2s ease" }} />
      <button type="button" onClick={() => scroll("left")} aria-label="Scroll left" style={{ ...ARROW_STYLE, left: 8, opacity: canLeft ? 1 : 0, pointerEvents: canLeft ? "auto" : "none", transform: canLeft ? "scale(1)" : "scale(0.6)" }}>
        <ChevronLeft style={{ width: 15, height: 15, strokeWidth: 2.5 }} />
      </button>

      <div ref={scrollRef} className="cl-strip-row" style={{ flex: 1, display: "flex", alignItems: "center", gap: 10, padding: "4px 20px", overflowX: "auto" }}>
        {children}
      </div>

      {/* Right fade */}
      <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 56, zIndex: 2, background: "linear-gradient(to left, rgba(237,246,251,0.98) 35%, transparent)", pointerEvents: "none", opacity: canRight ? 1 : 0, transition: "opacity 0.2s ease" }} />
      <button type="button" onClick={() => scroll("right")} aria-label="Scroll right" style={{ ...ARROW_STYLE, right: 8, opacity: canRight ? 1 : 0, pointerEvents: canRight ? "auto" : "none", transform: canRight ? "scale(1)" : "scale(0.6)" }}>
        <ChevronRight style={{ width: 15, height: 15, strokeWidth: 2.5 }} />
      </button>
    </div>
  )
}

interface Props {
  activeTemplate: TemplateId
  isPro: boolean
  colorScheme: string
  onSelect: (id: TemplateId) => void
  onUpgrade: () => void
}

export default function CoverLetterTemplateSwitcher({ activeTemplate, isPro, colorScheme, onSelect, onUpgrade }: Props) {
  const t = useTranslations("cover_letter_editor")

  function TemplateCard({ id, labelKey, locked }: { id: TemplateId; labelKey: string; locked: boolean }) {
    const isSelected = activeTemplate === id
    return (
      <button
        type="button"
        onClick={() => locked ? onUpgrade() : onSelect(id)}
        className="shrink-0 flex flex-col items-center gap-1 group"
      >
        <div
          suppressHydrationWarning
          style={{
            width: 48, height: 64, borderRadius: 8, overflow: "hidden", position: "relative",
            border: isSelected ? "2px solid #00D4FF" : "1.5px solid #E2ECF7",
            boxShadow: isSelected ? "0 0 0 3px rgba(0,212,255,0.2), 0 4px 16px rgba(0,212,255,0.15)" : "none",
            transition: "all 0.18s ease",
            opacity: locked ? 0.55 : 1,
          }}
        >
          <CoverLetterThumbnail id={id} color={locked ? "#9ca3af" : colorScheme} />
          {locked && (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.55)" }}>
              <Lock style={{ width: 12, height: 12, color: "#00D4FF" }} />
            </div>
          )}
        </div>
        <span style={{ fontSize: 9, fontWeight: 600, color: isSelected ? "#00A8CC" : "#7A9BB5", transition: "color 0.15s ease", maxWidth: 52, textAlign: "center", lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {t(labelKey as Parameters<typeof t>[0])}
        </span>
      </button>
    )
  }

  return (
    <div
      suppressHydrationWarning
      className="bg-[linear-gradient(180deg,#f0f8ff_0%,#e8f4fb_50%,#edf6fb_100%)] border-b border-dash-cyan/[0.18] py-3"
    >
      {/* Free row */}
      <div className="flex items-center">
        <span className="w-[54px] shrink-0 text-[8px] font-extrabold uppercase tracking-[0.08em] text-dash-navy text-center leading-[1.35] pl-1">
          {t("template_label_free")}
        </span>
        <CarouselRow>
          {FREE_TEMPLATES.map((tpl) => (
            <TemplateCard key={tpl.id} id={tpl.id} labelKey={tpl.labelKey} locked={false} />
          ))}
        </CarouselRow>
      </div>

      {/* Pro row */}
      <div className="flex items-center mt-2.5">
        <span className="w-[54px] shrink-0 text-[8px] font-extrabold uppercase tracking-[0.08em] text-center leading-[1.35] pl-1 text-gradient-purple">
          Pro
        </span>
        <CarouselRow>
          {PRO_TEMPLATES.map((tpl) => (
            <TemplateCard key={tpl.id} id={tpl.id} labelKey={tpl.labelKey} locked={!isPro} />
          ))}
        </CarouselRow>
      </div>
    </div>
  )
}

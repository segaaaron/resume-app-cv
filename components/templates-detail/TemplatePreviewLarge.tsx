/**
 * Large preview card for the template detail page.
 *
 * Mirrors the visual language of TemplatePreview in /app/[locale]/templates/page.tsx
 * but at hero scale (aspect-[3/4] @ ~480px wide). Reusable for both the hero
 * and the related templates grid.
 *
 * Server component — pure markup, no hooks. Designed to survive print/PDF
 * with explicit colors and -webkit-print-color-adjust friendly inline styles.
 */

import type { TemplateSEO } from "@/lib/templates-seo"

type Style = "sidebar" | "top-band" | "split" | "dark" | "neon" | "minimal" | "bordered"

const VISUAL_STYLE_BY_LAYOUT: Record<TemplateSEO["layout"], Style> = {
  "single-column": "minimal",
  "two-column": "split",
  "sidebar-left": "sidebar",
  "sidebar-right": "sidebar",
}

// Override visual style for specific templates that need a distinctive look
const STYLE_OVERRIDES: Record<string, Style> = {
  carbon: "dark",
  onyx: "dark",
  obsidian: "dark",
  terminalcv: "dark",
  devopsterminal: "dark",
  financeterminal: "dark",
  codeeditor: "dark",
  neon: "neon",
  bauhaus: "neon",
  neobrutalist: "neon",
  outline: "bordered",
  glass: "bordered",
  ats: "minimal",
  simple: "minimal",
  classic: "top-band",
  modern: "top-band",
  professional: "top-band",
  aurora: "top-band",
}

function resolveStyle(t: TemplateSEO): Style {
  return STYLE_OVERRIDES[t.id] ?? VISUAL_STYLE_BY_LAYOUT[t.layout]
}

function Lines({ n, color, widths = [75, 60, 85, 50, 70] }: { n: number; color: string; widths?: number[] }) {
  return (
    <>
      {Array.from({ length: n }, (_, i) => (
        <div
          key={i}
          className="rounded-full"
          style={{
            height: 4,
            width: `${widths[i % widths.length]}%`,
            backgroundColor: color,
            marginBottom: 4,
            WebkitPrintColorAdjust: "exact",
            printColorAdjust: "exact",
          }}
        />
      ))}
    </>
  )
}

function SectionLabel({ color }: { color: string }) {
  return (
    <div
      style={{
        height: 5,
        width: "45%",
        backgroundColor: color,
        borderRadius: 2,
        marginBottom: 6,
        marginTop: 8,
        opacity: 0.7,
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}
    />
  )
}

export default function TemplatePreviewLarge({
  template,
  className = "",
}: {
  template: TemplateSEO
  className?: string
}) {
  const style = resolveStyle(template)
  const accent = template.colors.accent
  const primary = template.colors.primary
  const bg = style === "dark" ? "#0f172a" : "#ffffff"
  const headerBg = primary
  const headerText = "#ffffff"

  // Premium frame wrapper — soft shadow with color, ring effect on hover
  const wrapper = (children: React.ReactNode) => (
    <div
      className={`relative aspect-[3/4] overflow-hidden rounded-2xl border border-slate-200/60 transition-all duration-300 hover:shadow-[0_30px_80px_-20px_rgba(26,46,74,0.45)] hover:-translate-y-1 hover:border-[#00D4FF]/40 ${className}`}
      style={{
        backgroundColor: bg,
        boxShadow: "0 20px 60px -15px rgba(26,46,74,0.25)",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}
    >
      {children}
    </div>
  )

  if (style === "dark") {
    return wrapper(
      <div className="w-full h-full flex" style={{ backgroundColor: bg }}>
        <div className="flex flex-col gap-2 p-4" style={{ width: "38%", backgroundColor: headerBg }}>
          <div
            className="rounded-full mx-auto mt-1"
            style={{ width: 48, height: 48, backgroundColor: accent + "30", border: `2px solid ${accent}` }}
          />
          <SectionLabel color={accent} />
          <Lines n={3} color={accent + "60"} />
          <SectionLabel color={accent} />
          <Lines n={4} color={accent + "40"} />
        </div>
        <div className="flex-1 p-4" style={{ backgroundColor: "#0b1220" }}>
          <div style={{ height: 10, width: "80%", backgroundColor: "#f1f5f9", borderRadius: 2, marginBottom: 4 }} />
          <div style={{ height: 6, width: "50%", backgroundColor: accent, borderRadius: 2, marginBottom: 16 }} />
          <SectionLabel color={accent} />
          <Lines n={4} color="#374151" />
          <SectionLabel color={accent} />
          <Lines n={3} color="#374151" />
        </div>
      </div>
    )
  }

  if (style === "sidebar") {
    const sidebarRight = template.layout === "sidebar-right"
    const sidebar = (
      <div className="flex flex-col gap-2 p-4" style={{ width: "38%", backgroundColor: headerBg }}>
        <div
          className="rounded-full mx-auto mt-1"
          style={{ width: 48, height: 48, backgroundColor: "#ffffff40", border: "2px solid #ffffff80" }}
        />
        <Lines n={2} color="#ffffff70" />
        <SectionLabel color="#ffffffaa" />
        <Lines n={4} color="#ffffff50" />
        <SectionLabel color="#ffffffaa" />
        <Lines n={3} color="#ffffff50" />
      </div>
    )
    const main = (
      <div className="flex-1 p-4">
        <div style={{ height: 10, width: "80%", backgroundColor: "#111827", borderRadius: 2, marginBottom: 4 }} />
        <div style={{ height: 6, width: "50%", backgroundColor: accent, borderRadius: 2, marginBottom: 16 }} />
        <SectionLabel color={accent} />
        <Lines n={4} color="#e5e7eb" />
        <SectionLabel color={accent} />
        <Lines n={3} color="#e5e7eb" />
      </div>
    )
    return wrapper(
      <div className="w-full h-full flex" style={{ backgroundColor: bg }}>
        {sidebarRight ? main : sidebar}
        {sidebarRight ? sidebar : main}
      </div>
    )
  }

  if (style === "split") {
    return wrapper(
      <div className="w-full h-full flex flex-col" style={{ backgroundColor: bg }}>
        <div className="flex items-center gap-3 px-5 py-4" style={{ background: headerBg }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", backgroundColor: "#ffffff30", flexShrink: 0 }} />
          <div className="flex-1">
            <div style={{ height: 8, width: 120, backgroundColor: headerText, borderRadius: 2 }} />
            <div style={{ height: 4, width: 70, backgroundColor: accent, borderRadius: 2, marginTop: 4 }} />
          </div>
        </div>
        <div className="flex flex-1 gap-0">
          <div className="flex-1 p-4">
            <SectionLabel color={accent} />
            <Lines n={4} color="#e5e7eb" />
            <SectionLabel color={accent} />
            <Lines n={3} color="#e5e7eb" />
          </div>
          <div className="p-4" style={{ width: "38%", borderLeft: `2px solid ${accent}20` }}>
            <SectionLabel color={accent} />
            <Lines n={3} color="#d1d5db" />
            <SectionLabel color={accent} />
            <Lines n={4} color="#d1d5db" />
          </div>
        </div>
      </div>
    )
  }

  if (style === "neon") {
    return wrapper(
      <div className="w-full h-full flex flex-col p-3" style={{ backgroundColor: bg }}>
        <div
          className="p-4 mb-2"
          style={{ backgroundColor: accent, boxShadow: "6px 6px 0 #000", border: "2px solid #000" }}
        >
          <div style={{ height: 10, width: "75%", backgroundColor: "#fff", borderRadius: 2, marginBottom: 6 }} />
          <div style={{ height: 5, width: "50%", backgroundColor: "#ffffff80", borderRadius: 2 }} />
        </div>
        <div className="px-2 mt-2">
          <SectionLabel color={accent} />
          <Lines n={4} color="#e5e7eb" />
          <SectionLabel color={accent} />
          <Lines n={3} color="#e5e7eb" />
        </div>
      </div>
    )
  }

  if (style === "bordered") {
    return wrapper(
      <div className="w-full h-full flex flex-col p-4" style={{ backgroundColor: bg, border: `2px solid ${accent}30` }}>
        <div
          className="p-3 rounded-lg mb-3"
          style={{ backgroundColor: headerBg, border: `1.5px solid ${accent}` }}
        >
          <div style={{ height: 10, width: "70%", backgroundColor: accent, borderRadius: 2, marginBottom: 4 }} />
          <div style={{ height: 5, width: "45%", backgroundColor: accent + "80", borderRadius: 2 }} />
        </div>
        <SectionLabel color={accent} />
        <Lines n={4} color="#e5e7eb" />
        <SectionLabel color={accent} />
        <Lines n={3} color="#e5e7eb" />
      </div>
    )
  }

  // minimal / default
  if (style === "minimal") {
    return wrapper(
      <div className="w-full h-full flex flex-col p-5" style={{ backgroundColor: bg }}>
        <div style={{ height: 12, width: "70%", backgroundColor: "#111827", borderRadius: 2, marginBottom: 4 }} />
        <div style={{ height: 5, width: "45%", backgroundColor: accent, borderRadius: 2, marginBottom: 14 }} />
        <div style={{ height: 1.5, backgroundColor: accent + "40", marginBottom: 12 }} />
        <SectionLabel color={accent} />
        <Lines n={4} color="#e5e7eb" />
        <SectionLabel color={accent} />
        <Lines n={3} color="#e5e7eb" />
      </div>
    )
  }

  // top-band default
  return wrapper(
    <div className="w-full h-full flex flex-col" style={{ backgroundColor: bg }}>
      <div className="px-5 py-5" style={{ background: headerBg }}>
        <div style={{ height: 12, width: "70%", backgroundColor: headerText, borderRadius: 2, marginBottom: 6 }} />
        <div style={{ height: 5, width: "45%", backgroundColor: accent, borderRadius: 2 }} />
        <div className="flex gap-2 mt-3">
          {[55, 40, 50].map((w, i) => (
            <div key={i} style={{ height: 3, width: w, backgroundColor: "#ffffff70", borderRadius: 99 }} />
          ))}
        </div>
      </div>
      <div className="flex-1 px-5 py-4">
        <SectionLabel color={accent} />
        <Lines n={4} color="#e5e7eb" />
        <SectionLabel color={accent} />
        <Lines n={3} color="#e5e7eb" />
      </div>
    </div>
  )
}

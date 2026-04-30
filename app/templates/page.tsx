import Navbar from "@/components/marketing/Navbar"
import Footer from "@/components/marketing/Footer"
import { TEMPLATES } from "@/types/resume"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Plantillas de Curriculum Vitae Profesionales — 128 Diseños",
  description:
    "Explora 128 plantillas de curriculum vitae profesionales para todos los sectores: tecnología, finanzas, diseño, salud y más. Cambia de plantilla sin perder tu contenido.",
  keywords: [
    "plantillas de curriculum",
    "plantillas cv profesionales",
    "modelos de curriculum vitae",
    "diseños de cv",
    "plantillas resume",
    "plantillas cv profesionales premium",
    "curriculum vitae moderno",
    "plantillas ats",
  ],
  alternates: {
    canonical: "https://readycv.app/templates",
  },
  openGraph: {
    title: "Plantillas de Curriculum Vitae Profesionales — READY CV",
    description:
      "128 plantillas de CV profesionales. Elige el diseño perfecto para tu sector y descarga en PDF.",
    url: "https://readycv.app/templates",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Plantillas de Curriculum Vitae Profesionales — READY CV",
    description:
      "128 plantillas de CV profesionales. Elige el diseño perfecto para tu sector y descarga en PDF.",
  },
}

// Visual config per template — drives the mini-preview
const TEMPLATE_VISUALS: Record<string, {
  bg: string
  accent: string
  headerBg: string
  headerText: string
  style: "sidebar" | "top-band" | "split" | "dark" | "neon" | "minimal" | "bordered"
  tag?: string
}> = {
  classic:      { bg: "#fff",    accent: "#2a72d7", headerBg: "#2a72d7",  headerText: "#fff",    style: "top-band" },
  modern:       { bg: "#fff",    accent: "#7c3aed", headerBg: "#1d1d20",  headerText: "#a78bfa", style: "top-band",  tag: "Foto" },
  professional: { bg: "#fff",    accent: "#0ea5e9", headerBg: "#0f172a",  headerText: "#fff",    style: "top-band",  tag: "Foto" },
  elegant:      { bg: "#fff",    accent: "#d97706", headerBg: "#1d1d20",  headerText: "#fbbf24", style: "top-band" },
  circular:     { bg: "#fff",    accent: "#10b981", headerBg: "#065f46",  headerText: "#6ee7b7", style: "top-band",  tag: "Foto" },
  vertical:     { bg: "#f8fafc", accent: "#3b82f6", headerBg: "#1e3a5f",  headerText: "#fff",    style: "split",     tag: "Foto" },
  horizontal:   { bg: "#fff",    accent: "#6366f1", headerBg: "#312e81",  headerText: "#c7d2fe", style: "top-band" },
  casual:       { bg: "#fdf4ff", accent: "#9333ea", headerBg: "#9333ea",  headerText: "#fff",    style: "top-band" },
  chrono:       { bg: "#fff",    accent: "#64748b", headerBg: "#f1f5f9",  headerText: "#0f172a", style: "minimal" },
  luxurious:    { bg: "#fdfaf6", accent: "#92400e", headerBg: "#78350f",  headerText: "#fde68a", style: "top-band",  tag: "Foto" },
  simple:       { bg: "#fff",    accent: "#374151", headerBg: "#fff",     headerText: "#111827", style: "minimal" },
  metro:        { bg: "#fff",    accent: "#dc2626", headerBg: "#dc2626",  headerText: "#fff",    style: "split" },
  ats:          { bg: "#fff",    accent: "#1f2937", headerBg: "#fff",     headerText: "#111827", style: "minimal",   tag: "ATS" },
  sharp:        { bg: "#fff",    accent: "#f59e0b", headerBg: "#111827",  headerText: "#fbbf24", style: "split" },
  glass:        { bg: "#eff6ff", accent: "#3b82f6", headerBg: "#dbeafe",  headerText: "#1d4ed8", style: "bordered",  tag: "Foto" },
  neon:         { bg: "#fff",    accent: "#ec4899", headerBg: "#ec4899",  headerText: "#fff",    style: "neon" },
  nordic:       { bg: "#f9fafb", accent: "#6b7280", headerBg: "#f3f4f6",  headerText: "#111827", style: "minimal" },
  executive:    { bg: "#fffbf5", accent: "#1e3a5f", headerBg: "#1e3a5f",  headerText: "#f5d96b", style: "top-band" },
  sidebar:      { bg: "#fff",    accent: "#0369a1", headerBg: "#0369a1",  headerText: "#fff",    style: "sidebar",   tag: "Foto" },
  fold:         { bg: "#fff",    accent: "#8b5cf6", headerBg: "#8b5cf6",  headerText: "#fff",    style: "split" },
  bauhaus:      { bg: "#fff",    accent: "#ef4444", headerBg: "#ef4444",  headerText: "#fff",    style: "neon" },
  outline:      { bg: "#fff",    accent: "#374151", headerBg: "#fff",     headerText: "#111827", style: "bordered" },
  spark:        { bg: "#fff",    accent: "#06b6d4", headerBg: "linear-gradient(135deg,#6366f1,#06b6d4)", headerText: "#fff", style: "top-band" },
  carbon:       { bg: "#111827", accent: "#22d3ee", headerBg: "#0f172a",  headerText: "#22d3ee", style: "dark",      tag: "Foto" },
  blueprint:    { bg: "#f8fafc", accent: "#2a72d7", headerBg: "#1e3a5f",  headerText: "#fff",    style: "sidebar",   tag: "Foto" },
  aurora:       { bg: "#fff",    accent: "#8b5cf6", headerBg: "linear-gradient(135deg,#4c1d95,#8b5cf6)", headerText: "#fff", style: "top-band" },
  helix:        { bg: "#fff",    accent: "#22d3ee", headerBg: "#0d1117",  headerText: "#22d3ee", style: "sidebar",   tag: "Foto" },
  lumiere:      { bg: "#faf9f7", accent: "#b45309", headerBg: "#fff",     headerText: "#1a1a1a", style: "minimal" },
  prism:        { bg: "#fff",    accent: "#29b6d8", headerBg: "#1b2a3b",  headerText: "#29b6d8", style: "sidebar",   tag: "Foto" },
  consul:       { bg: "#fff",    accent: "#2563eb", headerBg: "#2563eb",  headerText: "#fff",    style: "sidebar",   tag: "Foto" },
}

function TemplatePreview({ id, visual }: { id: string; visual: typeof TEMPLATE_VISUALS[string] }) {
  const { bg, accent, headerBg, headerText, style } = visual

  // Shared line elements
  const lines = (n: number, color = "#e5e7eb", widths = [75, 60, 85, 50, 70]) =>
    Array.from({ length: n }, (_, i) => (
      <div key={i} className="rounded-full" style={{ height: 4, width: `${widths[i % widths.length]}%`, backgroundColor: color, marginBottom: 4 }} />
    ))

  const sectionLabel = (color: string) => (
    <div style={{ height: 5, width: "45%", backgroundColor: color, borderRadius: 2, marginBottom: 6, marginTop: 8, opacity: 0.7 }} />
  )

  if (style === "dark") {
    return (
      <div className="w-full h-full flex overflow-hidden rounded-xl" style={{ backgroundColor: bg }}>
        {/* sidebar */}
        <div className="flex flex-col gap-2 p-2" style={{ width: "38%", backgroundColor: headerBg }}>
          <div className="rounded-full mx-auto mt-1" style={{ width: 28, height: 28, backgroundColor: accent + "30", border: `2px solid ${accent}` }} />
          {sectionLabel(accent)}
          {lines(3, accent + "40")}
          {sectionLabel(accent)}
          {lines(4, accent + "30")}
        </div>
        {/* main */}
        <div className="flex-1 p-2" style={{ backgroundColor: "#111827" }}>
          <div style={{ height: 6, width: "80%", backgroundColor: "#f1f5f9", borderRadius: 2, marginBottom: 3 }} />
          <div style={{ height: 4, width: "50%", backgroundColor: accent, borderRadius: 2, marginBottom: 10 }} />
          {sectionLabel(accent)}
          {lines(4, "#374151")}
          {sectionLabel(accent)}
          {lines(3, "#374151")}
        </div>
      </div>
    )
  }

  if (style === "sidebar") {
    return (
      <div className="w-full h-full flex overflow-hidden rounded-xl" style={{ backgroundColor: bg }}>
        {/* sidebar */}
        <div className="flex flex-col gap-2 p-2" style={{ width: "38%", backgroundColor: headerBg }}>
          <div className="rounded-full mx-auto mt-1" style={{ width: 28, height: 28, backgroundColor: "#ffffff40", border: "2px solid #ffffff80" }} />
          {lines(2, "#ffffff60")}
          {sectionLabel("#ffffff80")}
          {lines(4, "#ffffff40")}
          {sectionLabel("#ffffff80")}
          {lines(3, "#ffffff40")}
        </div>
        {/* main */}
        <div className="flex-1 p-2">
          <div style={{ height: 6, width: "80%", backgroundColor: "#111827", borderRadius: 2, marginBottom: 3 }} />
          <div style={{ height: 4, width: "50%", backgroundColor: accent, borderRadius: 2, marginBottom: 10 }} />
          {sectionLabel(accent)}
          {lines(4)}
          {sectionLabel(accent)}
          {lines(3)}
        </div>
      </div>
    )
  }

  if (style === "split") {
    return (
      <div className="w-full h-full flex flex-col overflow-hidden rounded-xl" style={{ backgroundColor: bg }}>
        {/* header */}
        <div className="flex items-center gap-2 px-3 py-2" style={{ background: headerBg }}>
          <div style={{ width: 22, height: 22, borderRadius: "50%", backgroundColor: "#ffffff30", flexShrink: 0 }} />
          <div>
            <div style={{ height: 5, width: 70, backgroundColor: headerText === "#fff" ? "#fff" : "#111827", borderRadius: 2 }} />
            <div style={{ height: 3, width: 40, backgroundColor: accent, borderRadius: 2, marginTop: 3 }} />
          </div>
        </div>
        {/* body two-column */}
        <div className="flex flex-1 gap-0">
          <div className="flex-1 p-2">
            {sectionLabel(accent)}
            {lines(4)}
            {sectionLabel(accent)}
            {lines(3)}
          </div>
          <div className="p-2" style={{ width: "38%", borderLeft: `2px solid ${accent}20` }}>
            {sectionLabel(accent)}
            {lines(3, "#d1d5db")}
            {sectionLabel(accent)}
            {lines(4, "#d1d5db")}
          </div>
        </div>
      </div>
    )
  }

  if (style === "neon") {
    return (
      <div className="w-full h-full flex flex-col overflow-hidden rounded-xl" style={{ backgroundColor: bg }}>
        <div className="p-3" style={{ backgroundColor: accent, boxShadow: `4px 4px 0 #000`, border: "2px solid #000", margin: 6 }}>
          <div style={{ height: 7, width: "75%", backgroundColor: "#fff", borderRadius: 2, marginBottom: 4 }} />
          <div style={{ height: 4, width: "50%", backgroundColor: "#ffffff80", borderRadius: 2 }} />
        </div>
        <div className="px-3">
          {sectionLabel(accent)}
          {lines(4)}
          {sectionLabel(accent)}
          {lines(3)}
        </div>
      </div>
    )
  }

  if (style === "bordered") {
    return (
      <div className="w-full h-full flex flex-col overflow-hidden rounded-xl p-2" style={{ backgroundColor: bg, border: `2px solid ${accent}30` }}>
        <div className="p-2 rounded-lg mb-2" style={{ backgroundColor: headerBg, border: `1.5px solid ${accent}` }}>
          <div style={{ height: 6, width: "70%", backgroundColor: headerText === "#1d4ed8" ? headerText : accent, borderRadius: 2, marginBottom: 3 }} />
          <div style={{ height: 3, width: "45%", backgroundColor: accent + "80", borderRadius: 2 }} />
        </div>
        {sectionLabel(accent)}
        {lines(4)}
        {sectionLabel(accent)}
        {lines(3)}
      </div>
    )
  }

  if (style === "minimal") {
    return (
      <div className="w-full h-full flex flex-col overflow-hidden rounded-xl p-3" style={{ backgroundColor: bg }}>
        <div style={{ height: 7, width: "70%", backgroundColor: "#111827", borderRadius: 2, marginBottom: 3 }} />
        <div style={{ height: 3, width: "45%", backgroundColor: accent, borderRadius: 2, marginBottom: 10 }} />
        <div style={{ height: 1, backgroundColor: accent + "40", marginBottom: 8 }} />
        {sectionLabel(accent)}
        {lines(4)}
        {sectionLabel(accent)}
        {lines(3)}
      </div>
    )
  }

  // default: top-band
  return (
    <div className="w-full h-full flex flex-col overflow-hidden rounded-xl" style={{ backgroundColor: bg }}>
      <div className="px-3 py-3" style={{ background: headerBg }}>
        <div style={{ height: 7, width: "70%", backgroundColor: headerText === "#fff" ? "#fff" : "#111827", borderRadius: 2, marginBottom: 4 }} />
        <div style={{ height: 3, width: "45%", backgroundColor: headerText === "#fff" ? "#ffffff80" : accent, borderRadius: 2 }} />
        <div className="flex gap-2 mt-2">
          {[40, 30, 35].map((w, i) => (
            <div key={i} style={{ height: 2.5, width: w, backgroundColor: headerText === "#fff" ? "#ffffff50" : "#9ca3af", borderRadius: 99 }} />
          ))}
        </div>
      </div>
      <div className="flex-1 px-3">
        {sectionLabel(accent)}
        {lines(4)}
        {sectionLabel(accent)}
        {lines(3)}
      </div>
    </div>
  )
}

export default function TemplatesPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 py-12 sm:py-20 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Hero */}
          <div className="text-center mb-10 sm:mb-16">
            <span className="inline-block text-xs font-semibold uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full mb-4">
              128 plantillas
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-4">
              Elige tu diseño perfecto
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
              Diseños modernos para cada industria y nivel profesional.
              Cambia de plantilla en cualquier momento sin perder tu contenido.
            </p>
          </div>

          {/* ── Pro Diseños ── */}
          {(() => {
            const PRO_IDS = ["aurora", "helix", "lumiere", "prism", "consul"]
            const proTemplates = TEMPLATES.filter((t) => PRO_IDS.includes(t.id))
            const regularTemplates = TEMPLATES.filter((t) => !PRO_IDS.includes(t.id))

            const TemplateCard = ({ template }: { template: typeof TEMPLATES[number] }) => {
              const visual = TEMPLATE_VISUALS[template.id] ?? {
                bg: "#fff", accent: "#2a72d7", headerBg: "#2a72d7", headerText: "#fff", style: "top-band" as const,
              }
              return (
                <Link key={template.id} href="/register" id={template.id} className="group flex flex-col">
                  <div
                    className="relative aspect-[3/4] overflow-hidden rounded-xl border border-border transition-all duration-200 group-hover:shadow-xl group-hover:-translate-y-1 group-hover:border-primary/40"
                    style={{ backgroundColor: visual.bg }}
                  >
                    <TemplatePreview id={template.id} visual={visual} />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-200 rounded-xl flex items-center justify-center">
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white text-primary font-semibold text-xs px-3 py-1.5 rounded-full shadow-md">
                        Usar plantilla
                      </span>
                    </div>
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      {visual.tag && (
                        <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-black/60 text-white leading-none">
                          {visual.tag}
                        </span>
                      )}
                      {template.columns === "double" && (
                        <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-black/60 text-white leading-none">
                          2 col
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="mt-2.5 px-0.5">
                    <h3 className="font-semibold text-sm leading-tight">{template.name}</h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug line-clamp-2">{template.description}</p>
                  </div>
                </Link>
              )
            }

            return (
              <>
                {/* Pro Diseños section */}
                <div className="mb-12">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="flex-1 h-px bg-border" />
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-extrabold tracking-tight">Pro Diseños</span>
                      <span className="text-xs font-bold uppercase tracking-widest bg-gradient-to-r from-violet-500 to-cyan-500 text-white px-2.5 py-0.5 rounded-full">
                        Premium
                      </span>
                    </div>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-5">
                    {proTemplates.map((t) => <TemplateCard key={t.id} template={t} />)}
                  </div>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">Todas las plantillas</span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                {/* Regular grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-5">
                  {regularTemplates.map((t) => <TemplateCard key={t.id} template={t} />)}
                </div>
              </>
            )
          })()}

          {/* CTA */}
          <div className="mt-20 text-center bg-muted/40 rounded-2xl py-12 px-6">
            <h2 className="text-2xl font-bold mb-2">¿Listo para destacar?</h2>
            <p className="text-muted-foreground mb-6">128 plantillas profesionales, 7 herramientas de IA y análisis ATS.</p>
            <Button size="lg" asChild>
              <Link href="/register">Crear mi CV</Link>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

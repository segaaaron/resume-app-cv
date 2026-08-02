import Navbar from "@/components/marketing/Navbar"
import Footer from "@/components/marketing/Footer"
import { TEMPLATES, TEMPLATE_COUNT } from "@/types/resume"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import type { Metadata } from "next"
import Script from "next/script"
import { getTranslations } from "next-intl/server"
import { setRequestLocale } from "next-intl/server"
import { auth } from "@/lib/auth"
import { isSuperAdmin, effectivePlan, canUsePremiumTemplates } from "@/lib/plans"
import { Lock, Sparkles, Crown, ArrowRight, Check, Zap, ShieldCheck } from "lucide-react"
import { getTemplateAtsSafety } from "@/lib/ats/template-ats-safety"
import { PRO_IDS } from "@/components/editor/template-switcher"
import MockTemplatePreview from "@/components/templates-detail/MockTemplatePreview"

export const dynamic = "force-dynamic"


const jsonLdItemList = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Professional Resume Templates — Valhalla Resume",
  description: `${TEMPLATE_COUNT} ATS-optimized professional resume templates for every industry`,
  url: "https://www.valhallaresume.com/templates",
  numberOfItems: TEMPLATE_COUNT,
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Featured Resume Templates", url: "https://www.valhallaresume.com/templates#featured" },
    { "@type": "ListItem", position: 2, name: "City-Inspired Resume Templates", url: "https://www.valhallaresume.com/templates#city" },
    { "@type": "ListItem", position: 3, name: "Creative Resume Templates", url: "https://www.valhallaresume.com/templates#creative" },
    { "@type": "ListItem", position: 4, name: "Business Resume Templates", url: "https://www.valhallaresume.com/templates#business" },
    { "@type": "ListItem", position: 5, name: "Health & Science Resume Templates", url: "https://www.valhallaresume.com/templates#health" },
    { "@type": "ListItem", position: 6, name: "Legal & Academic Resume Templates", url: "https://www.valhallaresume.com/templates#legal" },
    { "@type": "ListItem", position: 7, name: "Hospitality Resume Templates", url: "https://www.valhallaresume.com/templates#hospitality" },
    { "@type": "ListItem", position: 8, name: "Engineering & Tech Resume Templates", url: "https://www.valhallaresume.com/templates#engineering" },
    { "@type": "ListItem", position: 9, name: "Arts & Media Resume Templates", url: "https://www.valhallaresume.com/templates#arts" },
    { "@type": "ListItem", position: 10, name: "Other Professional Resume Templates", url: "https://www.valhallaresume.com/templates#other" },
  ],
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "metadata.templates" })

  return {
    title: t("title"),
    description: t("description"),
    keywords: locale === "es"
      ? [
          "plantillas de curriculum vitae profesionales",
          "plantillas cv ats compatible",
          "modelos de curriculum vitae modernos",
          "plantillas de cv con ia",
          "diseños de cv 2025",
          "plantillas resume ats",
          "curriculum vitae creativo",
          "plantillas cv para ingenieros",
          "plantillas cv para diseñadores",
          "plantillas cv para profesionales de salud",
        ]
      : [
          "professional resume templates",
          "ats-friendly resume templates",
          "modern cv templates",
          "resume templates 2025",
          "ai resume templates",
          "creative resume templates",
          "engineering resume templates",
          "tech resume templates",
          "resume templates for designers",
          "free resume templates download",
        ],
    alternates: {
      canonical: `https://www.valhallaresume.com/${locale}/templates`,
      languages: {
        es: "https://www.valhallaresume.com/es/templates",
        en: "https://www.valhallaresume.com/en/templates",
        "x-default": "https://www.valhallaresume.com/en/templates",
      },
    },
    openGraph: {
      title: t("og_title"),
      description: t("og_description"),
      url: `https://www.valhallaresume.com/${locale}/templates`,
      type: "website",
      images: [{ url: "https://www.valhallaresume.com/og-image.png", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: t("og_title"),
      description: t("og_description"),
      images: ["https://www.valhallaresume.com/og-image.png"],
    },
  }
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
  cobalt:   { bg: "#fff",    accent: "#2a72d7", headerBg: "#0d2137",  headerText: "#fff",    style: "sidebar",   tag: "Foto" },
  duality:  { bg: "#fff",    accent: "#2a5298", headerBg: "#2a5298",  headerText: "#fff",    style: "sidebar",   tag: "Foto" },
  havana:   { bg: "#fff",    accent: "#c0645a", headerBg: "#c0645a",  headerText: "#fff",    style: "sidebar",   tag: "Foto" },
  lisbon:   { bg: "#fff",    accent: "#2a72d7", headerBg: "#2a72d7",  headerText: "#fff",    style: "sidebar",   tag: "Foto" },
  nautical: { bg: "#fff",    accent: "#1e3a5f", headerBg: "#1e3a5f",  headerText: "#fff",    style: "sidebar",   tag: "Foto" },
  tokyo:    { bg: "#fff",    accent: "#0D0D0D", headerBg: "#0D0D0D",  headerText: "#fff",    style: "sidebar",   tag: "Foto" },
  vitae:    { bg: "#fff",    accent: "#1e2d3d", headerBg: "#1e2d3d",  headerText: "#fff",    style: "sidebar",   tag: "Foto" },
}


export default async function TemplatesPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations("templates_page")
  const tCommon = await getTranslations("common")
  const tTemplates = await getTranslations("templates")

  const jsonLdBreadcrumbTemplates = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: tCommon("home_label"), item: "https://www.valhallaresume.com" },
      { "@type": "ListItem", position: 2, name: tTemplates("breadcrumb_templates"), item: `https://www.valhallaresume.com/${locale}/templates` },
    ],
  }

  const session = await auth()
  const dbUser = session?.user?.id
    ? await import("@/lib/db").then(({ db }) =>
        db.user.findUnique({
          where: { id: session.user.id },
          select: { plan: true, subscriptionStatus: true, subscriptionEndsAt: true, role: true, isManaged: true, managedBlocked: true, managedExpiresAt: true },
        })
      )
    : null

  // Premium (PRO) templates are unlocked for SPRINT/PRO/LIMITED (and admin).
  // BASIC/UNSUBSCRIBED can preview but not use them. effectivePlan() makes an
  // expired BASIC/SPRINT fall back to UNSUBSCRIBED.
  const hasAccess = dbUser
    ? isSuperAdmin(dbUser.role) || canUsePremiumTemplates(effectivePlan(dbUser))
    : false

  // PRO_IDS imported from @/components/editor/template-switcher (single source of truth)
  const isEs = locale === "es"

  const proTemplates     = TEMPLATES.filter((t) => PRO_IDS.includes(t.id)).sort((a, b) => a.name.localeCompare(b.name))
  const regularTemplates = TEMPLATES.filter((t) => !PRO_IDS.includes(t.id)).sort((a, b) => a.name.localeCompare(b.name))

  // "Use template" sends logged-in users into the dashboard to create; guests
  // go to login (which offers account creation). Plan/PRO is enforced later at
  // the create/download gate — the preview itself stays open to everyone.
  const ctaHref = session?.user ? `/${locale}/dashboard/resumes` : `/${locale}/login`

  const TemplateCard = ({ template, locked = false }: { template: typeof TEMPLATES[number]; locked?: boolean }) => {
    const visual = TEMPLATE_VISUALS[template.id] ?? {
      bg: "#fff", accent: "#2a72d7", headerBg: "#2a72d7", headerText: "#fff", style: "top-band" as const,
    }
    return (
      <div id={template.id} className="group flex flex-col cursor-pointer">
        <div
          className={`relative aspect-[3/4] overflow-hidden rounded-xl border transition-all duration-200 group-hover:shadow-xl group-hover:-translate-y-1 ${
            locked
              ? "border-border group-hover:border-amber-400/60"
              : "border-border group-hover:border-primary/40"
          }`}
          style={{ backgroundColor: visual.bg }}
        >
          <MockTemplatePreview templateId={template.id} />

          {/* Preview stays fully visible for everyone; CTA appears on hover and
              routes to dashboard (logged in) or login (guest). */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-200 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100">
            <Link
              href={ctaHref}
              className="inline-flex items-center gap-1.5 bg-white text-primary font-semibold text-xs px-3 py-1.5 rounded-full shadow-md hover:bg-slate-50 transition-colors"
            >
              {t("use_template")}
            </Link>
          </div>

          {/* Always-visible lock icon for locked templates */}
          {locked && (
            <div className="absolute top-2 right-2">
              <span className="flex items-center gap-1 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-500/90 text-white leading-none">
                <Lock className="h-2.5 w-2.5" /> Pro
              </span>
            </div>
          )}

          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {visual.tag && (
              <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-black/60 text-white leading-none">
                {visual.tag}
              </span>
            )}
            {/* ATS-safe marker — single-column layouts parse cleanly in every ATS.
                Derived from the canonical getTemplateAtsSafety (not columns alone,
                so the dedicated "ats" template is always flagged). */}
            {getTemplateAtsSafety(template.id) === "safe" ? (
              <span
                title={t("ats_safe")}
                className="flex items-center gap-1 text-[9px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded text-white leading-none shadow-sm"
                style={{ background: "linear-gradient(135deg, #10B981 0%, #00A8CC 100%)" }}
              >
                <ShieldCheck className="h-2.5 w-2.5" /> ATS
              </span>
            ) : (
              <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-black/60 text-white leading-none">
                2 col
              </span>
            )}
          </div>
        </div>
        <div className="mt-2.5 px-0.5">
          <Link
            href={`/${locale}/templates/design/${template.id}`}
            className="group/title block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 rounded"
          >
            <h3 className="font-semibold text-sm leading-tight transition-colors group-hover/title:text-primary">
              {template.name}
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug line-clamp-2">
              {template.description}
            </p>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Script
        id="json-ld-breadcrumb-templates"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBreadcrumbTemplates) }}
      />
      <Script
        id="json-ld-itemlist-templates"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdItemList) }}
      />
      <Navbar />
      <main id="main-content" className="flex-1">
        {/* ───────────────────────── HERO ───────────────────────── */}
        <section
          className="relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #1a2e4a 0%, #0f1a2e 55%, #0a1322 100%)" }}
        >
          <div className="absolute top-0 inset-x-0 h-px" style={{ background: "linear-gradient(90deg, transparent, #00D4FF, transparent)" }} />
          <div className="absolute -top-40 -right-32 w-[520px] h-[520px] rounded-full opacity-20 blur-3xl pointer-events-none" style={{ background: "radial-gradient(circle, #00D4FF 0%, transparent 70%)" }} />
          <div className="absolute -bottom-44 -left-32 w-[480px] h-[480px] rounded-full opacity-10 blur-3xl pointer-events-none" style={{ background: "radial-gradient(circle, #7c5cff 0%, transparent 70%)" }} />

          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-20 sm:py-28 text-center text-white">
            <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#00D4FF] bg-[#00D4FF]/10 ring-1 ring-[#00D4FF]/30 px-3 py-1.5 rounded-full mb-6">
              <Sparkles className="h-3.5 w-3.5" /> {t("badge")}
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.05] mb-5">
              {t("title")}
            </h1>
            <p className="text-base sm:text-lg text-cyan-100/80 max-w-2xl mx-auto mb-9">
              {t("subtitle")}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2.5 mb-10">
              {[
                isEs ? `${TEMPLATES.length}+ plantillas` : `${TEMPLATES.length}+ templates`,
                "ATS-ready",
                isEs ? "Exporta a PDF" : "PDF export",
              ].map((s) => (
                <span key={s} className="inline-flex items-center gap-1.5 text-xs font-medium text-cyan-50/90 bg-white/5 ring-1 ring-white/10 px-3 py-1.5 rounded-full">
                  <Check className="h-3 w-3 text-[#00D4FF]" /> {s}
                </span>
              ))}
            </div>
            <div className="inline-flex items-center gap-1 p-1 rounded-full bg-white/5 ring-1 ring-white/10 backdrop-blur">
              <a href="#gratis" className="px-6 py-2 rounded-full text-sm font-semibold text-white/90 hover:bg-white/10 transition-colors">
                {isEs ? "Gratis" : "Free"}
              </a>
              <a
                href="#pro"
                className="inline-flex items-center gap-1.5 px-6 py-2 rounded-full text-sm font-bold text-[#0a1322] bg-gradient-to-r from-[#00D4FF] to-cyan-300 shadow-[0_6px_20px_-6px_rgba(0,212,255,0.7)] hover:from-cyan-300 hover:to-[#00D4FF] transition-all"
              >
                <Crown className="h-3.5 w-3.5" /> PRO
              </a>
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* ───────────────────────── FREE GROUP ───────────────────────── */}
          <section id="gratis" className="scroll-mt-24 pt-16 sm:pt-20 pb-12">
            <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
              <div>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-600 bg-emerald-500/10 ring-1 ring-emerald-500/20 px-2.5 py-1 rounded-full mb-3">
                  <Check className="h-3 w-3" /> {isEs ? "Incluidas gratis" : "Free forever"}
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#1a2e4a]">
                  {isEs ? "Plantillas gratis" : "Free templates"}
                </h2>
                <p className="text-slate-500 mt-1.5 max-w-md">
                  {isEs ? "Empieza sin pagar. Diseños limpios y listos para ATS." : "Start for free. Clean, ATS-ready designs."}
                </p>
              </div>
              <span className="text-sm font-semibold text-slate-400 tabular-nums">
                {regularTemplates.length} {isEs ? "diseños" : "designs"}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-5">
              {regularTemplates.map((tmpl) => <TemplateCard key={tmpl.id} template={tmpl} />)}
            </div>
          </section>

          {/* ───────────────────────── PRO GROUP ───────────────────────── */}
          <section id="pro" className="scroll-mt-24 pt-8 pb-16 sm:pb-20">
            <div
              className="relative overflow-hidden rounded-3xl px-6 sm:px-10 py-8 sm:py-10 mb-8"
              style={{ background: "linear-gradient(120deg, #1a2e4a 0%, #20183f 60%, #0f1a2e 100%)" }}
            >
              <div className="absolute -top-24 -right-16 w-80 h-80 rounded-full opacity-20 blur-3xl pointer-events-none" style={{ background: "radial-gradient(circle, #7c5cff 0%, transparent 70%)" }} />
              <div className="relative flex flex-wrap items-end justify-between gap-5">
                <div className="max-w-xl">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-amber-300 bg-amber-400/10 ring-1 ring-amber-400/30 px-2.5 py-1 rounded-full mb-3">
                    <Zap className="h-3 w-3" /> {t("premium_badge")}
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
                    <Crown className="h-6 w-6 text-amber-300" />
                    <span className="bg-gradient-to-r from-white via-cyan-100 to-[#00D4FF] bg-clip-text text-transparent">
                      {isEs ? "Diseños PRO" : "PRO designs"}
                    </span>
                  </h2>
                  <p className="text-cyan-100/75 mt-2">
                    {isEs
                      ? "Layouts únicos y tipografías premium que hacen que tu CV destaque entre cientos."
                      : "Unique layouts and premium type that make your Resume stand out from hundreds."}
                  </p>
                  <ul className="flex flex-wrap gap-x-5 gap-y-2 mt-4">
                    {(isEs
                      ? ["Tipografías premium & layouts únicos", "Optimizadas para ATS", "Descarga PDF ilimitada"]
                      : ["Premium type & unique layouts", "ATS-optimized", "Unlimited PDF download"]
                    ).map((b) => (
                      <li key={b} className="inline-flex items-center gap-1.5 text-sm text-cyan-50/90">
                        <Check className="h-3.5 w-3.5 text-[#00D4FF]" /> {b}
                      </li>
                    ))}
                  </ul>
                </div>
                <span className="text-sm font-semibold text-cyan-100/60 tabular-nums">
                  {proTemplates.length} {isEs ? "diseños PRO" : "PRO designs"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-5">
              {proTemplates.map((tmpl) => <TemplateCard key={tmpl.id} template={tmpl} locked={!hasAccess} />)}
            </div>
          </section>
        </div>

        {/* ───────────────────────── FINAL MARKETING CTA ───────────────────────── */}
        <section className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, #1a2e4a 0%, #0f1a2e 50%, #0a1322 100%)" }}>
          <div className="absolute -bottom-32 -right-24 w-[460px] h-[460px] rounded-full opacity-25 blur-3xl pointer-events-none" style={{ background: "radial-gradient(circle, #00D4FF 0%, transparent 70%)" }} />
          <div className="relative max-w-3xl mx-auto px-4 sm:px-6 py-20 text-center text-white">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
              {isEs ? "¿Viste un diseño que te encanta?" : "Found a design you love?"}
            </h2>
            <p className="text-lg text-cyan-100/80 mb-9">
              {isEs
                ? "Créalo gratis en minutos con tu información y descárgalo cuando estés listo."
                : "Build it free in minutes with your info and download it when you're ready."}
            </p>
            <Link href={`/${locale}/register`}>
              <Button
                size="lg"
                className="gap-2 text-base font-semibold bg-[#00D4FF] hover:bg-[#00D4FF]/90 text-[#0a1322] shadow-[0_12px_45px_-10px_rgba(0,212,255,0.7)] hover:shadow-[0_18px_60px_-10px_rgba(0,212,255,0.9)] transition-all px-8"
              >
                {t("cta_button")} <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <p className="text-xs text-cyan-100/50 mt-4">
              {isEs ? "Sin tarjeta · Empieza gratis" : "No card required · Start free"}
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}

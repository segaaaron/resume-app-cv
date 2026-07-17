import Link from "next/link"
import { CheckCircle2, Sparkles, Award } from "lucide-react"
import { Button } from "@/components/ui/button"
import MockTemplatePreview from "@/components/templates-detail/MockTemplatePreview"
import TemplateUseButton from "@/components/templates-detail/TemplateUseButton"
import type { TemplateSEO } from "@/lib/templates-seo"

interface Props {
  template: TemplateSEO
  locale: "en" | "es"
  isEs: boolean
  desc: string
  categoryLabel: string
  layoutLabel: string
  t: (k: string) => string
}

export default function TemplateDetailHero({
  template,
  locale,
  isEs,
  desc,
  categoryLabel,
  layoutLabel,
  t,
}: Props) {
  return (
    <section
      className="relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #1a2e4a 0%, #0f1a2e 60%, #0a1322 100%)",
      }}
    >
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background: "linear-gradient(90deg, transparent 0%, #00D4FF 50%, transparent 100%)",
        }}
      />
      <div
        className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full opacity-20 blur-3xl pointer-events-none"
        style={{ background: "radial-gradient(circle, #00D4FF 0%, transparent 70%)" }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        <div className="text-white">
          <nav className="flex items-center gap-2 text-xs text-cyan-200/70 mb-6" aria-label="Breadcrumb">
            <Link href={`/${locale}`} className="hover:text-cyan-200 transition-colors">
              {t("breadcrumb_home")}
            </Link>
            <span>/</span>
            <Link href={`/${locale}/templates`} className="hover:text-cyan-200 transition-colors">
              {t("breadcrumb_templates")}
            </Link>
            <span>/</span>
            <span className="text-white/90">{template.name}</span>
          </nav>

          <div className="flex flex-wrap items-center gap-2 mb-5">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-[#00D4FF] bg-[#00D4FF]/10 ring-1 ring-[#00D4FF]/30 px-3 py-1 rounded-full">
              <Sparkles className="h-3 w-3" />
              {categoryLabel}
            </span>
            {template.isPro && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest text-amber-300 bg-amber-500/10 ring-1 ring-amber-400/40 px-3 py-1 rounded-full">
                <Award className="h-3 w-3" /> Pro
              </span>
            )}
            {template.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-[11px] font-medium text-cyan-100/80 bg-white/5 ring-1 ring-white/10 px-2.5 py-1 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.05] mb-5">
            {isEs ? "Plantilla CV " : ""}
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: "linear-gradient(135deg, #ffffff 0%, #00D4FF 100%)",
              }}
            >
              {template.name}
            </span>
            {!isEs ? " Resume Template" : ""}
          </h1>

          <p className="text-lg text-cyan-100/80 leading-relaxed mb-8 max-w-xl">{desc}</p>

          <div className="grid grid-cols-3 gap-3 mb-8 max-w-md">
            {/* This tile used to read "ATS SCORE 92/100". That number was
                invented: stableAtsScore() picked a base per category and added
                jitter from a hash of the template id, which made a made-up
                figure look measured — sitting next to layout and photo, which
                are real facts. Replaced with the one thing about a template
                that genuinely affects parsing, and that we can actually state. */}
            <div className="rounded-xl bg-white/5 ring-1 ring-white/10 p-3 backdrop-blur-sm">
              <div className="text-[10px] uppercase tracking-widest text-cyan-200/60 mb-1">
                {t("text_label")}
              </div>
              <div className="text-sm font-bold text-white leading-tight">{t("text_selectable")}</div>
            </div>
            <div className="rounded-xl bg-white/5 ring-1 ring-white/10 p-3 backdrop-blur-sm">
              <div className="text-[10px] uppercase tracking-widest text-cyan-200/60 mb-1">
                {t("layout_label")}
              </div>
              <div className="text-sm font-bold text-white leading-tight">{layoutLabel}</div>
            </div>
            <div className="rounded-xl bg-white/5 ring-1 ring-white/10 p-3 backdrop-blur-sm">
              <div className="text-[10px] uppercase tracking-widest text-cyan-200/60 mb-1">
                {t("photo_label")}
              </div>
              <div className="text-sm font-bold text-white leading-tight">
                {template.hasPhoto ? t("yes") : t("no")}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <TemplateUseButton locale={locale} label={t("use_template_cta")} />
            <Link href={`/${locale}/templates`}>
              <Button
                size="lg"
                variant="outline"
                className="text-base bg-white/5 text-white border-white/20 hover:bg-white/10 hover:border-white/40"
              >
                {t("browse_all_cta")}
              </Button>
            </Link>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div
            className="absolute inset-0 -m-8 rounded-3xl blur-2xl opacity-40 pointer-events-none"
            style={{
              background: "radial-gradient(circle at 50% 50%, #00D4FF 0%, transparent 60%)",
            }}
          />
          <div className="relative aspect-[3/4] max-w-md mx-auto lg:max-w-none rounded-2xl overflow-hidden border border-white/10 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)]">
            <MockTemplatePreview templateId={template.id} />
          </div>
        </div>
      </div>

      <div className="relative border-t border-white/10 bg-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-xs text-cyan-100/70">
          {[t("badge_ats"), t("badge_free_download"), t("badge_no_watermark"), t("badge_edit_online")].map(
            (label, i) => (
              <span key={i} className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#00D4FF]" />
                <span className="font-medium">{label}</span>
              </span>
            ),
          )}
        </div>
      </div>
    </section>
  )
}

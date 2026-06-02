"use client"

import { useTranslations } from "next-intl"
import { CheckCircle2, XCircle, Zap, Target, FileSearch, Ruler, Phone } from "lucide-react"

type Breakdown = {
  keywords: { score: number; matched?: string[]; missing?: string[]; suggested?: string[] }
  format: { score: number; passes?: string[]; issues?: string[] }
  sections: { score: number; detected: string[]; missing?: string[] }
  length: { score: number; wordCount: number; recommendation: string }
  contact: { score: number; hasEmail: boolean; hasPhone: boolean; hasLinkedIn: boolean }
}

type Props = {
  breakdown: Breakdown
  allMissingKeywords: string[]
  allQuickWins: string[]
  upgradePath: string
}

function CategoryCard({
  icon, title, score, children,
}: {
  icon: React.ReactNode; title: string; score: number; children?: React.ReactNode
}) {
  const tone = score >= 80 ? "from-emerald-400 to-cyan-400" : score >= 60 ? "from-amber-400 to-orange-400" : "from-rose-400 to-pink-400"
  return (
    <div className="rounded-2xl border border-white/40 bg-white/80 p-5 shadow-[0_8px_30px_-12px_rgba(15,26,46,0.18)] backdrop-blur">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#1a2e4a] to-[#0f1a2e] text-[#00D4FF]">
            {icon}
          </div>
          <h3 className="text-sm font-bold text-[#1a2e4a]">{title}</h3>
        </div>
        <div className={`rounded-full bg-gradient-to-r ${tone} px-3 py-1 text-xs font-extrabold text-white`}>
          {score}
        </div>
      </div>
      {children && <div className="mt-4 space-y-1.5 text-sm text-[#1a2e4a]/75">{children}</div>}
    </div>
  )
}

export default function AtsResultsBreakdown({ breakdown, allMissingKeywords, allQuickWins, upgradePath }: Props) {
  const t = useTranslations("tools.atsChecker")
  const c = breakdown.contact

  return (
    <div className="space-y-7">
      {/* Categories */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <CategoryCard icon={<Target className="h-4 w-4" />} title={t("breakdown.keywords")} score={breakdown.keywords.score}>
          {(breakdown.keywords.matched ?? []).slice(0, 5).map((k) => (
            <div key={k} className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /><span>{k}</span></div>
          ))}
        </CategoryCard>
        <CategoryCard icon={<FileSearch className="h-4 w-4" />} title={t("breakdown.format")} score={breakdown.format.score}>
          {(breakdown.format.passes ?? []).slice(0, 3).map((p) => (
            <div key={p} className="flex items-start gap-1.5"><CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" /><span>{p}</span></div>
          ))}
        </CategoryCard>
        <CategoryCard icon={<FileSearch className="h-4 w-4" />} title={t("breakdown.sections")} score={breakdown.sections.score}>
          {breakdown.sections.detected.slice(0, 5).map((s) => (
            <div key={s} className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /><span className="capitalize">{s}</span></div>
          ))}
        </CategoryCard>
        <CategoryCard icon={<Ruler className="h-4 w-4" />} title={t("breakdown.length")} score={breakdown.length.score}>
          <p>{t("breakdown.lengthCount", { count: breakdown.length.wordCount })}</p>
          <p className="text-xs text-[#1a2e4a]/55">{breakdown.length.recommendation}</p>
        </CategoryCard>
        <CategoryCard icon={<Phone className="h-4 w-4" />} title={t("breakdown.contact")} score={breakdown.contact.score}>
          <div className="flex items-center gap-1.5">{c.hasEmail ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : <XCircle className="h-3.5 w-3.5 text-rose-500" />}<span>Email</span></div>
          <div className="flex items-center gap-1.5">{c.hasPhone ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : <XCircle className="h-3.5 w-3.5 text-rose-500" />}<span>{t("breakdown.phone")}</span></div>
          <div className="flex items-center gap-1.5">{c.hasLinkedIn ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : <XCircle className="h-3.5 w-3.5 text-rose-500" />}<span>LinkedIn</span></div>
        </CategoryCard>
      </div>

      {/* Full report */}
      <div className="rounded-3xl border border-[#1a2e4a]/10 bg-white p-6 md:p-8 shadow-[0_10px_40px_-12px_rgba(15,26,46,0.15)]">
        <h3 className="text-xl font-extrabold text-[#1a2e4a]">{t("preview.title")}</h3>
        <p className="mt-1 text-sm text-[#1a2e4a]/65">{t("preview.subtitle")}</p>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#1a2e4a]/55">{t("preview.missingKw")}</p>
            <ul className="mt-2 space-y-1.5 text-sm">
              {allMissingKeywords.map((k) => (
                <li key={k} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#00D4FF]" />
                  <span className="capitalize text-[#1a2e4a]">{k}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#1a2e4a]/55">{t("preview.quickWins")}</p>
            <ul className="mt-2 space-y-1.5 text-sm">
              {allQuickWins.map((w, i) => (
                <li key={`${i}-${w}`} className="flex items-start gap-2">
                  <Zap className="mt-0.5 h-4 w-4 shrink-0 text-[#00D4FF]" />
                  <span className="text-[#1a2e4a]">{w}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-7 rounded-2xl border border-[#00D4FF]/30 bg-gradient-to-br from-[#00D4FF]/5 to-transparent p-5">
          <p className="text-sm font-semibold text-[#1a2e4a]">{upgradePath}</p>
          <a
            href="../../pricing"
            className="mt-3 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1a2e4a] to-[#0f1a2e] px-5 py-2.5 text-sm font-bold text-white transition-all hover:scale-[1.02]"
          >
            {t("preview.proCta")}
          </a>
        </div>
      </div>
    </div>
  )
}

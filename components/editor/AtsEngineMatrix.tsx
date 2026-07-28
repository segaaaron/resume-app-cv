"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { CheckCircle2, AlertTriangle, XCircle, ChevronDown } from "lucide-react"
import type { EngineSimulation, ParseVerdict } from "@/lib/ats/engines"

// Verdict → visual token. Icon + text + colour together (never colour alone) so the
// verdict is legible to colour-blind users and screen readers. Contrast of each text
// colour on its tinted background clears WCAG AA (4.5:1).
const VERDICT: Record<
  ParseVerdict,
  { icon: typeof CheckCircle2; color: string; bg: string; ring: string; dot: string }
> = {
  clean: { icon: CheckCircle2, color: "#15803D", bg: "rgba(22,163,74,0.10)", ring: "rgba(22,163,74,0.25)", dot: "#16A34A" },
  caution: { icon: AlertTriangle, color: "#B45309", bg: "rgba(217,119,6,0.10)", ring: "rgba(217,119,6,0.25)", dot: "#D97706" },
  risk: { icon: XCircle, color: "#B91C1C", bg: "rgba(220,38,38,0.10)", ring: "rgba(220,38,38,0.25)", dot: "#DC2626" },
}

function EngineCard({
  result,
}: {
  result: EngineSimulation["engines"][number]
}) {
  const t = useTranslations("editor.ats")
  const [open, setOpen] = useState(false)
  const v = VERDICT[result.verdict]
  const Icon = v.icon
  const hasFindings = result.findings.length > 0

  return (
    <div
      className="relative rounded-xl border border-slate-200/80 bg-white/80 p-3 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
      style={{ borderLeft: `3px solid ${v.dot}`, boxShadow: `0 1px 8px -4px ${v.dot}55` }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[12px] font-black text-[#1a2e4a] tracking-tight">{result.label}</span>
        <span
          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
          style={{ color: v.color, background: v.bg, boxShadow: `inset 0 0 0 1px ${v.ring}` }}
        >
          <Icon className="h-2.5 w-2.5" strokeWidth={2.5} />
          {t(`engine_verdict_${result.verdict}`)}
        </span>
      </div>
      <p className="mt-1.5 text-[10px] leading-snug text-slate-500">{result.behavior}</p>

      {hasFindings && (
        <>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold transition-colors"
            style={{ color: v.color }}
          >
            {open ? t("engine_findings_hide") : t("engine_findings_show", { count: result.findings.length })}
            <ChevronDown
              className="h-2.5 w-2.5 transition-transform duration-200"
              style={{ transform: open ? "rotate(180deg)" : "none" }}
            />
          </button>
          <div
            className="grid transition-all duration-200 ease-out"
            style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
          >
            <ul className="overflow-hidden space-y-1.5">
              <li aria-hidden className="h-1.5" />
              {result.findings.map((f, i) => (
                <li key={i} className="flex items-start gap-1.5 text-[10px] leading-relaxed text-slate-600">
                  <span className="mt-0.5 h-1 w-1 shrink-0 rounded-full" style={{ background: v.dot }} />
                  <span>{f.message}</span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  )
}

/**
 * Per-engine ATS compatibility matrix. The same resume gets a different verdict per
 * real ATS because each parses differently — this surfaces that instead of hiding it
 * behind one score. Pure presentation: the simulation + already-localised finding
 * messages come from analyzeAts().engines.
 */
export default function AtsEngineMatrix({ simulation }: { simulation: EngineSimulation }) {
  const t = useTranslations("editor.ats")
  const { engines, cleanCount, total } = simulation

  return (
    <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50/90 to-white p-3.5">
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div>
          <p className="text-[10px] font-black tracking-widest uppercase text-[#1a2e4a] flex items-center gap-1.5">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: "linear-gradient(135deg,#00D4FF,#1a2e4a)" }}
            />
            {t("engines_title")}
          </p>
          <p className="mt-1 text-[11px] font-bold text-slate-600">
            {t("engines_pass_summary", { clean: cleanCount, total })}
          </p>
        </div>
        <div className="flex items-center gap-1" aria-hidden>
          {engines.map((e) => (
            <span
              key={e.engine}
              className="h-2 w-2 rounded-full"
              style={{ background: VERDICT[e.verdict].dot }}
              title={e.label}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {engines.map((e) => (
          <EngineCard key={e.engine} result={e} />
        ))}
      </div>
    </div>
  )
}

// Static, presentational preview of the ATS Score PRO/LIMITED delivers inside the
// editor. This is a MARKETING mockup — illustrative sample data, never a live
// analysis — so anonymous visitors see exactly what the paid feature produces
// before they buy. No free scoring is given away here.
//
// The component is parametric: the page renders it once per example profile
// (e.g. a Frontend Engineer and a Data Analyst) so a visitor from any field
// sees how the same deterministic engine scores their own tech stack.

import { CheckCircle2, XCircle, ShieldCheck, LayoutTemplate, TrendingUp } from "lucide-react"

export interface ShowcaseLabels {
  scoreCaption: string
  matched: string
  missing: string
  demonstratedNote: string
  templateNote: string
  afterFix: string
  subScores: {
    hardSkills: string
    mustHaves: string
    title: string
    sections: string
  }
}

export interface ShowcaseExample {
  /** Title-bar caption, e.g. "ATS Match Score — Senior Frontend Engineer". */
  window: string
  /** Footer line describing the engine/role. */
  role: string
  score: number
  /** Points gained after applying the suggested fixes (the live re-score result). */
  deltaAfter: number
  subScores: { hardSkills: number; mustHaves: number; title: number; sections: number }
  matched: string[]
  missing: string[]
}

// Circumference of an r=52 circle, for the SVG score ring.
const C = 2 * Math.PI * 52

export default function AtsFeatureShowcase({
  labels,
  example,
}: {
  labels: ShowcaseLabels
  example: ShowcaseExample
}) {
  const dash = (example.score / 100) * C
  const sub = [
    { key: "hardSkills" as const, pct: example.subScores.hardSkills },
    { key: "mustHaves" as const, pct: example.subScores.mustHaves },
    { key: "title" as const, pct: example.subScores.title },
    { key: "sections" as const, pct: example.subScores.sections },
  ]

  return (
    <div className="relative">
      {/* Glow behind the window */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-4 rounded-[2rem] bg-[radial-gradient(circle_at_50%_0%,_rgba(0,212,255,0.22),_transparent_65%)] blur-2xl"
      />

      {/* App window frame */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#1a2e4a] to-[#0f1a2e] shadow-[0_40px_120px_-30px_rgba(15,26,46,0.75)]">
        {/* Title bar */}
        <div className="flex items-center gap-2 border-b border-white/10 px-5 py-3.5">
          <span aria-hidden className="h-3 w-3 rounded-full bg-[#ff5f57]" />
          <span aria-hidden className="h-3 w-3 rounded-full bg-[#febc2e]" />
          <span aria-hidden className="h-3 w-3 rounded-full bg-[#28c840]" />
          <span className="ml-3 truncate text-xs font-semibold text-white/60">{example.window}</span>
        </div>

        <div className="grid gap-6 p-6 md:grid-cols-[auto_1fr] md:p-7">
          {/* Score ring */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative h-32 w-32">
              <svg aria-hidden viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="10" />
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  stroke="url(#atsGrad)"
                  strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${dash} ${C}`}
                />
                <defs>
                  <linearGradient id="atsGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#00D4FF" />
                    <stop offset="100%" stopColor="#4F8BFF" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-extrabold text-white">{example.score}</span>
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#00D4FF]">/ 100</span>
              </div>
            </div>
            <p className="mt-3 max-w-[10rem] text-center text-[11px] font-medium text-white/60">{labels.scoreCaption}</p>
            <div className="mt-2 flex flex-col items-center gap-1.5">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#00D4FF]/30 bg-[#00D4FF]/10 px-3 py-1 text-[10px] font-bold text-[#00D4FF]">
                <LayoutTemplate className="h-3 w-3" />
                {labels.templateNote}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-[10px] font-bold text-emerald-300">
                <TrendingUp className="h-3 w-3" />
                {labels.afterFix.replace("{n}", String(example.deltaAfter))}
              </span>
            </div>
          </div>

          {/* Right column: sub-scores + keywords */}
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-x-5 gap-y-3">
              {sub.map((s) => (
                <div key={s.key}>
                  <div className="mb-1 flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-white/75">{labels.subScores[s.key]}</span>
                    <span className="font-bold text-white/90">{s.pct}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#00D4FF] to-[#4F8BFF]"
                      style={{ width: `${s.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Matched */}
            <div>
              <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {labels.matched}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {example.matched.map((k) => (
                  <span
                    key={k}
                    className="rounded-lg border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-100"
                  >
                    {k}
                  </span>
                ))}
              </div>
              <p className="mt-2 text-[10px] italic text-white/60">{labels.demonstratedNote}</p>
            </div>

            {/* Missing */}
            <div>
              <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-amber-300">
                <XCircle className="h-3.5 w-3.5" />
                {labels.missing}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {example.missing.map((k) => (
                  <span
                    key={k}
                    className="rounded-lg border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 text-[11px] font-semibold text-amber-100"
                  >
                    {k}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Determinism footer */}
        <div className="flex items-center justify-center gap-2 border-t border-white/10 bg-white/[0.03] px-6 py-3 text-center text-[11px] font-medium text-white/60">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-[#00D4FF]" />
          {example.role}
        </div>
      </div>
    </div>
  )
}

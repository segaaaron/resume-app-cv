// Presentational pieces of the ATS panel: no state, no data fetching, no props beyond
// what they draw. Lifted out of ATSScorePanel.tsx to shrink the file the CEO reports the
// most bugs in; behaviour is unchanged, these are the same functions moved.

import { AlertCircle } from "lucide-react"
import type { FixAxis } from "@/lib/ats/fix-impact"

export const AXIS_STYLE: Record<FixAxis, string> = {
  match: "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200",
  content: "bg-violet-50 text-violet-700 ring-1 ring-violet-200",
  trust: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
}

/** Pass-risk pill styling — color-not-only (icon + word), readable in the report. */
export const RISK_STYLE: Record<"low" | "medium" | "high", { chip: string; label: string }> = {
  low: { chip: "bg-emerald-50 text-emerald-700 ring-emerald-200", label: "risk_low" },
  medium: { chip: "bg-amber-50 text-amber-700 ring-amber-200", label: "risk_medium" },
  high: { chip: "bg-rose-50 text-rose-700 ring-rose-200", label: "risk_high" },
}

export function ScoreRing({ score, label }: { score: number; label: string }) {
  const r = 70
  const c = 2 * Math.PI * r
  const offset = c - (score / 100) * c
  return (
    <div className="relative flex flex-col items-center gap-2 py-4">
      <div className="relative inline-block" style={{ filter: 'drop-shadow(0 0 20px rgba(0,212,255,0.3))' }}>
        <svg width="160" height="160" viewBox="0 0 160 160">
          <defs>
            <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#00D4FF' }} />
              <stop offset="100%" style={{ stopColor: '#10B981' }} />
            </linearGradient>
          </defs>
          <circle cx="80" cy="80" r="70" fill="none" stroke="rgba(0,212,255,0.08)" strokeWidth="8" />
          <circle cx="80" cy="80" r="70" fill="none" stroke="url(#scoreGrad)" strokeWidth="10"
            strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
            style={{ transform: 'rotate(-90deg)', transformOrigin: 'center', transition: 'stroke-dashoffset 0.8s ease' }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-4xl font-black text-[#1a2e4a] leading-none">{score}</div>
          <div className="text-[10px] font-bold text-dash-cyan uppercase tracking-widest mt-1">{label}</div>
        </div>
      </div>
    </div>
  )
}

// Numbered section header — turns the report into ONE ordered flow (verdict →
// what to fix → rewrites → verify) instead of a stack of disconnected cards.
export function SectionHeader({ n, title }: { n: number; title: string }) {
  return (
    <div className="flex items-center gap-2 pt-1">
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#1a2e4a] text-white text-[10px] font-black shrink-0">{n}</span>
      <span className="text-[11px] font-black uppercase tracking-widest text-[#1a2e4a]">{title}</span>
      <span className="h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent" />
    </div>
  )
}

export function ATSErrorBlock({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-red-200 bg-red-50/80 px-5 py-6 text-center backdrop-blur-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 ring-4 ring-red-50">
        <AlertCircle className="h-5 w-5 text-red-600" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-red-800">{title}</p>
        <p className="text-xs text-red-600 leading-relaxed">{description}</p>
      </div>
    </div>
  )
}

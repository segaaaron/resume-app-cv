import { useTranslations } from "next-intl"

function bandKey(score: number): "excellent" | "good" | "fair" | "poor" {
  if (score >= 85) return "excellent"
  if (score >= 70) return "good"
  if (score >= 50) return "fair"
  return "poor"
}

export default function AtsScoreCard({ score }: { score: number }) {
  const t = useTranslations("tools.atsChecker.score")
  const band = bandKey(score)
  const radius = 84
  const circ = 2 * Math.PI * radius
  const dash = (score / 100) * circ

  return (
    <div className="relative">
      <div className="absolute -inset-1 rounded-3xl bg-gradient-to-br from-[#00D4FF]/30 via-transparent to-[#1a2e4a]/30 blur-2xl" />
      <div className="relative grid grid-cols-1 items-center gap-8 rounded-3xl border border-white/10 bg-gradient-to-br from-[#1a2e4a] to-[#0f1a2e] p-8 md:grid-cols-2 md:p-10">
        <div className="flex items-center justify-center">
          <div className="relative h-[210px] w-[210px]">
            <svg viewBox="0 0 200 200" className="-rotate-90 h-full w-full">
              <defs>
                <linearGradient id="atsGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#00D4FF" />
                  <stop offset="100%" stopColor="#4F8BFF" />
                </linearGradient>
              </defs>
              <circle cx="100" cy="100" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="14" />
              <circle
                cx="100"
                cy="100"
                r={radius}
                fill="none"
                stroke="url(#atsGrad)"
                strokeWidth="14"
                strokeDasharray={`${dash} ${circ - dash}`}
                strokeLinecap="round"
                style={{ transition: "stroke-dasharray 1.2s cubic-bezier(0.22, 1, 0.36, 1)" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-extrabold text-white">{score}</span>
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#00D4FF]">/100</span>
            </div>
          </div>
        </div>
        <div className="space-y-3 text-white">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#00D4FF]/40 bg-[#00D4FF]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.15em] text-[#00D4FF]">
            {t(`band.${band}.label`)}
          </span>
          <h2 className="text-2xl font-extrabold md:text-3xl">{t(`band.${band}.title`)}</h2>
          <p className="text-sm text-white/70">{t(`band.${band}.subtitle`)}</p>
        </div>
      </div>
    </div>
  )
}

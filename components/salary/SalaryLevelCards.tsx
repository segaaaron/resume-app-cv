import type { CountryData, SalaryEntry } from "@/lib/salary/types"
import { LEVELS } from "@/lib/salary/types"
import { formatSalary } from "@/lib/salary/format"

export default function SalaryLevelCards({
  country,
  entry,
  locale,
  labels,
}: {
  country: CountryData
  entry: SalaryEntry
  locale: "en" | "es"
  labels: {
    level: Record<string, string>
    years: Record<string, string>
    percentile: { p25: string; p50: string; p75: string; p90: string }
  }
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {LEVELS.map((lv, idx) => {
        const data = entry[lv]
        const accent = idx === 0
          ? "from-[#0f1a2e] to-[#1a2e4a]"
          : idx === 1
          ? "from-[#1a2e4a] to-[#2a4a6e]"
          : idx === 2
          ? "from-[#1a2e4a] to-[#0a558c]"
          : "from-[#0a558c] to-[#00D4FF]"
        return (
          <div
            key={lv}
            className="relative overflow-hidden rounded-2xl border border-white/40 bg-white/90 p-6 shadow-[0_15px_40px_-15px_rgba(15,26,46,0.2)] backdrop-blur transition-shadow hover:shadow-[0_20px_50px_-15px_rgba(0,212,255,0.25)]"
          >
            <div className={`mb-3 inline-flex rounded-full bg-gradient-to-r ${accent} px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white`}>
              {labels.level[lv]} · {labels.years[lv]}
            </div>
            <p className="mt-2 bg-gradient-to-r from-[#1a2e4a] to-[#00D4FF] bg-clip-text text-4xl font-extrabold tracking-tight text-transparent">
              {formatSalary(data.p50, country, "year", locale)}
            </p>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#1a2e4a]/50">
              {labels.percentile.p50}
            </p>
            <div className="mt-4 grid grid-cols-3 gap-2 border-t border-[#1a2e4a]/8 pt-4 text-xs">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#1a2e4a]/45">{labels.percentile.p25}</p>
                <p className="mt-1 font-bold text-[#1a2e4a]">{formatSalary(data.p25, country, "year", locale)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#1a2e4a]/45">{labels.percentile.p75}</p>
                <p className="mt-1 font-bold text-[#1a2e4a]">{formatSalary(data.p75, country, "year", locale)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#1a2e4a]/45">{labels.percentile.p90}</p>
                <p className="mt-1 font-bold text-[#1a2e4a]">{formatSalary(data.p90, country, "year", locale)}</p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

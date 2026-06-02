import type { CountryData, SalaryEntry } from "@/lib/salary/types"
import { LEVELS } from "@/lib/salary/types"
import { formatSalary } from "@/lib/salary/format"

export default function SalaryBarChart({
  country,
  entry,
  locale,
  labels,
}: {
  country: CountryData
  entry: SalaryEntry
  locale: "en" | "es"
  labels: { level: Record<string, string>; range: string }
}) {
  const maxP90 = Math.max(...LEVELS.map((lv) => entry[lv].p90))
  return (
    <div className="relative overflow-hidden rounded-3xl border border-[#1a2e4a]/10 bg-white/85 p-6 shadow-[0_15px_40px_-15px_rgba(15,26,46,0.18)] backdrop-blur md:p-8">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#1a2e4a]/55">
        {labels.range}
      </p>
      <div className="mt-5 space-y-4">
        {LEVELS.map((lv) => {
          const data = entry[lv]
          const left = (data.p25 / maxP90) * 100
          const right = (data.p90 / maxP90) * 100
          const med = (data.p50 / maxP90) * 100
          return (
            <div key={lv}>
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#1a2e4a]">{labels.level[lv]}</span>
                <span className="font-bold text-[#1a2e4a]">
                  {formatSalary(data.p50, country, "year", locale)}
                </span>
              </div>
              <div className="relative mt-1.5 h-3 rounded-full bg-[#1a2e4a]/8">
                <div
                  className="absolute top-0 h-full rounded-full bg-gradient-to-r from-[#00D4FF]/60 to-[#4F8BFF]/70"
                  style={{ left: `${left}%`, width: `${right - left}%` }}
                />
                <div
                  className="absolute top-1/2 h-4 w-0.5 -translate-y-1/2 bg-[#1a2e4a]"
                  style={{ left: `${med}%` }}
                />
              </div>
              <div className="mt-1 flex justify-between text-[10px] font-medium text-[#1a2e4a]/45">
                <span>{formatSalary(data.p25, country, "year", locale)}</span>
                <span>{formatSalary(data.p90, country, "year", locale)}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

import type { CountryData, ProfessionCategory } from "@/lib/salary/types"
import { getProfessionsByCategory } from "@/lib/salary/professions"
import { buildEntry } from "@/lib/salary/salaries"
import { formatSalary } from "@/lib/salary/format"

export default function SalaryCategoryComparison({
  country,
  locale,
  title,
  subtitle,
  categoryLabels,
}: {
  country: CountryData
  locale: "en" | "es"
  title: string
  subtitle: string
  categoryLabels: Record<string, string>
}) {
  const byCat = getProfessionsByCategory()
  const rows: Array<{ cat: ProfessionCategory; avg: number }> = (
    Object.keys(byCat) as ProfessionCategory[]
  ).map((cat) => {
    const items = byCat[cat]
    const sum = items.reduce((acc, p) => acc + buildEntry(country, p).mid.p50, 0)
    return { cat, avg: Math.round(sum / items.length) }
  })
  rows.sort((a, b) => b.avg - a.avg)
  const max = Math.max(...rows.map((r) => r.avg))

  return (
    <section className="relative mx-auto max-w-4xl px-6 py-16">
      <div className="text-center">
        <h2 className="text-3xl font-extrabold tracking-tight text-[#1a2e4a] md:text-4xl">{title}</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-[#1a2e4a]/65">{subtitle}</p>
      </div>
      <div className="mt-10 overflow-hidden rounded-2xl border border-[#1a2e4a]/10 bg-white/85 p-6 shadow-[0_15px_40px_-15px_rgba(15,26,46,0.18)] backdrop-blur">
        <ul className="space-y-3">
          {rows.map((r) => {
            const pct = (r.avg / max) * 100
            return (
              <li key={r.cat}>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#1a2e4a]">{categoryLabels[r.cat]}</span>
                  <span className="font-bold text-[#1a2e4a]">
                    {formatSalary(r.avg, country, "year", locale)}
                  </span>
                </div>
                <div className="mt-1.5 h-2.5 rounded-full bg-[#1a2e4a]/8">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#00D4FF] to-[#4F8BFF]"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}

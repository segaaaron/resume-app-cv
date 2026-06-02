import Link from "next/link"
import { ArrowRight } from "lucide-react"
import type { CountryData } from "@/lib/salary/types"
import { getCountrySnapshot } from "@/lib/salary/salaries"
import { formatSalary } from "@/lib/salary/format"
import { getProfessionIcon } from "@/lib/salary/iconMap"

export default function SalaryProfessionGrid({
  country,
  locale,
  title,
  subtitle,
  medianLabel,
}: {
  country: CountryData
  locale: "en" | "es"
  title: string
  subtitle: string
  medianLabel: string
}) {
  const snapshot = getCountrySnapshot(country.slug) ?? []
  const sorted = [...snapshot].sort((a, b) => b.p50Mid - a.p50Mid)

  return (
    <section className="relative mx-auto max-w-6xl px-6 py-16">
      <div className="text-center">
        <h2 className="text-3xl font-extrabold tracking-tight text-[#1a2e4a] md:text-4xl">
          {title}
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-[#1a2e4a]/65">{subtitle}</p>
      </div>
      <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map(({ profession, p50Mid }) => {
          const Icon = getProfessionIcon(profession.icon)
          return (
            <Link
              key={profession.slug}
              href={`/${locale}/salary/${country.slug}/${profession.slug}`}
              className="group relative flex items-center gap-4 rounded-2xl border border-[#1a2e4a]/10 bg-white/85 p-5 backdrop-blur transition-all hover:-translate-y-0.5 hover:border-[#00D4FF]/40 hover:shadow-[0_15px_40px_-15px_rgba(0,212,255,0.3)]"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1a2e4a] to-[#0f1a2e] text-[#00D4FF] shadow-lg shadow-[#1a2e4a]/30">
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-bold text-[#1a2e4a]">
                  {profession.name[locale]}
                </h3>
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#1a2e4a]/45">
                  {medianLabel} · {formatSalary(p50Mid, country, "year", locale)}
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-[#1a2e4a]/40 transition-all group-hover:translate-x-0.5 group-hover:text-[#00D4FF]" />
            </Link>
          )
        })}
      </div>
    </section>
  )
}

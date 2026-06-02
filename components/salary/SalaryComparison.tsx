import Link from "next/link"
import type { CountryData, ProfessionInfo } from "@/lib/salary/types"
import { getCrossCountryComparison } from "@/lib/salary/salaries"
import { formatSalary } from "@/lib/salary/format"

export default function SalaryComparison({
  profession,
  excludeCountry,
  locale,
  title,
  subtitle,
  countryLabels,
}: {
  profession: ProfessionInfo
  excludeCountry: CountryData
  locale: "en" | "es"
  title: string
  subtitle: string
  countryLabels: Record<string, string>
}) {
  const items = getCrossCountryComparison(profession.slug, "mid") ?? []
  const others = items.filter((i) => i.country.code !== excludeCountry.code)
  const maxUsd = Math.max(...others.map((o) => o.p50Usd))

  return (
    <section className="relative mx-auto max-w-4xl px-6 py-16">
      <div className="text-center">
        <h2 className="text-3xl font-extrabold tracking-tight text-[#1a2e4a] md:text-4xl">
          {title}
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-[#1a2e4a]/65">{subtitle}</p>
      </div>
      <div className="mt-10 overflow-hidden rounded-2xl border border-[#1a2e4a]/10 bg-white/85 shadow-[0_15px_40px_-15px_rgba(15,26,46,0.18)] backdrop-blur">
        <ul className="divide-y divide-[#1a2e4a]/8">
          {others.map(({ country, p50, p50Usd }) => {
            const pct = (p50Usd / maxUsd) * 100
            return (
              <li key={country.code}>
                <Link
                  href={`/${locale}/salary/${country.slug}/${profession.slug}`}
                  className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-[#00D4FF]/5"
                >
                  <span className="text-2xl">{country.flag}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-[#1a2e4a]">{countryLabels[country.code]}</p>
                    <div className="mt-1.5 h-2 rounded-full bg-[#1a2e4a]/8">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#00D4FF] to-[#4F8BFF]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-[#1a2e4a]">
                      {formatSalary(p50, country, "year", locale)}
                    </p>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#1a2e4a]/45">
                      ≈ ${p50Usd.toLocaleString(locale === "es" ? "es-ES" : "en-US")} USD
                    </p>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}

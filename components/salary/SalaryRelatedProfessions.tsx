import Link from "next/link"
import { ArrowRight } from "lucide-react"
import type { CountryData, ProfessionInfo } from "@/lib/salary/types"
import { getProfessionIcon } from "@/lib/salary/iconMap"

export default function SalaryRelatedProfessions({
  country,
  related,
  locale,
  title,
  subtitle,
}: {
  country: CountryData
  related: ProfessionInfo[]
  locale: "en" | "es"
  title: string
  subtitle: string
}) {
  if (related.length === 0) return null
  return (
    <section className="relative mx-auto max-w-5xl px-6 py-16">
      <div className="text-center">
        <h2 className="text-2xl font-extrabold tracking-tight text-[#1a2e4a] md:text-3xl">{title}</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-[#1a2e4a]/65">{subtitle}</p>
      </div>
      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {related.map((p) => {
          const Icon = getProfessionIcon(p.icon)
          return (
            <Link
              key={p.slug}
              href={`/${locale}/salary/${country.slug}/${p.slug}`}
              className="group flex items-center gap-3 rounded-2xl border border-[#1a2e4a]/10 bg-white/85 p-4 backdrop-blur transition-all hover:-translate-y-0.5 hover:border-[#00D4FF]/40 hover:shadow-[0_15px_40px_-15px_rgba(0,212,255,0.25)]"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#1a2e4a] to-[#0f1a2e] text-[#00D4FF]">
                <Icon className="h-4 w-4" />
              </span>
              <span className="flex-1 truncate text-sm font-bold text-[#1a2e4a]">
                {p.name[locale]}
              </span>
              <ArrowRight className="h-4 w-4 text-[#1a2e4a]/40 transition-transform group-hover:translate-x-0.5 group-hover:text-[#00D4FF]" />
            </Link>
          )
        })}
      </div>
    </section>
  )
}

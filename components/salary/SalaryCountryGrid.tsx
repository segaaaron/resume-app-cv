import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { COUNTRIES } from "@/lib/salary/countries"
import { formatSalary } from "@/lib/salary/format"

export default function SalaryCountryGrid({
  locale,
  title,
  subtitle,
  countryLabels,
  professionsCountLabel,
}: {
  locale: "en" | "es"
  title: string
  subtitle: string
  countryLabels: Record<string, string>
  professionsCountLabel: string
}) {
  return (
    <section className="relative mx-auto max-w-6xl px-6 py-16">
      <div className="text-center">
        <h2 className="text-3xl font-extrabold tracking-tight text-[#1a2e4a] md:text-4xl">
          {title}
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-[#1a2e4a]/65">{subtitle}</p>
      </div>
      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {COUNTRIES.map((c) => (
          <Link
            key={c.code}
            href={`/${locale}/salary/${c.slug}`}
            className="group relative overflow-hidden rounded-2xl border border-white/40 bg-white/85 p-6 shadow-[0_10px_40px_-15px_rgba(15,26,46,0.2)] backdrop-blur transition-all hover:-translate-y-1 hover:shadow-[0_18px_50px_-15px_rgba(0,212,255,0.3)]"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute -top-12 -right-12 h-32 w-32 rounded-full bg-[radial-gradient(circle,_rgba(0,212,255,0.18),_transparent_65%)]"
            />
            <div className="relative flex items-center gap-3">
              <span className="text-4xl leading-none">{c.flag}</span>
              <div>
                <h3 className="text-lg font-bold text-[#1a2e4a]">{countryLabels[c.code]}</h3>
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#1a2e4a]/50">
                  {c.currency} · {formatSalary(c.averageNet, c, "year", locale)}
                </p>
              </div>
            </div>
            <div className="relative mt-4 flex items-center justify-between text-xs">
              <span className="text-[#1a2e4a]/65">{professionsCountLabel}</span>
              <span className="inline-flex items-center gap-1 font-bold text-[#1a2e4a] group-hover:text-[#00D4FF]">
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}

import Link from "next/link"
import { Sparkles } from "lucide-react"
import { COUNTRIES } from "@/lib/salary/countries"
import { PROFESSIONS } from "@/lib/salary/professions"

const PAIRS: Array<{ country: string; profession: string }> = [
  { country: "usa", profession: "software-engineer" },
  { country: "spain", profession: "registered-nurse" },
  { country: "mexico", profession: "doctor" },
  { country: "uk", profession: "data-scientist" },
  { country: "argentina", profession: "software-engineer" },
  { country: "colombia", profession: "marketing-manager" },
  { country: "usa", profession: "product-manager" },
  { country: "spain", profession: "teacher" },
]

export default function SalaryPopularSearches({
  locale,
  title,
  subtitle,
  countryLabels,
}: {
  locale: "en" | "es"
  title: string
  subtitle: string
  countryLabels: Record<string, string>
}) {
  const items = PAIRS.map((pair) => {
    const c = COUNTRIES.find((cc) => cc.slug === pair.country)
    const p = PROFESSIONS.find((pp) => pp.slug === pair.profession)
    if (!c || !p) return null
    return { c, p }
  }).filter(Boolean) as Array<{ c: typeof COUNTRIES[0]; p: typeof PROFESSIONS[0] }>

  return (
    <section className="relative mx-auto max-w-5xl px-6 py-16">
      <div className="text-center">
        <h2 className="text-2xl font-extrabold tracking-tight text-[#1a2e4a] md:text-3xl">{title}</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-[#1a2e4a]/65">{subtitle}</p>
      </div>
      <div className="mt-8 flex flex-wrap justify-center gap-2.5">
        {items.map(({ c, p }) => (
          <Link
            key={`${c.slug}-${p.slug}`}
            href={`/${locale}/salary/${c.slug}/${p.slug}`}
            className="group inline-flex items-center gap-2 rounded-full border border-[#1a2e4a]/12 bg-white/85 px-4 py-2 text-xs font-bold text-[#1a2e4a] backdrop-blur transition-all hover:-translate-y-0.5 hover:border-[#00D4FF]/45 hover:shadow-[0_10px_30px_-12px_rgba(0,212,255,0.35)]"
          >
            <Sparkles className="h-3.5 w-3.5 text-[#00D4FF]" />
            <span>{p.name[locale]}</span>
            <span className="text-[#1a2e4a]/55">·</span>
            <span>{c.flag} {countryLabels[c.code]}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}

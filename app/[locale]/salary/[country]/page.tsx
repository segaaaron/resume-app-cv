import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { ArrowRight, Globe, Coins, Briefcase, TrendingUp, Zap } from "lucide-react"
import Navbar from "@/components/marketing/Navbar"
import Footer from "@/components/marketing/Footer"
import SalarySchemas from "@/components/salary/SalarySchemas"
import SalaryProfessionGrid from "@/components/salary/SalaryProfessionGrid"
import SalaryCategoryComparison from "@/components/salary/SalaryCategoryComparison"
import SalaryFAQ from "@/components/salary/SalaryFAQ"
import { COUNTRIES, getCountry } from "@/lib/salary/countries"
import { PROFESSIONS, getProfessionsByCategory } from "@/lib/salary/professions"
import { buildEntry } from "@/lib/salary/salaries"
import { formatSalary } from "@/lib/salary/format"

const BASE_URL = "https://readycvv.com"
const LOCALES = ["en", "es"] as const

export function generateStaticParams() {
  const params: { locale: string; country: string }[] = []
  for (const locale of LOCALES) {
    for (const c of COUNTRIES) {
      params.push({ locale, country: c.slug })
    }
  }
  return params
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; country: string }>
}): Promise<Metadata> {
  const { locale, country: countrySlug } = await params
  const country = getCountry(countrySlug)
  if (!country) return {}
  const tCountries = await getTranslations({ locale, namespace: "salary.country_names" })
  const t = await getTranslations({ locale, namespace: "salary.country.meta" })
  const countryName = tCountries(country.code)
  const title = t("title", { country: countryName })
  const description = t("description", { country: countryName })
  const canonical = `${BASE_URL}/${locale}/salary/${country.slug}`

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        en: `${BASE_URL}/en/salary/${country.slug}`,
        es: `${BASE_URL}/es/salary/${country.slug}`,
        "x-default": `${BASE_URL}/en/salary/${country.slug}`,
      },
    },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "website",
      images: [
        {
          url: `${BASE_URL}/api/og?title=${encodeURIComponent(title)}&type=tool&locale=${locale}`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  }
}

export default async function CountrySalaryPage({
  params,
}: {
  params: Promise<{ locale: string; country: string }>
}) {
  const { locale, country: countrySlug } = await params
  setRequestLocale(locale)
  const country = getCountry(countrySlug)
  if (!country) notFound()

  const tCountries = await getTranslations({ locale, namespace: "salary.country_names" })
  const tCats = await getTranslations({ locale, namespace: "salary.category_names" })
  const t = await getTranslations({ locale, namespace: "salary.country" })
  const tShared = await getTranslations({ locale, namespace: "salary.shared" })
  const tPct = await getTranslations({ locale, namespace: "salary.shared.percentile" })

  const countryName = tCountries(country.code)
  const canonical = `${BASE_URL}/${locale}/salary/${country.slug}`

  // Top paying field
  const byCat = getProfessionsByCategory()
  const catAverages = (Object.keys(byCat) as Array<keyof typeof byCat>).map((cat) => {
    const items = byCat[cat]
    const sum = items.reduce((acc, p) => acc + buildEntry(country, p).mid.p50, 0)
    return { cat, avg: Math.round(sum / items.length) }
  })
  catAverages.sort((a, b) => b.avg - a.avg)
  const topField = catAverages[0]

  const countryLabels = {
    usa: tCountries("usa"),
    uk: tCountries("uk"),
    spain: tCountries("spain"),
    mexico: tCountries("mexico"),
    argentina: tCountries("argentina"),
    colombia: tCountries("colombia"),
  } as Record<string, string>
  const categoryLabels: Record<string, string> = {
    tech: tCats("tech"),
    business: tCats("business"),
    healthcare: tCats("healthcare"),
    education: tCats("education"),
    legal: tCats("legal"),
    trades: tCats("trades"),
    service: tCats("service"),
  }

  // Schemas
  const datasetSchema = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: `${countryName} 2026 salaries by profession`,
    description: `Salary estimates for 30 professions in ${countryName} across 4 experience levels.`,
    url: canonical,
    keywords: [countryName, "salary", "wages", "compensation"],
    creator: { "@type": "Organization", name: "ReadyCVV", url: BASE_URL },
    spatialCoverage: countryName,
    variableMeasured: ["median salary", "25th percentile", "75th percentile", "90th percentile"],
  }
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: tShared("home"), item: `${BASE_URL}/${locale}` },
      {
        "@type": "ListItem",
        position: 2,
        name: "Salary Calculator",
        item: `${BASE_URL}/${locale}/tools/salary-calculator`,
      },
      { "@type": "ListItem", position: 3, name: countryName, item: canonical },
    ],
  }
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [1, 2, 3, 4].map((i) => ({
      "@type": "Question",
      name: t(`faq.q${i}`),
      acceptedAnswer: {
        "@type": "Answer",
        text: t(`faq.a${i}`, { country: countryName }),
      },
    })),
  }

  const faqItems = [1, 2, 3, 4].map((i) => ({
    q: t(`faq.q${i}`),
    a: t(`faq.a${i}`, { country: countryName }),
  }))

  return (
    <>
      <SalarySchemas schemas={[datasetSchema, breadcrumbSchema, faqSchema]} />
      <Navbar />
      <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#f7fafc] via-white to-[#f0f6fb]">
        <div aria-hidden className="pointer-events-none absolute -top-40 left-1/2 h-[600px] w-[1100px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,_rgba(0,212,255,0.18),_transparent_60%)]" />

        {/* Breadcrumb */}
        <nav className="relative mx-auto max-w-6xl px-6 pt-8 text-xs">
          <ol className="flex flex-wrap items-center gap-1.5 text-[#1a2e4a]/55">
            <li><Link href={`/${locale}`} className="hover:text-[#1a2e4a]">{tShared("home")}</Link></li>
            <li>/</li>
            <li><Link href={`/${locale}/tools/salary-calculator`} className="hover:text-[#1a2e4a]">{tShared("breadcrumb.tool")}</Link></li>
            <li>/</li>
            <li className="font-bold text-[#1a2e4a]">{countryName}</li>
          </ol>
        </nav>

        {/* Hero */}
        <section className="relative mx-auto max-w-4xl px-6 pt-10 pb-12 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#00D4FF]/30 bg-white/80 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.15em] text-[#1a2e4a] shadow-sm backdrop-blur">
            <Globe className="h-3.5 w-3.5 text-[#00D4FF]" />
            {t("hero.eyebrow")}
          </span>
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-[#1a2e4a] md:text-5xl lg:text-6xl">
            <span className="mr-3 text-4xl md:text-5xl">{country.flag}</span>
            {t("hero.title", { country: countryName })}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-[#1a2e4a]/70 md:text-lg">
            {t("hero.subtitle", { country: countryName })}
          </p>
        </section>

        {/* Overview */}
        <section className="relative mx-auto max-w-5xl px-6 pb-10">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              {
                icon: TrendingUp,
                label: t("overview.averageNet"),
                value: formatSalary(country.averageNet, country, "year", locale as "en" | "es"),
              },
              {
                icon: Briefcase,
                label: t("overview.topPaying"),
                value: categoryLabels[topField.cat],
              },
              {
                icon: Coins,
                label: t("overview.currency"),
                value: `${country.currency} ${country.currencySymbol}`,
              },
              {
                icon: Globe,
                label: t("overview.professions"),
                value: String(PROFESSIONS.length),
              },
            ].map((s, i) => (
              <div
                key={i}
                className="relative overflow-hidden rounded-2xl border border-white/40 bg-white/85 p-5 backdrop-blur shadow-[0_10px_30px_-15px_rgba(15,26,46,0.18)]"
              >
                <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#1a2e4a] to-[#0f1a2e] text-[#00D4FF]">
                  <s.icon className="h-4 w-4" />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#1a2e4a]/55">{s.label}</p>
                <p className="mt-1 text-base font-bold text-[#1a2e4a]">{s.value}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Profession grid */}
        <SalaryProfessionGrid
          country={country}
          locale={locale as "en" | "es"}
          title={t("professionsTitle")}
          subtitle={t("professionsSubtitle", { country: countryName })}
          medianLabel={tPct("p50")}
        />

        {/* Category comparison */}
        <SalaryCategoryComparison
          country={country}
          locale={locale as "en" | "es"}
          title={t("comparisonTitle")}
          subtitle={t("comparisonSubtitle")}
          categoryLabels={categoryLabels}
        />

        {/* Methodology */}
        <section className="relative mx-auto max-w-3xl px-6 py-10">
          <div className="rounded-2xl border border-[#1a2e4a]/10 bg-white/85 p-6 backdrop-blur shadow-[0_10px_30px_-15px_rgba(15,26,46,0.15)]">
            <h2 className="text-lg font-bold text-[#1a2e4a]">{t("methodology.title")}</h2>
            <p className="mt-2 text-sm text-[#1a2e4a]/70">{t("methodology.body")}</p>
            <p className="mt-3 text-[11px] font-medium text-[#1a2e4a]/55">{tShared("disclaimer")} · {tShared("lastUpdated")}</p>
          </div>
        </section>

        {/* Other countries */}
        <section className="relative mx-auto max-w-5xl px-6 py-10">
          <div className="flex flex-wrap justify-center gap-2.5">
            {COUNTRIES.filter((c) => c.code !== country.code).map((c) => (
              <Link
                key={c.code}
                href={`/${locale}/salary/${c.slug}`}
                className="inline-flex items-center gap-2 rounded-full border border-[#1a2e4a]/12 bg-white/85 px-4 py-2 text-xs font-bold text-[#1a2e4a] backdrop-blur transition-all hover:-translate-y-0.5 hover:border-[#00D4FF]/45"
              >
                <span>{c.flag}</span>
                <span>{countryLabels[c.code]}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <SalaryFAQ title={t("faq.title")} items={faqItems} />

        {/* CTA */}
        <section className="relative mx-auto max-w-5xl px-6 pb-24">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#1a2e4a] to-[#0f1a2e] p-10 text-center text-white md:p-14">
            <div aria-hidden className="pointer-events-none absolute -top-20 left-1/2 h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,_rgba(0,212,255,0.25),_transparent_60%)]" />
            <Zap className="relative mx-auto mb-3 h-7 w-7 text-[#00D4FF]" />
            <h2 className="relative text-3xl font-extrabold md:text-4xl">{t("cta.title", { country: countryName })}</h2>
            <p className="relative mx-auto mt-3 max-w-xl text-sm text-white/70 md:text-base">{t("cta.subtitle", { country: countryName })}</p>
            <Link
              href={`/${locale}/pricing`}
              className="group relative mt-7 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#00D4FF] to-[#4F8BFF] px-7 py-3.5 text-sm font-bold text-[#0f1a2e] shadow-[0_15px_40px_-10px_rgba(0,212,255,0.55)] transition-all hover:scale-[1.02]"
            >
              {t("cta.button")}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}

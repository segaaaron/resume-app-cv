import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { ArrowRight, Award, Briefcase, Sparkles, TrendingUp, Zap } from "lucide-react"
import Navbar from "@/components/marketing/Navbar"
import Footer from "@/components/marketing/Footer"
import SalarySchemas from "@/components/salary/SalarySchemas"
import SalaryLevelCards from "@/components/salary/SalaryLevelCards"
import SalaryBarChart from "@/components/salary/SalaryBarChart"
import SalaryComparison from "@/components/salary/SalaryComparison"
import SalaryRelatedProfessions from "@/components/salary/SalaryRelatedProfessions"
import SalaryFAQ from "@/components/salary/SalaryFAQ"
import { COUNTRIES, getCountry } from "@/lib/salary/countries"
import { PROFESSIONS, getProfession } from "@/lib/salary/professions"
import { buildEntry, getRelatedProfessions } from "@/lib/salary/salaries"
import { formatSalary } from "@/lib/salary/format"
import { getProfessionIcon } from "@/lib/salary/iconMap"

const BASE_URL = "https://readycvv.com"
const LOCALES = ["en", "es"] as const

export function generateStaticParams() {
  const params: { locale: string; country: string; profession: string }[] = []
  for (const locale of LOCALES) {
    for (const c of COUNTRIES) {
      for (const p of PROFESSIONS) {
        params.push({ locale, country: c.slug, profession: p.slug })
      }
    }
  }
  return params
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; country: string; profession: string }>
}): Promise<Metadata> {
  const { locale, country: cs, profession: ps } = await params
  const country = getCountry(cs)
  const profession = getProfession(ps)
  if (!country || !profession) return {}
  const tCountries = await getTranslations({ locale, namespace: "salary.country_names" })
  const t = await getTranslations({ locale, namespace: "salary.profession.meta" })
  const countryName = tCountries(country.code)
  const professionName = profession.name[locale as "en" | "es"]
  const title = t("title", { profession: professionName, country: countryName })
  const description = t("description", { profession: professionName, country: countryName })
  const canonical = `${BASE_URL}/${locale}/salary/${country.slug}/${profession.slug}`

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        en: `${BASE_URL}/en/salary/${country.slug}/${profession.slug}`,
        es: `${BASE_URL}/es/salary/${country.slug}/${profession.slug}`,
        "x-default": `${BASE_URL}/en/salary/${country.slug}/${profession.slug}`,
      },
    },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "article",
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

export default async function ProfessionCountryPage({
  params,
}: {
  params: Promise<{ locale: string; country: string; profession: string }>
}) {
  const { locale, country: cs, profession: ps } = await params
  setRequestLocale(locale)
  const country = getCountry(cs)
  const profession = getProfession(ps)
  if (!country || !profession) notFound()

  const t = await getTranslations({ locale, namespace: "salary.profession" })
  const tShared = await getTranslations({ locale, namespace: "salary.shared" })
  const tLevel = await getTranslations({ locale, namespace: "salary.shared.level" })
  const tYears = await getTranslations({ locale, namespace: "salary.shared.levelYears" })
  const tPct = await getTranslations({ locale, namespace: "salary.shared.percentile" })
  const tCountries = await getTranslations({ locale, namespace: "salary.country_names" })

  const countryName = tCountries(country.code)
  const professionName = profession.name[locale as "en" | "es"]
  const entry = buildEntry(country, profession)
  const related = getRelatedProfessions(profession.slug, 6)
  const canonical = `${BASE_URL}/${locale}/salary/${country.slug}/${profession.slug}`

  const countryLabels = {
    usa: tCountries("usa"),
    uk: tCountries("uk"),
    spain: tCountries("spain"),
    mexico: tCountries("mexico"),
    argentina: tCountries("argentina"),
    colombia: tCountries("colombia"),
  } as Record<string, string>

  const levelLabels = {
    entry: tLevel("entry"),
    mid: tLevel("mid"),
    senior: tLevel("senior"),
    lead: tLevel("lead"),
  }
  const yearsLabels = {
    entry: tYears("entry"),
    mid: tYears("mid"),
    senior: tYears("senior"),
    lead: tYears("lead"),
  }
  const percentileLabels = {
    p25: tPct("p25"),
    p50: tPct("p50"),
    p75: tPct("p75"),
    p90: tPct("p90"),
  }

  // Schemas
  const datasetSchema = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: `${professionName} salaries in ${countryName}`,
    description: `Salary estimates for ${professionName} in ${countryName} in 2026, by experience level and percentile.`,
    url: canonical,
    keywords: [
      ...profession.searchTerms,
      countryName,
      professionName,
      "salary",
      "compensation",
    ],
    creator: { "@type": "Organization", name: "ReadyCVV", url: BASE_URL },
    distribution: {
      "@type": "DataDownload",
      encodingFormat: "text/html",
      contentUrl: canonical,
    },
    variableMeasured: ["median salary", "25th percentile", "75th percentile", "90th percentile"],
    spatialCoverage: countryName,
  }
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `${professionName} salary in ${countryName} 2026`,
    description: `Median, p25 and p90 salary for ${professionName} across experience levels in ${countryName}.`,
    author: { "@type": "Organization", name: "ReadyCVV", url: BASE_URL },
    publisher: { "@type": "Organization", name: "ReadyCVV", url: BASE_URL },
    datePublished: "2026-06-01",
    dateModified: "2026-06-01",
    mainEntityOfPage: canonical,
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
      {
        "@type": "ListItem",
        position: 3,
        name: countryName,
        item: `${BASE_URL}/${locale}/salary/${country.slug}`,
      },
      { "@type": "ListItem", position: 4, name: professionName, item: canonical },
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
        text: t(`faq.a${i}`, { country: countryName, profession: professionName }),
      },
    })),
  }

  const Icon = getProfessionIcon(profession.icon)
  const faqItems = [1, 2, 3, 4].map((i) => ({
    q: t(`faq.q${i}`),
    a: t(`faq.a${i}`, { country: countryName, profession: professionName }),
  }))

  const range = `${formatSalary(entry.mid.p25, country, "year", locale as "en" | "es")} – ${formatSalary(entry.mid.p90, country, "year", locale as "en" | "es")}`

  return (
    <>
      <SalarySchemas schemas={[datasetSchema, articleSchema, breadcrumbSchema, faqSchema]} />
      <Navbar />
      <main id="main-content" className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#f7fafc] via-white to-[#f0f6fb]">
        <div aria-hidden className="pointer-events-none absolute -top-40 left-1/2 h-[600px] w-[1100px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,_rgba(0,212,255,0.18),_transparent_60%)]" />

        {/* Breadcrumb */}
        <nav className="relative mx-auto max-w-6xl px-6 pt-8 text-xs">
          <ol className="flex flex-wrap items-center gap-1.5 text-[#1a2e4a]/55">
            <li><Link href={`/${locale}`} className="hover:text-[#1a2e4a]">{tShared("home")}</Link></li>
            <li>/</li>
            <li><Link href={`/${locale}/tools/salary-calculator`} className="hover:text-[#1a2e4a]">{tShared("breadcrumb.tool")}</Link></li>
            <li>/</li>
            <li><Link href={`/${locale}/salary/${country.slug}`} className="hover:text-[#1a2e4a]">{country.flag} {countryName}</Link></li>
            <li>/</li>
            <li className="font-bold text-[#1a2e4a]">{professionName}</li>
          </ol>
        </nav>

        {/* Hero */}
        <section className="relative mx-auto max-w-4xl px-6 pt-10 pb-10 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#00D4FF]/30 bg-white/80 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.15em] text-[#1a2e4a] shadow-sm backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-[#00D4FF]" />
            {t("hero.eyebrow")}
          </span>
          <div className="mt-6 flex items-center justify-center gap-3">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1a2e4a] to-[#0f1a2e] text-[#00D4FF] shadow-lg shadow-[#1a2e4a]/30">
              <Icon className="h-6 w-6" />
            </span>
            <span className="text-4xl md:text-5xl">{country.flag}</span>
          </div>
          <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-[#1a2e4a] md:text-5xl">
            {t("hero.title", { profession: professionName, country: countryName })}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-[#1a2e4a]/65 md:text-base">{t("hero.subtitle")}</p>
        </section>

        {/* Big number */}
        <section className="relative mx-auto max-w-3xl px-6 pb-10">
          <div className="relative overflow-hidden rounded-3xl border border-white/40 bg-gradient-to-br from-[#1a2e4a] to-[#0f1a2e] p-8 text-center text-white shadow-[0_30px_80px_-20px_rgba(15,26,46,0.5)] md:p-12">
            <div aria-hidden className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[radial-gradient(circle,_rgba(0,212,255,0.28),_transparent_65%)]" />
            <p className="relative text-[10px] font-bold uppercase tracking-[0.2em] text-[#00D4FF]">
              {t("summary.level")} · {levelLabels.mid}
            </p>
            <p className="relative mt-3 bg-gradient-to-r from-[#00D4FF] to-[#4F8BFF] bg-clip-text text-6xl font-extrabold tracking-tight text-transparent md:text-7xl">
              {formatSalary(entry.mid.p50, country, "year", locale as "en" | "es")}
            </p>
            <p className="relative mt-3 text-sm text-white/70">{t("summary.median")}</p>
            <div className="relative mt-6 inline-flex items-center gap-3 rounded-2xl border border-white/15 bg-white/5 px-5 py-3 backdrop-blur">
              <Award className="h-4 w-4 text-[#00D4FF]" />
              <span className="text-xs font-bold uppercase tracking-wider text-white/65">{t("summary.range")}</span>
              <span className="text-sm font-bold text-white">{range}</span>
            </div>
          </div>
        </section>

        {/* Level cards */}
        <section className="relative mx-auto max-w-5xl px-6 py-10">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-[#1a2e4a] md:text-4xl">{t("levels.title")}</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-[#1a2e4a]/65">{t("levels.subtitle")}</p>
          </div>
          <div className="mt-10">
            <SalaryLevelCards
              country={country}
              entry={entry}
              locale={locale as "en" | "es"}
              labels={{
                level: levelLabels,
                years: yearsLabels,
                percentile: percentileLabels,
              }}
            />
          </div>
        </section>

        {/* Chart */}
        <section className="relative mx-auto max-w-4xl px-6 py-10">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-extrabold tracking-tight text-[#1a2e4a] md:text-4xl">{t("chart.title")}</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-[#1a2e4a]/65">{t("chart.subtitle")}</p>
          </div>
          <SalaryBarChart
            country={country}
            entry={entry}
            locale={locale as "en" | "es"}
            labels={{ level: levelLabels, range: t("chart.title") }}
          />
        </section>

        {/* Cross country */}
        <SalaryComparison
          profession={profession}
          excludeCountry={country}
          locale={locale as "en" | "es"}
          title={t("cross.title")}
          subtitle={t("cross.subtitle", { profession: professionName })}
          countryLabels={countryLabels}
        />

        {/* Tips */}
        <section className="relative mx-auto max-w-4xl px-6 py-10">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-[#1a2e4a] md:text-4xl">
              {t("tips.title", { profession: professionName })}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-[#1a2e4a]/65">{t("tips.subtitle")}</p>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
            {[1, 2, 3].map((i) => {
              const TipIcon = i === 1 ? Briefcase : i === 2 ? TrendingUp : Award
              return (
                <div
                  key={i}
                  className="relative overflow-hidden rounded-2xl border border-white/40 bg-white/90 p-6 shadow-[0_10px_30px_-15px_rgba(15,26,46,0.18)] backdrop-blur transition-all hover:-translate-y-1 hover:shadow-[0_18px_50px_-15px_rgba(0,212,255,0.25)]"
                >
                  <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1a2e4a] to-[#0f1a2e] text-[#00D4FF]">
                    <TipIcon className="h-4 w-4" />
                  </div>
                  <h3 className="text-base font-bold text-[#1a2e4a]">{t(`tips.tip${i}Title`)}</h3>
                  <p className="mt-1.5 text-sm text-[#1a2e4a]/65">{t(`tips.tip${i}Body`)}</p>
                </div>
              )
            })}
          </div>
        </section>

        {/* Related */}
        <SalaryRelatedProfessions
          country={country}
          related={related}
          locale={locale as "en" | "es"}
          title={t("related.title")}
          subtitle={t("related.subtitle")}
        />

        {/* Disclaimer */}
        <section className="relative mx-auto max-w-3xl px-6 pb-10">
          <div className="rounded-2xl border border-[#1a2e4a]/10 bg-white/70 px-6 py-4 text-center text-xs font-medium text-[#1a2e4a]/65 backdrop-blur">
            {tShared("disclaimer")} · {tShared("lastUpdated")}
          </div>
        </section>

        {/* FAQ */}
        <SalaryFAQ title={t("faq.title")} items={faqItems} />

        {/* CTA */}
        <section className="relative mx-auto max-w-5xl px-6 pb-24">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#1a2e4a] to-[#0f1a2e] p-10 text-center text-white md:p-14">
            <div aria-hidden className="pointer-events-none absolute -top-20 left-1/2 h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,_rgba(0,212,255,0.25),_transparent_60%)]" />
            <Zap className="relative mx-auto mb-3 h-7 w-7 text-[#00D4FF]" />
            <h2 className="relative text-3xl font-extrabold md:text-4xl">{t("cta.title", { profession: professionName, country: countryName })}</h2>
            <p className="relative mx-auto mt-3 max-w-xl text-sm text-white/70 md:text-base">{t("cta.subtitle")}</p>
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

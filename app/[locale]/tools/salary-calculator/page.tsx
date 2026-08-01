import type { Metadata } from "next"
import Link from "next/link"
import { getTranslations, setRequestLocale } from "next-intl/server"
import {
  ArrowRight,
  CheckCircle2,
  Globe,
  Search,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react"
import Navbar from "@/components/marketing/Navbar"
import Footer from "@/components/marketing/Footer"
import SalaryCalculatorForm from "@/components/tools/salary-calculator/SalaryCalculatorForm"
import SalaryCountryGrid from "@/components/salary/SalaryCountryGrid"
import { PROFESSIONS } from "@/lib/salary/professions"
import SalaryPopularSearches from "@/components/salary/SalaryPopularSearches"
import SalaryFAQ from "@/components/salary/SalaryFAQ"
import SalarySchemas from "@/components/salary/SalarySchemas"

const BASE_URL = "https://valhallaresume.com"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "tools.salaryCalculator.meta" })
  return {
    title: t("title"),
    description: t("description"),
    keywords: [
      "salary calculator",
      "salary checker",
      "average salary by country",
      "salary range by profession",
      "calculadora de salario",
      "calculadora salarial",
      "sueldo por profesión",
      "salario medio por país",
    ],
    alternates: {
      canonical: `${BASE_URL}/${locale}/tools/salary-calculator`,
      languages: {
        en: `${BASE_URL}/en/tools/salary-calculator`,
        es: `${BASE_URL}/es/tools/salary-calculator`,
        "x-default": `${BASE_URL}/en/tools/salary-calculator`,
      },
    },
    openGraph: {
      title: t("title"),
      description: t("description"),
      url: `${BASE_URL}/${locale}/tools/salary-calculator`,
      type: "website",
      images: [
        {
          url: `${BASE_URL}/api/og?title=${encodeURIComponent(t("ogTitle"))}&type=tool&locale=${locale}`,
          width: 1200,
          height: 630,
          alt: t("title"),
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
    },
  }
}

export default async function SalaryCalculatorPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: "tools.salaryCalculator" })
  const tCountries = await getTranslations({ locale, namespace: "salary.country_names" })
  const tShared = await getTranslations({ locale, namespace: "salary.shared" })

  const countryLabels: Record<string, string> = {
    usa: tCountries("usa"),
    uk: tCountries("uk"),
    spain: tCountries("spain"),
    mexico: tCountries("mexico"),
    argentina: tCountries("argentina"),
    colombia: tCountries("colombia"),
  }

  const canonical = `${BASE_URL}/${locale}/tools/salary-calculator`

  const webApp = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: t("meta.title"),
    description: t("meta.description"),
    applicationCategory: "BusinessApplication",
    operatingSystem: "Any",
    url: canonical,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    publisher: { "@type": "Organization", name: "Valhalla Resume", url: BASE_URL },
  }
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [1, 2, 3, 4, 5].map((i) => ({
      "@type": "Question",
      name: t(`faq.q${i}`),
      acceptedAnswer: { "@type": "Answer", text: t(`faq.a${i}`) },
    })),
  }
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${BASE_URL}/${locale}` },
      { "@type": "ListItem", position: 2, name: "Tools", item: `${BASE_URL}/${locale}/tools/ats-checker` },
      { "@type": "ListItem", position: 3, name: t("meta.title"), item: canonical },
    ],
  }

  const steps = [
    { icon: Globe, title: t("how.s1Title"), body: t("how.s1Body") },
    { icon: Search, title: t("how.s2Title"), body: t("how.s2Body") },
    { icon: TrendingUp, title: t("how.s3Title"), body: t("how.s3Body") },
  ]

  const faqItems = [1, 2, 3, 4, 5].map((i) => ({
    q: t(`faq.q${i}`),
    a: t(`faq.a${i}`),
  }))

  return (
    <>
      <SalarySchemas schemas={[webApp, faqLd, breadcrumbLd]} />
      <Navbar />
      <main id="main-content" className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#f7fafc] via-white to-[#f0f6fb]">
        <div aria-hidden className="pointer-events-none absolute -top-40 left-1/2 h-[600px] w-[1100px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,_rgba(0,212,255,0.18),_transparent_60%)]" />
        <div aria-hidden className="pointer-events-none absolute top-32 right-0 h-[400px] w-[400px] rounded-full bg-[radial-gradient(circle,_rgba(26,46,74,0.12),_transparent_60%)]" />

        {/* Hero */}
        <section className="relative mx-auto max-w-4xl px-6 pt-20 pb-10 text-center md:pt-28">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#00D4FF]/30 bg-white/80 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.15em] text-[#1a2e4a] shadow-sm backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-[#00D4FF]" />
            {t("hero.badge")}
          </span>
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-[#1a2e4a] md:text-6xl lg:text-7xl">
            {t.rich("hero.title", {
              accent: (chunks) => (
                <span className="bg-gradient-to-r from-[#00D4FF] to-[#4F8BFF] bg-clip-text text-transparent">
                  {chunks}
                </span>
              ),
            })}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-[#1a2e4a]/70 md:text-lg">{t("hero.subtitle")}</p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-[#1a2e4a]/65">
            <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> {t("hero.feat1")}</span>
            <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> {t("hero.feat2")}</span>
            <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> {t("hero.feat3")}</span>
          </div>
        </section>

        {/* Calculator */}
        <section className="relative mx-auto max-w-3xl px-6 pb-12">
          <SalaryCalculatorForm />
        </section>

        {/* Trust */}
        <section className="relative mx-auto max-w-4xl px-6 pb-6">
          <div className="rounded-2xl border border-[#1a2e4a]/10 bg-white/70 px-6 py-4 text-center text-sm font-semibold text-[#1a2e4a]/75 backdrop-blur">
            {t("trust")}
          </div>
        </section>

        {/* How */}
        <section className="relative mx-auto max-w-5xl px-6 py-20">
          <h2 className="text-center text-3xl font-extrabold tracking-tight text-[#1a2e4a] md:text-4xl">{t("how.title")}</h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-sm text-[#1a2e4a]/65">{t("how.subtitle")}</p>
          <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
            {steps.map((s, i) => (
              <div key={i} className="relative rounded-2xl border border-white/40 bg-white/80 p-6 shadow-[0_10px_40px_-15px_rgba(15,26,46,0.2)] backdrop-blur transition-all hover:-translate-y-1 hover:shadow-[0_18px_50px_-15px_rgba(0,212,255,0.25)]">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1a2e4a] to-[#0f1a2e] text-[#00D4FF] shadow-lg shadow-[#1a2e4a]/30">
                  <s.icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-[#1a2e4a]">{s.title}</h3>
                <p className="mt-1.5 text-sm text-[#1a2e4a]/65">{s.body}</p>
                <span className="absolute right-5 top-5 text-3xl font-extrabold text-[#1a2e4a]/8 select-none">0{i + 1}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Countries */}
        <SalaryCountryGrid
          locale={locale as "en" | "es"}
          title={t("featuredCountries.title")}
          subtitle={t("featuredCountries.subtitle")}
          countryLabels={countryLabels}
          professionsCountLabel={tShared("professionsCount", { count: PROFESSIONS.length })}
        />

        {/* Popular */}
        <SalaryPopularSearches
          locale={locale as "en" | "es"}
          title={t("popular.title")}
          subtitle={t("popular.subtitle")}
          countryLabels={countryLabels}
        />

        {/* FAQ */}
        <SalaryFAQ title={t("faq.title")} items={faqItems} />

        {/* Bottom CTA */}
        <section className="relative mx-auto max-w-5xl px-6 pb-24">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#1a2e4a] to-[#0f1a2e] p-10 text-center text-white md:p-14">
            <div aria-hidden className="pointer-events-none absolute -top-20 left-1/2 h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,_rgba(0,212,255,0.25),_transparent_60%)]" />
            <Zap className="relative mx-auto mb-3 h-7 w-7 text-[#00D4FF]" />
            <h2 className="relative text-3xl font-extrabold md:text-4xl">{t("bottomCta.title")}</h2>
            <p className="relative mx-auto mt-3 max-w-xl text-sm text-white/70 md:text-base">{t("bottomCta.subtitle")}</p>
            <Link
              href={`/${locale}/pricing`}
              className="group relative mt-7 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#00D4FF] to-[#4F8BFF] px-7 py-3.5 text-sm font-bold text-[#0f1a2e] shadow-[0_15px_40px_-10px_rgba(0,212,255,0.55)] transition-all hover:scale-[1.02]"
            >
              {t("bottomCta.button")}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}

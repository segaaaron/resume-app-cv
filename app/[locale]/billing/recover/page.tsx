import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { CreditCard, AlertCircle, HelpCircle, Mail } from "lucide-react"
import { auth } from "@/lib/auth"
import Navbar from "@/components/marketing/Navbar"
import Footer from "@/components/marketing/Footer"
import RecoverPortalButton from "./RecoverPortalButton"

// Reads the authenticated session — must stay dynamic (the [locale] layout now
// enables static rendering by default for the subtree).
export const dynamic = "force-dynamic"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "billing.recover" })
  return {
    title: t("meta_title"),
    description: t("meta_description"),
    robots: { index: false, follow: false },
  }
}

export default async function BillingRecoverPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: "billing.recover" })

  const session = await auth()
  // Managed users have no Stripe relationship — billing recovery is meaningless for them.
  if (session?.user?.isManaged) {
    redirect(`/${locale}/dashboard/resumes`)
  }
  const isAuthenticated = !!session?.user
  const returnTo = encodeURIComponent(`/${locale}/billing/recover`)
  const loginHref = `/${locale}/login?callbackUrl=${returnTo}`

  const faqs: Array<{ q: string; a: string }> = [
    { q: t("faq.q1"), a: t("faq.a1") },
    { q: t("faq.q2"), a: t("faq.a2") },
    { q: t("faq.q3"), a: t("faq.a3") },
  ]

  const benefits: string[] = [
    t("benefits.b1"),
    t("benefits.b2"),
    t("benefits.b3"),
  ]

  return (
    <>
      <Navbar />
      <main id="main-content" className="min-h-screen bg-gradient-to-b from-[#0f1a2e] via-[#1a2e4a] to-[#0f1a2e]">
        {/* Hero */}
        <section className="relative px-4 pt-20 pb-12 md:pt-28 md:pb-16">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#00D4FF]/60 to-transparent" />
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-[#00D4FF]/20 to-[#00D4FF]/5 border border-[#00D4FF]/30 shadow-[0_8px_32px_rgba(0,212,255,0.25)] mb-6">
              <CreditCard className="w-10 h-10 text-[#00D4FF]" strokeWidth={1.5} />
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
              {t("hero.title")}
            </h1>
            <p className="text-base md:text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto">
              {t("hero.subtitle")}
            </p>
          </div>
        </section>

        {/* Why this matters card */}
        <section className="px-4 pb-12">
          <div className="mx-auto max-w-2xl">
            <div className="rounded-2xl bg-white/[0.04] backdrop-blur-sm border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)] p-6 md:p-8">
              <div className="flex items-start gap-4 mb-5">
                <div className="shrink-0 w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-amber-400" strokeWidth={2} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white mb-1">{t("why.title")}</h2>
                  <p className="text-sm text-slate-300 leading-relaxed">{t("why.body")}</p>
                </div>
              </div>
              <ul className="space-y-2 pl-14">
                {benefits.map((b, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-200">
                    <span className="text-[#00D4FF] mt-0.5">✓</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Primary CTA */}
        <section className="px-4 pb-16">
          <div className="mx-auto max-w-2xl">
            {isAuthenticated ? (
              <RecoverPortalButton locale={locale} label={t("cta.update")} errorLabel={t("cta.error")} />
            ) : (
              <Link
                href={loginHref}
                className="flex items-center justify-center gap-2 w-full rounded-xl bg-[#00D4FF] hover:bg-[#00D4FF]/90 text-[#0f1a2e] font-bold text-base px-6 py-4 shadow-[0_8px_24px_rgba(0,212,255,0.4)] hover:shadow-[0_12px_32px_rgba(0,212,255,0.5)] transition-all"
              >
                {t("cta.sign_in")}
              </Link>
            )}
            <p className="mt-3 text-xs text-slate-400 text-center">
              {t("cta.helper")}
            </p>
          </div>
        </section>

        {/* Help / FAQ */}
        <section className="px-4 pb-24">
          <div className="mx-auto max-w-2xl">
            <div className="rounded-2xl bg-white/[0.03] backdrop-blur-sm border border-white/10 p-6 md:p-8">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-lg bg-[#00D4FF]/10 border border-[#00D4FF]/25 flex items-center justify-center">
                  <HelpCircle className="w-5 h-5 text-[#00D4FF]" strokeWidth={2} />
                </div>
                <h2 className="text-lg font-bold text-white">{t("help.title")}</h2>
              </div>
              <div className="space-y-4">
                {faqs.map((f, i) => (
                  <div key={i} className="border-l-2 border-[#00D4FF]/40 pl-4">
                    <p className="text-sm font-semibold text-white mb-1">{f.q}</p>
                    <p className="text-sm text-slate-300 leading-relaxed">{f.a}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-6 border-t border-white/10 flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-400" />
                <a
                  href="mailto:techstackmssaravia@gmail.com"
                  className="text-sm text-[#00D4FF] hover:text-[#00D4FF]/80 underline underline-offset-4 transition-colors"
                >
                  {t("help.contact")}
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}

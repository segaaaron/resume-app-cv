import Link from "next/link"
import Navbar from "@/components/marketing/Navbar"
import Footer from "@/components/marketing/Footer"
import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { setRequestLocale } from "next-intl/server"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "metadata.privacy" })
  return {
    title: t("title"),
    alternates: {
      canonical: `https://www.valhallaresume.com/${locale}/privacy`,
      languages: {
        es: "https://www.valhallaresume.com/es/privacy",
        en: "https://www.valhallaresume.com/en/privacy",
        "x-default": "https://www.valhallaresume.com/en/privacy",
      },
    },
  }
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: "privacy_page" })

  const b = (chunks: React.ReactNode) => <strong className="text-foreground">{chunks}</strong>
  const contactEmail = "techstackmssaravia@gmail.com"

  const s2Items = [
    [t("s2_l1_bold"), t("s2_l1_rest")],
    [t("s2_l2_bold"), t("s2_l2_rest")],
    [t("s2_l3_bold"), t("s2_l3_rest")],
    [t("s2_l4_bold"), t("s2_l4_rest")],
  ]

  const s3Items = [t("s3_i1"), t("s3_i2"), t("s3_i3"), t("s3_i4")]

  const s7Items = [
    [t("s7_l1_bold"), t("s7_l1_rest")],
    [t("s7_l2_bold"), t("s7_l2_rest")],
    [t("s7_l3_bold"), t("s7_l3_rest")],
    [t("s7_l4_bold"), t("s7_l4_rest")],
    [t("s7_l5_bold"), t("s7_l5_rest")],
  ]

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main id="main-content" className="flex-1 py-16 px-4">
        <div className="max-w-3xl mx-auto space-y-6">

          {/* Hero */}
          <div className="text-center space-y-3 pb-4">
            <span className="inline-block text-xs font-semibold uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full">
              {t("badge")}
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              {t("title_h1")}
            </h1>
            <p className="text-muted-foreground text-sm">
              {t("last_updated")}
            </p>
          </div>

          {/* Intro */}
          <section className="rounded-xl border bg-card p-6">
            <p className="text-muted-foreground leading-relaxed">
              {t("intro")}
            </p>
          </section>

          {/* Section 1 */}
          <section className="rounded-xl border bg-card p-6 space-y-3">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">1</span>
              <h2 className="text-base font-semibold">{t("s1_title")}</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              {t.rich("s1_body_pre", { b })}{" "}
              <a href={`mailto:${contactEmail}`} className="text-primary underline underline-offset-4">{contactEmail}</a>
              {t("s1_body_post")}
            </p>
          </section>

          {/* Section 2 */}
          <section className="rounded-xl border bg-card p-6 space-y-3">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">2</span>
              <h2 className="text-base font-semibold">{t("s2_title")}</h2>
            </div>
            <ul className="space-y-2">
              {s2Items.map(([bold, rest]) => (
                <li key={bold} className="flex items-start gap-2">
                  <span className="mt-2 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  <span className="text-muted-foreground"><strong className="text-foreground">{bold}:</strong> {rest}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Section 3 */}
          <section className="rounded-xl border bg-card p-6 space-y-3">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">3</span>
              <h2 className="text-base font-semibold">{t("s3_title")}</h2>
            </div>
            <ul className="space-y-2">
              {s3Items.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-2 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  <span className="text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Section 4 */}
          <section className="rounded-xl border bg-card p-6 space-y-3">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">4</span>
              <h2 className="text-base font-semibold">{t("s4_title")}</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">{t("s4_body")}</p>
          </section>

          {/* Section 5 — Amber highlight */}
          <section className="rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20 p-6 space-y-3">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">5</span>
              <h2 className="text-base font-semibold">{t("s5_title")}</h2>
            </div>
            <div className="space-y-3">
              <p className="text-muted-foreground leading-relaxed">{t("s5_body1")}</p>
              <p className="text-muted-foreground leading-relaxed">{t.rich("s5_body2", { b })}</p>
            </div>
          </section>

          {/* Section 6 */}
          <section className="rounded-xl border bg-card p-6 space-y-3">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">6</span>
              <h2 className="text-base font-semibold">{t("s6_title")}</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">{t.rich("s6_body", { b })}</p>
          </section>

          {/* Section 7 */}
          <section className="rounded-xl border bg-card p-6 space-y-3">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">7</span>
              <h2 className="text-base font-semibold">{t("s7_title")}</h2>
            </div>
            <div className="space-y-3">
              <p className="text-muted-foreground">{t("s7_intro")}</p>
              <ul className="space-y-2">
                {s7Items.map(([bold, rest]) => (
                  <li key={bold} className="flex items-start gap-2">
                    <span className="mt-2 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                    <span className="text-muted-foreground"><strong className="text-foreground">{bold}:</strong> {rest}</span>
                  </li>
                ))}
              </ul>
              <div className="space-y-2 pt-1">
                <div className="rounded-lg bg-muted/40 border p-3 text-xs text-muted-foreground leading-relaxed">
                  <strong className="text-foreground block mb-1">Brasil · LGPD</strong>
                  {t("s7_lgpd_note")}
                </div>
                <div className="rounded-lg bg-muted/40 border p-3 text-xs text-muted-foreground leading-relaxed">
                  <strong className="text-foreground block mb-1">México · LFPDPPP</strong>
                  {t("s7_mexico_note")}
                </div>
              </div>
              <p className="text-muted-foreground text-sm">
                {t("s7_contact_pre")}{" "}
                <a href={`mailto:${contactEmail}`} className="text-primary underline underline-offset-4">{contactEmail}</a>.
              </p>
            </div>
          </section>

          {/* Section 8 */}
          <section className="rounded-xl border bg-card p-6 space-y-3">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">8</span>
              <h2 className="text-base font-semibold">{t("s8_title")}</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">{t.rich("s8_body", { b })}</p>
          </section>

          {/* Section 9 */}
          <section className="rounded-xl border bg-card p-6 space-y-3">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">9</span>
              <h2 className="text-base font-semibold">{t("s9_title")}</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              {t.rich("s9_body_pre", { b })}{" "}
              <Link href="/cookie-policy" className="text-primary underline underline-offset-4">{t("s9_body_link_label")}</Link>{" "}
              {t("s9_body_post")}
            </p>
          </section>

          {/* Section 10 */}
          <section className="rounded-xl border bg-card p-6 space-y-3">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">10</span>
              <h2 className="text-base font-semibold">{t("s10_title")}</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">{t.rich("s10_body", { b })}</p>
          </section>

          {/* Section 11 */}
          <section className="rounded-xl border bg-card p-6 space-y-3">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">11</span>
              <h2 className="text-base font-semibold">{t("s11_title")}</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">{t("s11_body")}</p>
          </section>

          {/* Contact card */}
          <section className="rounded-xl border bg-primary/5 border-primary/20 p-6 space-y-2">
            <h2 className="font-semibold text-base">{t("contact_title")}</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {t("contact_pre")}
              <a href={`mailto:${contactEmail}`} className="text-primary underline underline-offset-4">{contactEmail}</a>
              {t("contact_post")}
            </p>
          </section>

        </div>
      </main>
      <Footer />
    </div>
  )
}

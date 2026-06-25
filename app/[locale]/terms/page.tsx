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
  const t = await getTranslations({ locale, namespace: "metadata.terms" })
  return {
    title: t("title"),
    alternates: {
      canonical: `https://readycvv.com/${locale}/terms`,
      languages: {
        es: "https://readycvv.com/es/terms",
        en: "https://readycvv.com/en/terms",
        "x-default": "https://readycvv.com/en/terms",
      },
    },
  }
}

export default async function TermsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations("terms_page")

  const b = (chunks: React.ReactNode) => <strong className="text-foreground">{chunks}</strong>

  const toc = [
    [1, t("toc_1")], [2, t("toc_2")], [3, t("toc_3")], [4, t("toc_4")],
    [5, t("toc_5")], [6, t("toc_6")], [7, t("toc_7")], [8, t("toc_8")],
    [9, t("toc_9")], [10, t("toc_10")], [11, t("toc_11")], [12, t("toc_12")],
    [13, t("toc_13")], [14, t("toc_14")], [15, t("toc_15")], [16, t("toc_16")],
    [17, t("toc_17")], [18, t("toc_18")],
  ]

  const s2Items = [t("s2_i1"), t("s2_i2"), t("s2_i3"), t("s2_i4"), t("s2_i5"), t("s2_i6")]
  const s9Items = [t("s9_i1"), t("s9_i2"), t("s9_i3"), t("s9_i4"), t("s9_i5"), t("s9_i6"), t("s9_i7"), t("s9_i8"), t("s9_i9"), t("s9_i10"), t("s9_i11")]

  const contactEmail = "soporte@readycvv.com"

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />
      <main id="main-content" className="flex-1">
        {/* Hero header */}
        <div className="border-b bg-muted/30">
          <div className="max-w-3xl mx-auto px-4 py-12">
            <span className="inline-block text-xs font-semibold uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full mb-4">
              {t("badge")}
            </span>
            <h1 className="text-3xl font-bold tracking-tight mb-2">{t("title")}</h1>
            <p className="text-sm text-muted-foreground">{t("last_updated")} · MS Saravia Tech Stack LLC</p>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-12">
          <div className="flex gap-12 items-start">

            {/* Sticky sidebar TOC */}
            <aside className="hidden lg:block w-52 shrink-0">
              <div className="sticky top-8 space-y-1">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                  {t("contents_label")}
                </p>
                {toc.map(([num, label]) => (
                  <a
                    key={num}
                    href={`#terms-${num}`}
                    className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors py-1 pl-2 rounded hover:bg-muted/50"
                  >
                    <span className="w-4 text-right shrink-0 text-primary/60 font-medium">{num}.</span>
                    <span className="truncate">{label}</span>
                  </a>
                ))}
              </div>
            </aside>

            {/* Content */}
            <div className="flex-1 min-w-0 max-w-[680px] space-y-2">

              {/* Intro */}
              <div className="rounded-xl border bg-card p-6 mb-8">
                <p className="text-muted-foreground leading-relaxed">
                  {t.rich("intro", { b })}
                </p>
              </div>

              {/* Section 1 */}
              <section id="terms-1" className="rounded-xl border bg-card p-6 space-y-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold">1</span>
                  {t("s1_title")}
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  {t.rich("s1_body", { b })}
                </p>
              </section>

              {/* Section 2 */}
              <section id="terms-2" className="rounded-xl border bg-card p-6 space-y-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold">2</span>
                  {t("s2_title")}
                </h2>
                <p className="text-muted-foreground">{t("s2_body")}</p>
                <ul className="space-y-2 text-muted-foreground">
                  {s2Items.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <p className="text-muted-foreground pt-1">
                  {t.rich("s2_outro", { b })}
                </p>
              </section>

              {/* Section 3 */}
              <section id="terms-3" className="rounded-xl border bg-card p-6 space-y-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold">3</span>
                  {t("s3_title")}
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  {t.rich("s3_body_pre", { b })}{" "}
                  <a href={`mailto:${contactEmail}`} className="text-primary underline underline-offset-4">{contactEmail}</a>
                  {t("s3_body_post")}
                </p>
              </section>

              {/* Section 4 */}
              <section id="terms-4" className="rounded-xl border bg-card p-6 space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold">4</span>
                  {t("s4_title")}
                </h2>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="rounded-lg bg-muted/50 border p-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-1">{t("plan_monthly")}</p>
                    <p className="text-2xl font-bold">{t("plan_monthly_price")}<span className="text-sm font-normal text-muted-foreground">{t("plan_monthly_period")}</span></p>
                  </div>
                  <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
                    <p className="text-xs text-primary uppercase tracking-wide font-medium mb-1">{t("plan_annual_save")}</p>
                    <p className="text-2xl font-bold">{t("plan_annual_price")}<span className="text-sm font-normal text-muted-foreground">{t("plan_annual_period")}</span></p>
                    <p className="text-xs text-muted-foreground mt-0.5">{t("plan_annual_equiv")}</p>
                  </div>
                </div>

                <div className="space-y-3 text-muted-foreground leading-relaxed">
                  <p>{t.rich("s4_body1", { b })}</p>
                  <div className="rounded-lg bg-muted/40 border p-4 space-y-2 text-sm">
                    <p><strong className="text-foreground">{t("s4_cancel_label")}</strong> {t("s4_cancel")}</p>
                    <p>
                      <strong className="text-foreground">{t("s4_refund_label")}</strong>{" "}
                      {t("s4_refund_pre")}{" "}
                      <a href={`mailto:${contactEmail}`} className="text-primary underline underline-offset-4">{contactEmail}</a>{" "}
                      {t("s4_refund_post")}
                    </p>
                    <p>{t.rich("s4_refund_consumed", { b })}</p>
                    <p><strong className="text-foreground">{t("s4_price_label")}</strong> {t("s4_price")}</p>
                  </div>
                </div>
              </section>

              {/* Section 5 — AI Disclaimer */}
              <section id="terms-5" className="rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20 p-6 space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold">5</span>
                  {t("s5_title")}
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  {t.rich("s5_intro", { b })}
                </p>
                <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-background p-4 space-y-3">
                  <p className="text-sm font-semibold text-foreground">{t("s5_list_header")}</p>
                  <ul className="space-y-3 text-sm text-muted-foreground">
                    {(["s5_l1", "s5_l2", "s5_l3", "s5_l4", "s5_l5", "s5_l6"] as const).map((key) => (
                      <li key={key} className="flex items-start gap-2">
                        <span className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                        <span>{t.rich(key, { b })}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <p className="text-sm text-muted-foreground">
                  {t.rich("s5_outro", { b })}
                </p>
              </section>

              {/* Section 6 — Employment */}
              <section id="terms-6" className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20 p-6 space-y-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold">6</span>
                  {t("s6_title")}
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  {t.rich("s6_body", { b })}
                </p>
              </section>

              {/* Section 7 */}
              <section id="terms-7" className="rounded-xl border bg-card p-6 space-y-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold">7</span>
                  {t("s7_title")}
                </h2>
                <p className="text-muted-foreground leading-relaxed">{t.rich("s7_body1", { b })}</p>
                <p className="text-muted-foreground leading-relaxed">{t.rich("s7_body2", { b })}</p>
              </section>

              {/* Section 8 */}
              <section id="terms-8" className="rounded-xl border bg-card p-6 space-y-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold">8</span>
                  {t("s8_title")}
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  {t("s8_body1_pre")}{" "}
                  <a href="/privacy" className="text-primary underline underline-offset-4">{t("s8_body1_link_label")}</a>
                  {t("s8_body1_post")}
                </p>
                <p className="text-muted-foreground leading-relaxed">{t.rich("s8_body2", { b })}</p>
                <p className="text-muted-foreground leading-relaxed">{t.rich("s8_body3", { b })}</p>
              </section>

              {/* Section 9 */}
              <section id="terms-9" className="rounded-xl border bg-card p-6 space-y-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold">9</span>
                  {t("s9_title")}
                </h2>
                <p className="text-muted-foreground text-sm">{t("s9_intro")}</p>
                <ul className="space-y-2 text-muted-foreground text-sm">
                  {s9Items.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-destructive shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <p className="text-sm text-muted-foreground pt-1">
                  {t.rich("s9_outro", { b })}
                </p>
              </section>

              {/* Section 10 */}
              <section id="terms-10" className="rounded-xl border bg-card p-6 space-y-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold">10</span>
                  {t("s10_title")}
                </h2>
                <p className="text-muted-foreground leading-relaxed">{t("s10_body")}</p>
              </section>

              {/* Section 11 */}
              <section id="terms-11" className="rounded-xl border bg-card p-6 space-y-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold">11</span>
                  {t("s11_title")}
                </h2>
                <p className="text-muted-foreground text-sm">{t("s11_intro")}</p>
                <ul className="space-y-3 text-muted-foreground text-sm">
                  {(["s11_l1", "s11_l2", "s11_l3"] as const).map((key) => (
                    <li key={key} className="flex items-start gap-2">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                      <span>{t.rich(key, { b })}</span>
                    </li>
                  ))}
                </ul>
              </section>

              {/* Section 12 */}
              <section id="terms-12" className="rounded-xl border bg-card p-6 space-y-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold">12</span>
                  {t("s12_title")}
                </h2>
                <p className="text-muted-foreground leading-relaxed">{t("s12_body")}</p>
                <div className="rounded-lg border border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20 p-4 space-y-1">
                  <p className="text-sm font-semibold text-foreground">{t("s12_misuse_title")}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{t("s12_misuse_body")}</p>
                </div>
              </section>

              {/* Section 13 */}
              <section id="terms-13" className="rounded-xl border bg-card p-6 space-y-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold">13</span>
                  {t("s13_title")}
                </h2>
                <p className="text-muted-foreground leading-relaxed">{t.rich("s13_body", { b })}</p>
                <p className="text-muted-foreground leading-relaxed text-sm border-t pt-3">{t("s13_body2")}</p>
              </section>

              {/* Section 14 */}
              <section id="terms-14" className="rounded-xl border bg-card p-6 space-y-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold">14</span>
                  {t("s14_title")}
                </h2>
                <p className="text-muted-foreground leading-relaxed">{t.rich("s14_body", { b })}</p>
              </section>

              {/* Section 15 */}
              <section id="terms-15" className="rounded-xl border bg-card p-6 space-y-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold">15</span>
                  {t("s15_title")}
                </h2>
                <p className="text-muted-foreground leading-relaxed">{t.rich("s15_body", { b })}</p>
              </section>

              {/* Section 16 */}
              <section id="terms-16" className="rounded-xl border bg-card p-6 space-y-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold">16</span>
                  {t("s16_title")}
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  {t.rich("s16_body_pre", { b })}{" "}
                  <a href={`mailto:${contactEmail}`} className="text-primary underline underline-offset-4">{contactEmail}</a>.{" "}
                  {t.rich("s16_body_mid", { b })}
                </p>
                <p className="text-muted-foreground leading-relaxed text-sm border-t pt-3">
                  {t("s16_jurisdiction")}
                </p>
              </section>

              {/* Section 17 */}
              <section id="terms-17" className="rounded-xl border bg-card p-6 space-y-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold">17</span>
                  {t("s17_title")}
                </h2>
                <p className="text-muted-foreground leading-relaxed">{t.rich("s17_body", { b })}</p>
                <p className="text-muted-foreground leading-relaxed text-sm border-t pt-3">{t("s17_body2")}</p>
              </section>

              {/* Section 18 — Contact */}
              <section id="terms-18" className="rounded-xl border bg-primary/5 border-primary/20 p-6 space-y-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold">18</span>
                  {t("s18_title")}
                </h2>
                <div className="space-y-1 text-muted-foreground">
                  <p><strong className="text-foreground">MS Saravia Tech Stack LLC</strong> — ReadyCVV</p>
                  <p>{t("s18_website_label")} <a href="https://www.readycvv.com" className="text-primary underline underline-offset-4">www.readycvv.com</a></p>
                  <p>{t("s18_email_label")} <a href={`mailto:${contactEmail}`} className="text-primary underline underline-offset-4">{contactEmail}</a></p>
                </div>
              </section>

            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

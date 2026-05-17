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
  const t = await getTranslations({ locale, namespace: "cookie_policy" })
  return {
    title: t("meta_title"),
  }
}

export default async function CookiePolicyPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: "cookie_policy" })

  const toc = [
    [1, t("toc_1")],
    [2, t("toc_2")],
    [3, t("toc_3")],
    [4, t("toc_4")],
    [5, t("toc_5")],
    [6, t("toc_6")],
    [7, t("toc_7")],
  ]

  const s2Items = [
    [t("s2_l1_label"), t("s2_l1_value")],
    [t("s2_l2_label"), t("s2_l2_value")],
    [t("s2_l3_label"), t("s2_l3_value")],
  ]

  const s3Items = [
    [t("s3_l1_label"), t("s3_l1_value")],
    [t("s3_l2_label"), t("s3_l2_value")],
    [t("s3_l3_label"), t("s3_l3_value")],
  ]

  const s4Items = [t("s4_i1"), t("s4_i2"), t("s4_i3"), t("s4_i4")]

  const s5Browsers = [
    ["Google Chrome", t("s5_chrome_url")],
    ["Mozilla Firefox", t("s5_firefox_url")],
    ["Safari", t("s5_safari_url")],
    ["Microsoft Edge", t("s5_edge_url")],
  ]

  const contactEmail = "soporte@readycvv.com"

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />
      <main className="flex-1">

        {/* Hero header */}
        <div className="border-b bg-muted/30">
          <div className="max-w-3xl mx-auto px-4 py-12">
            <span className="inline-block text-xs font-semibold uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full mb-4">
              {t("badge")}
            </span>
            <h1 className="text-3xl font-bold tracking-tight mb-2">
              {t("title")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t("last_updated")} · MS Saravia Tech Stack LLC
            </p>
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
                    href={`#cookie-${num}`}
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

              {/* Intro card */}
              <div className="rounded-xl border bg-card p-6 mb-8">
                <p className="text-muted-foreground leading-relaxed">
                  {t("intro_pre")}<strong className="text-foreground">READY CV</strong>{t("intro_post")}
                </p>
              </div>

              {/* Section 1 */}
              <section id="cookie-1" className="rounded-xl border bg-card p-6 space-y-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold">1</span>
                  {t("s1_title")}
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  {t("s1_body")}
                </p>
              </section>

              {/* Section 2 */}
              <section id="cookie-2" className="rounded-xl border bg-card p-6 space-y-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold">2</span>
                  {t("s2_title")}
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  {t("s2_body")}
                </p>
                <ul className="space-y-2 text-muted-foreground text-sm">
                  {s2Items.map(([label, value]) => (
                    <li key={String(label)} className="flex items-start gap-2">
                      <span className="mt-2 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                      <span><strong className="text-foreground">{label}:</strong> {value}</span>
                    </li>
                  ))}
                </ul>
              </section>

              {/* Section 3 */}
              <section id="cookie-3" className="rounded-xl border bg-card p-6 space-y-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold">3</span>
                  {t("s3_title")}
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  {t("s3_body")}
                </p>
                <ul className="space-y-2 text-muted-foreground text-sm">
                  {s3Items.map(([label, value]) => (
                    <li key={String(label)} className="flex items-start gap-2">
                      <span className="mt-2 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                      <span><strong className="text-foreground">{label}:</strong> {value}</span>
                    </li>
                  ))}
                </ul>
              </section>

              {/* Section 4 */}
              <section id="cookie-4" className="rounded-xl border bg-card p-6 space-y-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold">4</span>
                  {t("s4_title")}
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  {t("s4_body")}
                </p>
                <ul className="space-y-2 text-muted-foreground text-sm">
                  {s4Items.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="mt-2 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </section>

              {/* Section 5 */}
              <section id="cookie-5" className="rounded-xl border bg-card p-6 space-y-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold">5</span>
                  {t("s5_title")}
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  {t("s5_body")}
                </p>
                <ul className="space-y-2 text-sm">
                  {s5Browsers.map(([browser, url]) => (
                    <li key={browser} className="flex items-start gap-2">
                      <span className="mt-2 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                      <a href={url} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-4 hover:opacity-80">
                        {browser}
                      </a>
                    </li>
                  ))}
                </ul>
              </section>

              {/* Section 6 */}
              <section id="cookie-6" className="rounded-xl border bg-card p-6 space-y-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold">6</span>
                  {t("s6_title")}
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  {t("s6_body")}
                </p>
              </section>

              {/* Section 7 */}
              <section id="cookie-7" className="rounded-xl border bg-card p-6 space-y-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold">7</span>
                  {t("s7_title")}
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  {t("s7_pre")}<a href={`mailto:${contactEmail}`} className="text-primary underline underline-offset-4">{contactEmail}</a>{t("s7_post")}
                </p>
              </section>

            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

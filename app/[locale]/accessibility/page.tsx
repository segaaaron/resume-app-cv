import Navbar from "@/components/marketing/Navbar"
import Footer from "@/components/marketing/Footer"
import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "metadata.accessibility" })
  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: `https://www.valhallaresume.com/${locale}/accessibility`,
      languages: {
        es: "https://www.valhallaresume.com/es/accessibility",
        en: "https://www.valhallaresume.com/en/accessibility",
        "x-default": "https://www.valhallaresume.com/en/accessibility",
      },
    },
  }
}

export default async function AccessibilityPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: "accessibility_page" })

  const contactEmail = "techstackmssaravia@gmail.com"

  const sections: { n: number; title: string; body: string }[] = [
    { n: 1, title: t("s1_title"), body: t("s1_body") },
    { n: 2, title: t("s2_title"), body: t("s2_body") },
    { n: 3, title: t("s3_title"), body: t("s3_body") },
    { n: 4, title: t("s4_title"), body: t("s4_body") },
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
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{t("title_h1")}</h1>
            <p className="text-muted-foreground text-sm">{t("last_updated")}</p>
          </div>

          {/* Intro */}
          <section className="rounded-xl border bg-card p-6">
            <p className="text-muted-foreground leading-relaxed">{t("intro")}</p>
          </section>

          {/* Sections */}
          {sections.map((s) => (
            <section key={s.n} className="rounded-xl border bg-card p-6 space-y-3">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                  {s.n}
                </span>
                <h2 className="text-base font-semibold">{s.title}</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">{s.body}</p>
            </section>
          ))}

          {/* Feedback / contact card */}
          <section className="rounded-xl border bg-primary/5 border-primary/20 p-6 space-y-2">
            <h2 className="font-semibold text-base">{t("contact_title")}</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {t("contact_pre")}{" "}
              <a href={`mailto:${contactEmail}`} className="text-primary underline underline-offset-4">
                {contactEmail}
              </a>
              {t("contact_post")}
            </p>
          </section>

        </div>
      </main>
      <Footer />
    </div>
  )
}

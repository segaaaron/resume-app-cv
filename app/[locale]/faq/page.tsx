import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"
import Navbar from "@/components/marketing/Navbar"
import Footer from "@/components/marketing/Footer"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "faq" })
  return {
    title: `${t("page_title")} — ReadyCVV`,
    description: t("page_subtitle"),
    alternates: {
      canonical: `https://readycvv.com/${locale}/faq`,
      languages: {
        es: "https://readycvv.com/es/faq",
        en: "https://readycvv.com/en/faq",
        "x-default": "https://readycvv.com/es/faq",
      },
    },
  }
}

export default async function FAQPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations({ locale, namespace: "faq" })

  const sections = [
    {
      key: "general",
      title: t("section_general"),
      items: [
        { q: t("q1"), a: t("a1") },
        { q: t("q2"), a: t("a2") },
        { q: t("q3"), a: t("a3") },
        { q: t("q4"), a: t("a4") },
        { q: t("q5"), a: t("a5") },
        { q: t("q6"), a: t("a6") },
      ],
    },
    {
      key: "ai",
      title: t("section_ai"),
      items: [
        { q: t("q_ai1"), a: t("a_ai1") },
        { q: t("q_ai2"), a: t("a_ai2") },
        { q: t("q_ai3"), a: t("a_ai3") },
        { q: t("q_ai4"), a: t("a_ai4") },
        { q: t("q_ai5"), a: t("a_ai5") },
        { q: t("q_ai6"), a: t("a_ai6") },
      ],
    },
    {
      key: "ats",
      title: t("section_ats"),
      items: [
        { q: t("q_ats1"), a: t("a_ats1") },
        { q: t("q_ats2"), a: t("a_ats2") },
        { q: t("q_ats3"), a: t("a_ats3") },
        { q: t("q_ats4"), a: t("a_ats4") },
      ],
    },
    {
      key: "templates",
      title: t("section_templates"),
      items: [
        { q: t("q_tpl1"), a: t("a_tpl1") },
        { q: t("q_tpl2"), a: t("a_tpl2") },
      ],
    },
    {
      key: "plan",
      title: t("section_plan"),
      items: [
        { q: t("q_plan1"), a: t("a_plan1") },
        { q: t("q_plan2"), a: t("a_plan2") },
      ],
    },
    {
      key: "privacy",
      title: t("section_privacy"),
      items: [
        { q: t("q_priv1"), a: t("a_priv1") },
        { q: t("q_priv2"), a: t("a_priv2") },
      ],
    },
  ]

  return (
    <>
      <Navbar />
      <main id="main-content" className="min-h-screen bg-background">
        {/* Hero */}
        <section className="max-w-3xl mx-auto px-4 pt-20 pb-12 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
            {t("page_title")}
          </h1>
          <p className="text-lg text-muted-foreground">{t("page_subtitle")}</p>
        </section>

        {/* Sections */}
        <section className="max-w-3xl mx-auto px-4 pb-24 space-y-12">
          {sections.map((section) => (
            <div key={section.key}>
              <h2 className="text-xl font-semibold mb-4 pb-2 border-b border-border">
                {section.title}
              </h2>
              <Accordion className="space-y-2">
                {section.items.map((item, i) => (
                  <AccordionItem
                    key={i}
                    value={`${section.key}-${i}`}
                    className="border border-border rounded-xl px-4 overflow-hidden"
                  >
                    <AccordionTrigger className="text-left font-medium py-4 hover:no-underline">
                      {item.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pb-4 leading-relaxed">
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}
        </section>
      </main>
      <Footer />
    </>
  )
}

/**
 * Template detail page — /[locale]/templates/design/[templateId]
 *
 * NOTE on route placement:
 * The existing /templates/[profession]/page.tsx route already occupies the
 * single dynamic slot under /templates. To avoid colliding (Next.js does not
 * allow two sibling dynamic segments) we nest template detail under /design/.
 * URLs: /en/templates/design/aurora, /es/templates/design/cobalt, …
 *
 * Strategy:
 * - generateStaticParams emits one page per template (from templatesSEO) × 2 locales.
 * - Unknown / removed template slugs resolve to notFound() → 404 (de-indexed).
 * - generateMetadata produces locale-aware title, description, OG, canonical,
 *   hreflang and twitter card.
 * - Page composes sub-components (hero, features, best-for, description,
 *   FAQ, related, CTA) and injects JSON-LD via <TemplateDetailSchemas>.
 */

import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getTranslations, setRequestLocale } from "next-intl/server"

import Navbar from "@/components/marketing/Navbar"
import Footer from "@/components/marketing/Footer"
import TemplateDetailHero from "@/components/templates-detail/TemplateDetailHero"
import TemplateDetailFeatures from "@/components/templates-detail/TemplateDetailFeatures"
import TemplateDetailDescription from "@/components/templates-detail/TemplateDetailDescription"
import TemplateDetailBestFor from "@/components/templates-detail/TemplateDetailBestFor"
import TemplateDetailFaq from "@/components/templates-detail/TemplateDetailFaq"
import TemplateDetailRelated from "@/components/templates-detail/TemplateDetailRelated"
import TemplateDetailCta from "@/components/templates-detail/TemplateDetailCta"
import TemplateDetailSchemas from "@/components/templates-detail/TemplateDetailSchemas"
import {
  templatesSEO,
  getTemplateSEO,
  getRelatedTemplates,
  type TemplateSEO,
} from "@/lib/templates-seo"

const BASE_URL = "https://www.valhallaresume.com"
const SUPPORTED_LOCALES = ["es", "en"] as const
type Locale = (typeof SUPPORTED_LOCALES)[number]

// ─── Static params ───────────────────────────────────────────────────────────

export async function generateStaticParams() {
  return templatesSEO.flatMap((t) =>
    SUPPORTED_LOCALES.map((locale) => ({ locale, templateId: t.slug }))
  )
}

// ─── Metadata ────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale; templateId: string }>
}): Promise<Metadata> {
  const { locale, templateId } = await params
  const template = getTemplateSEO(templateId)
  if (!template) return {}

  const isEs = locale === "es"
  const title = isEs
    ? `Plantilla CV ${template.name} | ATS-Friendly | Valhalla Resume`
    : `${template.name} Resume Template | ATS-Friendly | Valhalla Resume`
  const description = template.description[locale]
  const url = `${BASE_URL}/${locale}/templates/design/${templateId}`

  return {
    title,
    description,
    keywords: isEs
      ? [
          `plantilla cv ${template.name.toLowerCase()}`,
          `plantilla curriculum vitae ${template.name.toLowerCase()}`,
          `cv ${template.category}`,
          "plantilla cv ats",
          "diseño cv profesional",
          ...template.bestFor.es.map((p) => `cv para ${p.toLowerCase()}`),
        ]
      : [
          `${template.name.toLowerCase()} resume template`,
          `${template.name.toLowerCase()} cv template`,
          `${template.category} resume`,
          "ats resume template",
          "professional resume design",
          ...template.bestFor.en.map((p) => `${p.toLowerCase()} resume`),
        ],
    alternates: {
      canonical: url,
      languages: {
        en: `${BASE_URL}/en/templates/design/${templateId}`,
        es: `${BASE_URL}/es/templates/design/${templateId}`,
        "x-default": `${BASE_URL}/en/templates/design/${templateId}`,
      },
    },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      images: [
        {
          url: `${BASE_URL}/api/og?title=${encodeURIComponent(template.name)}&type=template&locale=${locale}`,
          width: 1200,
          height: 630,
          alt: `${template.name} CV template preview`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [
        `${BASE_URL}/api/og?title=${encodeURIComponent(template.name)}&type=template&locale=${locale}`,
      ],
    },
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function categoryLabel(cat: TemplateSEO["category"], t: (k: string) => string): string {
  return t(`category_${cat}`)
}

function layoutLabel(layout: TemplateSEO["layout"], t: (k: string) => string): string {
  const key = layout.replace(/-/g, "_")
  return t(`layout_${key}`)
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function TemplateDetailPage({
  params,
}: {
  params: Promise<{ locale: Locale; templateId: string }>
}) {
  const { locale, templateId } = await params
  setRequestLocale(locale)

  const template = getTemplateSEO(templateId)
  if (!template) notFound()

  const t = await getTranslations({ locale, namespace: "templates_detail" })
  const isEs = locale === "es"
  const desc = template.description[locale]
  const longDesc = template.longDescription[locale]
  const features = template.features[locale]
  const bestFor = template.bestFor[locale]
  const url = `${BASE_URL}/${locale}/templates/design/${templateId}`
  const ogImage = `${BASE_URL}/api/og?title=${encodeURIComponent(template.name)}&type=template&locale=${locale}`

  const related = getRelatedTemplates(templateId, 6)

  const faqItems: Array<{ q: string; a: string }> = [
    { q: t("faq_q1"), a: t("faq_a1") },
    { q: t("faq_q2"), a: t("faq_a2") },
    { q: t("faq_q3"), a: t("faq_a3") },
    { q: t("faq_q4"), a: t("faq_a4") },
    { q: t("faq_q5"), a: t("faq_a5") },
  ]

  return (
    <div className="flex flex-col min-h-screen">
      <TemplateDetailSchemas
        template={template}
        locale={locale}
        url={url}
        ogImage={ogImage}
        desc={desc}
        categoryLabel={categoryLabel(template.category, t)}
        breadcrumbHomeLabel={t("breadcrumb_home")}
        breadcrumbTemplatesLabel={t("breadcrumb_templates")}
        faqItems={faqItems}
        baseUrl={BASE_URL}
      />

      <Navbar />

      <main id="main-content" className="flex-1">
        <TemplateDetailHero
          template={template}
          locale={locale}
          isEs={isEs}
          desc={desc}
          categoryLabel={categoryLabel(template.category, t)}
          layoutLabel={layoutLabel(template.layout, t)}
          t={t}
        />

        <TemplateDetailFeatures template={template} features={features} t={t} />

        <TemplateDetailDescription longDesc={longDesc} t={t} />

        <TemplateDetailBestFor bestFor={bestFor} t={t} />

        <TemplateDetailFaq faqItems={faqItems} t={t} />

        <TemplateDetailRelated
          related={related}
          locale={locale}
          categoryLabelFor={(cat) => categoryLabel(cat, t)}
          t={t}
        />

        <TemplateDetailCta locale={locale} t={t} />
      </main>

      <Footer />
    </div>
  )
}

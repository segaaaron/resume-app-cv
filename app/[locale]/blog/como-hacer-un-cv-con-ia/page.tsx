import Navbar from "@/components/marketing/Navbar"
import Footer from "@/components/marketing/Footer"
import Link from "next/link"
import Script from "next/script"
import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { setRequestLocale } from "next-intl/server"
import { ArrowRight } from "lucide-react"

const SLUG = "como-hacer-un-cv-con-ia"
const DATE_PUBLISHED = "2026-05-02"
const DATE_MODIFIED = "2026-05-02"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "metadata.blog_ai_cv" })
  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: `https://www.valhallaresume.com/${locale}/blog/${SLUG}`,
      languages: {
        es: `https://www.valhallaresume.com/es/blog/${SLUG}`,
        en: `https://www.valhallaresume.com/en/blog/${SLUG}`,
        "x-default": `https://www.valhallaresume.com/en/blog/${SLUG}`,
      },
    },
    openGraph: {
      title: t("title"),
      description: t("description"),
      type: "article",
      url: `https://www.valhallaresume.com/${locale}/blog/${SLUG}`,
      images: [{ url: "https://www.valhallaresume.com/og-image.png", width: 1200, height: 630 }],
      publishedTime: DATE_PUBLISHED,
      modifiedTime: DATE_MODIFIED,
      authors: ["Valhalla Resume"],
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
      images: ["https://www.valhallaresume.com/og-image.png"],
    },
  }
}

export default async function AIResumeArticlePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations("blog_ai_cv")
  const tBlog = await getTranslations("blog")

  const content = {
    tag: t("tag"),
    title: t("title"),
    intro: t("intro"),
    sections: [
      { heading: t("s1_h"), body: t("s1_b") },
      { heading: t("s2_h"), body: t("s2_b") },
      { heading: t("s3_h"), body: t("s3_b") },
      { heading: t("s4_h"), body: t("s4_b") },
      { heading: t("s5_h"), body: t("s5_b") },
      { heading: t("s6_h"), body: t("s6_b") },
    ],
  }

  const relatedArticles = [
    { slug: t("r1_slug"), title: t("r1_title") },
    { slug: t("r2_slug"), title: t("r2_title") },
    { slug: t("r3_slug"), title: t("r3_title") },
  ]

  const howToJsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: t("howto_name"),
    description: t("howto_desc"),
    totalTime: "PT30M",
    step: content.sections.map((section, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: section.heading,
      text: section.body.slice(0, 300),
    })),
  }

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: content.title,
    description: content.intro,
    datePublished: DATE_PUBLISHED,
    dateModified: DATE_MODIFIED,
    author: { "@type": "Organization", name: "Valhalla Resume", url: "https://www.valhallaresume.com" },
    publisher: {
      "@type": "Organization",
      name: "Valhalla Resume",
      logo: { "@type": "ImageObject", url: "https://www.valhallaresume.com/og-image.png" },
    },
    image: "https://www.valhallaresume.com/og-image.png",
    url: `https://www.valhallaresume.com/${locale}/blog/${SLUG}`,
    inLanguage: locale,
    mainEntityOfPage: { "@type": "WebPage", "@id": `https://www.valhallaresume.com/${locale}/blog/${SLUG}` },
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main id="main-content" className="flex-1 py-12 sm:py-20 px-4">
        <div className="max-w-2xl mx-auto">
          <Link
            href={`/${locale}/blog`}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-block mb-8"
          >
            {tBlog("back")}
          </Link>

          <div className="mb-8">
            <span className="inline-block text-xs font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full mb-3">
              {content.tag}
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold mb-4 leading-tight">{content.title}</h1>
            <p className="text-lg text-muted-foreground leading-relaxed">{content.intro}</p>
          </div>

          <div className="prose prose-neutral max-w-none space-y-8">
            {content.sections.map((section) => (
              <div key={section.heading}>
                <h2 className="text-xl font-semibold mb-3">{section.heading}</h2>
                {section.body.split("\n\n").map((para, i) => (
                  <p key={i} className="text-muted-foreground leading-relaxed mb-3 whitespace-pre-line">
                    {para}
                  </p>
                ))}
              </div>
            ))}
          </div>

          <div className="mt-10 border-t border-border pt-8">
            <p className="font-semibold mb-4">{tBlog("related_guides")}</p>
            <ul className="space-y-2">
              {relatedArticles.map((a) => (
                <li key={a.slug}>
                  <Link href={`/${locale}/blog/${a.slug}`} className="text-primary hover:underline text-sm font-medium">
                    {a.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-12 bg-primary/5 border border-primary/20 rounded-2xl p-8 text-center">
            <p className="font-semibold text-lg mb-2">{tBlog("cta_title")}</p>
            <p className="text-muted-foreground mb-6">{tBlog("cta_desc")}</p>
            <Link
              href={`/${locale}/register`}
              className="inline-flex items-center gap-2 bg-primary text-white font-semibold px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors text-sm"
            >
              {tBlog("cta_btn")} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </main>
      <Script id="article-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <Script id="howto-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }} />
      <Footer />
    </div>
  )
}

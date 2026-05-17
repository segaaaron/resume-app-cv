import Navbar from "@/components/marketing/Navbar"
import Footer from "@/components/marketing/Footer"
import Link from "next/link"
import Script from "next/script"
import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { setRequestLocale } from "next-intl/server"
import { ArrowRight } from "lucide-react"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "metadata.blog_index" })
  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: `https://readycvv.com/${locale}/blog`,
      languages: {
        es: "https://readycvv.com/es/blog",
        en: "https://readycvv.com/en/blog",
      },
    },
    openGraph: {
      title: t("title"),
      description: t("description"),
      url: `https://readycvv.com/${locale}/blog`,
      type: "website",
      images: [{ url: "https://readycvv.com/og-image.png", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
      images: ["https://readycvv.com/og-image.png"],
    },
  }
}

export default async function BlogIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const t = await getTranslations("blog_index")
  const tBlog = await getTranslations("blog")

  const articles = [
    { slug: "que-es-ats-y-por-que-rechaza-tu-cv", title: t("que-es-ats-y-por-que-rechaza-tu-cv.title"), desc: t("que-es-ats-y-por-que-rechaza-tu-cv.desc"), tag: t("que-es-ats-y-por-que-rechaza-tu-cv.tag"), date: "2026-04-29", readingTime: 7 },
    { slug: "como-escribir-bullets-de-cv", title: t("como-escribir-bullets-de-cv.title"), desc: t("como-escribir-bullets-de-cv.desc"), tag: t("como-escribir-bullets-de-cv.tag"), date: "2026-04-29", readingTime: 6 },
    { slug: "constructores-de-cv-gratuitos-vs-pago", title: t("constructores-de-cv-gratuitos-vs-pago.title"), desc: t("constructores-de-cv-gratuitos-vs-pago.desc"), tag: t("constructores-de-cv-gratuitos-vs-pago.tag"), date: "2026-04-29", readingTime: 5 },
    { slug: "carta-de-presentacion-2026", title: t("carta-de-presentacion-2026.title"), desc: t("carta-de-presentacion-2026.desc"), tag: t("carta-de-presentacion-2026.tag"), date: "2026-04-29", readingTime: 5 },
    { slug: "como-hacer-un-cv-con-ia", title: t("como-hacer-un-cv-con-ia.title"), desc: t("como-hacer-un-cv-con-ia.desc"), tag: t("como-hacer-un-cv-con-ia.tag"), date: "2026-05-02", readingTime: 8 },
    { slug: "cv-para-desarrolladores-de-software", title: t("cv-para-desarrolladores-de-software.title"), desc: t("cv-para-desarrolladores-de-software.desc"), tag: t("cv-para-desarrolladores-de-software.tag"), date: "2026-05-02", readingTime: 9 },
    { slug: "como-pasar-el-ats", title: t("como-pasar-el-ats.title"), desc: t("como-pasar-el-ats.desc"), tag: t("como-pasar-el-ats.tag"), date: "2026-05-02", readingTime: 7 },
    { slug: "cv-para-marketing", title: t("cv-para-marketing.title"), desc: t("cv-para-marketing.desc"), tag: t("cv-para-marketing.tag"), date: "2026-05-02", readingTime: 8 },
    { slug: "carta-de-presentacion-ejemplos", title: t("carta-de-presentacion-ejemplos.title"), desc: t("carta-de-presentacion-ejemplos.desc"), tag: t("carta-de-presentacion-ejemplos.tag"), date: "2026-05-02", readingTime: 7 },
  ]

  const jsonLdBlogIndex = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: t("collection_name"),
    url: `https://readycvv.com/${locale}/blog`,
    description: t("collection_desc"),
    hasPart: articles.map((a) => ({
      "@type": "Article",
      headline: a.title,
      url: `https://readycvv.com/${locale}/blog/${a.slug}`,
    })),
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Script id="blog-index-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBlogIndex) }} />
      <Navbar />
      <main className="flex-1 py-12 sm:py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="mb-12">
            <span className="inline-block text-xs font-semibold uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full mb-4">
              Blog
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold mb-3">
              {t("index_title")}
            </h1>
            <p className="text-muted-foreground text-lg">
              {t("index_subtitle")}
            </p>
          </div>

          <div className="space-y-6">
            {articles.map((article) => (
              <Link
                key={article.slug}
                href={`/${locale}/blog/${article.slug}`}
                className="group block bg-white border border-border rounded-2xl p-6 hover:shadow-md hover:border-primary/30 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        {article.tag}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {article.readingTime} {tBlog("reading_time")}
                      </span>
                    </div>
                    <h2 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                      {article.title}
                    </h2>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {article.desc}
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary shrink-0 mt-1 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

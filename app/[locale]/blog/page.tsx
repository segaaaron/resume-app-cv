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
        "x-default": "https://readycvv.com/en/blog",
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

  // Locale-specific posts (no cross-translation). Each renders only in its target locale.
  type Article = { slug: string; title: string; desc: string; tag: string; date: string; readingTime: number }
  const localeSpecific: Article[] = [
    // Lote 1 — pilot posts
    locale === "en" && {
      slug: "how-to-write-resume-summary",
      title: "How to Write a Resume Summary (50 Examples That Get Interviews)",
      desc: "The 4-line formula recruiters expect, 50 role-specific examples and the 7 mistakes that skip your summary. Pass ATS in 15 minutes.",
      tag: "Resume Writing",
      date: "2026-06-01",
      readingTime: 9,
    },
    locale === "es" && {
      slug: "cv-en-ingles",
      title: "CV en Inglés: Guía Paso a Paso con Ejemplos (Resume 2026)",
      desc: "El formato real que usan en USA, UK y multinacionales. Estructura, vocabulario por sector, errores típicos y plantillas listas.",
      tag: "CV Internacional",
      date: "2026-06-01",
      readingTime: 10,
    },
    // Lote 2 — EN posts
    locale === "en" && {
      slug: "resume-skills-by-industry",
      title: "Resume Skills: 200+ Skills by Industry (2026 Guide)",
      desc: "200+ resume skills organized by industry, the framework to choose yours, ATS formatting rules and the 5 mistakes that tank your match score.",
      tag: "Resume Skills",
      date: "2026-06-01",
      readingTime: 11,
    },
    locale === "en" && {
      slug: "cv-vs-resume-differences",
      title: "CV vs Resume: Complete Comparison 2026 (When to Use Each)",
      desc: "CV and resume are not interchangeable. The 7 key differences, when to use each, and a country-by-country guide so you never send the wrong document.",
      tag: "Resume Basics",
      date: "2026-06-01",
      readingTime: 9,
    },
    // Lote 2 — ES posts
    locale === "es" && {
      slug: "habilidades-para-cv",
      title: "Habilidades para CV: 200+ Skills por Industria (Guía 2026)",
      desc: "200+ habilidades organizadas por industria, el proceso para elegir las tuyas, reglas de formato ATS y los 5 errores que arruinan tu match score.",
      tag: "Habilidades CV",
      date: "2026-06-01",
      readingTime: 11,
    },
    locale === "es" && {
      slug: "objetivo-profesional-ejemplos",
      title: "50 Ejemplos de Objetivo Profesional para CV (Guía 2026)",
      desc: "50 ejemplos por categoría (recién egresado, cambio de carrera, sin experiencia, con experiencia, por industria), la fórmula que funciona y los 6 errores que evitar.",
      tag: "Objetivo Profesional",
      date: "2026-06-01",
      readingTime: 10,
    },
    // Lote 3 — EN posts
    locale === "en" && {
      slug: "chronological-vs-functional-resume",
      title: "Chronological vs Functional Resume: Which Format to Use (2026)",
      desc: "Chronological, functional or combination — which resume format wins in 2026, when to use each, ATS compatibility per format and real candidate examples.",
      tag: "Resume Formats",
      date: "2026-06-01",
      readingTime: 10,
    },
    locale === "en" && {
      slug: "resume-length-guide",
      title: "Resume Length: 1 or 2 Pages? Complete Guide for 2026",
      desc: "The real answer on resume length: when 1 page wins, when 2 is required, country-by-country expectations and 8 tactics to cut to a single page without losing impact.",
      tag: "Resume Basics",
      date: "2026-06-01",
      readingTime: 8,
    },
    // Lote 3 — ES posts
    locale === "es" && {
      slug: "cv-recien-graduado",
      title: "CV para Recién Graduados Universitarios (Guía 2026 + Ejemplos)",
      desc: "La estructura ideal del CV recién graduado, cómo presentar prácticas y proyectos académicos como experiencia y 5 ejemplos completos por área profesional.",
      tag: "CV Sin Experiencia",
      date: "2026-06-01",
      readingTime: 10,
    },
    locale === "es" && {
      slug: "cv-cambio-carrera",
      title: "CV para Cambio de Carrera: Guía Completa con Ejemplos (2026)",
      desc: "El CV de cambio de carrera necesita estrategia distinta: formato correcto, habilidades transferibles, reformular experiencia y 4 ejemplos antes/después reales.",
      tag: "Cambio de Carrera",
      date: "2026-06-01",
      readingTime: 9,
    },
    // Lote 4 — EN posts (cross-translated)
    locale === "en" && {
      slug: "action-verbs-resume",
      title: "300+ Action Verbs for Your Resume (By Industry, 2026)",
      desc: "300+ resume action verbs organized by category — leadership, results, technical, sales — plus the 4-step framework to pick the right verb and 5 before/after rewrites.",
      tag: "Resume Writing",
      date: "2026-06-01",
      readingTime: 9,
    },
    locale === "en" && {
      slug: "resume-mistakes-to-avoid",
      title: "15 Resume Mistakes That Cost You The Interview (2026)",
      desc: "The 15 highest-cost resume mistakes ranked by impact: why each one hurts, how to fix it, before/after examples and a 12-item self-audit checklist.",
      tag: "Resume Basics",
      date: "2026-06-01",
      readingTime: 9,
    },
    // Lote 4 — ES posts (cross-translated)
    locale === "es" && {
      slug: "verbos-de-accion-cv",
      title: "300+ Verbos de Acción para tu Currículum (Por Industria, 2026)",
      desc: "300+ verbos de acción organizados por categoría — liderazgo, resultados, técnicos, ventas — el framework para elegir el correcto y 5 ejemplos antes/después.",
      tag: "Redacción CV",
      date: "2026-06-01",
      readingTime: 9,
    },
    locale === "es" && {
      slug: "errores-comunes-cv",
      title: "15 Errores Comunes en el Currículum que Debes Evitar (2026)",
      desc: "Los 15 errores más costosos en el CV ranking por impacto: por qué dañan, cómo arreglarlos, ejemplos antes/después y checklist de auto-auditoría de 12 ítems.",
      tag: "Errores CV",
      date: "2026-06-01",
      readingTime: 9,
    },
    // Lote 5 — EN posts (cross-translated)
    locale === "en" && {
      slug: "how-to-tailor-resume",
      title: "How to Tailor Your Resume for Each Job (Step-by-Step Guide 2026)",
      desc: "Tailored resumes get 40% more interviews. The 6-step process to adapt your resume per job in 15-30 minutes, with a worked example showing 3 versions from one base.",
      tag: "Resume Strategy",
      date: "2026-06-01",
      readingTime: 9,
    },
    // Lote 5 — ES posts (cross-translated + single-locale)
    locale === "es" && {
      slug: "adaptar-cv-oferta-trabajo",
      title: "Cómo Adaptar tu CV a Cada Oferta de Trabajo (Guía Paso a Paso 2026)",
      desc: "Los CVs adaptados obtienen 40% más entrevistas. El proceso de 6 pasos para adaptar tu CV por oferta en 15-30 minutos, con ejemplo trabajado de 3 versiones desde una base.",
      tag: "Estrategia CV",
      date: "2026-06-01",
      readingTime: 9,
    },
    locale === "es" && {
      slug: "cv-sin-experiencia",
      title: "Cómo Hacer un CV Sin Experiencia (Guía Completa 2026 + 8 Ejemplos)",
      desc: "La estructura ideal del CV sin experiencia, cómo convertir proyectos y voluntariado en activos legítimos y 8 ejemplos completos por área profesional.",
      tag: "CV Sin Experiencia",
      date: "2026-06-01",
      readingTime: 11,
    },
  ].filter(Boolean) as Article[]

  const articles: Article[] = [
    ...localeSpecific,
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
      <main id="main-content" className="flex-1 py-12 sm:py-20 px-4">
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

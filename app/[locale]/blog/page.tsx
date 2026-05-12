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

const articles = [
  {
    slug: "que-es-ats-y-por-que-rechaza-tu-cv",
    titleEs: "¿Qué es ATS y por qué rechaza tu CV?",
    titleEn: "What is ATS and Why is It Rejecting Your Resume?",
    descEs: "El 75% de los CVs son rechazados antes de llegar a un recruiter. Aprende qué es un sistema ATS, cómo funciona y qué cambiar para pasar el filtro.",
    descEn: "75% of resumes are rejected before reaching a recruiter. Learn what ATS is, how it works and what to change to pass the filter.",
    date: "2026-04-29",
    readingTime: 7,
    tag: "ATS",
  },
  {
    slug: "como-escribir-bullets-de-cv",
    titleEs: "Cómo escribir bullets de CV que consiguen entrevistas",
    titleEn: "How to Write CV Bullet Points That Get Interviews",
    descEs: "Guía práctica con ejemplos reales para redactar bullets de experiencia con verbos de acción, métricas y lenguaje orientado a resultados.",
    descEn: "Practical guide with real examples to write experience bullets with action verbs, metrics and results-oriented language.",
    date: "2026-04-29",
    readingTime: 6,
    tag: "Redacción",
  },
  {
    slug: "constructores-de-cv-gratuitos-vs-pago",
    titleEs: "Constructores de CV gratuitos vs de pago: ¿qué importa realmente?",
    titleEn: "Free vs Paid CV Builders: What Actually Matters",
    descEs: "Comparativa honesta de herramientas de CV gratuitas y de pago. Qué funciones cambian el resultado y cuándo vale la pena pagar.",
    descEn: "Honest comparison of free and paid CV tools. Which features change outcomes and when is it worth paying.",
    date: "2026-04-29",
    readingTime: 5,
    tag: "Herramientas",
  },
  {
    slug: "carta-de-presentacion-2026",
    titleEs: "Carta de presentación en 2026: ¿todavía importa?",
    titleEn: "Cover Letter in 2026: Does It Still Matter?",
    descEs: "¿Necesitas carta de presentación en 2026? Datos reales, cuándo incluirla y cómo escribir una que funcione con IA.",
    descEn: "Do you need a cover letter in 2026? Real data, when to include one and how to write one that works with AI.",
    date: "2026-04-29",
    readingTime: 5,
    tag: "Carta",
  },
  {
    slug: "como-hacer-un-cv-con-ia",
    titleEs: "Cómo hacer un CV con inteligencia artificial (paso a paso)",
    titleEn: "How to Make a Resume with AI in 2026 (Step by Step)",
    descEs: "Guía completa: usa IA para generar tu resumen, mejorar bullets, revisar el ATS Score y redactar tu carta de presentación en minutos.",
    descEn: "Complete guide: use AI to generate your summary, improve bullets, check ATS Score and write your cover letter in minutes.",
    date: "2026-05-02",
    readingTime: 8,
    tag: "IA",
  },
  {
    slug: "cv-para-desarrolladores-de-software",
    titleEs: "CV para desarrollador de software: guía completa 2026",
    titleEn: "Software Developer Resume: Complete Guide 2026",
    descEs: "Formato, sección de habilidades, bullets de impacto, proyectos y ATS Score. Todo lo que necesita tu CV para conseguir entrevistas en tech.",
    descEn: "Format, skills section, impact bullets, projects and ATS Score. Everything your resume needs to land tech interviews.",
    date: "2026-05-02",
    readingTime: 9,
    tag: "Tech",
  },
  {
    slug: "como-pasar-el-ats",
    titleEs: "Cómo pasar el ATS en 2026: tácticas probadas para tu CV",
    titleEn: "How to Pass ATS Screening in 2026 (Proven Tactics)",
    descEs: "El 75% de los CVs son rechazados por el ATS antes de llegar a un humano. Aprende las tácticas de formato, palabras clave y estructura que funcionan.",
    descEn: "Over 75% of resumes are rejected by ATS before a human reads them. Learn the format, keyword and structure tactics that actually work.",
    date: "2026-05-02",
    readingTime: 7,
    tag: "ATS",
  },
  {
    slug: "cv-para-marketing",
    titleEs: "CV para marketing 2026: formato, métricas y ejemplos",
    titleEn: "Marketing Resume Guide 2026: Format, Metrics & Examples",
    descEs: "Cómo estructurar tu CV de marketing, qué métricas incluir, herramientas que listar y cómo adaptarlo a cada oferta para conseguir más entrevistas.",
    descEn: "How to structure your marketing resume, which metrics to include, tools to list and how to tailor it to each role to get more interviews.",
    date: "2026-05-02",
    readingTime: 8,
    tag: "Marketing",
  },
  {
    slug: "carta-de-presentacion-ejemplos",
    titleEs: "Ejemplos de carta de presentación 2026: plantillas que funcionan",
    titleEn: "Cover Letter Examples 2026: Templates That Actually Work",
    descEs: "Ejemplos reales de cartas de presentación para tech, marketing y cambios de carrera. La estructura de 3 párrafos, aperturas ganadoras y los errores a evitar.",
    descEn: "Real cover letter examples for tech, marketing and career changers. The 3-paragraph structure, winning openings and the mistakes to avoid.",
    date: "2026-05-02",
    readingTime: 7,
    tag: "Carta",
  },
]

export default async function BlogIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const isEn = locale === "en"

  const jsonLdBlogIndex = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: isEn ? "CV Tips and Job Search Guides — ReadyCV Blog" : "Guías de CV y Búsqueda de Empleo — Blog ReadyCV",
    url: `https://readycvv.com/${locale}/blog`,
    description: isEn
      ? "Practical guides on optimizing your resume, passing ATS filters and getting more interviews."
      : "Guías prácticas para optimizar tu CV, pasar filtros ATS y conseguir más entrevistas.",
    hasPart: articles.map((a) => ({
      "@type": "Article",
      headline: isEn ? a.titleEn : a.titleEs,
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
              {isEn ? "CV tips and job search guides" : "Guías de CV y búsqueda de empleo"}
            </h1>
            <p className="text-muted-foreground text-lg">
              {isEn
                ? "Practical advice to optimize your resume and get more interviews."
                : "Consejos prácticos para optimizar tu CV y conseguir más entrevistas."}
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
                        {article.readingTime} {isEn ? "min read" : "min de lectura"}
                      </span>
                    </div>
                    <h2 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                      {isEn ? article.titleEn : article.titleEs}
                    </h2>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {isEn ? article.descEn : article.descEs}
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

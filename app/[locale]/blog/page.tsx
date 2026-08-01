import Navbar from "@/components/marketing/Navbar"
import Footer from "@/components/marketing/Footer"
import Link from "next/link"
import Script from "next/script"
import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { setRequestLocale } from "next-intl/server"
import { ArrowRight, FileText, Sparkles, Target, Crosshair, Globe, ListChecks, AlertTriangle, PenLine, Mail, Megaphone, Code2, Scale, Sprout, ScanLine, Bot, GitCompare, List, GraduationCap, Route, Ruler, Columns3 } from "lucide-react"
import type { LucideIcon } from "lucide-react"

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
      canonical: `https://valhallaresume.com/${locale}/blog`,
      languages: {
        es: "https://valhallaresume.com/es/blog",
        en: "https://valhallaresume.com/en/blog",
        "x-default": "https://valhallaresume.com/en/blog",
      },
    },
    openGraph: {
      title: t("title"),
      description: t("description"),
      url: `https://valhallaresume.com/${locale}/blog`,
      type: "website",
      images: [{ url: "https://valhallaresume.com/og-image.png", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
      images: ["https://valhallaresume.com/og-image.png"],
    },
  }
}

// Each post gets a cover panel whose icon + color relate to THAT post's topic,
// keyed on the stable English slug so no two categories collapse into the same
// visual. A gradient + a topic-relevant icon reads as an image without shipping
// a raster asset. Order matters: most specific slugs first. Falls back to brand.
function coverFor(slug: string): { from: string; to: string; Icon: LucideIcon } {
  const s = slug.toLowerCase()
  if (/summary|resumen/.test(s)) return { from: "#d97706", to: "#7c2d12", Icon: PenLine }        // resume summary
  if (/ingles|english|internacional/.test(s)) return { from: "#0d9488", to: "#0f2f3a", Icon: Globe } // international CV
  if (/skill|habilidad/.test(s)) return { from: "#7c3aed", to: "#1e1b4b", Icon: ListChecks }     // skills
  if (/recien|graduad|graduate/.test(s)) return { from: "#059669", to: "#052e2b", Icon: GraduationCap } // new grad
  if (/cambio-carrera|career-change/.test(s)) return { from: "#ea580c", to: "#7c2d12", Icon: Route }    // career switch
  if (/sin-experiencia|no-experience/.test(s)) return { from: "#16a34a", to: "#14532d", Icon: Sprout }  // no experience
  if (/verbo|action-verb/.test(s)) return { from: "#4f46e5", to: "#1e1b4b", Icon: Sparkles }     // action verbs
  if (/mistake|error/.test(s)) return { from: "#e11d48", to: "#4c0519", Icon: AlertTriangle }    // mistakes
  if (/tailor|adaptar/.test(s)) return { from: "#0891b2", to: "#0e2a47", Icon: Crosshair }       // tailor to job
  if (/length|longitud/.test(s)) return { from: "#2563eb", to: "#0e2a47", Icon: Ruler }          // resume length
  if (/chronological|functional/.test(s)) return { from: "#6366f1", to: "#1e1b4b", Icon: Columns3 } // formats
  if (/vs-resume|differences/.test(s)) return { from: "#475569", to: "#0f172a", Icon: GitCompare }   // CV vs resume
  if (/objetivo/.test(s)) return { from: "#f59e0b", to: "#7c2d12", Icon: Target }                 // career objective
  if (/ats/.test(s)) return { from: "#0891b2", to: "#0e2a47", Icon: ScanLine }                    // ATS
  if (/bullet/.test(s)) return { from: "#1d4ed8", to: "#0e2a47", Icon: List }                     // bullet points
  if (/con-ia|ai-cv|ai-resume/.test(s)) return { from: "#7c3aed", to: "#1e1b4b", Icon: Bot }      // AI CV
  if (/gratuitos|-pago|free-vs|constructores|builder/.test(s)) return { from: "#334155", to: "#0f172a", Icon: Scale } // free vs paid
  if (/carta|cover-letter|presentacion/.test(s)) return { from: "#db2777", to: "#500724", Icon: Mail } // cover letter
  if (/desarrollador|developer|software/.test(s)) return { from: "#0e7490", to: "#0e2a47", Icon: Code2 } // dev CV
  if (/marketing/.test(s)) return { from: "#1d4ed8", to: "#0e2a47", Icon: Megaphone }             // marketing CV
  return { from: "#00D4FF", to: "#1a2e4a", Icon: FileText }
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
    url: `https://valhallaresume.com/${locale}/blog`,
    description: t("collection_desc"),
    hasPart: articles.map((a) => ({
      "@type": "Article",
      headline: a.title,
      url: `https://valhallaresume.com/${locale}/blog/${a.slug}`,
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
            {articles.map((article) => {
              const cover = coverFor(article.slug)
              const CoverIcon = cover.Icon
              return (
                <Link
                  key={article.slug}
                  href={`/${locale}/blog/${article.slug}`}
                  className="group relative flex flex-col overflow-hidden rounded-3xl border border-[#1a2e4a]/8 bg-white shadow-[0_18px_40px_-16px_rgba(26,46,74,0.35),0_6px_12px_-6px_rgba(26,46,74,0.16)] transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_38px_70px_-20px_rgba(0,212,255,0.45),0_14px_28px_-12px_rgba(26,46,74,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D4FF] focus-visible:ring-offset-2 motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:flex-row"
                >
                  {/* Cover visual — illustrated editorial tile: a tilted résumé sheet
                      (the document the article is about) with the topic icon on a
                      frosted-glass badge. Reads as an image, ships zero assets. */}
                  <div
                    className="relative flex min-h-[184px] shrink-0 items-center justify-center overflow-hidden p-6 sm:w-64"
                    style={{ backgroundImage: `linear-gradient(140deg, ${cover.from}, ${cover.to})` }}
                  >
                    {/* fine grain + directional light + faint ring for depth */}
                    <div
                      aria-hidden
                      className="absolute inset-0 opacity-[0.14]"
                      style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "15px 15px" }}
                    />
                    <div aria-hidden className="absolute -left-12 -top-14 h-44 w-44 rounded-full bg-white/25 blur-3xl" />
                    <div aria-hidden className="absolute -bottom-16 -right-14 h-48 w-48 rounded-full border border-white/12" />

                    {/* Scene: résumé sheet + overlapping topic badge */}
                    <div aria-hidden className="relative">
                      <div className="w-[116px] rotate-[-6deg] rounded-xl bg-white/95 p-3 shadow-[0_20px_34px_-14px_rgba(0,0,0,0.55)] ring-1 ring-black/[0.06] transition-transform duration-500 ease-out group-hover:rotate-[-3deg] group-hover:scale-[1.05] motion-reduce:transition-none motion-reduce:group-hover:rotate-[-6deg] motion-reduce:group-hover:scale-100">
                        <div className="h-2 w-9 rounded-full" style={{ backgroundColor: cover.from }} />
                        <div className="mt-2.5 h-1.5 w-full rounded-full bg-[#1a2e4a]/12" />
                        <div className="mt-1.5 h-1.5 w-[86%] rounded-full bg-[#1a2e4a]/12" />
                        <div className="mt-1.5 h-1.5 w-[68%] rounded-full bg-[#1a2e4a]/12" />
                        <div className="mt-3 flex gap-1.5">
                          <div className="h-1.5 w-7 rounded-full bg-[#1a2e4a]/[0.08]" />
                          <div className="h-1.5 w-5 rounded-full bg-[#1a2e4a]/[0.08]" />
                        </div>
                      </div>
                      <div className="absolute -right-4 -top-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/40 bg-white/20 shadow-[0_10px_24px_-8px_rgba(0,0,0,0.5)] backdrop-blur-md transition-transform duration-500 ease-out group-hover:-translate-y-1 group-hover:scale-110 motion-reduce:transition-none motion-reduce:group-hover:translate-y-0 motion-reduce:group-hover:scale-100">
                        <CoverIcon strokeWidth={1.75} className="h-7 w-7 text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.4)]" />
                      </div>
                    </div>

                    <span className="absolute left-3 top-3 inline-flex items-center rounded-full bg-black/30 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-sm">
                      {article.readingTime} {tBlog("reading_time")}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="relative flex flex-1 flex-col p-6">
                    <span className="mb-2.5 inline-flex w-fit items-center rounded-full border border-[#00D4FF]/25 bg-gradient-to-r from-[#1a2e4a]/[0.06] to-[#00D4FF]/[0.10] px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-[#1a2e4a]">
                      {article.tag}
                    </span>
                    <h2 className="text-xl font-bold leading-snug text-[#1a2e4a] transition-colors group-hover:text-[#0f6f8f]">
                      {article.title}
                    </h2>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-[#1a2e4a]/60">
                      {article.desc}
                    </p>
                    <span
                      aria-hidden
                      className="mt-5 flex h-9 w-9 items-center justify-center self-end rounded-full border border-[#1a2e4a]/10 bg-white text-[#1a2e4a]/50 shadow-sm transition-all duration-300 group-hover:border-transparent group-hover:bg-gradient-to-br group-hover:from-[#00D4FF] group-hover:to-[#4F8BFF] group-hover:text-[#0f1a2e] group-hover:shadow-[0_8px_20px_-6px_rgba(0,212,255,0.6)]"
                    >
                      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

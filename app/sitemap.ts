import type { MetadataRoute } from "next"
import { templatesSEO } from "@/lib/templates-seo"
import { COUNTRIES } from "@/lib/salary/countries"
import { PROFESSIONS } from "@/lib/salary/professions"

const BASE_URL = "https://readycvv.com"
const locales = ["es", "en"] as const

type Page = {
  path: string
  changeFrequency: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never"
  priority: number
  lastModified?: Date
}

// Core public pages — both locales
const corePages: Array<Page & { lastModified: Date }> = [
  { path: "",              changeFrequency: "weekly",  priority: 1.0, lastModified: new Date("2026-05-02") },
  { path: "/pricing",      changeFrequency: "monthly", priority: 0.9, lastModified: new Date("2026-05-02") },
  { path: "/templates",    changeFrequency: "monthly", priority: 0.9, lastModified: new Date("2026-05-02") },
  { path: "/blog",         changeFrequency: "weekly",  priority: 0.7, lastModified: new Date("2026-05-02") },
  { path: "/register",     changeFrequency: "yearly",  priority: 0.8, lastModified: new Date("2026-04-01") },
  { path: "/login",        changeFrequency: "yearly",  priority: 0.4, lastModified: new Date("2026-04-01") },
  { path: "/guide",        changeFrequency: "monthly", priority: 0.9, lastModified: new Date("2026-05-09") },
  { path: "/tools/ats-checker", changeFrequency: "weekly", priority: 0.9, lastModified: new Date("2026-06-01") },
  { path: "/tools/salary-calculator", changeFrequency: "weekly", priority: 0.9, lastModified: new Date("2026-06-01") },
  { path: "/faq",          changeFrequency: "monthly", priority: 0.7, lastModified: new Date("2026-05-09") },
  { path: "/pro-disenos",  changeFrequency: "monthly", priority: 0.5, lastModified: new Date("2026-04-29") },
  { path: "/privacy",      changeFrequency: "yearly",  priority: 0.2, lastModified: new Date("2026-04-01") },
  { path: "/terms",        changeFrequency: "yearly",  priority: 0.2, lastModified: new Date("2026-04-01") },
  { path: "/cookie-policy", changeFrequency: "yearly", priority: 0.2, lastModified: new Date("2026-04-01") },
  { path: "/dmca",          changeFrequency: "yearly", priority: 0.2, lastModified: new Date("2026-04-01") },
]

// Blog articles — high priority for SEO cluster strategy
const blogSlugs: { slug: string; date: string }[] = [
  { slug: "que-es-ats-y-por-que-rechaza-tu-cv",    date: "2026-04-29" },
  { slug: "como-escribir-bullets-de-cv",             date: "2026-04-29" },
  { slug: "constructores-de-cv-gratuitos-vs-pago",  date: "2026-04-29" },
  { slug: "carta-de-presentacion-2026",              date: "2026-04-29" },
  { slug: "como-hacer-un-cv-con-ia",                date: "2026-05-02" },
  { slug: "cv-para-desarrolladores-de-software",    date: "2026-05-02" },
  { slug: "como-pasar-el-ats",                      date: "2026-05-02" },
  { slug: "cv-para-marketing",                      date: "2026-05-02" },
  { slug: "carta-de-presentacion-ejemplos",         date: "2026-05-02" },
]

// Locale-specific blog articles (single-language posts — no cross-translation pair).
// Posts here are emitted ONLY for their target locale.
const localeBlogSlugs: { locale: "en" | "es"; slug: string; date: string }[] = [
  // Lote 1 — pilot posts
  { locale: "en", slug: "how-to-write-resume-summary", date: "2026-06-01" },
  { locale: "es", slug: "cv-en-ingles",                date: "2026-06-01" },
  // Lote 2 — single-locale
  { locale: "en", slug: "cv-vs-resume-differences",    date: "2026-06-01" },
  { locale: "es", slug: "objetivo-profesional-ejemplos", date: "2026-06-01" },
  // Lote 3 — single-locale
  { locale: "en", slug: "chronological-vs-functional-resume", date: "2026-06-01" },
  { locale: "en", slug: "resume-length-guide",         date: "2026-06-01" },
  { locale: "es", slug: "cv-recien-graduado",          date: "2026-06-01" },
  { locale: "es", slug: "cv-cambio-carrera",           date: "2026-06-01" },
  // Lote 5 — single-locale
  { locale: "es", slug: "cv-sin-experiencia",          date: "2026-06-01" },
]

// Cross-translated post pairs — same canonical topic published in both EN and ES
// with distinct slugs. Each pair emits TWO URLs (one per locale). Hreflang is
// declared inside the page's `alternates.languages` metadata.
const crossTranslatedPosts: { enSlug: string; esSlug: string; date: string }[] = [
  // Lote 2 — Resume Skills / Habilidades para CV
  { enSlug: "resume-skills-by-industry", esSlug: "habilidades-para-cv", date: "2026-06-01" },
  // Lote 4 — Action Verbs / Verbos de Acción
  { enSlug: "action-verbs-resume", esSlug: "verbos-de-accion-cv", date: "2026-06-01" },
  // Lote 4 — Resume Mistakes / Errores Comunes CV
  { enSlug: "resume-mistakes-to-avoid", esSlug: "errores-comunes-cv", date: "2026-06-01" },
  // Lote 5 — Tailor Resume / Adaptar CV
  { enSlug: "how-to-tailor-resume", esSlug: "adaptar-cv-oferta-trabajo", date: "2026-06-01" },
]

const professionSlugs: string[] = [
  "software-engineer",
  "marketing",
  "data-scientist",
  "nurse",
  "project-manager",
  "designer",
  "accountant",
  "teacher",
  "lawyer",
  "sales",
  "hr",
]

const LAST_DEPLOY = new Date("2026-05-02")

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = []

  // Core pages for each locale
  for (const locale of locales) {
    for (const page of corePages) {
      entries.push({
        url: `${BASE_URL}/${locale}${page.path}`,
        lastModified: page.lastModified ?? LAST_DEPLOY,
        changeFrequency: page.changeFrequency,
        priority: page.priority,
      })
    }
  }

  // Blog articles for each locale (bilingual slugs)
  for (const locale of locales) {
    for (const { slug, date } of blogSlugs) {
      entries.push({
        url: `${BASE_URL}/${locale}/blog/${slug}`,
        lastModified: new Date(date),
        changeFrequency: "monthly",
        priority: 0.7,
      })
    }
  }

  // Locale-specific blog articles (emitted only for their target locale)
  for (const { locale, slug, date } of localeBlogSlugs) {
    entries.push({
      url: `${BASE_URL}/${locale}/blog/${slug}`,
      lastModified: new Date(date),
      changeFrequency: "monthly",
      priority: 0.7,
    })
  }

  // Cross-translated posts — emit BOTH locale URLs for each pair
  for (const { enSlug, esSlug, date } of crossTranslatedPosts) {
    entries.push({
      url: `${BASE_URL}/en/blog/${enSlug}`,
      lastModified: new Date(date),
      changeFrequency: "monthly",
      priority: 0.7,
    })
    entries.push({
      url: `${BASE_URL}/es/blog/${esSlug}`,
      lastModified: new Date(date),
      changeFrequency: "monthly",
      priority: 0.7,
    })
  }

  // Profession landing pages
  for (const locale of locales) {
    for (const slug of professionSlugs) {
      entries.push({
        url: `${BASE_URL}/${locale}/templates/${slug}`,
        lastModified: LAST_DEPLOY,
        changeFrequency: "monthly",
        priority: 0.8,
      })
    }
  }

  // Template detail pages — 129 templates × 2 locales = 258 URLs
  for (const locale of locales) {
    for (const tpl of templatesSEO) {
      entries.push({
        url: `${BASE_URL}/${locale}/templates/design/${tpl.slug}`,
        lastModified: LAST_DEPLOY,
        changeFrequency: "monthly",
        priority: 0.7,
      })
    }
  }

  // Salary calculator — country & profession landing pages
  // 6 countries × 2 locales = 12 + 6 × 30 × 2 = 360 = 372 URLs
  const SALARY_LAST = new Date("2026-06-01")
  for (const locale of locales) {
    for (const country of COUNTRIES) {
      entries.push({
        url: `${BASE_URL}/${locale}/salary/${country.slug}`,
        lastModified: SALARY_LAST,
        changeFrequency: "monthly",
        priority: 0.7,
      })
      for (const prof of PROFESSIONS) {
        entries.push({
          url: `${BASE_URL}/${locale}/salary/${country.slug}/${prof.slug}`,
          lastModified: SALARY_LAST,
          changeFrequency: "monthly",
          priority: 0.6,
        })
      }
    }
  }

  return entries
}

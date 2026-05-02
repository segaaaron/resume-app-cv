import type { MetadataRoute } from "next"

const BASE_URL = "https://readycvv.com"
const locales = ["es", "en"] as const

type Page = {
  path: string
  changeFrequency: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never"
  priority: number
}

// Core public pages — both locales
const corePages: Page[] = [
  { path: "",              changeFrequency: "weekly",  priority: 1.0 },
  { path: "/pricing",      changeFrequency: "monthly", priority: 0.9 },
  { path: "/templates",    changeFrequency: "monthly", priority: 0.9 },
  { path: "/blog",         changeFrequency: "weekly",  priority: 0.7 },
  { path: "/register",     changeFrequency: "yearly",  priority: 0.8 },
  { path: "/login",        changeFrequency: "yearly",  priority: 0.4 },
  { path: "/pro-disenos",  changeFrequency: "monthly", priority: 0.5 },
  { path: "/privacy",      changeFrequency: "yearly",  priority: 0.2 },
  { path: "/terms",        changeFrequency: "yearly",  priority: 0.2 },
]

// Blog articles — high priority for SEO cluster strategy
const blogSlugs: { slug: string; date: string }[] = [
  { slug: "que-es-ats-y-por-que-rechaza-tu-cv",    date: "2026-04-29" },
  { slug: "como-escribir-bullets-de-cv",             date: "2026-04-29" },
  { slug: "constructores-de-cv-gratuitos-vs-pago",  date: "2026-04-29" },
  { slug: "carta-de-presentacion-2026",              date: "2026-04-29" },
  { slug: "como-hacer-un-cv-con-ia",                date: "2026-05-02" },
  { slug: "cv-para-desarrolladores-de-software",    date: "2026-05-02" },
]

const professionSlugs: string[] = [
  "software-engineer",
  "marketing",
  "data-scientist",
  "nurse",
  "project-manager",
  "designer",
]

const LAST_DEPLOY = new Date("2026-05-02")

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = []

  // Core pages for each locale
  for (const locale of locales) {
    for (const page of corePages) {
      entries.push({
        url: `${BASE_URL}/${locale}${page.path}`,
        lastModified: LAST_DEPLOY,
        changeFrequency: page.changeFrequency,
        priority: page.priority,
      })
    }
  }

  // Blog articles for each locale
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

  return entries
}

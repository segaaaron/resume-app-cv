import type { MetadataRoute } from "next"

const BASE_URL = "https://readycvv.com"
const locales = ["es", "en"] as const

type Page = {
  path: string
  changeFrequency: "weekly" | "monthly" | "yearly"
  priority: number
}

const pages: Page[] = [
  { path: "",           changeFrequency: "weekly",  priority: 1.0 },
  { path: "/pricing",   changeFrequency: "monthly", priority: 0.9 },
  { path: "/templates", changeFrequency: "monthly", priority: 0.8 },
  { path: "/register",  changeFrequency: "yearly",  priority: 0.8 },
  { path: "/login",     changeFrequency: "yearly",  priority: 0.7 },
  { path: "/blog",      changeFrequency: "weekly",  priority: 0.6 },
  { path: "/pro-disenos", changeFrequency: "monthly", priority: 0.5 },
  { path: "/privacy",   changeFrequency: "yearly",  priority: 0.2 },
  { path: "/terms",     changeFrequency: "yearly",  priority: 0.2 },
]

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = []

  for (const locale of locales) {
    for (const page of pages) {
      entries.push({
        url: `${BASE_URL}/${locale}${page.path}`,
        lastModified: new Date(),
        changeFrequency: page.changeFrequency,
        priority: page.priority,
      })
    }
  }

  return entries
}

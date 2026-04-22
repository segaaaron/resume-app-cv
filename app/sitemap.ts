import type { MetadataRoute } from "next"

const BASE_URL = "https://readycv.app"
const locales = ["es", "en"] as const

type Page = {
  path: string
  changeFrequency: "weekly" | "monthly" | "yearly"
  priority: number
}

const pages: Page[] = [
  { path: "",           changeFrequency: "weekly",  priority: 1 },
  { path: "/templates", changeFrequency: "monthly", priority: 0.9 },
  { path: "/pricing",   changeFrequency: "monthly", priority: 0.8 },
  { path: "/pro-disenos", changeFrequency: "monthly", priority: 0.7 },
  { path: "/login",     changeFrequency: "yearly",  priority: 0.3 },
  { path: "/register",  changeFrequency: "yearly",  priority: 0.4 },
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

import type { MetadataRoute } from "next"

const BASE_URL = "https://readycv.app"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard/",
          "/editor/",
          "/api/",
          "/resume/",
          "/cover-letter/",
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}

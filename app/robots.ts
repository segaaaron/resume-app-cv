import type { MetadataRoute } from "next"

const BASE_URL = "https://www.valhallaresume.com"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/api/og"],
        disallow: [
          // Non-locale paths (legacy/redirect routes)
          "/dashboard/",
          "/editor/",
          "/api/",
          "/resume/",
          "/cover-letter/",
          "/checkout/",
          // Shared-by-link resumes. They carry the candidate's name, email and
          // phone; a share link is not a publication, and the page says noindex
          // too. Belt and braces, because this one is somebody's personal data.
          "/cv/",
          "/es/cv/",
          "/en/cv/",
          // Locale-prefixed authenticated routes
          "/es/dashboard/",
          "/en/dashboard/",
          "/es/editor/",
          "/en/editor/",
          "/es/resume/",
          "/en/resume/",
          "/es/cover-letter/",
          "/en/cover-letter/",
          "/es/checkout/",
          "/en/checkout/",
          "/es/verify-email/",
          "/en/verify-email/",
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}

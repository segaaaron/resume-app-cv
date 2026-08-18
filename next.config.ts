import type { NextConfig } from "next"
import createNextIntlPlugin from "next-intl/plugin"

const withNextIntl = createNextIntlPlugin("./i18n/request.ts")

const securityHeaders = [
  { key: "X-Content-Type-Options",    value: "nosniff" },
  { key: "X-Frame-Options",           value: "SAMEORIGIN" },
{ key: "Referrer-Policy",           value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy",                  value: "camera=(), microphone=(), geolocation=()" },
  { key: "X-Permitted-Cross-Domain-Policies",   value: "none" },
  { key: "Cross-Origin-Opener-Policy",          value: "same-origin-allow-popups" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' https://api.stripe.com https://api.openai.com",
      "frame-src https://js.stripe.com https://hooks.stripe.com",
      "object-src 'none'",
      "base-uri 'self'",
    ].join("; "),
  },
]

// ── Blog: single-locale posts ───────────────────────────────────────────────
// Not every article exists in both languages. Hitting a post under the wrong
// locale prefix used to render a 404 (Search Console: "No encontrado (404)",
// 17 URLs). Google reaches those URLs by swapping the locale segment on its
// own — nothing on the site links them — so the honest answer is a 301 to the
// page that does exist, not a dead end. Two shapes:
//   1. Cross-translated pairs → send to the counterpart IN the requested locale
//      (/en/blog/habilidades-para-cv → /en/blog/resume-skills-by-industry).
//   2. Posts with no counterpart → send to the post in ITS OWN locale
//      (/en/blog/cv-en-ingles → /es/blog/cv-en-ingles).
// Keep in sync with app/sitemap.ts (`crossTranslatedPosts` / `localeBlogSlugs`)
// and app/[locale]/blog/page.tsx.

// [enSlug, esSlug] — same topic published under a distinct slug per language.
const CROSS_TRANSLATED: [string, string][] = [
  ["resume-skills-by-industry", "habilidades-para-cv"],
  ["action-verbs-resume", "verbos-de-accion-cv"],
  ["resume-mistakes-to-avoid", "errores-comunes-cv"],
  ["how-to-tailor-resume", "adaptar-cv-oferta-trabajo"],
]

// Posts that exist in one language only.
const EN_ONLY = [
  "how-to-write-resume-summary",
  "cv-vs-resume-differences",
  "chronological-vs-functional-resume",
  "resume-length-guide",
]
const ES_ONLY = [
  "cv-en-ingles",
  "objetivo-profesional-ejemplos",
  "cv-recien-graduado",
  "cv-cambio-carrera",
  "cv-sin-experiencia",
]

const blogLocaleRedirects = [
  ...CROSS_TRANSLATED.flatMap(([en, es]) => [
    { source: `/en/blog/${es}`, destination: `/en/blog/${en}`, permanent: true },
    { source: `/es/blog/${en}`, destination: `/es/blog/${es}`, permanent: true },
  ]),
  ...EN_ONLY.map((slug) => ({
    source: `/es/blog/${slug}`,
    destination: `/en/blog/${slug}`,
    permanent: true,
  })),
  ...ES_ONLY.map((slug) => ({
    source: `/en/blog/${slug}`,
    destination: `/es/blog/${slug}`,
    permanent: true,
  })),
]

const nextConfig: NextConfig = {
  output: "standalone",
  compress: true,
  // Hide the on-screen dev indicator (the "N" badge). It's dev-only, but the
  // screenshot service was capturing it into template thumbnails.
  devIndicators: false,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  // nspell + the Hunspell dictionaries stay OUT of the server bundle: the
  // dictionary packages read their .aff/.dic with `fs.readFile(new URL(...,
  // import.meta.url))`, which resolves to the bundle path once webpack inlines
  // them — the files are then not there and the spell check throws at runtime.
  serverExternalPackages: ["pdf-parse", "mammoth", "geoip-lite", "nspell", "dictionary-en", "dictionary-es"],
  outputFileTracingIncludes: {
    // Data files read at runtime, not imported — the tracer cannot see them, so
    // a standalone build would ship without them.
    "/**/*": [
      "./node_modules/geoip-lite/data/**/*.dat",
      "./node_modules/dictionary-en/index.{aff,dic}",
      "./node_modules/dictionary-es/index.{aff,dic}",
    ],
  },
  async redirects() {
    return [
      // "PRO diseños" merged into the unified /templates page (PRO group).
      { source: "/:locale/pro-disenos", destination: "/:locale/templates#pro", permanent: true },
      ...blogLocaleRedirects,
    ]
  },
  async rewrites() {
    // Umami analytics proxied same-origin so the tracker + collect endpoint stay
    // under valhallaresume.com: keeps the CSP at `'self'` (no external whitelist) and
    // side-steps ad blockers. `beforeFiles` runs ahead of routes/filesystem, and
    // both paths are already excluded from the i18n middleware matcher
    // (`/api/*` and any path with a `.`), so no locale prefix is injected.
    return {
      beforeFiles: [
        { source: "/script.js", destination: "https://analytics.yasminmedrano.com/script.js" },
        // /api/send YA NO se reescribe: lo atiende app/api/send/route.ts, que reenvía la
        // IP del visitante. Un rewrite es un proxy ciego y Umami ubicaba a todo el mundo
        // como "(Unknown)" porque veía siempre la IP de nuestro servidor.
      ],
    }
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        // Static images: 1-year immutable cache. Filename-based versioning handles updates.
        source: "/images/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },

    ]
  },
}

export default withNextIntl(nextConfig)

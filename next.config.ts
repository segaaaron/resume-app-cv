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

const nextConfig: NextConfig = {
  output: "standalone",
  compress: true,
  // Hide the on-screen dev indicator (the "N" badge). It's dev-only, but the
  // screenshot service was capturing it into template thumbnails.
  devIndicators: false,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  serverExternalPackages: ["pdf-parse", "mammoth", "geoip-lite"],
  outputFileTracingIncludes: {
    "/**/*": ["./node_modules/geoip-lite/data/**/*.dat"],
  },
  async redirects() {
    // "PRO diseños" merged into the unified /templates page (PRO group).
    return [
      { source: "/:locale/pro-disenos", destination: "/:locale/templates#pro", permanent: true },
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
        { source: "/api/send", destination: "https://analytics.yasminmedrano.com/api/send" },
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

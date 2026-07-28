import type { Metadata } from "next"
import { NextIntlClientProvider } from "next-intl"
import { getMessages, setRequestLocale } from "next-intl/server"
import { routing } from "@/i18n/routing"
import { notFound } from "next/navigation"
import { UpgradeModalProvider } from "@/contexts/UpgradeModalContext"

const BASE_URL = "https://readycvv.com"

// Locale-aware so the site-wide OG locale and x-default follow the language the
// subtree is rendered in — a static `es_ES` / x-default=/es leaked onto every
// English page that doesn't set its own openGraph (privacy, terms, cookie-policy,
// dmca, accessibility), telling crawlers those /en pages were Spanish. Content
// pages still override alternates/OG with their own path; this only fixes the
// inherited default. x-default = English, mirroring the runtime FALLBACK_LOCALE.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const isEs = locale === "es"
  return {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "ReadyCVV — AI Resume Builder | Beat ATS, 128 Templates",
    template: "%s | ReadyCVV",
  },
  description:
    "Build an ATS-optimized resume with AI in minutes. 128 professional templates, cover letter generator, job application tracker. Try ReadyCVV Pro from $15/month.",
  keywords: [
    // High-intent EN (KD 50-65)
    "ai resume builder",
    "ats resume builder",
    "resume builder with cover letter",
    "professional resume templates",
    // High-intent ES (KD 20-35 — primary opportunity)
    "constructor de cv con ia",
    "resume builder en español",
    "crear cv profesional online",
    "plantillas de cv profesionales",
    "generador de curriculum vitae con inteligencia artificial",
    "cv con analisis ats",
    // Long-tail decision-intent
    "hacer cv online gratis con ia",
    "curriculum vitae para trabajo en el extranjero",
    "plantillas cv ats compatible",
    "carta de presentacion con inteligencia artificial",
  ],
  authors: [{ name: "ReadyCVV", url: BASE_URL }],
  creator: "ReadyCVV",
  publisher: "ReadyCVV",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: `${BASE_URL}/${locale}`,
    languages: {
      es: `${BASE_URL}/es`,
      en: `${BASE_URL}/en`,
      "x-default": `${BASE_URL}/en`,
    },
  },
  openGraph: {
    type: "website",
    locale: isEs ? "es_ES" : "en_US",
    alternateLocale: isEs ? ["en_US"] : ["es_ES"],
    url: `${BASE_URL}/${locale}`,
    siteName: "ReadyCVV",
    title: "ReadyCVV — AI Resume Builder | Beat ATS, 128 Templates",
    description:
      "Build an ATS-optimized resume with AI in minutes. 128 professional templates, cover letter generator, job application tracker. From $15/month.",
    images: [
      {
        url: `${BASE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "ReadyCVV — AI Resume Builder with 128 Professional Templates",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ReadyCVV — AI Resume Builder | Beat ATS, 128 Templates",
    description:
      "Build an ATS-optimized resume with AI in minutes. 128 professional templates, cover letter generator, job application tracker.",
    images: [`${BASE_URL}/og-image.png`],
    creator: "@readycvv",
    site: "@readycvv",
  },
  verification: {
    google: "a7b236b7cefc3ac7e10f5ca57c3ec884eaea1aac",
  },
  }
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  if (!routing.locales.includes(locale as "es" | "en")) {
    notFound()
  }

  // Enable static rendering for the whole [locale] subtree. Without this,
  // next-intl falls back to dynamic rendering for every descendant page.
  // Pages that genuinely need per-request data opt back in via `export const dynamic`.
  setRequestLocale(locale)

  const messages = await getMessages()

  return (
    <NextIntlClientProvider messages={messages}>
      <UpgradeModalProvider>
        {children}
      </UpgradeModalProvider>
    </NextIntlClientProvider>
  )
}

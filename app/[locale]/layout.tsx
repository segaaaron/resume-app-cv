import type { Metadata } from "next"
import { NextIntlClientProvider } from "next-intl"
import { getMessages, setRequestLocale } from "next-intl/server"
import { routing } from "@/i18n/routing"
import { notFound } from "next/navigation"
import { UpgradeModalProvider } from "@/contexts/UpgradeModalContext"

const BASE_URL = "https://www.valhallaresume.com"

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
    default: "Valhalla Resume — AI Resume Builder | Beat ATS, 132 Templates",
    template: "%s | Valhalla Resume",
  },
  description:
    "Build an ATS-optimized resume with AI in minutes. 132 professional templates, cover letter generator, job application tracker. Try Valhalla Resume Pro from $15/month.",
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
  authors: [{ name: "Valhalla Resume", url: BASE_URL }],
  creator: "Valhalla Resume",
  publisher: "Valhalla Resume",
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
    siteName: "Valhalla Resume",
    title: "Valhalla Resume — AI Resume Builder | Beat ATS, 132 Templates",
    description:
      "Build an ATS-optimized resume with AI in minutes. 132 professional templates, cover letter generator, job application tracker. From $15/month.",
    images: [
      {
        url: `${BASE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Valhalla Resume — AI Resume Builder with 132 Professional Templates",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Valhalla Resume — AI Resume Builder | Beat ATS, 132 Templates",
    description:
      "Build an ATS-optimized resume with AI in minutes. 132 professional templates, cover letter generator, job application tracker.",
    images: [`${BASE_URL}/og-image.png`],
  },
  verification: {
    google: "ZSp58knctbj095ozmJb69X35jNn3pgP-uOZQ7PR5FSo",
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

import type { Metadata } from "next"
import { NextIntlClientProvider } from "next-intl"
import { getMessages } from "next-intl/server"
import { routing } from "@/i18n/routing"
import { notFound } from "next/navigation"

const BASE_URL = "https://readycvv.com"

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "ReadyCV — AI Resume Builder | Beat ATS, 111+ Templates",
    template: "%s | ReadyCV",
  },
  description:
    "Build an ATS-optimized resume with AI in minutes. 111+ professional templates, cover letter generator, job application tracker. Try ReadyCV Pro from $15/month.",
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
  authors: [{ name: "ReadyCV", url: BASE_URL }],
  creator: "ReadyCV",
  publisher: "ReadyCV",
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
    canonical: BASE_URL,
    languages: {
      es: `${BASE_URL}/es`,
      en: `${BASE_URL}/en`,
      "x-default": `${BASE_URL}/es`,
    },
  },
  openGraph: {
    type: "website",
    locale: "es_ES",
    alternateLocale: ["en_US"],
    url: BASE_URL,
    siteName: "ReadyCV",
    title: "ReadyCV — AI Resume Builder | Beat ATS, 111+ Templates",
    description:
      "Build an ATS-optimized resume with AI in minutes. 111+ professional templates, cover letter generator, job application tracker. From $15/month.",
    images: [
      {
        url: `${BASE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "ReadyCV — AI Resume Builder with 111+ Professional Templates",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ReadyCV — AI Resume Builder | Beat ATS, 111+ Templates",
    description:
      "Build an ATS-optimized resume with AI in minutes. 111+ professional templates, cover letter generator, job application tracker.",
    images: [`${BASE_URL}/og-image.png`],
    creator: "@readycvv",
    site: "@readycvv",
  },
  verification: {
    google: "a7b236b7cefc3ac7e10f5ca57c3ec884eaea1aac",
  },
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

  const messages = await getMessages()

  return (
    <NextIntlClientProvider messages={messages}>
      {children}
    </NextIntlClientProvider>
  )
}

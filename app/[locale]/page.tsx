import type { Metadata } from "next"
import Script from "next/script"
import Navbar from "@/components/marketing/Navbar"
import Hero from "@/components/marketing/Hero"
import HowItWorks from "@/components/marketing/HowItWorks"
import FeatureCards from "@/components/marketing/FeatureCards"
import TemplateGallery from "@/components/marketing/TemplateGallery"
import SocialProof from "@/components/marketing/SocialProof"
import FAQ from "@/components/marketing/FAQ"
import Footer from "@/components/marketing/Footer"
import { getTranslations } from "next-intl/server"
import { setRequestLocale } from "next-intl/server"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "metadata.home" })

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: "https://readycv.app",
      languages: {
        es: "https://readycv.app/es",
        en: "https://readycv.app/en",
      },
    },
    openGraph: {
      title: t("og_title"),
      description: t("og_description"),
      url: "https://readycv.app",
      type: "website",
    },
  }
}

const jsonLdWebsite = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "READY CV",
  url: "https://readycv.app",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: "https://readycv.app/templates?q={search_term_string}",
    },
    "query-input": "required name=search_term_string",
  },
}

const jsonLdSitelinks = {
  "@context": "https://schema.org",
  "@type": "SiteLinksSearchBox",
  url: "https://readycv.app",
  potentialAction: {
    "@type": "SearchAction",
    target: "https://readycv.app/templates?q={search_term_string}",
    "query-input": "required name=search_term_string",
  },
}

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "READY CV",
  url: "https://readycv.app",
  description:
    "Generador de CV profesional online. Crea tu currículum vitae con plantillas modernas y descarga en PDF gratis.",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  offers: [
    {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      description: "Plan gratuito con plantillas básicas",
    },
    {
      "@type": "Offer",
      price: "10",
      priceCurrency: "USD",
      description: "Plan Pro con todas las plantillas y funciones avanzadas",
      billingIncrement: "P1M",
    },
  ],
  featureList: [
    "29 plantillas profesionales",
    "Descarga en PDF",
    "Editor en tiempo real",
    "Cartas de presentación",
    "Gestión de candidaturas",
  ],
  inLanguage: "es",
  screenshot: "https://readycv.app/og-image.png",
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.8",
    ratingCount: "320",
  },
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <div className="flex flex-col min-h-screen">
      <Script
        id="json-ld-webapp"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Script
        id="json-ld-website"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdWebsite) }}
      />
      <Script
        id="json-ld-sitelinks"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSitelinks) }}
      />
      <Navbar />
      <main className="flex-1">
        <Hero />
        <HowItWorks />
        <FeatureCards />
        <TemplateGallery />
        <SocialProof />
        <FAQ />
      </main>
      <Footer />
    </div>
  )
}

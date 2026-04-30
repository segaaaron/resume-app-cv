import type { Metadata } from "next"
import Script from "next/script"
import Navbar from "@/components/marketing/Navbar"
import Hero from "@/components/marketing/Hero"
import HowItWorks from "@/components/marketing/HowItWorks"
import FeatureCards from "@/components/marketing/FeatureCards"
import AIFeatures from "@/components/marketing/AIFeatures"
import ATSSection from "@/components/marketing/ATSSection"
import CVExamples from "@/components/marketing/CVExamples"
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
    "Constructor de CV con IA y análisis ATS. 128 plantillas profesionales, carta de presentación automática y tracker de candidaturas.",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  offers: [
    {
      "@type": "Offer",
      price: "15",
      priceCurrency: "USD",
      description: "Plan Pro con 128 plantillas, 7 herramientas de IA y análisis ATS",
      billingIncrement: "P1M",
    },
  ],
  featureList: [
    "128 plantillas profesionales",
    "Análisis ATS con IA",
    "Mejora de bullets con IA",
    "Generador de resumen profesional",
    "Carta de presentación con IA",
    "Tracker de candidaturas",
    "Exportación PDF y Word",
    "CV público compartible",
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
        <AIFeatures />
        <ATSSection />
        <CVExamples />
        <TemplateGallery />
        <SocialProof />
        <FAQ />
      </main>
      <Footer />
    </div>
  )
}

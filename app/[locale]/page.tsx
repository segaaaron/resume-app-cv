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
      canonical: `https://readycvv.com/${locale}`,
      languages: {
        es: "https://readycvv.com/es",
        en: "https://readycvv.com/en",
        "x-default": "https://readycvv.com/es",
      },
    },
    openGraph: {
      title: t("og_title"),
      description: t("og_description"),
      url: `https://readycvv.com/${locale}`,
      type: "website",
      locale: locale === "es" ? "es_ES" : "en_US",
      images: [
        {
          url: "https://readycvv.com/og-image.png",
          width: 1200,
          height: 630,
          alt: locale === "es"
            ? "ReadyCV — Constructor de CV con IA"
            : "ReadyCV — AI Resume Builder",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: t("og_title"),
      description: t("og_description"),
      images: ["https://readycvv.com/og-image.png"],
    },
  }
}

const jsonLdWebsite = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "ReadyCV",
  url: "https://readycvv.com",
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: "https://readycvv.com/templates?q={search_term_string}",
    },
    "query-input": "required name=search_term_string",
  },
}

const jsonLdOrganization = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "ReadyCV",
  url: "https://readycvv.com",
  logo: {
    "@type": "ImageObject",
    url: "https://readycvv.com/og-image.png",
    width: 1200,
    height: 630,
  },
  sameAs: [],
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer support",
    email: "support@readycvv.com",
  },
}

const jsonLdWebApp = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "ReadyCV",
  url: "https://readycvv.com",
  description:
    "AI-powered resume builder with ATS analysis. 111+ professional templates, cover letter generator, job application tracker.",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  browserRequirements: "Requires JavaScript. Requires HTML5.",
  offers: [
    {
      "@type": "Offer",
      price: "15.00",
      priceCurrency: "USD",
      description: "Pro Plan: 111+ templates, 7 AI tools, ATS Score, cover letter generator, application tracker",
      priceValidUntil: "2027-01-01",
    },
    {
      "@type": "Offer",
      price: "144.00",
      priceCurrency: "USD",
      description: "Pro Plan Annual (save 20%): 111+ templates, 7 AI tools, ATS Score, cover letter generator",
      priceValidUntil: "2027-01-01",
    },
  ],
  featureList: [
    "111+ professional resume templates",
    "ATS Score analysis with AI",
    "AI bullet point improvement",
    "AI professional summary generator",
    "AI cover letter generator",
    "Job application Kanban tracker",
    "PDF export",
    "Shareable public CV with custom URL",
    "AI CV review with applied suggestions",
    "Resume version history",
  ],
  inLanguage: ["es", "en"],
  screenshot: "https://readycvv.com/og-image.png",
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.8",
    ratingCount: "320",
  },
}

const jsonLdFaq = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is ReadyCV?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "ReadyCV is an AI-powered resume builder that helps you create ATS-optimized resumes in minutes. It includes 111+ professional templates, an ATS score analyzer, AI cover letter generator, and a job application tracker — all in one platform.",
      },
    },
    {
      "@type": "Question",
      name: "How does the AI work in ReadyCV?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "ReadyCV uses GPT-4o-mini to power 7 AI tools: bullet point improvement, professional summary generation, ATS compatibility scoring, cover letter generation, CV review with actionable suggestions, skills suggestion, and AI profile filling from a free-text description.",
      },
    },
    {
      "@type": "Question",
      name: "Is ReadyCV compatible with ATS systems?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. ReadyCV includes a built-in ATS Score tool that analyzes your resume against a specific job description and scores compatibility. It also includes ATS-optimized templates that use clean formatting recruiters and ATS systems can parse correctly.",
      },
    },
    {
      "@type": "Question",
      name: "How much does ReadyCV cost?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "ReadyCV Pro costs $15/month or $144/year (saving 20%). This includes unlimited resumes, all 111+ templates, all 7 AI features, ATS Score, cover letter generator, and job application tracker. There is no free plan — every feature is included in Pro.",
      },
    },
    {
      "@type": "Question",
      name: "In what languages is ReadyCV available?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "ReadyCV is fully available in Spanish and English. The interface, AI tools, and templates work in both languages, making it the leading AI resume builder for Spanish-speaking professionals.",
      },
    },
    {
      "@type": "Question",
      name: "¿Qué es ReadyCV?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "ReadyCV es un constructor de CV con inteligencia artificial que te ayuda a crear un currículum optimizado para ATS en minutos. Incluye más de 111 plantillas profesionales, análisis de compatibilidad ATS, generador de carta de presentación con IA, y un tracker de candidaturas — todo en una sola plataforma.",
      },
    },
    {
      "@type": "Question",
      name: "¿Cuánto cuesta ReadyCV?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "ReadyCV Pro cuesta $15/mes o $144/año (ahorrando un 20%). Incluye CVs ilimitados, todas las 111+ plantillas, las 7 herramientas de IA, ATS Score, generador de carta de presentación y tracker de candidaturas. Es más económico que competidores como Zety ($24/mes) o Resume.io ($26/mes).",
      },
    },
  ],
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdWebApp) }}
      />
      <Script
        id="json-ld-website"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdWebsite) }}
      />
      <Script
        id="json-ld-organization"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdOrganization) }}
      />
      <Script
        id="json-ld-faq"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFaq) }}
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

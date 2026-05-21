import type { Metadata } from "next"
import Script from "next/script"
import { getTranslations, setRequestLocale } from "next-intl/server"
import CinematicHomepage from "@/components/marketing/cinematic/CinematicHomepage"
import ActEntry from "@/components/marketing/cinematic/ActEntry"
import ActProblem from "@/components/marketing/cinematic/ActProblem"
import ActReveal from "@/components/marketing/cinematic/ActReveal"
import ActFeatureScene from "@/components/marketing/cinematic/ActFeatureScene"
import FillProfileMockup from "@/components/guide/mockups/FillProfileMockup"
import ImproveBulletMockup from "@/components/guide/mockups/ImproveBulletMockup"
import SummaryMockup from "@/components/guide/mockups/SummaryMockup"
import ATSScoreMockup from "@/components/guide/mockups/ATSScoreMockup"
import CoverLetterMockup from "@/components/guide/mockups/CoverLetterMockup"
import CVReviewMockup from "@/components/guide/mockups/CVReviewMockup"
import ActTemplates from "@/components/marketing/cinematic/ActTemplates"
import ActClimax from "@/components/marketing/cinematic/ActClimax"

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
          alt: t("og_image_alt"),
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
  name: "ReadyCVV",
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
  name: "ReadyCVV",
  url: "https://readycvv.com",
  logo: {
    "@type": "ImageObject",
    url: "https://readycvv.com/icon.svg",
    width: 512,
    height: 512,
  },
  sameAs: [
    "https://twitter.com/readycvv",
  ],
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer support",
    email: "support@readycvv.com",
  },
}

const jsonLdWebApp = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "ReadyCVV",
  url: "https://readycvv.com",
  description:
    "AI-powered resume builder with ATS analysis. 139+ professional templates, cover letter generator, job application tracker.",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  browserRequirements: "Requires JavaScript. Requires HTML5.",
  offers: [
    {
      "@type": "Offer",
      price: "15.00",
      priceCurrency: "USD",
      description: "Pro Plan: 139+ templates, 7 AI tools, ATS Score, cover letter generator, application tracker",
      priceValidUntil: "2027-01-01",
    },
    {
      "@type": "Offer",
      price: "144.00",
      priceCurrency: "USD",
      description: "Pro Plan Annual (save 20%): 139+ templates, 7 AI tools, ATS Score, cover letter generator",
      priceValidUntil: "2027-01-01",
    },
  ],
  featureList: [
    "139+ professional resume templates",
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
      name: "What is ReadyCVV?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "ReadyCVV is an AI-powered resume builder that helps you create ATS-optimized resumes in minutes. It includes 139+ professional templates, an ATS score analyzer, AI cover letter generator, and a job application tracker — all in one platform.",
      },
    },
    {
      "@type": "Question",
      name: "How does the AI work in ReadyCVV?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "ReadyCVV uses GPT-4o-mini to power 7 AI tools: bullet point improvement, professional summary generation, ATS compatibility scoring, cover letter generation, CV review with actionable suggestions, skills suggestion, and AI profile filling from a free-text description.",
      },
    },
    {
      "@type": "Question",
      name: "Is ReadyCVV compatible with ATS systems?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. ReadyCVV includes a built-in ATS Score tool that analyzes your resume against a specific job description and scores compatibility. It also includes ATS-optimized templates that use clean formatting recruiters and ATS systems can parse correctly.",
      },
    },
    {
      "@type": "Question",
      name: "How much does ReadyCVV cost?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "ReadyCVV Pro costs $15/month or $144/year (saving 20%). This includes unlimited resumes, all 139+ templates, all 7 AI features, ATS Score, cover letter generator, and job application tracker. There is no free plan — every feature is included in Pro.",
      },
    },
    {
      "@type": "Question",
      name: "In what languages is ReadyCVV available?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "ReadyCVV is fully available in Spanish and English. The interface, AI tools, and templates work in both languages, making it the leading AI resume builder for Spanish-speaking professionals.",
      },
    },
    {
      "@type": "Question",
      name: "¿Qué es ReadyCVV?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "ReadyCVV es un constructor de CV con inteligencia artificial que te ayuda a crear un currículum optimizado para ATS en minutos. Incluye más de 139 plantillas profesionales, análisis de compatibilidad ATS, generador de carta de presentación con IA, y un tracker de candidaturas — todo en una sola plataforma.",
      },
    },
    {
      "@type": "Question",
      name: "¿Cuánto cuesta ReadyCVV?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "ReadyCVV Pro cuesta $15/mes o $144/año (ahorrando un 20%). Incluye CVs ilimitados, todas las 139+ plantillas, las 7 herramientas de IA, ATS Score, generador de carta de presentación y tracker de candidaturas.",
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
  const t = await getTranslations({ locale, namespace: "cinematic" })

  return (
    <>
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

      <CinematicHomepage locale={locale}>
        <ActEntry
          line1={t("entry_line1")}
          line2={t("entry_line2")}
          scrollHint={t("entry_scroll")}
        />
        <ActProblem
          stat={t("problem_stat")}
          line1={t("problem_line1")}
          line2={t("problem_line2")}
          body={t("problem_body")}
        />
        <ActReveal
          brand={t("reveal_brand")}
          tagline={t("reveal_tagline")}
          statAi={t("reveal_stats_ai")}
          statTemplates={t("reveal_stats_templates")}
          statAts={t("reveal_stats_ats")}
        />
        <ActFeatureScene
          scene="act-fill"
          badge="IA · Fill Profile"
          headline={t("feature_fill_headline")}
          body={t("feature_fill_body")}
          mockup={<FillProfileMockup locale={locale} />}
          reverse={false}
        />
        <ActFeatureScene
          scene="act-bullets"
          badge="IA · Improve Bullets"
          headline={t("feature_bullets_headline")}
          body={t("feature_bullets_body")}
          mockup={<ImproveBulletMockup locale={locale} />}
          reverse={true}
        />
        <ActFeatureScene
          scene="act-summary"
          badge="IA · Summary"
          headline={t("feature_summary_headline")}
          body={t("feature_summary_body")}
          mockup={<SummaryMockup locale={locale} />}
          reverse={false}
        />
        <ActFeatureScene
          scene="act-ats"
          badge="IA · ATS Score"
          headline={t("feature_ats_headline")}
          body={t("feature_ats_body")}
          mockup={<ATSScoreMockup locale={locale} />}
          reverse={true}
        />
        <ActFeatureScene
          scene="act-cover"
          badge="IA · Cover Letter"
          headline={t("feature_cover_headline")}
          body={t("feature_cover_body")}
          mockup={<CoverLetterMockup locale={locale} />}
          reverse={false}
        />
        <ActFeatureScene
          scene="act-review"
          badge="IA · CV Review"
          headline={t("feature_review_headline")}
          body={t("feature_review_body")}
          mockup={<CVReviewMockup locale={locale} />}
          reverse={true}
        />
        <ActTemplates
          headline={t("templates_headline")}
          sub={t("templates_sub")}
          footer={t("templates_footer")}
          locale={locale}
          labels={{
            tech: t("templates_tech"),
            design: t("templates_design"),
            legal: t("templates_legal"),
            health: t("templates_health"),
            hospitality: t("templates_hospitality"),
          }}
        />
        <ActClimax
          line1={t("climax_line1")}
          line2={t("climax_line2")}
          cta={t("climax_cta")}
          note={t("climax_note")}
          locale={locale}
        />
      </CinematicHomepage>
    </>
  )
}

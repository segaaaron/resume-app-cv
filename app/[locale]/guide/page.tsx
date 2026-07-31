import type { Metadata } from "next"
import Script from "next/script"
import { getTranslations, setRequestLocale } from "next-intl/server"
import Navbar from "@/components/marketing/Navbar"
import Footer from "@/components/marketing/Footer"
import ScrollRevealInit from "@/components/ui/ScrollRevealInit"
import GuideHero from "@/components/guide/GuideHero"
import GuideSteps from "@/components/guide/GuideSteps"
import GuideFeatureBlock from "@/components/guide/GuideFeatureBlock"
import GuideStats from "@/components/guide/GuideStats"
import GuideCTA from "@/components/guide/GuideCTA"
import FillProfileMockup from "@/components/guide/mockups/FillProfileMockup"
import ImproveBulletMockup from "@/components/guide/mockups/ImproveBulletMockup"
import SummaryMockup from "@/components/guide/mockups/SummaryMockup"
import ATSScoreMockup from "@/components/guide/mockups/ATSScoreMockup"
import CoverLetterMockup from "@/components/guide/mockups/CoverLetterMockup"
import CVReviewMockup from "@/components/guide/mockups/CVReviewMockup"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "metadata.guide" })

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: `https://readycvv.com/${locale}/guide`,
      languages: {
        es: "https://readycvv.com/es/guide",
        en: "https://readycvv.com/en/guide",
        "x-default": "https://readycvv.com/en/guide",
      },
    },
    openGraph: {
      title: t("og_title"),
      description: t("og_description"),
      url: `https://readycvv.com/${locale}/guide`,
      type: "website",
      images: [{ url: "https://readycvv.com/og-image.png", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: t("og_title"),
      description: t("og_description"),
      images: ["https://readycvv.com/og-image.png"],
    },
  }
}

const jsonLdHowTo = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "Cómo crear un CV profesional con ReadyCVV e Inteligencia Artificial",
  description: "Guía paso a paso para crear un CV profesional usando las 7 herramientas de IA de ReadyCVV",
  step: [
    {
      "@type": "HowToStep",
      position: 1,
      name: "Elige tu plantilla",
      text: "Selecciona entre 143 plantillas profesionales compatibles con sistemas ATS",
    },
    {
      "@type": "HowToStep",
      position: 2,
      name: "Completa tu perfil con IA",
      text: "Usa la IA para rellenar tu perfil, mejorar bullets, generar resumen y carta de presentación",
    },
    {
      "@type": "HowToStep",
      position: 3,
      name: "Analiza tu compatibilidad ATS",
      text: "Pega la oferta de empleo y obtén tu porcentaje de compatibilidad con keywords presentes y faltantes",
    },
    {
      "@type": "HowToStep",
      position: 4,
      name: "Descarga tu CV en PDF",
      text: "Exporta tu CV como PDF profesional listo para enviar a empleadores",
    },
  ],
}

export default async function GuidePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const tf = await getTranslations({ locale, namespace: "guide.features" })

  const features = [
    {
      badge: tf("fill_profile.badge"),
      title: tf("fill_profile.title"),
      description: tf("fill_profile.description"),
      mockup: <FillProfileMockup locale={locale} />,
      reverse: false,
      alt: false,
    },
    {
      badge: tf("improve_bullet.badge"),
      title: tf("improve_bullet.title"),
      description: tf("improve_bullet.description"),
      mockup: <ImproveBulletMockup locale={locale} />,
      reverse: true,
      alt: true,
    },
    {
      badge: tf("summary.badge"),
      title: tf("summary.title"),
      description: tf("summary.description"),
      mockup: <SummaryMockup locale={locale} />,
      reverse: false,
      alt: false,
    },
    {
      badge: tf("ats_score.badge"),
      title: tf("ats_score.title"),
      description: tf("ats_score.description"),
      mockup: <ATSScoreMockup locale={locale} />,
      reverse: true,
      alt: true,
      pro: true,
    },
    {
      badge: tf("cover_letter.badge"),
      title: tf("cover_letter.title"),
      description: tf("cover_letter.description"),
      mockup: <CoverLetterMockup locale={locale} />,
      reverse: false,
      alt: false,
    },
    {
      badge: tf("cv_review.badge"),
      title: tf("cv_review.title"),
      description: tf("cv_review.description"),
      mockup: <CVReviewMockup locale={locale} />,
      reverse: true,
      alt: true,
      pro: true,
    },
  ]

  return (
    <>
      <ScrollRevealInit />
      <Script
        id="json-ld-guide"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdHowTo) }}
      />
      <Navbar />
      <main id="main-content">
        <GuideHero locale={locale} />
        <GuideSteps locale={locale} />
        {features.map((f, i) => (
          <GuideFeatureBlock key={i} {...f} locale={locale} />
        ))}
        <GuideStats locale={locale} />
        <GuideCTA locale={locale} />
      </main>
      <Footer />
    </>
  )
}

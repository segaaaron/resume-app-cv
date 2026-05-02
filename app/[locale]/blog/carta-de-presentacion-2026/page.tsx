import Navbar from "@/components/marketing/Navbar"
import Footer from "@/components/marketing/Footer"
import Link from "next/link"
import Script from "next/script"
import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { setRequestLocale } from "next-intl/server"
import { ArrowRight } from "lucide-react"

const SLUG = "carta-de-presentacion-2026"
const DATE_PUBLISHED = "2026-04-29"
const DATE_MODIFIED = "2026-04-29"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "metadata.blog_cover_letter" })
  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: `https://readycvv.com/${locale}/blog/${SLUG}`,
      languages: {
        es: `https://readycvv.com/es/blog/${SLUG}`,
        en: `https://readycvv.com/en/blog/${SLUG}`,
      },
    },
    openGraph: {
      title: t("title"),
      description: t("description"),
      type: "article",
      url: `https://readycvv.com/${locale}/blog/${SLUG}`,
      images: [{ url: "https://readycvv.com/og-image.png", width: 1200, height: 630 }],
      publishedTime: DATE_PUBLISHED,
      modifiedTime: DATE_MODIFIED,
      authors: ["ReadyCV"],
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
      images: ["https://readycvv.com/og-image.png"],
    },
  }
}

export default async function CoverLetterArticlePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const isEn = locale === "en"
  const t = await getTranslations("blog")

  const content = isEn ? {
    tag: "Cover Letter",
    title: "Cover Letter in 2026: Does It Still Matter?",
    intro: "The short answer: sometimes yes, sometimes no, and knowing the difference is what separates candidates who get callbacks from those who don't.",
    sections: [
      {
        heading: "The honest data",
        body: "Studies consistently show a split: roughly 50% of hiring managers say they read cover letters; the other 50% skip them entirely unless the resume already impressed them.\n\nSo why bother? Because when it matters, it matters a lot. A well-written cover letter can be the difference between two equally qualified candidates.",
      },
      {
        heading: "When a cover letter is mandatory",
        body: "Include a cover letter when:\n• The job posting explicitly asks for one\n• You're applying to a small company or startup where culture fit matters\n• You're making a career change and need to explain the transition\n• You have a gap in your employment history\n• You're applying through a personal referral\n• The role is highly competitive and you need every edge\n\nIn any of these situations, skipping the cover letter costs you real opportunities.",
      },
      {
        heading: "When you can skip it",
        body: "You can skip the cover letter when:\n• The job posting specifically says \"no cover letter needed\"\n• You're applying through an ATS portal that doesn't have a field for it\n• You're applying to a large tech company that processes thousands of applications — they often don't read letters\n• The application is for a junior role and the volume is too high for letters to matter",
      },
      {
        heading: "What a good cover letter actually does",
        body: "A cover letter is not a restatement of your resume. It answers three questions the resume can't:\n\n1. Why do you want this specific role at this specific company?\n2. What makes you a better fit than other qualified candidates?\n3. Is there anything in your history that needs context (gap, career change, unconventional path)?\n\nIf your letter doesn't answer at least one of those questions, it's adding noise, not signal.",
      },
      {
        heading: "The structure that works in 2026",
        body: "Opening: Hook with something specific — a company achievement, a shared mission, something that shows you did your research. Not \"I am writing to apply for...\"\n\nBody (1-2 paragraphs): Connect one or two of your strongest experiences directly to what the job requires. Use specifics.\n\nClose: Clear ask. Express genuine interest. Keep it under 5 lines.\n\nTotal length: 250-350 words. No more. Recruiters don't read long letters.",
      },
      {
        heading: "Use AI to write it faster, not lazier",
        body: "ReadyCV's AI cover letter generator writes a personalized letter using your actual CV data and the job description. Choose formal, balanced, or dynamic tone. Done in 30 seconds.\n\nThe rule: always edit what the AI gives you. Add one specific detail about the company that only a person who researched them would know. That's what separates AI-assisted from AI-generated.",
      },
    ],
  } : {
    tag: "Carta",
    title: "Carta de presentación en 2026: ¿todavía importa?",
    intro: "La respuesta corta: a veces sí, a veces no, y saber la diferencia separa a los candidatos que reciben llamadas de los que no.",
    sections: [
      {
        heading: "Los datos honestos",
        body: "Los estudios muestran consistentemente una división: aproximadamente el 50% de los responsables de selección dice leer las cartas de presentación; el otro 50% las ignora por completo a menos que el CV ya les haya impresionado.\n\n¿Por qué molestarse entonces? Porque cuando importa, importa mucho. Una carta bien escrita puede marcar la diferencia entre dos candidatos igual de cualificados.",
      },
      {
        heading: "Cuándo la carta de presentación es obligatoria",
        body: "Incluye una carta de presentación cuando:\n• La oferta de empleo la pide explícitamente\n• Aplicas a una empresa pequeña o startup donde el encaje cultural importa\n• Estás haciendo un cambio de carrera y necesitas explicar la transición\n• Tienes una brecha en tu historial laboral\n• Aplicas a través de una referencia personal\n• El puesto es muy competitivo y necesitas cada ventaja\n\nEn cualquiera de estas situaciones, omitir la carta te cuesta oportunidades reales.",
      },
      {
        heading: "Cuándo puedes omitirla",
        body: "Puedes omitir la carta cuando:\n• La oferta indica específicamente que no se requiere carta\n• Aplicas a través de un portal ATS que no tiene campo para adjuntarla\n• Aplicas a una gran empresa tecnológica que procesa miles de candidaturas — suelen no leer cartas\n• La candidatura es para un puesto junior y el volumen es demasiado alto para que las cartas importen",
      },
      {
        heading: "Qué hace realmente una buena carta",
        body: "Una carta de presentación no es una repetición del CV. Responde tres preguntas que el CV no puede:\n\n1. ¿Por qué quieres este puesto específico en esta empresa específica?\n2. ¿Qué te hace mejor candidato que otros igual de cualificados?\n3. ¿Hay algo en tu historial que necesite contexto (brecha, cambio de carrera, trayectoria no convencional)?\n\nSi tu carta no responde al menos una de esas preguntas, está añadiendo ruido, no señal.",
      },
      {
        heading: "La estructura que funciona en 2026",
        body: "Apertura: Gancho con algo específico — un logro de la empresa, una misión compartida, algo que demuestre que investigaste. Nunca \"Me dirijo a usted para solicitar...\"\n\nCuerpo (1-2 párrafos): Conecta una o dos de tus experiencias más sólidas directamente con lo que requiere el puesto. Usa datos concretos.\n\nCierre: Petición clara. Interés genuino. Menos de 5 líneas.\n\nLongitud total: 250-350 palabras. No más. Los recruiters no leen cartas largas.",
      },
      {
        heading: "Usa IA para escribirla más rápido, no de forma más perezosa",
        body: "El generador de cartas de presentación con IA de ReadyCV escribe una carta personalizada usando los datos reales de tu CV y la descripción del puesto. Elige tono formal, equilibrado o dinámico. Listo en 30 segundos.\n\nLa regla: siempre edita lo que te da la IA. Añade un detalle específico sobre la empresa que solo alguien que la haya investigado conocería. Eso separa lo asistido por IA de lo generado por IA.",
      },
    ],
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 py-12 sm:py-20 px-4">
        <div className="max-w-2xl mx-auto">
          <Link href={`/${locale}/blog`} className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-block mb-8">
            {t("back")}
          </Link>

          <div className="mb-8">
            <span className="inline-block text-xs font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full mb-3">
              {content.tag}
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold mb-4 leading-tight">{content.title}</h1>
            <p className="text-lg text-muted-foreground leading-relaxed">{content.intro}</p>
          </div>

          <div className="space-y-8">
            {content.sections.map((section) => (
              <div key={section.heading}>
                <h2 className="text-xl font-semibold mb-3">{section.heading}</h2>
                {section.body.split("\n\n").map((para, i) => (
                  <p key={i} className="text-muted-foreground leading-relaxed mb-3 whitespace-pre-line">{para}</p>
                ))}
              </div>
            ))}
          </div>

          <div className="mt-12 bg-primary/5 border border-primary/20 rounded-2xl p-8 text-center">
            <p className="font-semibold text-lg mb-2">{t("cta_title")}</p>
            <p className="text-muted-foreground mb-6">{t("cta_desc")}</p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-primary text-white font-semibold px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors text-sm"
            >
              {t("cta_btn")} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </main>
      <Script id="article-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Article",
        headline: content.title,
        description: content.intro,
        datePublished: DATE_PUBLISHED,
        dateModified: DATE_MODIFIED,
        author: { "@type": "Organization", name: "ReadyCV", url: "https://readycvv.com" },
        publisher: { "@type": "Organization", name: "ReadyCV", logo: { "@type": "ImageObject", url: "https://readycvv.com/og-image.png" } },
        image: "https://readycvv.com/og-image.png",
        url: `https://readycvv.com/${locale}/blog/${SLUG}`,
        inLanguage: locale,
        mainEntityOfPage: { "@type": "WebPage", "@id": `https://readycvv.com/${locale}/blog/${SLUG}` },
      }) }} />
      <Footer />
    </div>
  )
}

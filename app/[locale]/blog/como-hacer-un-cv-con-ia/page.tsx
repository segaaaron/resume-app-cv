import Navbar from "@/components/marketing/Navbar"
import Footer from "@/components/marketing/Footer"
import Link from "next/link"
import Script from "next/script"
import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { setRequestLocale } from "next-intl/server"
import { ArrowRight } from "lucide-react"

const SLUG = "como-hacer-un-cv-con-ia"
const DATE_PUBLISHED = "2026-05-02"
const DATE_MODIFIED = "2026-05-02"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "metadata.blog_ai_cv" })
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

export default async function AIResumeArticlePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const isEn = locale === "en"
  const t = await getTranslations("blog")

  const content = isEn
    ? {
        tag: "AI Resume",
        title: "How to Make a Resume with AI in 2026 (Step by Step)",
        intro:
          "AI hasn't replaced resume writing — it's made it faster, smarter, and more targeted. The difference between a candidate who spends 3 hours on a resume and one who spends 20 minutes isn't effort. It's knowing which AI tools to use, and how to use them without losing your authentic voice.",
        sections: [
          {
            heading: "Step 1: Start with your raw information",
            body: "Before any AI can help you, you need your raw material ready: job titles, companies, dates, and a rough description of what you did in each role. Don't worry about phrasing — that's what AI is for.\n\nIn ReadyCV, use the 'Help me with AI' panel (bottom of the Content tab). Describe your background in plain language — your role, industry, years of experience, main skills. The AI generates a structured starting point: summary, job title suggestion, skills list, and work experience entries. It's not a finished CV — it's a first draft you'll refine.",
          },
          {
            heading: "Step 2: Generate your professional summary with AI",
            body: "The professional summary is the hardest part of a CV to write — it requires condensing years of work into 3-4 lines that are both honest and compelling.\n\nIn ReadyCV's Summary section, click the AI button. The model reads your existing content and generates 3 versions of your summary, each with a different emphasis: one technical, one leadership-focused, one achievement-led. Pick the one that fits the role you're targeting, edit as needed.\n\nImportant: always personalize the AI output. Add one specific achievement or context detail that makes it yours — recruiters have read thousands of AI-generated summaries and can spot the generic ones instantly.",
          },
          {
            heading: "Step 3: Improve your bullet points with AI",
            body: "Most CV bullets are duty descriptions: 'Responsible for managing social media accounts.' AI can transform them into impact statements: 'Grew Instagram engagement by 340% in 6 months through a daily content cadence and influencer partnership program.'\n\nFor each work experience entry in ReadyCV, click the improve button on any bullet. The AI rewrites it with stronger verbs, quantified impact, and the format: [Action verb] + [what you did] + [result/scale]. You can generate multiple versions and pick the best one.\n\nNote: if the AI adds a number you can't verify (like '40% improvement'), change it to something accurate. Fabricated metrics create legal and ethical problems.",
          },
          {
            heading: "Step 4: Check your ATS Score",
            body: "Writing a great CV and having it rejected by an ATS is one of the most frustrating experiences in job searching. ReadyCV's ATS Score feature prevents this.\n\nPaste the full job description into the ATS Score panel. The AI analyzes your CV against it and scores you across keyword coverage, skills match, experience alignment, and structure. It then gives specific suggestions: 'Add keyword X from the job description to your skills section' or 'Your experience section is missing the term Y which appears 4 times in the JD.'\n\nDo this for every job you apply to. A CV tailored to a specific posting outperforms a generic CV by a significant margin — research consistently shows 40-60% higher callback rates for tailored applications.",
          },
          {
            heading: "Step 5: Generate your cover letter with AI",
            body: "A cover letter written from scratch takes 45-90 minutes. ReadyCV's cover letter AI generates a personalized first draft in under a minute.\n\nPaste the job description and specify your tone (formal, conversational, technical). The AI writes a 3-paragraph letter: an opening that hooks with your strongest relevant achievement, a middle that connects your experience to the company's specific needs, and a close that requests the interview confidently.\n\nEdit it. Add one personal detail about the company (a product you use, a mission statement you believe in, a recent news item). That personal touch is what the AI can't add — but it's also what separates a good cover letter from a great one.",
          },
          {
            heading: "What AI can't do (yet)",
            body: "AI can help you write, structure, and optimize. It cannot:\n\n• Verify your claims — you're responsible for accuracy\n• Replace your judgment about which experience is most relevant to a specific role\n• Add the specific detail that makes your application memorable\n• Know your personality, communication style, or what you actually want from your next role\n\nThe best AI-assisted CV is one where the AI handled the structure and language, and you handled the strategy and authenticity. Use AI as an accelerator, not a replacement.",
          },
        ],
      }
    : {
        tag: "CV con IA",
        title: "Cómo Hacer un CV con Inteligencia Artificial en 2026 (Paso a Paso)",
        intro:
          "La IA no ha reemplazado la escritura de CVs — la ha vuelto más rápida, inteligente y específica. La diferencia entre un candidato que pasa 3 horas en su CV y uno que pasa 20 minutos no es el esfuerzo. Es saber qué herramientas de IA usar, y cómo usarlas sin perder tu voz auténtica.",
        sections: [
          {
            heading: "Paso 1: Empieza con tu información en bruto",
            body: "Antes de que cualquier IA pueda ayudarte, necesitas tu materia prima lista: títulos de trabajo, empresas, fechas y una descripción aproximada de lo que hiciste en cada rol. No te preocupes por la redacción — para eso está la IA.\n\nEn ReadyCV, usa el panel 'Ayúdate con la IA' (al final de la pestaña Contenido). Describe tu trayectoria en lenguaje simple — tu rol, industria, años de experiencia, habilidades principales. La IA genera un punto de partida estructurado: resumen, sugerencia de título, lista de habilidades y entradas de experiencia laboral. No es un CV terminado — es un primer borrador que vas a refinar.",
          },
          {
            heading: "Paso 2: Genera tu resumen profesional con IA",
            body: "El resumen profesional es la parte más difícil de escribir en un CV — requiere condensar años de trabajo en 3-4 líneas que sean a la vez honestas y convincentes.\n\nEn la sección Resumen de ReadyCV, haz clic en el botón IA. El modelo lee tu contenido existente y genera 3 versiones de tu resumen, cada una con un énfasis diferente: una técnica, una enfocada en liderazgo, una orientada a logros. Elige la que mejor se adapte al rol al que aplicas, y edita según sea necesario.\n\nImportante: siempre personaliza el resultado de la IA. Agrega un logro específico o un detalle contextual que lo haga tuyo — los reclutadores han leído miles de resúmenes generados por IA y detectan los genéricos al instante.",
          },
          {
            heading: "Paso 3: Mejora tus bullets con IA",
            body: "La mayoría de los bullets de CV son descripciones de tareas: 'Responsable de gestionar las cuentas de redes sociales.' La IA puede transformarlos en declaraciones de impacto: 'Aumenté el engagement de Instagram en un 340% en 6 meses mediante una cadencia de contenido diaria y un programa de partnerships con influencers.'\n\nPara cada entrada de experiencia laboral en ReadyCV, haz clic en el botón de mejora en cualquier bullet. La IA lo reescribe con verbos más fuertes, impacto cuantificado y el formato: [Verbo de acción] + [qué hiciste] + [resultado/escala]. Puedes generar múltiples versiones y elegir la mejor.\n\nNota: si la IA agrega un número que no puedes verificar (como 'mejora del 40%'), cámbialo por algo preciso. Las métricas fabricadas crean problemas legales y éticos.",
          },
          {
            heading: "Paso 4: Revisa tu ATS Score",
            body: "Escribir un excelente CV y que sea rechazado por un ATS es una de las experiencias más frustrantes en la búsqueda de empleo. El ATS Score de ReadyCV evita esto.\n\nPega la descripción completa del trabajo en el panel ATS Score. La IA analiza tu CV contra ella y te da una puntuación en: cobertura de palabras clave, match de habilidades, alineación de experiencia y estructura. Luego da sugerencias específicas: 'Agrega la palabra clave X de la oferta a tu sección de habilidades' o 'A tu sección de experiencia le falta el término Y que aparece 4 veces en la oferta.'\n\nHaz esto para cada trabajo al que apliques. Un CV adaptado a una oferta específica supera significativamente a un CV genérico — las investigaciones muestran consistentemente tasas de llamada 40-60% más altas para aplicaciones personalizadas.",
          },
          {
            heading: "Paso 5: Genera tu carta de presentación con IA",
            body: "Una carta de presentación escrita desde cero toma 45-90 minutos. El generador de cartas IA de ReadyCV genera un primer borrador personalizado en menos de un minuto.\n\nPega la descripción del trabajo y especifica tu tono (formal, conversacional, técnico). La IA escribe una carta de 3 párrafos: una apertura que engancha con tu logro más relevante, un cuerpo que conecta tu experiencia con las necesidades específicas de la empresa, y un cierre que solicita la entrevista con confianza.\n\nEdítala. Agrega un detalle personal sobre la empresa (un producto que uses, una declaración de misión en la que creas, una noticia reciente). Ese toque personal es lo que la IA no puede agregar — pero también es lo que separa una buena carta de una excelente.",
          },
          {
            heading: "Lo que la IA aún no puede hacer",
            body: "La IA puede ayudarte a escribir, estructurar y optimizar. No puede:\n\n• Verificar tus afirmaciones — tú eres responsable de la precisión\n• Reemplazar tu criterio sobre qué experiencia es más relevante para un rol específico\n• Agregar el detalle específico que hace memorable tu aplicación\n• Conocer tu personalidad, estilo de comunicación o lo que realmente quieres de tu próximo empleo\n\nEl mejor CV asistido por IA es aquel donde la IA manejó la estructura y el lenguaje, y tú manejaste la estrategia y la autenticidad. Usa la IA como un acelerador, no como un reemplazo.",
          },
        ],
      }

  const relatedArticles = [
    { slug: "como-pasar-el-ats", titleEs: "Cómo pasar el ATS en 2026: tácticas probadas", titleEn: "How to Pass ATS Screening in 2026" },
    { slug: "que-es-ats-y-por-que-rechaza-tu-cv", titleEs: "¿Qué es ATS y por qué rechaza tu CV?", titleEn: "What is ATS and Why is It Rejecting Your Resume?" },
    { slug: "como-escribir-bullets-de-cv", titleEs: "Cómo escribir bullets de CV que consiguen entrevistas", titleEn: "How to Write CV Bullet Points That Get Interviews" },
  ]

  const howToJsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: isEn ? "How to Make a Resume with AI in 2026" : "Cómo hacer un CV con inteligencia artificial en 2026",
    description: isEn
      ? "Step-by-step guide to building an ATS-optimized resume using AI tools"
      : "Guía paso a paso para crear un CV optimizado para ATS con herramientas de IA",
    totalTime: "PT30M",
    step: content.sections.map((section, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: section.heading,
      text: section.body.slice(0, 300),
    })),
  }

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: content.title,
    description: content.intro,
    datePublished: DATE_PUBLISHED,
    dateModified: DATE_MODIFIED,
    author: { "@type": "Organization", name: "ReadyCV", url: "https://readycvv.com" },
    publisher: {
      "@type": "Organization",
      name: "ReadyCV",
      logo: { "@type": "ImageObject", url: "https://readycvv.com/og-image.png" },
    },
    image: "https://readycvv.com/og-image.png",
    url: `https://readycvv.com/${locale}/blog/${SLUG}`,
    inLanguage: locale,
    mainEntityOfPage: { "@type": "WebPage", "@id": `https://readycvv.com/${locale}/blog/${SLUG}` },
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 py-12 sm:py-20 px-4">
        <div className="max-w-2xl mx-auto">
          <Link
            href={`/${locale}/blog`}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-block mb-8"
          >
            {t("back")}
          </Link>

          <div className="mb-8">
            <span className="inline-block text-xs font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full mb-3">
              {content.tag}
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold mb-4 leading-tight">{content.title}</h1>
            <p className="text-lg text-muted-foreground leading-relaxed">{content.intro}</p>
          </div>

          <div className="prose prose-neutral max-w-none space-y-8">
            {content.sections.map((section) => (
              <div key={section.heading}>
                <h2 className="text-xl font-semibold mb-3">{section.heading}</h2>
                {section.body.split("\n\n").map((para, i) => (
                  <p key={i} className="text-muted-foreground leading-relaxed mb-3 whitespace-pre-line">
                    {para}
                  </p>
                ))}
              </div>
            ))}
          </div>

          <div className="mt-10 border-t border-border pt-8">
            <p className="font-semibold mb-4">{isEn ? "Related guides" : "Guías relacionadas"}</p>
            <ul className="space-y-2">
              {relatedArticles.map((a) => (
                <li key={a.slug}>
                  <Link href={`/${locale}/blog/${a.slug}`} className="text-primary hover:underline text-sm font-medium">
                    {isEn ? a.titleEn : a.titleEs}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-12 bg-primary/5 border border-primary/20 rounded-2xl p-8 text-center">
            <p className="font-semibold text-lg mb-2">{t("cta_title")}</p>
            <p className="text-muted-foreground mb-6">{t("cta_desc")}</p>
            <Link
              href={`/${locale}/register`}
              className="inline-flex items-center gap-2 bg-primary text-white font-semibold px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors text-sm"
            >
              {t("cta_btn")} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </main>
      <Script id="article-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <Script id="howto-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }} />
      <Footer />
    </div>
  )
}

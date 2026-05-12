import Navbar from "@/components/marketing/Navbar"
import Footer from "@/components/marketing/Footer"
import Link from "next/link"
import Script from "next/script"
import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { setRequestLocale } from "next-intl/server"
import { ArrowRight } from "lucide-react"

const SLUG = "como-pasar-el-ats"
const DATE_PUBLISHED = "2026-05-02"
const DATE_MODIFIED = "2026-05-02"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "metadata.blog_pass_ats" })
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

export default async function ATSArticlePage({
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
        tag: "ATS",
        title: "How to Pass ATS Screening in 2026 (Proven Tactics)",
        intro:
          "Over 75% of resumes are rejected by Applicant Tracking Systems before a human ever reads them. The good news: ATS systems are not intelligent. They follow rules. Once you understand those rules, passing the filter becomes a solvable problem — not a lottery.",
        sections: [
          {
            heading: "Understand what ATS actually does",
            body: "An ATS doesn't 'read' your resume the way a human does. It parses the document into structured data fields (name, email, job titles, dates, skills) and then runs keyword matching against the job description. A resume that looks beautiful in PDF may be completely unreadable by an ATS parser if it uses tables, columns, text boxes, or unusual fonts.\n\nThe first rule of ATS optimization: format for machines first, humans second. That doesn't mean ugly — it means structured and standard.",
          },
          {
            heading: "Use a single-column, text-based format",
            body: "Multi-column layouts are the single biggest ATS killer. When a parser sees two columns, it often reads across both simultaneously, producing garbled output. Tables cause similar problems.\n\nUse a single-column layout with clearly labeled sections. If you want visual appeal, use spacing, font weight, and subtle color in section headers — not columns or text boxes.\n\nReadyCV's ATS Pro template is specifically designed to parse perfectly across all major ATS platforms (Greenhouse, Lever, Workday, Taleo, iCIMS).",
          },
          {
            heading: "Name your sections conventionally",
            body: "ATS systems look for specific section names. If your experience section is titled 'What I've Done' or 'My Journey', the parser may not recognize it.\n\nUse these standard names:\n• Work Experience (not Career History or Professional Background)\n• Education (not Academic Background)\n• Skills (not Competencies or Tech Stack)\n• Certifications (not Credentials)\n• Projects (not Portfolio or Work Samples)\n\nThe more closely your section headers match standard ATS expectations, the more accurately your resume is parsed.",
          },
          {
            heading: "Extract and match keywords from the job description",
            body: "The most direct path to ATS success is keyword matching. Read the job description carefully and identify:\n\n1. Required skills and tools (exact spellings matter — 'JavaScript' vs 'Javascript')\n2. Soft skills and methodologies mentioned repeatedly\n3. Job title variations the company uses\n4. Industry-specific terminology\n\nIncorporate these keywords naturally into your skills section, experience bullets, and summary. Don't keyword-stuff — write them into context. 'Led cross-functional Agile sprints using Jira' beats 'Agile, Jira, Sprint, Scrum' as a keyword dump.\n\nReadyCV's ATS Score feature automates this analysis: paste the job description, and the AI identifies missing keywords and shows you exactly where to add them.",
          },
          {
            heading: "Fix the five most common ATS format mistakes",
            body: "1. Photos and graphics — ATS parsers can't read images. If your contact info is in a header graphic, it's invisible to the parser.\n2. Headers and footers — Many ATS platforms skip page headers/footers entirely. Don't put contact info there.\n3. Unusual bullet characters — Stick to standard bullets (•, -, *). Decorative symbols often parse as garbage characters.\n4. Text in tables — Tables confuse parsers. Use line breaks and indentation instead.\n5. Saved as the wrong file type — PDF is generally fine for modern ATS. Some older systems prefer .docx. When in doubt, submit both if the portal allows it.",
          },
          {
            heading: "Use ReadyCV's ATS Score before every application",
            body: "Manually checking keyword coverage for each job application takes 20+ minutes. ReadyCV's ATS Score does it in seconds.\n\nPaste the full job description into the ATS Score panel in the editor. The AI scores your resume across:\n• Keyword coverage: which required terms are present vs missing\n• Skills match: how your listed skills align with what the role requires\n• Experience alignment: whether your seniority level and experience match what's described\n• Structure: whether your resume format will parse correctly\n\nThe ATS Score report gives specific suggestions: 'Add keyword X to your skills section' or 'Your summary doesn't mention Y, which appears 5 times in the job description.' Use it for every new application and your callback rate will improve significantly.",
          },
        ],
      }
    : {
        tag: "ATS",
        title: "Cómo Pasar el ATS en 2026: Tácticas Probadas para tu CV",
        intro:
          "Más del 75% de los CVs son rechazados por los Sistemas de Seguimiento de Candidatos antes de que un humano los lea. La buena noticia: los sistemas ATS no son inteligentes. Siguen reglas. Una vez que entiendes esas reglas, superar el filtro se convierte en un problema con solución — no en una lotería.",
        sections: [
          {
            heading: "Entiende qué hace realmente el ATS",
            body: "Un ATS no 'lee' tu CV como lo haría un humano. Analiza el documento en campos de datos estructurados (nombre, email, títulos de trabajo, fechas, habilidades) y luego ejecuta un matching de palabras clave contra la descripción del puesto. Un CV que se ve hermoso en PDF puede ser completamente ilegible para un parser ATS si usa tablas, columnas, cuadros de texto o fuentes inusuales.\n\nLa primera regla de optimización para ATS: formatea para máquinas primero, humanos después. Eso no significa feo — significa estructurado y estándar.",
          },
          {
            heading: "Usa un formato de una columna basado en texto",
            body: "Los layouts de múltiples columnas son el mayor problema para el ATS. Cuando un parser ve dos columnas, a menudo las lee de forma cruzada, produciendo texto sin sentido. Las tablas causan problemas similares.\n\nUsa un layout de una sola columna con secciones claramente etiquetadas. Si quieres atractivo visual, usa espaciado, peso de fuente y color sutil en los encabezados de sección — no columnas ni cuadros de texto.\n\nLa plantilla ATS Pro de ReadyCV está diseñada específicamente para parsear perfectamente en todas las principales plataformas ATS (Greenhouse, Lever, Workday, Taleo, iCIMS).",
          },
          {
            heading: "Nombra tus secciones de forma convencional",
            body: "Los sistemas ATS buscan nombres específicos de sección. Si tu sección de experiencia se llama 'Lo que he hecho' o 'Mi trayectoria', el parser puede no reconocerla.\n\nUsa estos nombres estándar:\n• Experiencia Laboral (no Historial de Carrera)\n• Educación (no Formación Académica)\n• Habilidades (no Competencias)\n• Certificaciones (no Credenciales)\n• Proyectos (no Portafolio)\n\nCuanto más se aproximen tus encabezados de sección a las expectativas estándar del ATS, más precisamente se parseará tu CV.",
          },
          {
            heading: "Extrae y haz match con palabras clave de la oferta",
            body: "El camino más directo al éxito en ATS es el matching de palabras clave. Lee la descripción del puesto con atención e identifica:\n\n1. Habilidades y herramientas requeridas (la ortografía exacta importa)\n2. Habilidades blandas y metodologías mencionadas repetidamente\n3. Variaciones del título del puesto que usa la empresa\n4. Terminología específica del sector\n\nIncorpora estas palabras clave de forma natural en tu sección de habilidades, bullets de experiencia y resumen. No hagas keyword stuffing — escríbelas en contexto.\n\nEl ATS Score de ReadyCV automatiza este análisis: pega la descripción del trabajo, y la IA identifica palabras clave faltantes y te muestra exactamente dónde agregarlas.",
          },
          {
            heading: "Corrige los cinco errores de formato más comunes",
            body: "1. Fotos y gráficos — Los parsers ATS no pueden leer imágenes. Si tu información de contacto está en un gráfico de encabezado, es invisible para el parser.\n2. Encabezados y pies de página — Muchas plataformas ATS omiten completamente los encabezados/pies de página. No pongas datos de contacto ahí.\n3. Caracteres de bullet inusuales — Usa bullets estándar (•, -, *). Los símbolos decorativos suelen parsearse como caracteres basura.\n4. Texto en tablas — Las tablas confunden a los parsers. Usa saltos de línea y sangría en su lugar.\n5. Guardado en el tipo de archivo incorrecto — El PDF es generalmente válido para ATS modernos. Algunos sistemas más antiguos prefieren .docx. Ante la duda, envía ambos si el portal lo permite.",
          },
          {
            heading: "Usa el ATS Score de ReadyCV antes de cada solicitud",
            body: "Verificar manualmente la cobertura de palabras clave para cada solicitud lleva más de 20 minutos. El ATS Score de ReadyCV lo hace en segundos.\n\nPega la descripción completa del trabajo en el panel ATS Score en el editor. La IA puntúa tu CV en:\n• Cobertura de palabras clave: qué términos requeridos están presentes vs ausentes\n• Match de habilidades: cómo tus habilidades listadas se alinean con lo que requiere el rol\n• Alineación de experiencia: si tu nivel de seniority y experiencia coinciden con lo descrito\n• Estructura: si el formato de tu CV parseará correctamente\n\nEl informe del ATS Score da sugerencias específicas: 'Agrega la palabra clave X a tu sección de habilidades' o 'Tu resumen no menciona Y, que aparece 5 veces en la descripción.' Úsalo para cada nueva solicitud y tu tasa de respuestas mejorará significativamente.",
          },
        ],
      }

  const relatedArticles = [
    { slug: "que-es-ats-y-por-que-rechaza-tu-cv", titleEs: "¿Qué es ATS y por qué rechaza tu CV?", titleEn: "What is ATS and Why is It Rejecting Your Resume?" },
    { slug: "cv-para-desarrolladores-de-software", titleEs: "CV para desarrollador de software: guía completa 2026", titleEn: "Software Developer Resume: Complete Guide 2026" },
    { slug: "como-hacer-un-cv-con-ia", titleEs: "Cómo hacer un CV con inteligencia artificial (paso a paso)", titleEn: "How to Make a Resume with AI in 2026 (Step by Step)" },
  ]

  const howToJsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: isEn ? "How to Pass ATS Screening in 2026" : "Cómo pasar el ATS en 2026",
    description: isEn
      ? "Proven tactics to beat automated resume screening systems"
      : "Tácticas probadas para superar los sistemas de selección automatizada de CVs",
    totalTime: "PT20M",
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

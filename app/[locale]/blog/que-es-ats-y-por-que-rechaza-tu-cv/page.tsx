import Navbar from "@/components/marketing/Navbar"
import Footer from "@/components/marketing/Footer"
import Link from "next/link"
import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { setRequestLocale } from "next-intl/server"
import { ArrowRight } from "lucide-react"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "metadata.blog_ats" })
  return {
    title: t("title"),
    description: t("description"),
    alternates: { canonical: "https://readycv.app/blog/que-es-ats-y-por-que-rechaza-tu-cv" },
    openGraph: { title: t("title"), description: t("description"), type: "article" },
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

  const content = isEn ? {
    tag: "ATS",
    title: "What is ATS and Why is It Rejecting Your Resume?",
    intro: "You spent hours perfecting your resume. You applied to dozens of jobs. And yet — radio silence. Before you blame your experience or your writing, consider this: the problem might not be your resume. It might be that a machine never even read it.",
    sections: [
      {
        heading: "What is an ATS (Applicant Tracking System)?",
        body: "An Applicant Tracking System (ATS) is software that companies use to manage the flood of job applications they receive. Before any human reads your resume, the ATS scans it for keywords, experience, and structure — and scores it against the job description. Candidates below a certain threshold are automatically filtered out.\n\nAccording to industry estimates, over 75% of resumes are rejected by ATS before reaching a recruiter.",
      },
      {
        heading: "How does ATS actually work?",
        body: "The ATS parses your resume into structured data: name, contact info, work history, education, skills. Then it compares your content against the job description, looking for matches in:\n\n• Job title keywords\n• Required skills (both technical and soft)\n• Years of experience\n• Education level and field\n• Industry-specific terminology\n\nIf you use different words than the job posting — even synonyms — the system may not recognize them as matches.",
      },
      {
        heading: "5 reasons your resume fails ATS",
        body: "1. Missing keywords from the job description\n2. Using tables, columns, or complex formatting the parser can't read\n3. Saving as an image or scanned PDF instead of text-based PDF\n4. Putting critical information in headers or footers\n5. Using a creative template that looks great to humans but breaks the parser",
      },
      {
        heading: "How to optimize your resume for ATS",
        body: "• Mirror the language of the job description — use the exact same words, not synonyms\n• Use a clean, single-column layout (or a well-structured two-column that exports cleanly to text)\n• Include a skills section with specific technologies and tools\n• Quantify your experience with numbers and results\n• Use standard section headings: Experience, Education, Skills\n\nThe fastest way to check: paste your resume and the job description into ReadyCV's ATS Score tool. You'll get a compatibility score in seconds and a list of missing keywords.",
      },
      {
        heading: "Does ATS optimization mean keyword stuffing?",
        body: "No — and this is important. Stuffing your resume with keywords makes it pass the filter but fail the human review. The goal is to use the right keywords naturally, in context, backed by real experience.\n\nATS optimization and good writing aren't in conflict. The best resumes do both.",
      },
    ],
    cta: "Check your ATS score in seconds with ReadyCV →",
  } : {
    tag: "ATS",
    title: "¿Qué es ATS y por qué rechaza tu CV?",
    intro: "Dedicaste horas a perfeccionar tu CV. Aplicaste a decenas de ofertas. Y sin embargo — silencio absoluto. Antes de culpar a tu experiencia o tu redacción, considera esto: el problema puede no ser tu CV. Puede ser que ninguna máquina lo haya leído siquiera.",
    sections: [
      {
        heading: "¿Qué es un ATS (Applicant Tracking System)?",
        body: "Un Applicant Tracking System (ATS) es un software que las empresas usan para gestionar el volumen de candidaturas que reciben. Antes de que ningún humano lea tu CV, el ATS lo escanea buscando keywords, experiencia y estructura, y lo puntúa frente a la descripción del puesto. Los candidatos que no alcanzan cierto umbral son filtrados automáticamente.\n\nSegún estimaciones del sector, más del 75% de los CVs son rechazados por un ATS antes de llegar a un recruiter.",
      },
      {
        heading: "¿Cómo funciona el ATS exactamente?",
        body: "El ATS parsea tu CV en datos estructurados: nombre, contacto, historial laboral, educación, habilidades. Luego compara tu contenido con la oferta de empleo, buscando coincidencias en:\n\n• Keywords del título del puesto\n• Habilidades requeridas (técnicas y soft)\n• Años de experiencia\n• Nivel y área de estudios\n• Terminología específica del sector\n\nSi usas palabras distintas a las de la oferta — aunque sean sinónimos — el sistema puede no reconocerlas como coincidencias.",
      },
      {
        heading: "5 razones por las que tu CV falla en ATS",
        body: "1. Faltan keywords de la descripción del puesto\n2. Usas tablas, columnas o formatos complejos que el parser no puede leer\n3. Guardas como imagen o PDF escaneado en lugar de PDF con texto\n4. Pones información clave en encabezados o pies de página\n5. Usas una plantilla creativa que se ve bien a los humanos pero rompe el parser",
      },
      {
        heading: "Cómo optimizar tu CV para ATS",
        body: "• Usa el mismo lenguaje que la oferta de empleo — las palabras exactas, no sinónimos\n• Diseño limpio, columna única o dos columnas bien estructuradas\n• Incluye una sección de habilidades con tecnologías y herramientas específicas\n• Cuantifica tu experiencia con números y resultados\n• Usa títulos de sección estándar: Experiencia, Educación, Habilidades\n\nLa forma más rápida de comprobarlo: pega tu CV y la oferta en la herramienta ATS Score de ReadyCV. Obtendrás un score de compatibilidad en segundos y una lista de keywords que faltan.",
      },
      {
        heading: "¿Optimizar para ATS significa rellenar de keywords?",
        body: "No — y esto es importante. Saturar el CV de keywords hace que pase el filtro pero falle la revisión humana. El objetivo es usar las keywords correctas de forma natural, en contexto, respaldadas por experiencia real.\n\nOptimizar para ATS y redactar bien no son objetivos opuestos. Los mejores CVs hacen las dos cosas.",
      },
    ],
    cta: "Analiza tu score ATS en segundos con ReadyCV →",
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

          <div className="prose prose-neutral max-w-none space-y-8">
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
      <Footer />
    </div>
  )
}

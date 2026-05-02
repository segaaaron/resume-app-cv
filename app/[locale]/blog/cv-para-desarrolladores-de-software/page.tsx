import Navbar from "@/components/marketing/Navbar"
import Footer from "@/components/marketing/Footer"
import Link from "next/link"
import Script from "next/script"
import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { setRequestLocale } from "next-intl/server"
import { ArrowRight } from "lucide-react"

const SLUG = "cv-para-desarrolladores-de-software"
const DATE_PUBLISHED = "2026-05-02"
const DATE_MODIFIED = "2026-05-02"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "metadata.blog_dev_cv" })
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

export default async function DevResumeArticlePage({
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
        tag: "Developer Resume",
        title: "How to Write a Software Developer Resume in 2026",
        intro:
          "The software job market in 2026 is competitive at every level. Junior developers compete with bootcamp grads and CS graduates. Senior engineers compete globally. The resumes that get interviews share two traits: they're structured for human readability and optimized for ATS keyword matching. This guide covers both.",
        sections: [
          {
            heading: "The right format for a developer resume",
            body: "Use reverse-chronological format unless you have fewer than 2 years of experience. For most developers: Contact → Summary → Skills → Experience → Projects → Education.\n\nIf you're a new developer with strong projects but limited work history, move Projects above Experience. Your GitHub projects are your portfolio — treat them like work experience.\n\nLength: one page for under 7 years of experience. Two pages are acceptable for senior engineers documenting significant technical depth.",
          },
          {
            heading: "The skills section: your most important ATS signal",
            body: "Most developer CVs bury skills at the bottom as an afterthought. This is a mistake. ATS systems scan for technical keywords and your skills section is the most reliable place to include them.\n\nOrganize by category:\n• Languages: Python, TypeScript, Go, Rust, Java\n• Frameworks: React, Next.js, Node.js, FastAPI, Spring Boot\n• Databases: PostgreSQL, MongoDB, Redis, DynamoDB\n• Cloud/DevOps: AWS, GCP, Docker, Kubernetes, Terraform, CI/CD\n• Other: REST APIs, GraphQL, gRPC, microservices\n\nOnly list skills you can discuss confidently in a technical interview. Listing 'Kubernetes' when you've only run a tutorial will create problems.",
          },
          {
            heading: "Writing experience bullets that prove impact",
            body: "Most developer experience bullets describe tasks. Hiring managers care about results.\n\nWeak: 'Worked on the checkout service.'\nStrong: 'Refactored checkout service from monolith to microservices, reducing p99 latency from 1.2s to 180ms and enabling independent deployments for 5 teams.'\n\nThe formula: [Action verb] + [what you built/changed] + [why it mattered] + [measurable result].\n\nUse ReadyCV's AI bullet improver to transform your existing descriptions. It rewrites each bullet with stronger verbs and better structure — then you add the specific numbers only you know.",
          },
          {
            heading: "Projects: your proof of skills",
            body: "For junior developers, personal projects are your strongest differentiator. For senior developers, significant side projects or open source contributions add credibility.\n\nFor each project include:\n• What it does (1 sentence)\n• The stack you used\n• One interesting technical challenge you solved\n• GitHub link or live URL\n\nDo not include tutorial projects (Todo app, weather app, movie database). Include projects that solve a real problem, have real users, or demonstrate an interesting technical decision.",
          },
          {
            heading: "Using ATS Score to beat automated screening",
            body: "Over 75% of developer resumes are filtered by ATS before reaching a human. The fix is keyword matching — but not spamming keywords randomly.\n\nReadyCV's ATS Score feature lets you paste a job description and get a specific match analysis: which keywords from the JD are missing from your CV, which skills to highlight more prominently, and what structure improvements would raise your score.\n\nA frontend developer applying to a React role should see React, TypeScript, Redux, testing libraries, and performance optimization mentioned. A backend role wants to see API design, database experience, and system design keywords. Different roles, different keyword maps — ATS Score helps you tailor each application.",
          },
          {
            heading: "Common mistakes on developer resumes",
            body: "1. Listing technologies you barely know — leads to failed technical screens\n2. No GitHub link — the most common omission for junior developers\n3. Vague responsibilities without any quantification\n4. Using a creative template that ATS can't parse — beautiful PDFs with columns or text boxes often fail ATS parsing\n5. Listing 'proficient in' without context — proficient compared to what?\n6. Education at the top for experienced developers — move it to the bottom after 2+ years\n7. Generic summary ('passionate developer with experience in multiple technologies') — says nothing, remembered by no one",
          },
        ],
      }
    : {
        tag: "CV Desarrollador",
        title: "Cómo Hacer un CV para Desarrollador de Software en 2026",
        intro:
          "El mercado de trabajo de software en 2026 es competitivo en todos los niveles. Los desarrolladores junior compiten con graduados de bootcamps y egresados de CS. Los ingenieros senior compiten globalmente. Los CVs que consiguen entrevistas comparten dos rasgos: están estructurados para la legibilidad humana y optimizados para el matching de palabras clave en ATS. Esta guía cubre ambos.",
        sections: [
          {
            heading: "El formato correcto para un CV de desarrollador",
            body: "Usa el formato cronológico inverso a menos que tengas menos de 2 años de experiencia. Para la mayoría de desarrolladores: Contacto → Resumen → Habilidades → Experiencia → Proyectos → Educación.\n\nSi eres desarrollador nuevo con proyectos sólidos pero historial laboral limitado, mueve Proyectos sobre Experiencia. Tus proyectos en GitHub son tu portafolio — trátalos como experiencia laboral.\n\nExtensión: una página para menos de 7 años de experiencia. Dos páginas son aceptables para ingenieros senior que documentan profundidad técnica significativa.",
          },
          {
            heading: "La sección de habilidades: tu señal ATS más importante",
            body: "La mayoría de CVs de desarrolladores entierran las habilidades al final como algo secundario. Esto es un error. Los sistemas ATS buscan palabras clave técnicas y tu sección de habilidades es el lugar más confiable para incluirlas.\n\nOrganiza por categoría:\n• Lenguajes: Python, TypeScript, Go, Rust, Java\n• Frameworks: React, Next.js, Node.js, FastAPI, Spring Boot\n• Bases de datos: PostgreSQL, MongoDB, Redis, DynamoDB\n• Cloud/DevOps: AWS, GCP, Docker, Kubernetes, Terraform, CI/CD\n• Otros: REST APIs, GraphQL, gRPC, microservicios\n\nSolo lista habilidades que puedas discutir con confianza en una entrevista técnica. Listar 'Kubernetes' cuando solo has hecho un tutorial creará problemas.",
          },
          {
            heading: "Escribir bullets de experiencia que demuestren impacto",
            body: "La mayoría de los bullets de experiencia de desarrolladores describen tareas. A los gerentes de contratación les importan los resultados.\n\nDébil: 'Trabajé en el servicio de checkout.'\nFuerte: 'Refactoricé el servicio de checkout de monolito a microservicios, reduciendo la latencia p99 de 1.2s a 180ms y habilitando deploys independientes para 5 equipos.'\n\nLa fórmula: [Verbo de acción] + [qué construiste/cambiaste] + [por qué importó] + [resultado medible].\n\nUsa el mejorador de bullets IA de ReadyCV para transformar tus descripciones existentes. Reescribe cada bullet con verbos más fuertes y mejor estructura — luego tú agregas los números específicos que solo tú conoces.",
          },
          {
            heading: "Proyectos: tu prueba de habilidades",
            body: "Para desarrolladores junior, los proyectos personales son tu mayor diferenciador. Para desarrolladores senior, los proyectos paralelos significativos o las contribuciones open source agregan credibilidad.\n\nPara cada proyecto incluye:\n• Qué hace (1 oración)\n• El stack que usaste\n• Un desafío técnico interesante que resolviste\n• Link de GitHub o URL en vivo\n\nNo incluyas proyectos de tutorial (app de tareas, app del clima, base de datos de películas). Incluye proyectos que resuelven un problema real, tienen usuarios reales, o demuestran una decisión técnica interesante.",
          },
          {
            heading: "Usar ATS Score para superar el filtrado automatizado",
            body: "Más del 75% de los CVs de desarrolladores son filtrados por ATS antes de llegar a un humano. La solución es el matching de palabras clave — pero no spam de palabras clave al azar.\n\nEl ATS Score de ReadyCV te permite pegar una oferta de trabajo y obtener un análisis específico de match: qué palabras clave de la oferta faltan en tu CV, qué habilidades destacar más prominentemente, y qué mejoras de estructura subirían tu puntuación.\n\nUn desarrollador frontend que aplica a un rol de React debería ver React, TypeScript, Redux, librerías de testing y optimización de rendimiento mencionados. Un rol backend quiere ver diseño de API, experiencia con bases de datos y palabras clave de diseño de sistemas. Diferentes roles, diferentes mapas de palabras clave — ATS Score te ayuda a personalizar cada aplicación.",
          },
          {
            heading: "Errores comunes en CVs de desarrolladores",
            body: "1. Listar tecnologías que apenas conoces — lleva a pantallas técnicas fallidas\n2. Sin link de GitHub — la omisión más común de desarrolladores junior\n3. Responsabilidades vagas sin ninguna cuantificación\n4. Usar una plantilla creativa que el ATS no puede parsear — los PDFs bonitos con columnas o cajas de texto a menudo fallan el parseo ATS\n5. Listar 'competente en' sin contexto — ¿competente comparado con qué?\n6. Educación al inicio para desarrolladores con experiencia — muévela al final después de 2+ años\n7. Resumen genérico ('desarrollador apasionado con experiencia en múltiples tecnologías') — no dice nada, nadie lo recuerda",
          },
        ],
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
              {[
                { slug: "como-pasar-el-ats", titleEs: "Cómo pasar el ATS en 2026: tácticas probadas", titleEn: "How to Pass ATS Screening in 2026" },
                { slug: "como-hacer-un-cv-con-ia", titleEs: "Cómo hacer un CV con inteligencia artificial", titleEn: "How to Make a Resume with AI in 2026" },
                { slug: "como-escribir-bullets-de-cv", titleEs: "Cómo escribir bullets de CV que consiguen entrevistas", titleEn: "How to Write CV Bullets That Get Interviews" },
              ].map((a) => (
                <li key={a.slug}>
                  <Link href={`/${locale}/blog/${a.slug}`} className="text-primary hover:underline text-sm font-medium">
                    {isEn ? a.titleEn : a.titleEs}
                  </Link>
                </li>
              ))}
            </ul>
            <p className="text-sm text-muted-foreground mt-4">
              {isEn ? "Browse " : "Ver "}
              <Link href={`/${locale}/templates/software-engineer`} className="text-primary hover:underline font-medium">
                {isEn ? "software engineer resume templates" : "plantillas de CV para desarrolladores"}
              </Link>
            </p>
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
      <Footer />
    </div>
  )
}

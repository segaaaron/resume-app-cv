import Navbar from "@/components/marketing/Navbar"
import Footer from "@/components/marketing/Footer"
import Link from "next/link"
import Script from "next/script"
import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { setRequestLocale } from "next-intl/server"
import { ArrowRight } from "lucide-react"

const SLUG = "como-escribir-bullets-de-cv"
const DATE_PUBLISHED = "2026-04-29"
const DATE_MODIFIED = "2026-04-29"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "metadata.blog_bullets" })
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

export default async function BulletsArticlePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const isEn = locale === "en"
  const t = await getTranslations("blog")

  const content = isEn ? {
    tag: "Writing",
    title: "How to Write CV Bullet Points That Get Interviews",
    intro: "Most resume bullet points describe job duties. The ones that get interviews describe results. The difference is everything — and it's a learnable skill.",
    sections: [
      {
        heading: "The problem with most CV bullets",
        body: "\"Responsible for managing social media accounts.\"\n\"Worked with the sales team on client proposals.\"\n\"Assisted with product launches.\"\n\nThese bullets say nothing meaningful. They describe tasks, not impact. Any of a thousand candidates could write the same thing. They give the recruiter no reason to prefer you.",
      },
      {
        heading: "The formula: Action + Task + Result",
        body: "The strongest CV bullets follow a simple structure:\n\n[Strong action verb] + [what you did] + [measurable result or context]\n\nExamples:\n• \"Grew Instagram following from 12K to 48K in 8 months through organic content strategy.\"\n• \"Reduced customer churn by 18% by redesigning the onboarding email sequence.\"\n• \"Closed $1.2M in annual contracts, exceeding quota by 23%.\"\n\nNotice what changed: a number, a time frame, and a result. That's what makes a bullet memorable.",
      },
      {
        heading: "Action verbs that work",
        body: "Avoid: \"Responsible for\", \"Helped with\", \"Worked on\", \"Assisted\"\n\nUse instead:\n• Leadership: Led, Directed, Managed, Oversaw, Spearheaded\n• Growth: Grew, Scaled, Expanded, Increased, Drove\n• Improvement: Optimized, Reduced, Streamlined, Simplified, Improved\n• Creation: Built, Designed, Developed, Launched, Created\n• Achievement: Delivered, Exceeded, Achieved, Won, Secured",
      },
      {
        heading: "What if you don't have hard numbers?",
        body: "Not every role produces clear metrics. That's fine — estimate, or describe impact qualitatively:\n\n• \"Managed onboarding for 30+ enterprise clients per quarter.\"\n• \"First engineer on the team to implement end-to-end testing — adopted by the full team within 2 months.\"\n• \"Recognized as top-performing rep in Q3 2025 among a team of 12.\"\n\nEven without percentages, specificity beats vagueness every time.",
      },
      {
        heading: "Use AI to rewrite your bullets",
        body: "If you have a rough draft and want a stronger version, ReadyCV's AI bullet improvement tool rewrites your bullets using impact language — action verbs, quantified results, recruiter-ready framing. Paste your bullet, get three improved versions in seconds.\n\nOne important rule: if the AI adds metrics like [X%] or [$Y], replace them with your real numbers before sending your resume. Never use placeholder metrics.",
      },
    ],
  } : {
    tag: "Redacción",
    title: "Cómo escribir bullets de CV que consiguen entrevistas",
    intro: "La mayoría de los bullets de CV describen responsabilidades laborales. Los que consiguen entrevistas describen resultados. La diferencia es todo — y es una habilidad que se aprende.",
    sections: [
      {
        heading: "El problema con la mayoría de bullets de CV",
        body: "\"Responsable de gestionar las redes sociales de la empresa.\"\n\"Trabajé con el equipo de ventas en propuestas para clientes.\"\n\"Apoyé en los lanzamientos de producto.\"\n\nEstos bullets no dicen nada significativo. Describen tareas, no impacto. Miles de candidatos podrían escribir exactamente lo mismo. No dan al recruiter ningún motivo para preferirte.",
      },
      {
        heading: "La fórmula: Acción + Tarea + Resultado",
        body: "Los bullets más efectivos siguen una estructura simple:\n\n[Verbo de acción fuerte] + [qué hiciste] + [resultado medible o contexto]\n\nEjemplos:\n• \"Hice crecer el Instagram de marca de 12K a 48K seguidores en 8 meses con estrategia de contenido orgánico.\"\n• \"Reduje el churn de clientes un 18% rediseñando la secuencia de emails de onboarding.\"\n• \"Cerré $1,2M en contratos anuales, superando la cuota en un 23%.\"\n\nFíjate en lo que cambió: un número, un plazo y un resultado. Eso es lo que hace memorable un bullet.",
      },
      {
        heading: "Verbos de acción que funcionan",
        body: "Evita: \"Responsable de\", \"Ayudé a\", \"Trabajé en\", \"Colaboré con\"\n\nUsa en su lugar:\n• Liderazgo: Lideré, Dirigí, Gestioné, Supervisé, Encabecé\n• Crecimiento: Hice crecer, Escalé, Expandí, Aumenté, Impulsé\n• Mejora: Optimicé, Reduje, Simplifiqué, Mejoré, Automaticé\n• Creación: Construí, Diseñé, Desarrollé, Lancé, Creé\n• Logro: Entregué, Superé, Logré, Gané, Conseguí",
      },
      {
        heading: "¿Y si no tienes números concretos?",
        body: "No todos los roles generan métricas claras. Eso es normal — estima, o describe el impacto cualitativamente:\n\n• \"Gestioné el onboarding de más de 30 clientes enterprise por trimestre.\"\n• \"Primer ingeniero del equipo en implementar tests end-to-end — adoptado por todo el equipo en 2 meses.\"\n• \"Reconocido como rep de mayor rendimiento en Q3 2025 entre un equipo de 12 personas.\"\n\nIncluso sin porcentajes, la especificidad gana a la vaguedad siempre.",
      },
      {
        heading: "Usa IA para reescribir tus bullets",
        body: "Si tienes un borrador y quieres una versión más potente, la herramienta de mejora de bullets de ReadyCV reescribe tus bullets con lenguaje de impacto — verbos de acción, resultados cuantificados y framing orientado a recruiters. Pega tu bullet, obtén tres versiones mejoradas en segundos.\n\nUna regla importante: si la IA añade métricas como [X%] o [$Y], sustitúyelas por tus números reales antes de enviar el CV. Nunca uses métricas de marcador de posición.",
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

          <div className="mt-10 border-t border-border pt-8">
            <p className="font-semibold mb-4">{isEn ? "Related guides" : "Guías relacionadas"}</p>
            <ul className="space-y-2">
              {[
                { slug: "que-es-ats-y-por-que-rechaza-tu-cv", titleEs: "¿Qué es ATS y por qué rechaza tu CV?", titleEn: "What is ATS and Why is It Rejecting Your Resume?" },
                { slug: "como-hacer-un-cv-con-ia", titleEs: "Cómo hacer un CV con inteligencia artificial", titleEn: "How to Make a Resume with AI in 2026" },
                { slug: "como-pasar-el-ats", titleEs: "Cómo pasar el ATS en 2026: tácticas probadas", titleEn: "How to Pass ATS Screening in 2026" },
              ].map((a) => (
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
              href="/register"
              className="inline-flex items-center gap-2 bg-primary text-white font-semibold px-6 py-3 rounded-xl hover:bg-primary/90 transition-colors text-sm"
            >
              {t("cta_btn")} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </main>
      <Script id="howto-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "HowTo",
        name: isEn ? "How to Write CV Bullet Points That Get Interviews" : "Cómo escribir bullets de CV que consiguen entrevistas",
        description: isEn ? "Learn to write impactful CV bullets with action verbs and measurable results" : "Aprende a escribir bullets de CV con verbos de acción y resultados medibles",
        totalTime: "PT15M",
        step: content.sections.map((section, i) => ({
          "@type": "HowToStep",
          position: i + 1,
          name: section.heading,
          text: section.body.slice(0, 300),
        })),
      }) }} />
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

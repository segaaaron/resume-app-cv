import Navbar from "@/components/marketing/Navbar"
import Footer from "@/components/marketing/Footer"
import Link from "next/link"
import Script from "next/script"
import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { setRequestLocale } from "next-intl/server"
import { ArrowRight } from "lucide-react"

const SLUG = "constructores-de-cv-gratuitos-vs-pago"
const DATE_PUBLISHED = "2026-04-29"
const DATE_MODIFIED = "2026-04-29"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "metadata.blog_free_vs_paid" })
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

export default async function FreeVsPaidArticlePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const isEn = locale === "en"
  const t = await getTranslations("blog")

  const content = isEn ? {
    tag: "Tools",
    title: "Free vs Paid CV Builders: What Actually Matters",
    intro: "There are dozens of CV builders out there, free and paid. The question isn't which one is cheapest — it's which one gives you a better shot at getting the job. Here's an honest breakdown.",
    sections: [
      {
        heading: "What free CV builders actually give you",
        body: "Most free tools offer:\n• Basic templates (usually 3-5 designs)\n• A limited editor\n• PDF export — often with a watermark\n• No AI features\n• One CV document\n\nFor a quick, one-off resume, this can be enough. If you're early in your career, applying to a handful of jobs, and don't need AI assistance, a free tool gets the job done.",
      },
      {
        heading: "Where free tools fall short",
        body: "The limitations compound quickly when you're actively job hunting:\n\n1. Watermarked PDFs look unprofessional and signal budget constraints to recruiters\n2. Limited templates mean your CV looks the same as thousands of others\n3. No ATS Score means you're flying blind on keyword compatibility\n4. No AI assistance means spending hours on wording instead of applying\n5. One document limit means you can't tailor your CV for different roles",
      },
      {
        heading: "What paid tools add (and why it matters)",
        body: "A good paid CV builder adds features that directly affect your results:\n\n• ATS Score analysis: know your compatibility before applying, not after getting rejected\n• AI bullet rewriting: turn job duties into achievement statements in seconds\n• Unlimited CVs: tailor your resume for every role and industry\n• Clean PDF export: no watermark, high resolution, ready to send\n• AI cover letter: personalized letters in 30 seconds using your actual experience\n• Professional templates: 40+ designs covering every industry and style",
      },
      {
        heading: "The ROI calculation",
        body: "ReadyCV Pro costs $15/month. One extra interview — let alone one job offer — pays for months of the tool.\n\nIf you're spending more than 20 hours a month on your job search, paying $15 to get AI assistance, ATS scoring, and professional templates is straightforward math. The question isn't whether you can afford a paid tool. It's whether you can afford to keep job searching without one.",
      },
      {
        heading: "When free is actually fine",
        body: "Free makes sense if:\n• You're applying to one specific job and have a strong existing resume\n• You're a student with no budget and just need a basic document\n• You need a quick reference document, not a competitive job application\n\nFor everything else — active job search, career change, competitive roles — the time you save and the edge you gain from AI features make the paid tier worth it.",
      },
    ],
  } : {
    tag: "Herramientas",
    title: "Constructores de CV gratuitos vs de pago: ¿qué importa realmente?",
    intro: "Hay docenas de herramientas para crear CVs, gratuitas y de pago. La pregunta no es cuál es más barata — es cuál te da mejores posibilidades de conseguir el trabajo. Aquí un análisis honesto.",
    sections: [
      {
        heading: "Qué te dan realmente las herramientas gratuitas",
        body: "La mayoría de herramientas gratuitas ofrecen:\n• Plantillas básicas (generalmente 3-5 diseños)\n• Un editor limitado\n• Exportación en PDF — normalmente con marca de agua\n• Sin funciones de IA\n• Un solo documento de CV\n\nPara un CV rápido y puntual, puede ser suficiente. Si estás al inicio de tu carrera, aplicas a pocas ofertas y no necesitas asistencia de IA, una herramienta gratuita cumple su función.",
      },
      {
        heading: "Dónde fallan las herramientas gratuitas",
        body: "Las limitaciones se acumulan rápidamente cuando estás buscando trabajo activamente:\n\n1. Los PDFs con marca de agua son poco profesionales y transmiten una imagen de restricción presupuestaria\n2. Plantillas limitadas hacen que tu CV se vea igual que miles de otros\n3. Sin ATS Score navegas a ciegas sobre la compatibilidad de keywords\n4. Sin asistencia de IA pasas horas en la redacción en lugar de aplicar\n5. El límite de un documento impide personalizar el CV para diferentes puestos",
      },
      {
        heading: "Qué añaden las herramientas de pago (y por qué importa)",
        body: "Una buena herramienta de pago añade funciones que afectan directamente a tus resultados:\n\n• ATS Score: conoce tu compatibilidad antes de aplicar, no después de ser rechazado\n• IA para bullets: convierte responsabilidades en logros en segundos\n• CVs ilimitados: adapta tu CV a cada puesto e industria\n• PDF limpio: sin marca de agua, alta resolución, listo para enviar\n• Carta de presentación con IA: cartas personalizadas en 30 segundos con tu experiencia real\n• Plantillas profesionales: más de 40 diseños para todos los sectores",
      },
      {
        heading: "El cálculo del ROI",
        body: "ReadyCV Pro cuesta $15/mes. Una entrevista extra — y ni hablar de una oferta — paga meses de la herramienta.\n\nSi dedicas más de 20 horas al mes a tu búsqueda de empleo, pagar $15 para obtener asistencia de IA, análisis ATS y plantillas profesionales es matemática simple. La pregunta no es si puedes permitirte una herramienta de pago. Es si puedes permitirte seguir buscando trabajo sin una.",
      },
      {
        heading: "Cuándo la versión gratuita es suficiente",
        body: "La versión gratuita tiene sentido si:\n• Aplicas a un puesto específico y ya tienes un CV sólido\n• Eres estudiante sin presupuesto y solo necesitas un documento básico\n• Necesitas un documento de referencia rápido, no una candidatura competitiva\n\nPara todo lo demás — búsqueda activa, cambio de carrera, puestos competitivos — el tiempo que ahorras y la ventaja que obtienes con las funciones de IA hacen que el plan de pago valga la pena.",
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
                { slug: "como-pasar-el-ats", titleEs: "Cómo pasar el ATS en 2026: tácticas probadas", titleEn: "How to Pass ATS Screening in 2026" },
                { slug: "carta-de-presentacion-2026", titleEs: "Carta de presentación en 2026: ¿todavía importa?", titleEn: "Cover Letter in 2026: Does It Still Matter?" },
                { slug: "como-hacer-un-cv-con-ia", titleEs: "Cómo hacer un CV con inteligencia artificial", titleEn: "How to Make a Resume with AI in 2026" },
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
              href="/pricing"
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

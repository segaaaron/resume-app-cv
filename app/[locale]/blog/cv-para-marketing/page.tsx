import Navbar from "@/components/marketing/Navbar"
import Footer from "@/components/marketing/Footer"
import Link from "next/link"
import Script from "next/script"
import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { setRequestLocale } from "next-intl/server"
import { ArrowRight } from "lucide-react"

const SLUG = "cv-para-marketing"
const DATE_PUBLISHED = "2026-05-02"
const DATE_MODIFIED = "2026-05-02"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "metadata.blog_marketing_cv" })
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

export default async function MarketingResumeArticlePage({
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
        tag: "Marketing",
        title: "Marketing Resume Guide 2026: Format, Metrics & Examples",
        intro:
          "Marketing is one of the most diverse fields in hiring. A content marketer and a performance marketer have almost nothing in common — yet both have 'marketing' on their resume. The first challenge is positioning: making it immediately clear what type of marketing you do, at what level, and with what measurable results.",
        sections: [
          {
            heading: "Position yourself clearly in your summary",
            body: "The biggest mistake on marketing resumes is a generic summary: 'Experienced marketing professional with a passion for brand growth.' That describes 10,000 people.\n\nYour summary should answer three questions in 3-4 lines:\n1. What type of marketing do you do? (SEO, paid social, content, brand, email, growth, product marketing)\n2. At what stage of company? (early-stage startup, mid-market, enterprise, agency)\n3. What's your strongest proof point? (one specific metric or achievement)\n\nExample: 'Growth marketer specializing in B2B SaaS. 5 years scaling content and paid channels at Series A/B startups. Most recently: grew organic traffic from 12K to 180K monthly visitors as Head of SEO at [Company].'\n\nReadyCV's AI summary generator can produce 3 versions of your summary — each with a different emphasis. Pick the one that best fits the role you're targeting.",
          },
          {
            heading: "Every bullet needs a metric",
            body: "Marketing resumes live and die by quantification. Recruiters in marketing expect to see numbers. If you can't quantify it, you probably shouldn't include it.\n\nThe metrics marketing hiring managers want to see:\n• Traffic growth: 'Increased organic traffic by 340% in 18 months'\n• Conversion: 'Improved landing page conversion from 1.8% to 4.2%'\n• Revenue: 'Generated $1.2M in pipeline through inbound campaigns'\n• ROAS: 'Maintained 4.2x ROAS on Meta Ads with $80K monthly budget'\n• Engagement: 'Grew email list from 8K to 45K subscribers in 12 months'\n• Efficiency: 'Reduced cost per lead by 38% through audience refinement'\n\nIf you don't have exact numbers, use ranges or approximations with a qualifier: 'Generated approximately $500K in pipeline over Q3-Q4.'\n\nUse ReadyCV's AI bullet improver to transform vague duty descriptions into metric-led impact statements.",
          },
          {
            heading: "Build a strong tools and skills section",
            body: "Marketing is a tool-heavy field. ATS systems scan for platform keywords explicitly, so your skills section is critical.\n\nOrganize by category:\n• Analytics: Google Analytics 4, Mixpanel, Amplitude, Looker, Tableau\n• Paid: Meta Ads, Google Ads, LinkedIn Ads, TikTok Ads, DV360\n• SEO: Semrush, Ahrefs, Screaming Frog, Search Console\n• Email/CRM: HubSpot, Salesforce Marketing Cloud, Klaviyo, Mailchimp\n• Content: WordPress, Webflow, Contentful, Figma (basic)\n• Social: Sprout Social, Buffer, Hootsuite, Later\n\nOnly list tools you can use confidently in a working context. A hiring manager for a paid media role will often ask you to walk through your campaign setup process.",
          },
          {
            heading: "Structure your experience by marketing type",
            body: "If you've done multiple types of marketing (content, paid, email, events), structure your bullets by channel or program — not just chronologically by task.\n\nFor each role, group your bullets:\n• Owned channels (content, SEO, email)\n• Paid channels (with budget and ROAS)\n• Brand/campaigns (with reach or awareness metrics)\n• Team/cross-functional work (with scope and outcome)\n\nThis structure helps recruiters quickly assess whether your marketing mix matches what they need. A company looking for a pure performance marketer will see immediately whether that's your strength — or whether you're a generalist applying to a specialist role.",
          },
          {
            heading: "Include a portfolio or work samples section",
            body: "Unlike most fields, marketing professionals can often show their work directly. A well-placed portfolio link adds credibility that bullet points alone can't provide.\n\nWhat to link:\n• Campaign landing pages you built or designed\n• Content pieces with strong organic rankings (include traffic in the description)\n• Case studies or decks from successful campaigns\n• LinkedIn articles or publications if they're high-quality\n\nIn ReadyCV, add your portfolio link in the contact section or as a dedicated section. Keep it to 2-3 links — curated is better than comprehensive.",
          },
          {
            heading: "Tailor your resume to the marketing sub-role",
            body: "Marketing job descriptions are highly specific about what they want. A 'Marketing Manager' at one company means email and events. At another, it means paid performance and attribution modeling.\n\nBefore applying, identify the 3-5 most-mentioned capabilities in the job description. Then verify your resume leads with proof of those specific capabilities — not a generic overview of everything you've done.\n\nUse ReadyCV's ATS Score to paste the job description and see exactly which keywords and skills are missing from your current resume. This tailoring process, done properly, takes 10-15 minutes and significantly increases your interview rate.",
          },
        ],
      }
    : {
        tag: "Marketing",
        title: "CV para Marketing 2026: Formato, Métricas y Ejemplos",
        intro:
          "Marketing es uno de los campos con mayor diversidad en la contratación. Un content marketer y un performance marketer casi no tienen nada en común — pero ambos tienen 'marketing' en su CV. El primer desafío es el posicionamiento: dejar claro de inmediato qué tipo de marketing haces, a qué nivel y con qué resultados medibles.",
        sections: [
          {
            heading: "Posiciónate claramente en tu resumen",
            body: "El mayor error en los CVs de marketing es un resumen genérico: 'Profesional de marketing con experiencia y pasión por el crecimiento de marca.' Eso describe a 10.000 personas.\n\nTu resumen debe responder tres preguntas en 3-4 líneas:\n1. ¿Qué tipo de marketing haces? (SEO, paid social, contenidos, marca, email, growth, product marketing)\n2. ¿En qué tipo de empresa? (startup en etapa temprana, mediana empresa, enterprise, agencia)\n3. ¿Cuál es tu prueba más fuerte? (una métrica o logro específico)\n\nEjemplo: 'Growth marketer especializado en SaaS B2B. 5 años escalando canales de contenido y paid en startups Serie A/B. Más reciente: hice crecer el tráfico orgánico de 12K a 180K visitas mensuales como Head de SEO en [Empresa].'\n\nEl generador de resumen IA de ReadyCV puede producir 3 versiones de tu resumen — cada una con un énfasis diferente. Elige la que mejor se adapte al rol que buscas.",
          },
          {
            heading: "Cada bullet necesita una métrica",
            body: "Los CVs de marketing se ganan o se pierden por la cuantificación. Los reclutadores en marketing esperan ver números. Si no puedes cuantificarlo, probablemente no deberías incluirlo.\n\nLas métricas que los gerentes de marketing quieren ver:\n• Crecimiento de tráfico: 'Aumenté el tráfico orgánico un 340% en 18 meses'\n• Conversión: 'Mejoré la conversión de landing page del 1.8% al 4.2%'\n• Ingresos: 'Generé $1.2M en pipeline mediante campañas inbound'\n• ROAS: 'Mantuve un ROAS de 4.2x en Meta Ads con presupuesto mensual de $80K'\n• Engagement: 'Hice crecer la lista de email de 8K a 45K suscriptores en 12 meses'\n• Eficiencia: 'Reduje el costo por lead un 38% mediante refinamiento de audiencias'\n\nSi no tienes números exactos, usa rangos o aproximaciones con un calificador: 'Generé aproximadamente $500K en pipeline en el Q3-Q4.'\n\nUsa el mejorador de bullets IA de ReadyCV para transformar descripciones vagas en declaraciones de impacto basadas en métricas.",
          },
          {
            heading: "Construye una sección de herramientas y habilidades sólida",
            body: "Marketing es un campo con muchas herramientas. Los sistemas ATS buscan palabras clave de plataformas explícitamente, por lo que tu sección de habilidades es crítica.\n\nOrganiza por categoría:\n• Analítica: Google Analytics 4, Mixpanel, Amplitude, Looker, Tableau\n• Paid: Meta Ads, Google Ads, LinkedIn Ads, TikTok Ads, DV360\n• SEO: Semrush, Ahrefs, Screaming Frog, Search Console\n• Email/CRM: HubSpot, Salesforce Marketing Cloud, Klaviyo, Mailchimp\n• Contenido: WordPress, Webflow, Contentful, Figma (básico)\n• Social: Sprout Social, Buffer, Hootsuite, Later\n\nSolo lista herramientas que puedas usar con confianza en un contexto laboral real.",
          },
          {
            heading: "Estructura tu experiencia por tipo de marketing",
            body: "Si has hecho múltiples tipos de marketing (contenido, paid, email, eventos), estructura tus bullets por canal o programa — no solo cronológicamente por tarea.\n\nPara cada rol, agrupa tus bullets:\n• Canales propios (contenido, SEO, email)\n• Canales pagados (con presupuesto y ROAS)\n• Marca/campañas (con métricas de alcance o awareness)\n• Trabajo en equipo/interfuncional (con alcance y resultado)\n\nEsta estructura ayuda a los reclutadores a evaluar rápidamente si tu mix de marketing coincide con lo que necesitan.",
          },
          {
            heading: "Incluye una sección de portafolio o muestras de trabajo",
            body: "A diferencia de la mayoría de campos, los profesionales de marketing a menudo pueden mostrar su trabajo directamente. Un link de portafolio bien ubicado agrega credibilidad que los bullets solos no pueden aportar.\n\nQué linkear:\n• Landing pages de campañas que construiste o diseñaste\n• Piezas de contenido con rankings orgánicos fuertes (incluye el tráfico en la descripción)\n• Casos de estudio o decks de campañas exitosas\n• Artículos de LinkedIn o publicaciones de calidad\n\nEn ReadyCV, agrega tu link de portafolio en la sección de contacto o como una sección dedicada. Mantén 2-3 links — curado es mejor que exhaustivo.",
          },
          {
            heading: "Adapta tu CV al sub-rol de marketing",
            body: "Las ofertas de trabajo de marketing son muy específicas sobre lo que buscan. Un 'Marketing Manager' en una empresa significa email y eventos. En otra, significa performance paid y modelado de atribución.\n\nAntes de aplicar, identifica las 3-5 capacidades más mencionadas en la descripción del trabajo. Luego verifica que tu CV lidere con pruebas de esas capacidades específicas — no un resumen genérico de todo lo que has hecho.\n\nUsa el ATS Score de ReadyCV para pegar la descripción del trabajo y ver exactamente qué palabras clave y habilidades faltan en tu CV actual. Este proceso de personalización, hecho correctamente, toma 10-15 minutos y aumenta significativamente tu tasa de entrevistas.",
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
                { slug: "carta-de-presentacion-ejemplos", titleEs: "Ejemplos de carta de presentación 2026", titleEn: "Cover Letter Examples 2026: Templates That Actually Work" },
                { slug: "como-pasar-el-ats", titleEs: "Cómo pasar el ATS en 2026: tácticas probadas", titleEn: "How to Pass ATS Screening in 2026" },
                { slug: "como-hacer-un-cv-con-ia", titleEs: "Cómo hacer un CV con inteligencia artificial", titleEn: "How to Make a Resume with AI in 2026" },
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
              <Link href={`/${locale}/templates/marketing`} className="text-primary hover:underline font-medium">
                {isEn ? "marketing resume templates" : "plantillas de CV para marketing"}
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

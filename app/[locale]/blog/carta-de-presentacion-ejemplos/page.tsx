import Navbar from "@/components/marketing/Navbar"
import Footer from "@/components/marketing/Footer"
import Link from "next/link"
import Script from "next/script"
import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { setRequestLocale } from "next-intl/server"
import { ArrowRight } from "lucide-react"

const SLUG = "carta-de-presentacion-ejemplos"
const DATE_PUBLISHED = "2026-05-02"
const DATE_MODIFIED = "2026-05-02"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "metadata.blog_cover_examples" })
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

export default async function CoverLetterExamplesArticlePage({
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
        tag: "Cover Letter",
        title: "Cover Letter Examples 2026: Templates That Actually Work",
        intro:
          "Most cover letters fail for the same reason: they summarize the resume instead of adding to it. A cover letter that works does something your resume can't — it shows personality, connects your specific experience to the company's specific needs, and gives the recruiter a reason to want to talk to you.",
        sections: [
          {
            heading: "The three-paragraph structure that works",
            body: "Forget the 5-paragraph essay format. Hiring managers spend less than 30 seconds on a cover letter. Use this tight structure:\n\nParagraph 1 — The hook (2-3 sentences): Start with your strongest relevant achievement, not 'I am writing to apply for...' The opening line determines whether anyone reads further.\n\nParagraph 2 — The connection (3-5 sentences): Explain specifically why this company, this role. Reference something real: a product you use, a problem the company is solving, a recent initiative you admire. Show you actually read the job description.\n\nParagraph 3 — The close (2 sentences): Request the conversation directly. Not 'I hope to hear from you' — 'I'd welcome the opportunity to discuss how my experience with X maps to what you're building at Y. Available for a call this week or next.'\n\nTotal length: 200-300 words. Anything longer loses the reader.",
          },
          {
            heading: "Example: Software engineer cover letter opening",
            body: "What fails:\n'I am excited to apply for the Senior Backend Engineer position at Acme Corp. I have 5 years of experience in software development and am passionate about building scalable systems.'\n\nWhat works:\n'Last quarter I refactored a monolithic checkout service into 8 microservices — cutting p99 latency from 1.2s to 180ms and unblocking 4 teams from a deployment bottleneck that had been unsolved for 18 months. That's the kind of high-ownership, cross-functional infrastructure problem I'm looking for at [Company].'\n\nThe difference: the working version proves something specific before asking for anything. It creates immediate credibility and signals that this person solves hard problems.",
          },
          {
            heading: "Example: Marketing cover letter opening",
            body: "What fails:\n'I am a results-driven marketing professional with experience in digital marketing, content creation and social media management.'\n\nWhat works:\n'I've been following [Company]'s content strategy for the last 6 months — specifically how you've used SEO-driven blog content to drive demo signups without paid amplification. At [Previous Company] I built a similar playbook from scratch: 0 to 90K monthly organic visitors in 14 months, contributing 35% of total pipeline. I'd like to bring that approach to your team.'\n\nThe working version shows research, names a specific company strategy, and maps the writer's proven experience directly to it.",
          },
          {
            heading: "Example: Career change cover letter",
            body: "Career changers face an extra challenge: explaining the pivot without apologizing for it. The tone should be confident transition, not 'despite my background in X.'\n\nWhat works:\n'Five years in operations gave me an unusual vantage point into why most data projects fail: not because of the analysis, but because of how findings are communicated and actioned. I've spent the last 18 months building that bridge from the other side — completing a Google Data Analytics certificate, building two predictive models for internal decision-making, and earning a 92nd percentile Kaggle ranking in my first competition. I'm applying to [Company] because your data team operates at the intersection of technical rigor and business impact — which is exactly what I've been building toward.'\n\nThis opening acknowledges the transition, reframes past experience as an asset, documents proof of the pivot, and connects specifically to the target company.",
          },
          {
            heading: "What to personalize for every application",
            body: "A cover letter template is a starting point, not a finished product. Recruiters immediately recognize templated letters — they're missing the specificity that only a real applicant can provide.\n\nFor every application, customize:\n• The company name (obvious, but often wrong due to copy-paste errors)\n• One specific thing about this company or role that isn't generic\n• Your most relevant achievement mapped to this role's stated priorities\n• The closing ask — 'for a call this week' is more direct than 'I look forward to hearing from you'\n\nReadyCV's AI cover letter generator produces a personalized first draft in under a minute. Paste the job description, choose your tone, and the AI writes all three paragraphs. Then you add the specific company detail that makes it yours.",
          },
          {
            heading: "Mistakes that get cover letters ignored",
            body: "1. Starting with 'I am writing to apply for...' — the most skipped opening in recruiting\n2. Restating your resume in prose — add something, don't summarize\n3. Generic company praise ('your innovative company' or 'industry leader') — signals you didn't research\n4. Length over 350 words — if you can't say it in 300, edit harder\n5. No specific ask in the closing — end with a direct, confident request for the conversation\n6. Sending the same letter to every company — a recruiter knows immediately\n7. Focusing on what you want from the role instead of what you bring to it — the company cares about their problem, not your ambition",
          },
        ],
      }
    : {
        tag: "Carta",
        title: "Ejemplos de Carta de Presentación 2026: Plantillas que Funcionan",
        intro:
          "La mayoría de las cartas de presentación fallan por la misma razón: resumen el CV en vez de agregarle valor. Una carta de presentación que funciona hace algo que tu CV no puede — muestra personalidad, conecta tu experiencia específica con las necesidades específicas de la empresa, y le da al reclutador una razón para querer hablar contigo.",
        sections: [
          {
            heading: "La estructura de tres párrafos que funciona",
            body: "Olvida el formato de 5 párrafos. Los gerentes de contratación pasan menos de 30 segundos en una carta. Usa esta estructura concisa:\n\nPárrafo 1 — El gancho (2-3 oraciones): Empieza con tu logro más relevante, no con 'Me dirijo a ustedes para solicitar...' La primera línea determina si alguien sigue leyendo.\n\nPárrafo 2 — La conexión (3-5 oraciones): Explica específicamente por qué esta empresa, este rol. Referencia algo real: un producto que usas, un problema que la empresa está resolviendo, una iniciativa reciente que admiras. Demuestra que realmente leíste la descripción del puesto.\n\nPárrafo 3 — El cierre (2 oraciones): Solicita la conversación directamente. No 'Espero tener noticias suyas' — 'Me encantaría discutir cómo mi experiencia en X se relaciona con lo que están construyendo en Y. Disponible para una llamada esta semana o la próxima.'\n\nLongitud total: 200-300 palabras. Todo lo que sea más largo pierde al lector.",
          },
          {
            heading: "Ejemplo: Apertura de carta para desarrollador de software",
            body: "Lo que falla:\n'Me complace postularme para el puesto de Ingeniero Backend Senior en Acme Corp. Tengo 5 años de experiencia en desarrollo de software y me apasiona construir sistemas escalables.'\n\nLo que funciona:\n'El trimestre pasado refactoricé un servicio de checkout monolítico en 8 microservicios — reduciendo la latencia p99 de 1.2s a 180ms y desbloqueando a 4 equipos de un cuello de botella de despliegue que llevaba 18 meses sin resolver. Es exactamente ese tipo de problema de infraestructura de alto impacto y trabajo interfuncional lo que busco en [Empresa].'\n\nLa diferencia: la versión que funciona demuestra algo específico antes de pedir nada. Crea credibilidad inmediata y señala que esta persona resuelve problemas difíciles.",
          },
          {
            heading: "Ejemplo: Apertura de carta para marketing",
            body: "Lo que falla:\n'Soy un profesional de marketing orientado a resultados con experiencia en marketing digital, creación de contenidos y gestión de redes sociales.'\n\nLo que funciona:\n'He seguido la estrategia de contenidos de [Empresa] durante los últimos 6 meses — especialmente cómo han usado contenido de blog orientado a SEO para impulsar solicitudes de demo sin amplificación pagada. En [Empresa Anterior] construí un playbook similar desde cero: de 0 a 90K visitas orgánicas mensuales en 14 meses, contribuyendo al 35% del pipeline total. Me gustaría llevar ese enfoque a su equipo.'\n\nLa versión que funciona demuestra investigación, nombra una estrategia específica de la empresa y conecta la experiencia probada del escritor directamente con ella.",
          },
          {
            heading: "Ejemplo: Carta de presentación para cambio de carrera",
            body: "Quienes cambian de carrera enfrentan un desafío adicional: explicar el giro sin disculparse por él. El tono debe ser transición segura, no 'a pesar de mi trayectoria en X.'\n\nLo que funciona:\n'Cinco años en operaciones me dieron un punto de vista inusual sobre por qué la mayoría de los proyectos de datos fracasan: no por el análisis, sino por cómo se comunican y se ponen en práctica los hallazgos. He pasado los últimos 18 meses construyendo ese puente desde el otro lado — completando un certificado de Google Data Analytics, construyendo dos modelos predictivos para la toma de decisiones interna y obteniendo un ranking en el percentil 92 en Kaggle en mi primera competencia. Aplico a [Empresa] porque su equipo de datos opera en la intersección del rigor técnico y el impacto empresarial — que es exactamente hacia donde me he estado preparando.'\n\nEsta apertura reconoce la transición, reenmarca la experiencia pasada como un activo y documenta pruebas del giro.",
          },
          {
            heading: "Qué personalizar para cada solicitud",
            body: "Una plantilla de carta de presentación es un punto de partida, no un producto terminado. Los reclutadores reconocen inmediatamente las cartas con plantilla — les falta la especificidad que solo un candidato real puede proporcionar.\n\nPara cada solicitud, personaliza:\n• El nombre de la empresa (obvio, pero a menudo incorrecto por errores de copiar-pegar)\n• Una cosa específica sobre esta empresa o rol que no sea genérica\n• Tu logro más relevante mapeado a las prioridades declaradas de este rol\n• El cierre — 'para una llamada esta semana' es más directo que 'quedo en espera de su respuesta'\n\nEl generador de cartas IA de ReadyCV produce un primer borrador personalizado en menos de un minuto. Pega la descripción del trabajo, elige tu tono, y la IA escribe los tres párrafos. Luego tú agregas el detalle específico de la empresa que lo hace tuyo.",
          },
          {
            heading: "Errores que hacen que las cartas sean ignoradas",
            body: "1. Empezar con 'Me dirijo a ustedes para solicitar...' — la apertura más saltada en reclutamiento\n2. Reescribir el CV en prosa — agrega algo, no resumas\n3. Elogios genéricos de empresa ('su innovadora empresa' o 'líder del sector') — señala que no investigaste\n4. Más de 350 palabras — si no puedes decirlo en 300, edita más fuerte\n5. Sin solicitud específica en el cierre — termina con una petición directa y segura de la conversación\n6. Enviar la misma carta a todas las empresas — un reclutador lo sabe inmediatamente\n7. Enfocarse en lo que quieres del rol en vez de lo que aportas — a la empresa le importa su problema, no tu ambición",
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
                { slug: "carta-de-presentacion-2026", titleEs: "Carta de presentación en 2026: ¿todavía importa?", titleEn: "Cover Letter in 2026: Does It Still Matter?" },
                { slug: "cv-para-marketing", titleEs: "CV para marketing 2026: formato, métricas y ejemplos", titleEn: "Marketing Resume Guide 2026: Format, Metrics & Examples" },
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

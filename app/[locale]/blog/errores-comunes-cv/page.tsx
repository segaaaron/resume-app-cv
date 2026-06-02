import Link from "next/link"
import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { notFound } from "next/navigation"
import { CheckCircle2, XCircle, AlertTriangle, ShieldCheck } from "lucide-react"

import BlogArticle from "@/components/blog/BlogArticle"
import BlogHero from "@/components/blog/BlogHero"
import BlogTableOfContents from "@/components/blog/BlogTableOfContents"
import BlogProse from "@/components/blog/BlogProse"
import BlogFAQ from "@/components/blog/BlogFAQ"
import BlogCTA from "@/components/blog/BlogCTA"
import BlogRelatedPosts from "@/components/blog/BlogRelatedPosts"
import BlogSchemas from "@/components/blog/BlogSchemas"
import { ERRORES_CV, CHECKLIST_AUTOAUDITORIA } from "@/lib/blog/errores-cv-data"

const SLUG = "errores-comunes-cv"
const DATE_PUBLISHED = "2026-06-01"
const DATE_MODIFIED = "2026-06-01"
const READING_TIME = 9
const LOCALE_TARGET = "es"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "metadata.blog_errores_cv" })
  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: `https://readycvv.com/${locale}/blog/${SLUG}`,
      languages: {
        es: `https://readycvv.com/es/blog/${SLUG}`,
        en: `https://readycvv.com/en/blog/resume-mistakes-to-avoid`,
        "x-default": `https://readycvv.com/en/blog/resume-mistakes-to-avoid`,
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
      authors: ["ReadyCVV Team"],
      locale: "es_ES",
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
      images: ["https://readycvv.com/og-image.png"],
    },
  }
}

const impactStyle: Record<string, string> = {
  Crítico: "bg-rose-100 text-rose-700 border-rose-200",
  Alto: "bg-amber-100 text-amber-700 border-amber-200",
  Medio: "bg-[#00D4FF]/15 text-[#1a2e4a] border-[#00D4FF]/30",
}

export default async function ErroresCvPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  if (locale !== LOCALE_TARGET) notFound()

  const tBlog = await getTranslations("blog")

  const TITLE = "15 Errores Comunes en el Currículum que Debes Evitar (2026)"
  const SUBTITLE =
    "La mayoría de los CVs rechazados lo son por un puñado de errores corregibles. Aquí están los 15 más costosos — ranqueados por impacto — con el arreglo, el ejemplo y un checklist de auto-auditoría de 12 ítems."
  const TAG = "Errores CV"

  const toc = [
    { id: "intro", label: "Por qué la mayoría de los CVs son rechazados" },
    { id: "ranked", label: "Los 15 errores más costosos (ranqueados)" },
    { id: "ats-killers", label: "Errores ATS-killers específicos" },
    { id: "checklist", label: "Checklist de auto-auditoría (12 ítems)" },
    { id: "faq", label: "Preguntas frecuentes" },
  ]

  const faqs = [
    {
      q: "¿Qué porcentaje de CVs son rechazados en la etapa del ATS?",
      a: "Estimaciones de la industria ubican el rechazo automático entre 50% y 75% de todos los CVs enviados, dependiendo de la empresa y el rol. La gran mayoría falla en los errores corregibles de esta guía — no en la calidad del candidato.",
    },
    {
      q: "Si corrijo todos los errores de esta lista, ¿tengo garantizada la entrevista?",
      a: "No — corregir errores solo elimina fricción. Aún necesitas experiencia relevante, buen match de keywords con la oferta y una narrativa clara basada en logros. Pero eliminar estas 15 fuentes de fricción es el paso individual de mayor apalancamiento.",
    },
    {
      q: "¿Cada cuánto debo actualizar mi CV?",
      a: "Al menos cada 6 meses estando empleado, y adaptado por oferta cuando estés en búsqueda activa. El error oculto más grande es enviar un CV que no tocas hace 2 años — se nota en el lenguaje, el formato y las herramientas que mencionas.",
    },
    {
      q: "¿Son los mismos errores para perfiles senior que para perfiles junior?",
      a: "En su mayoría sí. Los errores críticos (tipográficos, mentir, PDF roto) pegan igual de fuerte a todo nivel. Los errores de formato (longitud, foto, plantilla) se vuelven más costosos a mayor seniority porque el pool de reclutadores es más exigente.",
    },
    {
      q: "¿Puedo confiar en una herramienta de IA para corregir todos estos?",
      a: "La IA puede detectar tipos, sugerir reemplazos de verbos y reformular bullets a formato logros. La IA no puede elegir la convención de foto correcta para tu país, decidir cuál rol es irrelevante ni evitar que exageres credenciales. Usa IA para los arreglos mecánicos y juicio humano para los estratégicos.",
    },
    {
      q: "¿Cuál es el error individual que más entrevistas hace perder?",
      a: "No incluir las keywords de la oferta. Es el único error que produce rechazo silencioso — nunca te contestan y nunca sabes por qué, porque el ATS te filtró antes de que un humano vea tu CV. El paso de 10 minutos para incluir keywords es la edición de mayor ROI por postulación.",
    },
  ]

  const relatedItems = [
    { slug: "verbos-de-accion-cv", title: "300+ Verbos de Acción para tu Currículum", desc: "Los verbos que debes usar y los que debes soltar en 2026, organizados por industria.", tag: "Redacción CV", readingTime: 9 },
    { slug: "habilidades-para-cv", title: "Habilidades para CV: 200+ Skills por Industria", desc: "200+ habilidades organizadas por industria con formato ATS-amigable.", tag: "Habilidades CV", readingTime: 11 },
    { slug: "objetivo-profesional-ejemplos", title: "50 Ejemplos de Objetivo Profesional", desc: "La fórmula que funciona en 2026, organizada por categoría.", tag: "Objetivo Profesional", readingTime: 10 },
  ]

  return (
    <BlogArticle>
      <BlogSchemas
        locale={locale}
        slug={SLUG}
        title={TITLE}
        description={SUBTITLE}
        datePublished={DATE_PUBLISHED}
        dateModified={DATE_MODIFIED}
        faqs={faqs}
        breadcrumbBlogLabel={tBlog("browse")}
        keywords={["errores en el cv", "errores comunes curriculum", "errores cv evitar", "errores ats", "errores de formato cv"]}
      />

      <BlogHero
        locale={locale}
        tag={TAG}
        title={TITLE}
        subtitle={SUBTITLE}
        datePublished={DATE_PUBLISHED}
        readingTime={READING_TIME}
        breadcrumbBlogLabel={tBlog("browse")}
        breadcrumbHomeLabel="Inicio"
        readingLabel={tBlog("reading_time")}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="grid lg:grid-cols-[1fr_280px] gap-10 lg:gap-14">
          <article className="min-w-0">
            <BlogProse>
              <p>
                La mayoría de los CVs rechazados no lo son porque el candidato no esté calificado. Lo son por un puñado de errores corregibles, bien documentados, que se acumulan silenciosamente — primero en el filtro ATS, luego en el barrido de seis segundos del reclutador, luego en la shortlist del responsable de contratación. Para cuando recibes el email de &quot;hemos seguido adelante con otros candidatos,&quot; tres filtros distintos ya te vetaron por razones que podrías haber arreglado en veinte minutos.
              </p>
              <p>
                Esta guía ranquea los quince errores de CV de mayor costo por impacto, explica <em>por qué</em> cada uno daña en la contratación de 2026, te entrega el arreglo concreto y termina con un checklist de auto-auditoría de 12 ítems que puedes correr contra cada borrador antes de enviar.
              </p>

              <div className="not-prose my-10">
                <BlogTableOfContents items={toc} title="En esta página" />
              </div>

              <h2 id="intro">Por qué la mayoría de los CVs son rechazados</h2>
              <p>
                Una postulación moderna pasa por tres filtros: <strong>parsing ATS</strong> (¿el documento parsea limpio y matchea keywords?), <strong>barrido del reclutador</strong> (¿la primera impresión aguanta?) y <strong>revisión del hiring manager</strong> (¿la sustancia matchea con el rol?). Cada filtro tiene sus propios modos de falla. Los errores abajo cubren los tres.
              </p>

              <h2 id="ranked">Los 15 errores más costosos (ranqueados)</h2>
              <div className="not-prose space-y-4 my-8">
                {ERRORES_CV.map((m) => (
                  <div key={m.rank} className="rounded-2xl border border-[#1a2e4a]/10 bg-white p-5 sm:p-6 hover:shadow-md hover:border-[#1a2e4a]/20 transition-all">
                    <div className="flex items-start gap-4">
                      <div className="shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-[#1a2e4a] to-[#1a2e4a]/80 text-white font-bold flex items-center justify-center text-sm shadow-md">
                        {m.rank}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 className="font-semibold text-[#1a2e4a] text-base sm:text-lg" dangerouslySetInnerHTML={{ __html: m.title.replace(/&apos;/g, "&#39;") }} />
                          <span className={`text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${impactStyle[m.impact]}`}>
                            {m.impact}
                          </span>
                        </div>
                        <p className="text-sm text-[#1a2e4a]/80 leading-relaxed mb-3">
                          <span className="font-semibold text-[#1a2e4a]">Por qué daña:</span> {m.why}
                        </p>
                        <p className="text-sm text-[#1a2e4a]/80 leading-relaxed">
                          <span className="font-semibold text-emerald-700">Cómo arreglar:</span> {m.fix}
                        </p>
                        {m.example && (
                          <div className="grid sm:grid-cols-2 gap-3 mt-4">
                            <div className="rounded-xl border border-rose-100 bg-rose-50/40 p-3">
                              <p className="text-xs font-semibold uppercase tracking-widest text-rose-700 mb-1">Antes</p>
                              <p className="text-sm text-[#1a2e4a]/85 italic">{m.example.antes}</p>
                            </div>
                            <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3">
                              <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700 mb-1">Después</p>
                              <p className="text-sm text-[#1a2e4a]/85">{m.example.despues}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <h2 id="ats-killers">Errores ATS-killers específicos</h2>
              <p>
                Más allá de los 15 errores ranqueados, tres decisiones de formato rompen consistentemente el parsing ATS — y el CV nunca llega a un humano. Audítalos explícitamente.
              </p>
              <div className="not-prose space-y-3 my-6">
                {[
                  { title: "Gráficos, íconos o gráficas como contenido central", text: "Muchos parsers ATS ignoran el contenido de imagen por completo. Las habilidades mostradas como barras o gráficas desaparecen del texto parseado. Mantén los visuales como decoración, nunca como carga estructural." },
                  { title: "Tablas para maquetar (no para datos)", text: "Las maquetas multi-columna construidas con tablas producen texto desordenado en la salida del parser. Usa layouts CSS de columna única o doble sobre plantillas parser-clean." },
                  { title: "Información crítica solo en encabezado o pie", text: "Algunos parsers omiten por completo las regiones de header/footer de un PDF. Nunca pongas tu teléfono, email o nombre solo en el header — duplica la línea de contacto en el cuerpo del documento." },
                ].map(({ title, text }, i) => (
                  <div key={i} className="flex gap-4 rounded-2xl border border-rose-100 bg-rose-50/40 p-4 sm:p-5">
                    <XCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-[#1a2e4a] text-sm sm:text-base mb-1">{title}</p>
                      <p className="text-sm text-[#1a2e4a]/75 leading-relaxed">{text}</p>
                    </div>
                  </div>
                ))}
              </div>

              <h2 id="checklist">Checklist de auto-auditoría (12 ítems)</h2>
              <p>Corre este checklist contra cada borrador antes de enviar. Apunta a 12/12 en cada postulación.</p>
              <div className="not-prose my-6 rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/60 to-white p-6">
                <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700 mb-4 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  Checklist pre-envío
                </p>
                <ul className="space-y-2.5">
                  {CHECKLIST_AUTOAUDITORIA.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-[#1a2e4a]/85">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="not-prose rounded-2xl border border-amber-200 bg-amber-50/50 p-5 sm:p-6 my-8 flex gap-4">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-[#1a2e4a] text-sm sm:text-base mb-1.5">Corre la auditoría automáticamente</p>
                  <p className="text-sm text-[#1a2e4a]/80 leading-relaxed">
                    El <Link href={`/${locale}/tools/ats-checker`}>ATS Checker de ReadyCV</Link> automatiza 8 de los 12 ítems de auditoría: limpieza del PDF, match de keywords, estructura verbo-primero, métricas en bullets, longitud y layout parser-safe. Empieza desde una <Link href={`/${locale}/templates`}>plantilla ATS-verificada</Link> y los errores de formato no aparecen en primer lugar.
                  </p>
                </div>
              </div>

              <p>
                Ninguno de estos quince errores tiene que ver con la calidad del candidato. Tienen que ver con fricción prevenible — la diferencia entre un CV que llega al hiring manager y uno que no. Corrígelos una vez, incorpóralos a tu plantilla default, y cada postulación futura arranca por delante de los candidatos que nunca leyeron esta lista.
              </p>
            </BlogProse>

            <div className="mt-16">
              <BlogFAQ items={faqs} title="Preguntas frecuentes" />
            </div>

            <div className="mt-16">
              <BlogCTA
                locale={locale}
                title="Construye un CV que evite los 15 errores por diseño."
                description="Las plantillas de ReadyCV PRO están pre-validadas contra cada error de esta guía: PDFs ATS-clean, encabezados estructurados, plantillas de bullets por logro, convenciones de foto por país y adaptación de keywords con IA por postulación."
                buttonLabel="Empezar con ReadyCV PRO"
                hint="$15/mes o $144/año · 7 herramientas con IA · Cancela cuando quieras"
              />
            </div>

            <div className="mt-16">
              <BlogRelatedPosts
                locale={locale}
                items={relatedItems}
                title="Sigue leyendo"
                readingLabel={tBlog("reading_time")}
              />
            </div>
          </article>

          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <BlogTableOfContents items={toc} title="En esta página" />
            </div>
          </aside>
        </div>
      </div>
    </BlogArticle>
  )
}

import Link from "next/link"
import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { notFound } from "next/navigation"
import { CheckCircle2, XCircle, Sparkles, AlertTriangle, Wand2 } from "lucide-react"

import BlogArticle from "@/components/blog/BlogArticle"
import BlogHero from "@/components/blog/BlogHero"
import BlogTableOfContents from "@/components/blog/BlogTableOfContents"
import BlogProse from "@/components/blog/BlogProse"
import BlogFAQ from "@/components/blog/BlogFAQ"
import BlogCTA from "@/components/blog/BlogCTA"
import BlogAtsPreview from "@/components/blog/BlogAtsPreview"
import BlogRelatedPosts from "@/components/blog/BlogRelatedPosts"
import BlogSchemas from "@/components/blog/BlogSchemas"
import {
  VERBOS_ACCION_CATEGORIAS,
  VERBOS_SOBREUSADOS,
  EJEMPLOS_ANTES_DESPUES,
  TOTAL_VERBOS_COUNT,
} from "@/lib/blog/verbos-accion-data"

const SLUG = "verbos-de-accion-cv"
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
  const t = await getTranslations({ locale, namespace: "metadata.blog_verbos_accion" })
  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: `https://readycvv.com/${locale}/blog/${SLUG}`,
      languages: {
        es: `https://readycvv.com/es/blog/${SLUG}`,
        en: `https://readycvv.com/en/blog/action-verbs-resume`,
        "x-default": `https://readycvv.com/en/blog/action-verbs-resume`,
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

export default async function VerbosAccionPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  if (locale !== LOCALE_TARGET) notFound()

  const tBlog = await getTranslations("blog")

  const TITLE = `${TOTAL_VERBOS_COUNT}+ Verbos de Acción para tu Currículum (Por Industria, 2026)`
  const SUBTITLE =
    "El reclutador dedica 6-7 segundos al primer barrido. Los verbos de acción son cómo sobrevives esos segundos. Aquí tienes 300+ verbos organizados por categoría, el framework para elegir el correcto y 5 ejemplos antes/después."
  const TAG = "Redacción CV"

  const toc = [
    { id: "por-que", label: "Por qué los verbos de acción son críticos" },
    { id: "ciencia", label: "La ciencia detrás del barrido de 6 segundos" },
    { id: "framework", label: "Cómo elegir el verbo correcto (4 pasos)" },
    ...VERBOS_ACCION_CATEGORIAS.map((c) => ({ id: c.id, label: c.title })),
    { id: "por-nivel", label: "Verbos por nivel de experiencia" },
    { id: "sobreusados", label: "Verbos sobreusados y reemplazos fuertes" },
    { id: "rewrites", label: "Ejemplos antes/después" },
    { id: "ats", label: "Uso ATS-friendly de los verbos" },
    { id: "faq", label: "Preguntas frecuentes" },
  ]

  const faqs = [
    {
      q: "¿Cuántos verbos distintos debo usar en un mismo CV?",
      a: "En un CV de 1-2 páginas deberías usar 15-25 verbos distintos — aproximadamente uno por bullet, sin repetir ninguno más de dos veces. La repetición es la señal silenciosa de un CV sin editar.",
    },
    {
      q: "¿Uso siempre pasado simple o también presente?",
      a: "Pasado simple para todos los roles ya terminados, y presente solo para responsabilidades actuales y en curso del rol vigente. Mezclar tiempos dentro de un mismo rol es el error de consistencia más común.",
    },
    {
      q: "¿Hay verbos que delatan que el CV fue escrito por IA?",
      a: "Sí — verbos sobreusados como &apos;lideré,&apos; &apos;optimicé&apos; e &apos;impulsé&apos; aparecen tanto en CVs generados por IA que algunos reclutadores empiezan a marcarlos. Mezcla verbos menos esperados como &apos;orquesté,&apos; &apos;catalicé,&apos; &apos;forjé&apos; o &apos;instauré&apos; para romper el patrón.",
    },
    {
      q: "¿Los ATS valoran qué verbo uses?",
      a: "No directamente. El ATS no puntúa por intensidad del verbo. Pero los verbos fuertes hacen que el bullet sea denso en keywords y cuantificado — y eso sí lo premia el ATS. El verbo es palanca, no la carga.",
    },
    {
      q: "¿Uso verbos específicos de una industria aunque no tenga experiencia en ella?",
      a: "Solo si la acción es genuina. Si arquitecté sistemas, di &apos;arquitecté.&apos; Pero no inventes verbos técnicos para trabajo no técnico — los reclutadores lo notan en la entrevista.",
    },
    {
      q: "¿Es alguna vez apropiado usar &apos;fui responsable de&apos; o &apos;encargado de&apos;?",
      a: "Casi nunca en un CV competitivo. Ambos tienen reemplazos más fuertes que comunican la misma idea con más impacto — lideré, dirigí, supervisé, coordiné. Reserva &apos;encargado de&apos; solo para los casos donde su matiz específico importe.",
    },
  ]

  const relatedItems = [
    { slug: "habilidades-para-cv", title: "Habilidades para CV: 200+ Skills por Industria", desc: "200+ habilidades organizadas por industria con formato ATS-amigable.", tag: "Habilidades CV", readingTime: 11 },
    { slug: "objetivo-profesional-ejemplos", title: "50 Ejemplos de Objetivo Profesional", desc: "La fórmula que funciona en 2026, organizada por categoría.", tag: "Objetivo Profesional", readingTime: 10 },
    { slug: "errores-comunes-cv", title: "15 Errores Comunes en el Currículum", desc: "Los 15 errores más costosos en el CV ranking por impacto.", tag: "Errores CV", readingTime: 9 },
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
        keywords={["verbos de accion cv", "verbos accion curriculum", "palabras de poder cv", "verbos fuertes cv", "verbos de impacto"]}
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
                Dos CVs pueden describir exactamente el mismo trabajo, con exactamente los mismos logros, y generar reacciones completamente distintas en el reclutador. La variable casi nunca es el contenido — es el verbo al inicio de cada bullet. Un bullet que abre con &quot;Dirigí&quot; aterriza con más fuerza que uno que abre con &quot;Fui encargado de,&quot; aunque las siguientes 12 palabras sean idénticas.
              </p>
              <p>
                Esta guía te entrega {TOTAL_VERBOS_COUNT}+ verbos de acción para CV organizados en {VERBOS_ACCION_CATEGORIAS.length} categorías, un framework de 4 pasos para elegir el correcto por bullet, los verbos que debes soltar en 2026 y cinco reescrituras antes/después que muestran la regla en acción.
              </p>

              <div className="not-prose my-10">
                <BlogTableOfContents items={toc} title="En esta página" />
              </div>

              <h2 id="por-que">Por qué los verbos de acción son críticos</h2>
              <p>
                Los reclutadores escanean, no leen. El ojo aterriza primero en el borde izquierdo de cada bullet — lo que significa que tu verbo es la palabra de mayor apalancamiento en todo tu CV. Un verbo fuerte transmite propiedad, alcance y resultado antes de que el reclutador procese la métrica o el contexto que sigue.
              </p>

              <h2 id="ciencia">La ciencia detrás del barrido de 6 segundos</h2>
              <p>
                Estudios de eye-tracking sobre comportamiento de reclutadores ubican consistentemente el tiempo de lectura del primer barrido entre 6 y 11 segundos por CV. En esa ventana, el reclutador escanea <strong>nombres, cargos, fechas, empleadores — y la primera palabra de cada bullet</strong>. Todo lo demás se procesa solo si el primer barrido gana el segundo.
              </p>

              <h2 id="framework">Cómo elegir el verbo correcto (4 pasos)</h2>
              <ol>
                <li><strong>Identifica la acción.</strong> ¿Qué hiciste realmente — diseñar, entregar, analizar, liderar, vender, construir? Elige primero la categoría.</li>
                <li><strong>Ajusta el verbo al alcance.</strong> &quot;Lideré un equipo de 2 personas&quot; usa verbos distintos a &quot;Lideré una organización de 40.&quot; La intensidad del verbo debe seguir el alcance real.</li>
                <li><strong>Evita los defaults de IA.</strong> &quot;Lideré,&quot; &quot;optimicé&quot; e &quot;impulsé&quot; están saturados. Elige la segunda mejor opción de la categoría.</li>
                <li><strong>Acompaña con un número.</strong> Un verbo fuerte sin métrica lee como bravata. &quot;Aumenté ingresos&quot; no significa nada; &quot;Aumenté ingresos +38% YoY&quot; significa todo.</li>
              </ol>

              {VERBOS_ACCION_CATEGORIAS.map((cat) => (
                <div key={cat.id}>
                  <h2 id={cat.id}>{cat.title} ({cat.verbs.length} verbos)</h2>
                  <p>{cat.description}</p>
                  <div className="not-prose my-6 rounded-2xl border border-[#1a2e4a]/10 bg-white p-5">
                    <div className="flex flex-wrap gap-2">
                      {cat.verbs.map((v) => (
                        <span
                          key={v}
                          className="inline-flex items-center px-3 py-1.5 rounded-full bg-gradient-to-br from-[#00D4FF]/10 to-[#1a2e4a]/5 text-[#1a2e4a] text-xs font-medium border border-[#00D4FF]/15 hover:border-[#00D4FF]/40 hover:shadow-sm transition-all"
                        >
                          {v}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}

              <h2 id="por-nivel">Verbos por nivel de experiencia</h2>
              <div className="not-prose my-6 overflow-x-auto rounded-2xl border border-[#1a2e4a]/10">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#1a2e4a] text-white">
                      <th className="px-4 py-3 text-left font-semibold">Nivel</th>
                      <th className="px-4 py-3 text-left font-semibold">Intensidad del verbo</th>
                      <th className="px-4 py-3 text-left font-semibold">Verbos adecuados</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {[
                      ["Junior / sin experiencia", "Verbos de acción sin sobreafirmar", "Construí, Diseñé, Analicé, Aporté, Apoyé, Entregué"],
                      ["Semi-senior", "Verbos con alcance y resultado", "Lideré, Coordiné, Impulsé, Optimicé, Arquitecté, Lancé"],
                      ["Senior IC", "Profundidad estratégica + técnica", "Orquesté, Arquitecté, Pioneé, Instauré, Reformulé"],
                      ["Gerente / Director", "Escala organizacional", "Dirigí, Orquesté, Galvanicé, Transformé, Mobilizé"],
                      ["Ejecutivo", "Visión y resultado a escala", "Encabecé, Catalicé, Reestructuré, Establecí, Conduje"],
                    ].map(([lvl, intensity, fits], i) => (
                      <tr key={i} className={i % 2 === 1 ? "bg-[#00D4FF]/5 border-b border-[#1a2e4a]/10" : "border-b border-[#1a2e4a]/10"}>
                        <td className="px-4 py-3 font-semibold text-[#1a2e4a]">{lvl}</td>
                        <td className="px-4 py-3 text-[#1a2e4a]/80">{intensity}</td>
                        <td className="px-4 py-3 text-[#1a2e4a]/80">{fits}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h2 id="sobreusados">Verbos sobreusados y reemplazos fuertes</h2>
              <p>
                Estos verbos aparecen en prácticamente todos los CVs en 2026 — incluidos los generados por IA. Suéltalos y elige del listado de reemplazos. El reclutador ve menos de estos por día, lo que significa que tu bullet destaca tanto por ausencia como por contenido.
              </p>
              <div className="not-prose my-6 overflow-x-auto rounded-2xl border border-[#1a2e4a]/10">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#1a2e4a] text-white">
                      <th className="px-4 py-3 text-left font-semibold">Suelta esto</th>
                      <th className="px-4 py-3 text-left font-semibold">Usa uno de estos</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {VERBOS_SOBREUSADOS.map(({ debil, fuertes }, i) => (
                      <tr key={debil} className={i % 2 === 1 ? "bg-[#00D4FF]/5 border-b border-[#1a2e4a]/10" : "border-b border-[#1a2e4a]/10"}>
                        <td className="px-4 py-3 font-semibold text-rose-600 line-through">{debil}</td>
                        <td className="px-4 py-3 text-[#1a2e4a]/80">{fuertes.join(" · ")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h2 id="rewrites">Ejemplos antes/después</h2>
              <div className="not-prose space-y-4 my-8">
                {EJEMPLOS_ANTES_DESPUES.map(({ antes, despues, verbo }, i) => (
                  <div key={i} className="rounded-2xl border border-[#1a2e4a]/10 bg-white p-5">
                    <p className="text-xs font-semibold uppercase tracking-widest text-[#00D4FF] mb-3 flex items-center gap-2">
                      <Wand2 className="h-3.5 w-3.5" />
                      Reescritura usando &quot;{verbo}&quot;
                    </p>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div className="rounded-xl border border-rose-100 bg-rose-50/40 p-3">
                        <p className="text-xs font-semibold uppercase tracking-widest text-rose-700 mb-1">Antes</p>
                        <p className="text-sm text-[#1a2e4a]/85 italic">{antes}</p>
                      </div>
                      <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3">
                        <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700 mb-1">Después</p>
                        <p className="text-sm text-[#1a2e4a]/85">{despues}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <h2 id="ats">Uso ATS-friendly de los verbos</h2>
              <ul>
                <li><strong>Inicia cada bullet con un verbo.</strong> Nunca con un sustantivo, fecha o frase preposicional. Los parsers ATS esperan estructura verbo-primero.</li>
                <li><strong>Varía los verbos.</strong> La repetición señala documento sin editar — y algunos dashboards ATS marcan conteos de verbos duplicados como métrica de calidad.</li>
                <li><strong>Ajusta el verbo a la densidad de keywords.</strong> Si la oferta dice &quot;construí,&quot; &quot;desarrollé,&quot; &quot;lancé&quot; — usa esos mismos verbos textuales en al menos un bullet para anclar el match.</li>
                <li><strong>Evita construcciones pasivas.</strong> &quot;Me asignaron&quot; o &quot;Se me dio la responsabilidad de&quot; fallan la heurística verbo-primero del ATS y se leen como evasivos.</li>
              </ul>

              <div className="not-prose rounded-2xl border border-amber-200 bg-amber-50/50 p-5 sm:p-6 my-8 flex gap-4">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-[#1a2e4a] text-sm sm:text-base mb-1.5">Combina verbos fuertes con validación ATS</p>
                  <p className="text-sm text-[#1a2e4a]/80 leading-relaxed">
                    Mira cómo el <Link href={`/${locale}/tools/ats-checker`}>puntaje ATS de ReadyCV PRO</Link> lee tus bullets reescritos contra la oferta real: te muestra qué requisitos tu CV todavía no menciona — para que decidas qué añadir antes de postular, en vez de adivinar. Empieza desde una <Link href={`/${locale}/templates`}>plantilla parser-clean</Link> para que los verbos no se vean arruinados por problemas de maquetación.
                  </p>
                </div>
              </div>

              <div className="not-prose grid sm:grid-cols-3 gap-4 my-8">
                {[
                  { icon: CheckCircle2, title: "Verbo primero, siempre", text: "Cada bullet empieza con un verbo. Sin excepciones." },
                  { icon: Sparkles, title: "Acompaña con número", text: "Los verbos fuertes sin métrica leen como bravata. Siempre acompaña." },
                  { icon: XCircle, title: "Suelta los defaults", text: "&apos;Fui responsable de,&apos; &apos;encargado de,&apos; &apos;trabajé en&apos; — fuera en 2026." },
                ].map(({ icon: Icon, title, text }, i) => (
                  <div key={i} className="rounded-2xl border border-emerald-100 bg-emerald-50/30 p-5">
                    <Icon className={`h-5 w-5 mb-3 ${i === 2 ? "text-rose-600" : "text-emerald-600"}`} />
                    <p className="font-semibold text-[#1a2e4a] text-sm mb-1.5">{title}</p>
                    <p className="text-sm text-[#1a2e4a]/75 leading-relaxed" dangerouslySetInnerHTML={{ __html: text.replace(/&apos;/g, "&#39;") }} />
                  </div>
                ))}
              </div>

              <p>
                Los verbos de acción son la unidad más pequeña de optimización del CV que produce la mayor ganancia. Cinco minutos por bullet, el verbo correcto, la métrica correcta — y el barrido de seis segundos del reclutador se convierte en una lectura de dieciséis segundos. Esa es la diferencia entre el email de rechazo y la llamada de screening.
              </p>
            </BlogProse>

            <div className="mt-16">
              <BlogFAQ items={faqs} title="Preguntas frecuentes" />
            </div>

            <div className="mt-16">
              <BlogAtsPreview locale={locale} variant="frontend" />

              <BlogCTA
                locale={locale}
                title="Deja que la IA elija el verbo correcto en cada bullet."
                description="El editor de bullets con IA de ReadyCV PRO reescribe tu experiencia con estructura verbo-primero, intensidad ajustada al alcance y métricas embebidas — en segundos, sobre 111+ plantillas ATS-verificadas."
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

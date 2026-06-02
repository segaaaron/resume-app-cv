import Link from "next/link"
import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { notFound } from "next/navigation"
import { CheckCircle2, XCircle, ArrowRightLeft, Sparkles, AlertTriangle } from "lucide-react"

import BlogArticle from "@/components/blog/BlogArticle"
import BlogHero from "@/components/blog/BlogHero"
import BlogTableOfContents from "@/components/blog/BlogTableOfContents"
import BlogProse from "@/components/blog/BlogProse"
import BlogFAQ from "@/components/blog/BlogFAQ"
import BlogCTA from "@/components/blog/BlogCTA"
import BlogRelatedPosts from "@/components/blog/BlogRelatedPosts"
import BlogSchemas from "@/components/blog/BlogSchemas"

const SLUG = "cv-cambio-carrera"
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
  const t = await getTranslations({ locale, namespace: "metadata.blog_cv_cambio_carrera" })
  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: `https://readycvv.com/${locale}/blog/${SLUG}`,
      languages: {
        es: `https://readycvv.com/es/blog/${SLUG}`,
        "x-default": `https://readycvv.com/es/blog/${SLUG}`,
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

export default async function CVCambioCarreraPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  if (locale !== LOCALE_TARGET) notFound()

  const tBlog = await getTranslations("blog")

  const TITLE = "CV para Cambio de Carrera: Guía Completa con Ejemplos (2026)"
  const SUBTITLE =
    "Cambiar de industria a los 30, 40 o 50 ya no es excepcional — es habitual. Pero tu CV de cambio de carrera necesita reposicionar todo: formato, objetivo, habilidades transferibles. Aquí está cómo."
  const TAG = "Cambio de Carrera"

  const toc = [
    { id: "intro", label: "Por qué requiere estrategia distinta" },
    { id: "formato", label: "Funcional vs cronológico vs mixto" },
    { id: "objetivo", label: "Objetivo profesional para cambio de carrera" },
    { id: "transferibles", label: "Habilidades transferibles por industria" },
    { id: "experiencia", label: "Reformular experiencia para nueva industria" },
    { id: "carta", label: "Carta de presentación complementaria" },
    { id: "educacion", label: "Educación complementaria y certificaciones" },
    { id: "ejemplos", label: "4 ejemplos antes/después" },
    { id: "errores", label: "Errores comunes" },
    { id: "entrevista", label: "Tips para entrevista post-cambio" },
    { id: "faq", label: "Preguntas frecuentes" },
  ]

  const faqs = [
    {
      q: "¿Debo esconder mi experiencia anterior si cambio de carrera?",
      a: "No. Esconderla genera huecos en el CV que el ATS detecta y los reclutadores cuestionan. La estrategia correcta es mantenerla visible pero reformulada — los mismos roles descritos con vocabulario y enfoque de la nueva industria. Lo que cambias es el ángulo, no los hechos.",
    },
    {
      q: "¿Qué formato funciona mejor para cambio de carrera?",
      a: "El formato combinado (híbrido). Lleva un objetivo profesional fuerte enfocado en la nueva industria, una sección de habilidades transferibles destacada arriba, y luego experiencia cronológica reformulada. El funcional puro genera desconfianza; el cronológico puro entierra tus habilidades transferibles bajo títulos del pasado.",
    },
    {
      q: "¿Necesito un máster o certificación antes de cambiar de carrera?",
      a: "Depende del salto. Cambios adyacentes (marketing → producto, finanzas → consultoría) muchas veces no requieren formación formal — alcanza con certificaciones específicas. Saltos radicales (humanidades → tech) sí benefician de un bootcamp o máster que demuestre compromiso serio con la transición.",
    },
    {
      q: "¿Cuánto tiempo tarda un cambio de carrera real?",
      a: "Promedio 6-12 meses desde la decisión hasta el primer empleo en la nueva industria, considerando estudio complementario, ajuste de CV, networking y proceso de selección. Los cambios más rápidos son entre industrias adyacentes con habilidades fuertemente transferibles.",
    },
    {
      q: "¿Pongo mi título universitario aunque no sea de la nueva área?",
      a: "Sí, siempre. Omitir la educación es sospechoso. La estrategia es darle menos peso visual (sección breve, sin desarrollar materias) y compensar con certificaciones, bootcamps o cursos relacionados con la nueva industria destacados arriba.",
    },
    {
      q: "¿Debo aceptar un salario más bajo al cambiar de carrera?",
      a: "Generalmente sí, al menos en el primer rol. El mercado paga experiencia en la industria específica, no años de experiencia totales. Posicionarse como senior con junior pay no es derrota — es estrategia para entrar y luego acelerar. Calcula tu nuevo rango con la calculadora de salario por industria y país.",
    },
  ]

  const relatedItems = [
    { slug: "habilidades-para-cv", title: "Habilidades para CV: 200+ Skills por Industria", desc: "200+ habilidades por industria — fundamental para identificar tus transferibles.", tag: "Habilidades CV", readingTime: 11 },
    { slug: "objetivo-profesional-ejemplos", title: "50 Ejemplos de Objetivo Profesional", desc: "Incluye categoría completa de cambio de carrera con ejemplos por escenario.", tag: "Objetivo Profesional", readingTime: 10 },
    { slug: "cv-recien-graduado", title: "CV para Recién Graduados Universitarios", desc: "Si tu cambio es vía estudios formales, la guía para presentar tu nueva formación.", tag: "CV Sin Experiencia", readingTime: 10 },
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
        keywords={["cv cambio de carrera", "cambio carrera profesional", "habilidades transferibles", "reorientacion laboral", "cambio sector laboral"]}
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
                Cambiar de carrera ya no es la excepción. Según informes recientes del Foro Económico Mundial, casi 1 de cada 2 profesionales cambiará sustancialmente de industria al menos una vez en la próxima década, impulsado por automatización, IA y reorganización de sectores enteros. Lo que sí sigue siendo excepcional es <strong>hacer ese cambio con un CV bien construido</strong>.
              </p>
              <p>
                Los CVs de cambio de carrera que fracasan tienen un patrón claro: intentan ocultar el pasado, esperan que el reclutador adivine la conexión entre lo anterior y lo nuevo, o se rinden al genérico &quot;dispuesto a aprender&quot;. Los que funcionan hacen lo contrario: enmarcan el cambio con seguridad, traducen experiencia previa al vocabulario de la nueva industria y destacan habilidades transferibles antes que títulos del pasado.
              </p>

              <div className="not-prose my-10">
                <BlogTableOfContents items={toc} title="En esta página" />
              </div>

              <h2 id="intro">Por qué el CV de cambio de carrera requiere estrategia distinta</h2>
              <p>
                Un CV tradicional cuenta tu pasado para predecir tu futuro. El CV de cambio de carrera tiene que hacer algo más difícil: <strong>contar tu pasado de tal forma que el reclutador <em>quiera</em> apostar por tu futuro</strong>. Necesita reposicionar — no reescribir — cada bloque, desde el objetivo hasta los bullets de tus roles anteriores.
              </p>

              <h2 id="formato">Funcional vs cronológico vs mixto — cuál usar</h2>
              <div className="not-prose my-6 overflow-x-auto rounded-2xl border border-[#1a2e4a]/10">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#1a2e4a] text-white">
                      <th className="px-4 py-3 text-left font-semibold">Formato</th>
                      <th className="px-4 py-3 text-left font-semibold">¿Funciona para cambio?</th>
                      <th className="px-4 py-3 text-left font-semibold">Cuándo</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {[
                      ["Cronológico", "No bien", "Entierra habilidades transferibles bajo títulos antiguos"],
                      ["Funcional puro", "Riesgoso", "Genera desconfianza; ATS no parsea fechas"],
                      ["Combinado (híbrido)", "Sí — recomendado", "Skills arriba + experiencia cronológica reformulada abajo"],
                    ].map(([f, w, c], i) => (
                      <tr key={i} className={i % 2 === 1 ? "bg-[#00D4FF]/5 border-b border-[#1a2e4a]/10" : "border-b border-[#1a2e4a]/10"}>
                        <td className="px-4 py-3 font-semibold text-[#1a2e4a]">{f}</td>
                        <td className="px-4 py-3 text-[#1a2e4a]/80">{w}</td>
                        <td className="px-4 py-3 text-[#1a2e4a]/80">{c}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p>
                El formato combinado gana porque resuelve la tensión central del cambio de carrera: el reclutador necesita <em>ver</em> tus habilidades para la nueva industria <em>antes</em> de leer tus títulos antiguos. La sección de competencias arriba hace ese trabajo de framing; la cronología abajo da credibilidad.
              </p>

              <h2 id="objetivo">Cómo redactar un objetivo profesional persuasivo</h2>
              <p>
                Tu objetivo profesional es el único bloque del CV donde puedes hablar directamente del cambio. Úsalo. La fórmula que funciona: <strong>perfil actual + razón del cambio + valor concreto que aportas + rol específico que buscas</strong>. La &quot;razón del cambio&quot; no debe sonar a queja del pasado, sino a tracción hacia el futuro.
              </p>
              <div className="not-prose space-y-3 my-6">
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-5">
                  <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700 mb-2">Bien escrito (Marketing → UX Design)</p>
                  <p className="text-sm text-[#1a2e4a]/85 italic">
                    &quot;Profesional de marketing con 6 años liderando campañas centradas en investigación de usuario y testing A/B, ahora orientada al diseño UX tras certificación en Google UX Design y 3 proyectos freelance. Busco rol Junior UX Designer donde aplicar mi experiencia en research cuantitativo y cualitativo a la creación de productos digitales.&quot;
                  </p>
                </div>
                <div className="rounded-2xl border border-rose-100 bg-rose-50/40 p-5">
                  <p className="text-xs font-semibold uppercase tracking-widest text-rose-700 mb-2">A evitar</p>
                  <p className="text-sm text-[#1a2e4a]/85 italic">
                    &quot;Profesional con experiencia en marketing buscando un cambio de carrera hacia diseño porque siempre me apasionó. Estoy dispuesta a aprender y comenzar desde cero. Soy proactiva y trabajo en equipo.&quot;
                  </p>
                </div>
              </div>

              <h2 id="transferibles">Habilidades transferibles por industria</h2>
              <p>
                Las habilidades transferibles son el puente. La tabla siguiente muestra puentes habituales entre industrias — el ejercicio es identificar las que ya posees, no inventarlas.
              </p>
              <div className="not-prose my-6 overflow-x-auto rounded-2xl border border-[#1a2e4a]/10">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#1a2e4a] text-white">
                      <th className="px-4 py-3 text-left font-semibold">De → A</th>
                      <th className="px-4 py-3 text-left font-semibold">Habilidades transferibles clave</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {[
                      ["Marketing → UX Design", "User research, testing A/B, análisis de datos, copywriting, empatía con usuario"],
                      ["Docencia → Corporate Trainer", "Diseño instruccional, comunicación, evaluación de aprendizaje, facilitación"],
                      ["Ingeniería → Consultoría", "Resolución estructurada de problemas, gestión proyectos, comunicación técnica"],
                      ["Finanzas → Data Analytics", "Modelado, Excel avanzado, SQL, pensamiento cuantitativo, storytelling con datos"],
                      ["Ventas → Customer Success", "Gestión cuentas, comunicación, negociación, KPIs comerciales"],
                      ["Hospitalidad → People Ops", "Atención al cliente, resolución conflictos, trabajo bajo presión, multilingüe"],
                      ["Periodismo → Content Marketing", "Investigación, redacción, edición, storytelling, manejo de deadlines"],
                      ["Militar → Project Management", "Liderazgo, logística, planificación estratégica, ejecución bajo restricciones"],
                    ].map(([d, s], i) => (
                      <tr key={i} className={i % 2 === 1 ? "bg-[#00D4FF]/5 border-b border-[#1a2e4a]/10" : "border-b border-[#1a2e4a]/10"}>
                        <td className="px-4 py-3 font-semibold text-[#1a2e4a]">{d}</td>
                        <td className="px-4 py-3 text-[#1a2e4a]/80">{s}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h2 id="experiencia">Cómo reformular experiencia previa para nueva industria</h2>
              <p>
                Tus roles del pasado no cambian — su <em>descripción</em> sí. Reescribe cada bullet desde el ángulo de la nueva industria: usa el vocabulario, prioriza los aspectos transferibles, omite o reduce lo específico del sector anterior. El ejercicio mental es <em>&quot;si el reclutador de mi nueva industria leyera esta línea sola, ¿la reconocería como relevante?&quot;</em>.
              </p>
              <div className="not-prose space-y-3 my-6">
                <div className="rounded-2xl border border-rose-100 bg-rose-50/40 p-5">
                  <p className="text-xs font-semibold uppercase tracking-widest text-rose-700 mb-2">Versión original (rol de Marketing)</p>
                  <p className="text-sm text-[#1a2e4a]/85 italic">
                    &quot;Gestioné campañas de email marketing alcanzando una tasa de apertura del 28%.&quot;
                  </p>
                </div>
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-5">
                  <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700 mb-2">Reescrita para UX (mismo logro, otro framing)</p>
                  <p className="text-sm text-[#1a2e4a]/85 italic">
                    &quot;Diseñé experiencias de email basadas en investigación de usuario y testing A/B sobre 3 segmentos, alcanzando 28% de apertura (+11pp vs baseline).&quot;
                  </p>
                </div>
              </div>

              <h2 id="carta">Carta de presentación complementaria</h2>
              <p>
                En cambio de carrera, la carta de presentación deja de ser opcional — es donde explicas el <em>por qué</em> del cambio con narrativa. Una página, tres párrafos: <strong>1) por qué este cambio tiene sentido en mi historia, 2) qué traigo del pasado que es valioso para esta industria, 3) por qué esta empresa específica</strong>. Sin dramatismo, sin disculpas.
              </p>

              <h2 id="educacion">Educación complementaria, cursos y certificaciones</h2>
              <p>
                Si tomaste un bootcamp, máster, certificación profesional o cursos serios para preparar el cambio, deben aparecer <strong>arriba en el CV</strong>, no enterrados al final. Crean credibilidad: muestran que el cambio no es impulso, sino preparación. Lista nombre, institución, fecha, y proyecto final o entregable concreto cuando aplique.
              </p>

              <h2 id="ejemplos">4 ejemplos antes/después por escenario</h2>
              <div className="not-prose space-y-4 my-8">
                <div className="rounded-2xl border border-[#00D4FF]/20 bg-[#00D4FF]/5 p-5">
                  <p className="text-xs font-semibold uppercase tracking-widest text-[#00D4FF] mb-2 flex items-center gap-2"><ArrowRightLeft className="h-3.5 w-3.5" />De Marketing a UX Design</p>
                  <p className="text-sm text-[#1a2e4a]/85 leading-relaxed">
                    <strong>Estrategia:</strong> certificación Google UX Design + 3 proyectos freelance documentados con case study (research, wireframes, prototipos en Figma). Objetivo profesional enfatizando investigación de usuario. Bullets de roles previos reescritos para destacar testing, análisis de comportamiento y data-driven decisions.
                  </p>
                </div>
                <div className="rounded-2xl border border-[#00D4FF]/20 bg-[#00D4FF]/5 p-5">
                  <p className="text-xs font-semibold uppercase tracking-widest text-[#00D4FF] mb-2 flex items-center gap-2"><ArrowRightLeft className="h-3.5 w-3.5" />De Docente a Corporate Trainer</p>
                  <p className="text-sm text-[#1a2e4a]/85 leading-relaxed">
                    <strong>Estrategia:</strong> reposicionar &quot;diseño de clases&quot; como &quot;diseño instruccional&quot;, &quot;evaluación de alumnos&quot; como &quot;medición de aprendizaje&quot;, &quot;gestión de aula&quot; como &quot;facilitación de grupos&quot;. Agregar certificación en diseño instruccional corporativo o LMS empresariales (Cornerstone, Docebo). Bullets cuantificados (X programas diseñados, Y empleados capacitados).
                  </p>
                </div>
                <div className="rounded-2xl border border-[#00D4FF]/20 bg-[#00D4FF]/5 p-5">
                  <p className="text-xs font-semibold uppercase tracking-widest text-[#00D4FF] mb-2 flex items-center gap-2"><ArrowRightLeft className="h-3.5 w-3.5" />De Ingeniería a Consultoría</p>
                  <p className="text-sm text-[#1a2e4a]/85 leading-relaxed">
                    <strong>Estrategia:</strong> traducir proyectos técnicos a marco de impacto de negocio (&quot;optimización X que ahorró USD Y al año&quot;). Destacar liderazgo de equipos multidisciplinarios y comunicación con stakeholders no-técnicos. Casos de pro-bono o consultoría freelance complementan. MBA o curso de Strategy & Business Frameworks acelera el cambio.
                  </p>
                </div>
                <div className="rounded-2xl border border-[#00D4FF]/20 bg-[#00D4FF]/5 p-5">
                  <p className="text-xs font-semibold uppercase tracking-widest text-[#00D4FF] mb-2 flex items-center gap-2"><ArrowRightLeft className="h-3.5 w-3.5" />De Finanzas a Tech (Data Analyst)</p>
                  <p className="text-sm text-[#1a2e4a]/85 leading-relaxed">
                    <strong>Estrategia:</strong> aprovechar Excel avanzado y modelado financiero como base — luego agregar SQL, Python, Tableau/Power BI vía certificaciones (Google Data Analytics, IBM Data Science). Proyectos personales en Kaggle o GitHub. Objetivo profesional enfatiza el puente: &quot;analista financiero con pensamiento cuantitativo, ahora certificada en SQL y Python&quot;.
                  </p>
                </div>
              </div>

              <div className="not-prose rounded-2xl border border-amber-200 bg-amber-50/50 p-5 sm:p-6 my-8 flex gap-4">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-[#1a2e4a] text-sm sm:text-base mb-1.5">Valida tu CV contra ofertas de la nueva industria</p>
                  <p className="text-sm text-[#1a2e4a]/80 leading-relaxed">
                    Antes de postular, pasa tu CV reformulado por el <Link href={`/${locale}/tools/ats-checker`}>ATS Checker de ReadyCV</Link> con ofertas reales del sector destino. Si el match es bajo, el problema no es tu experiencia — es que los keywords del nuevo sector no aparecen aún. Empieza desde una <Link href={`/${locale}/templates`}>plantilla combinada ATS-verificada</Link> diseñada para cambios de carrera.
                  </p>
                </div>
              </div>

              <h2 id="errores">Errores comunes en CV de cambio de carrera</h2>
              <div className="not-prose space-y-3 my-8">
                {[
                  { title: "Esconder años de experiencia previa", text: "Genera huecos en fechas que el ATS detecta. Mejor visible y reformulado que oculto." },
                  { title: "Vocabulario de la industria anterior", text: "Usar términos del sector previo desconecta al reclutador de la nueva industria. Adopta el idioma del destino." },
                  { title: "Disculparse en el objetivo", text: "&apos;Dispuesto a aprender desde cero&apos; te posiciona como junior sin razón. Eres senior en habilidades transferibles." },
                  { title: "CV demasiado largo intentando justificar todo", text: "Dos páginas máximo. La narrativa larga va en la carta de presentación, no en el CV." },
                  { title: "Omitir certificaciones del nuevo campo", text: "Tu MBA, bootcamp o certificación es la prueba de compromiso con el cambio. Va arriba, no al final." },
                  { title: "No personalizar por oferta", text: "Cada postulación es distinta. Adapta objetivo y bullets transferibles al lenguaje específico de cada vacante." },
                ].map(({ title, text }, i) => (
                  <div key={i} className="flex gap-4 rounded-2xl border border-rose-100 bg-rose-50/40 p-4 sm:p-5">
                    <XCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-[#1a2e4a] text-sm sm:text-base mb-1" dangerouslySetInnerHTML={{ __html: title.replace(/&apos;/g, "&#39;") }} />
                      <p className="text-sm text-[#1a2e4a]/75 leading-relaxed">{text}</p>
                    </div>
                  </div>
                ))}
              </div>

              <h2 id="entrevista">Tips para entrevistas post-cambio</h2>
              <ul>
                <li><strong>Domina la narrativa del cambio en 60 segundos.</strong> Práctica el &quot;por qué cambias&quot; hasta que sea claro y sin pausas.</li>
                <li><strong>Anticipa la pregunta de salario.</strong> Investiga el rango entry-mid de la nueva industria — calcúlalo con la <Link href={`/${locale}/tools/salary-calculator`}>calculadora de salario</Link>.</li>
                <li><strong>Lleva 1-2 proyectos demostrables.</strong> Un repo, un portfolio, un caso freelance — algo concreto que ya hiciste en la nueva área.</li>
                <li><strong>Conecta cada respuesta a la nueva industria.</strong> Aun preguntas sobre el pasado deben terminar con el puente a la oportunidad actual.</li>
              </ul>

              <div className="not-prose grid sm:grid-cols-3 gap-4 my-8">
                {[
                  { icon: CheckCircle2, title: "Formato combinado siempre", text: "Skills arriba + cronología abajo. Es el formato diseñado para tu situación." },
                  { icon: Sparkles, title: "Traduce, no escondas", text: "Mismo pasado, vocabulario nuevo. Esa es la jugada." },
                  { icon: CheckCircle2, title: "Certificaciones visibles", text: "Tu compromiso documentado con el cambio gana credibilidad rápido." },
                ].map(({ icon: Icon, title, text }, i) => (
                  <div key={i} className="rounded-2xl border border-emerald-100 bg-emerald-50/30 p-5">
                    <Icon className="h-5 w-5 mb-3 text-emerald-600" />
                    <p className="font-semibold text-[#1a2e4a] text-sm mb-1.5">{title}</p>
                    <p className="text-sm text-[#1a2e4a]/75 leading-relaxed">{text}</p>
                  </div>
                ))}
              </div>

              <p>
                Un cambio de carrera bien ejecutado no se nota porque parezca obvio — se nota porque, después de leerlo, el reclutador piensa <em>&quot;esta persona ya empezó la transición, no está pidiéndome que apueste a ciegas&quot;</em>. Esa percepción se construye en cada bloque del CV. Reformula, no escondas. Demuestra, no prometas.
              </p>
            </BlogProse>

            <div className="mt-16">
              <BlogFAQ items={faqs} title="Preguntas frecuentes" />
            </div>

            <div className="mt-16">
              <BlogCTA
                locale={locale}
                title="Construye tu CV de cambio de carrera con estrategia."
                description="ReadyCV PRO incluye plantillas combinadas (skills arriba + cronología abajo) específicas para cambio de carrera, AI que reformula tus bullets al vocabulario del nuevo sector y validación ATS contra ofertas reales. Empieza en menos de dos minutos."
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

import Link from "next/link"
import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { notFound } from "next/navigation"
import { CheckCircle2, XCircle, Target, Clock, AlertTriangle } from "lucide-react"

import BlogArticle from "@/components/blog/BlogArticle"
import BlogHero from "@/components/blog/BlogHero"
import BlogTableOfContents from "@/components/blog/BlogTableOfContents"
import BlogProse from "@/components/blog/BlogProse"
import BlogFAQ from "@/components/blog/BlogFAQ"
import BlogCTA from "@/components/blog/BlogCTA"
import BlogAtsPreview from "@/components/blog/BlogAtsPreview"
import BlogRelatedPosts from "@/components/blog/BlogRelatedPosts"
import BlogSchemas from "@/components/blog/BlogSchemas"

const SLUG = "adaptar-cv-oferta-trabajo"
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
  const t = await getTranslations({ locale, namespace: "metadata.blog_adaptar_cv" })
  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: `https://www.valhallaresume.com/${locale}/blog/${SLUG}`,
      languages: {
        es: `https://www.valhallaresume.com/es/blog/${SLUG}`,
        en: `https://www.valhallaresume.com/en/blog/how-to-tailor-resume`,
        "x-default": `https://www.valhallaresume.com/en/blog/how-to-tailor-resume`,
      },
    },
    openGraph: {
      title: t("title"),
      description: t("description"),
      type: "article",
      url: `https://www.valhallaresume.com/${locale}/blog/${SLUG}`,
      images: [{ url: "https://www.valhallaresume.com/og-image.png", width: 1200, height: 630 }],
      publishedTime: DATE_PUBLISHED,
      modifiedTime: DATE_MODIFIED,
      authors: ["Valhalla Resume Team"],
      locale: "es_ES",
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
      images: ["https://www.valhallaresume.com/og-image.png"],
    },
  }
}

export default async function AdaptarCvPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  if (locale !== LOCALE_TARGET) notFound()

  const tBlog = await getTranslations("blog")

  const TITLE = "Cómo Adaptar tu CV a Cada Oferta de Trabajo (Guía Paso a Paso 2026)"
  const SUBTITLE =
    "Los CVs adaptados generan aproximadamente 40% más entrevistas que los genéricos. Aquí está el proceso de 6 pasos para personalizar tu CV por oferta en 15-30 minutos — con un ejemplo trabajado que muestra 3 versiones desde una base."
  const TAG = "Estrategia CV"

  const toc = [
    { id: "por-que", label: "Por qué adaptar marca la diferencia" },
    { id: "generico-vs-adaptado", label: "Genérico vs adaptado — comparativa" },
    { id: "paso1", label: "Paso 1: Descifra la oferta" },
    { id: "paso2", label: "Paso 2: Mapea keywords al CV" },
    { id: "paso3", label: "Paso 3: Reescribe el resumen por oferta" },
    { id: "paso4", label: "Paso 4: Reordena los bullets de experiencia" },
    { id: "paso5", label: "Paso 5: Ajusta la sección de habilidades" },
    { id: "paso6", label: "Paso 6: Incorpora señales de fit con la empresa" },
    { id: "ejemplo", label: "Ejemplo: un CV, 3 versiones adaptadas" },
    { id: "tiempo", label: "¿Cuánto debería tomar?" },
    { id: "herramientas", label: "Herramientas que aceleran la adaptación" },
    { id: "errores", label: "Errores a evitar al adaptar" },
    { id: "faq", label: "Preguntas frecuentes" },
  ]

  const faqs = [
    {
      q: "¿Realmente necesito adaptar el CV para cada postulación?",
      a: "Para roles que genuinamente quieres, sí. Para postulaciones de alto volumen (50+ por semana en búsqueda activa), adapta a fondo tus top 10 objetivos y usa una base fuerte para el resto. La diferencia en hit rate es lo suficientemente grande como para que 20 minutos de adaptación consistentemente venzan a enviar 5 versiones genéricas.",
    },
    {
      q: "¿Puedo solo cambiar el resumen y dejar todo lo demás igual?",
      a: "No. El resumen es el cambio más visible pero el menos impactante para el scoring ATS. La sección de habilidades y los top 3 bullets de tu rol más reciente son los que generan la mayor densidad de keywords — adáptalos antes que nada.",
    },
    {
      q: "¿Es deshonesto reescribir el mismo logro de formas distintas para distintas ofertas?",
      a: "Para nada. El logro de fondo no cambia — estás destacando la faceta más relevante para cada rol. Un bullet sobre &quot;optimicé el flujo de onboarding&quot; puede enmarcarse como investigación de usuario para un rol UX y como análisis de datos para un rol de analytics. Ambos son ciertos.",
    },
    {
      q: "¿Cómo adapto si la oferta es vaga o muy corta?",
      a: "Mira 3-5 ofertas similares de otras empresas para el mismo cargo. Extrae el vocabulario común entre todas — ese es el verdadero set de keywords del rol, independiente de lo que una empresa específica escribió. La oferta vaga es la excepción, no la señal.",
    },
    {
      q: "¿Qué hago si la oferta pide habilidades que no tengo?",
      a: "Incluye las habilidades que sí tienes y son adyacentes o transferibles, y aborda el gap en la carta de presentación, no en el CV. El CV es posicionamiento; la carta es donde manejas la objeción &quot;pero no tienes X&quot; de forma proactiva.",
    },
    {
      q: "¿Puede la IA adaptar mi CV sin que pierda mi voz?",
      a: "Las buenas herramientas de IA pueden adaptar keywords, reordenar y ajustar — pero siempre deberías hacer la lectura final por el tono. Los bullets generados por IA suelen llevar &quot;lideré&quot; y &quot;optimicé&quot; en cada bullet, lo que se vuelve un delator. Que la IA proponga y tú edita por voz.",
    },
  ]

  const relatedItems = [
    { slug: "habilidades-para-cv", title: "Habilidades para CV: 200+ Skills por Industria", desc: "200+ habilidades por industria — el insumo para la sección de habilidades adaptada.", tag: "Habilidades CV", readingTime: 11 },
    { slug: "verbos-de-accion-cv", title: "300+ Verbos de Acción para tu Currículum", desc: "Los verbos para reescribir bullets por oferta, organizados por categoría.", tag: "Redacción CV", readingTime: 9 },
    { slug: "errores-comunes-cv", title: "15 Errores Comunes en el Currículum", desc: "Los 15 errores ranqueados — &apos;CV genérico&apos; ocupa el puesto #2.", tag: "Errores CV", readingTime: 9 },
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
        keywords={["adaptar cv oferta", "personalizar cv", "cv personalizado", "adaptar curriculum", "tailor cv español"]}
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
                Enviar el mismo CV a cada rol es apostar a que el recruiter haga la traducción por ti. No la va a hacer. Una sola vacante puede recibir más de 2.000 candidaturas en días, y la mayoría de los recruiters las revisan por orden de llegada y paran cuando ya tienen buenos perfiles — así que cuando abren el tuyo, tiene segundos para demostrar que encaja con ESTA oferta, no con cualquiera.
              </p>
              <p>
                Esta guía recorre el proceso de seis pasos que usan los redactores profesionales de CV, condensado en una rutina que puedes ejecutar en 15-30 minutos por oferta. Al final tendrás un CV base más un workflow repetible para adaptarlo por rol — sin reescribir desde cero.
              </p>

              <div className="not-prose my-10">
                <BlogTableOfContents items={toc} title="En esta página" />
              </div>

              <h2 id="por-que">Por qué adaptar marca la diferencia</h2>
              <p>
                Datos de la industria de los principales vendors ATS (Workday, Greenhouse, Lever) muestran consistentemente que los CVs con keyword match superior al 70% reciben contacto del reclutador a aproximadamente 2.5x la tasa de los que están bajo 50%. La matemática no es sutil. Adaptar es la actividad de mayor ROI en la búsqueda laboral — más alta que elegir la plantilla correcta, más alta que la carta de presentación, más alta que el networking en la mayoría de los casos.
              </p>

              <h2 id="generico-vs-adaptado">Genérico vs adaptado — comparativa</h2>
              <div className="not-prose my-6 overflow-x-auto rounded-2xl border border-[#1a2e4a]/10">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#1a2e4a] text-white">
                      <th className="px-4 py-3 text-left font-semibold">Dimensión</th>
                      <th className="px-4 py-3 text-left font-semibold">CV genérico</th>
                      <th className="px-4 py-3 text-left font-semibold">CV adaptado</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {[
                      ["Palabras que usó la oferta", "Las que tu CV dijera por casualidad", "Los términos de la oferta, donde sean ciertos"],
                      ["Resumen profesional", "Mismo párrafo para cada oferta", "Reescrito por enfoque del rol"],
                      ["Sección de habilidades", "Mismo listado siempre", "Top 8-10 priorizadas según la oferta"],
                      ["Bullets principales", "Orden fijo", "Reordenados para abrir con logros relevantes"],
                      ["Tiempo del reclutador para ver fit", "8-12 segundos (suele fallar)", "3-5 segundos (fit obvio)"],
                      ["Tasa de entrevista (promedio sector)", "~3-5% de postulaciones", "~10-15% de postulaciones"],
                      ["Tiempo por postulación", "2 minutos (enviar y olvidar)", "15-30 minutos (engagement real)"],
                    ].map(([k, g, t], i) => (
                      <tr key={i} className={i % 2 === 1 ? "bg-[#00D4FF]/5 border-b border-[#1a2e4a]/10" : "border-b border-[#1a2e4a]/10"}>
                        <td className="px-4 py-3 font-semibold text-[#1a2e4a]">{k}</td>
                        <td className="px-4 py-3 text-[#1a2e4a]/80">{g}</td>
                        <td className="px-4 py-3 text-[#1a2e4a]/80">{t}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h2 id="paso1">Paso 1: Descifra la oferta</h2>
              <p>
                Abre la oferta y crea una nota de 4 columnas: <strong>requisitos duros</strong> (habilidades, años, certificaciones obligatorias), <strong>deseables</strong> (preferentes pero no obligatorios), <strong>habilidades blandas</strong> (comunicación, liderazgo, ownership) y <strong>valores / cultura de la empresa</strong>. La mayoría de las ofertas telegrafían esto en secciones distintas — &quot;Requisitos,&quot; &quot;Plus,&quot; &quot;Lo que aportas,&quot; &quot;Sobre nosotros.&quot;
              </p>
              <p>Dedica 5 minutos a este paso. Define todo lo que viene después.</p>

              <h2 id="paso2">Paso 2: Mapea keywords al CV</h2>
              <p>
                Extrae los 10-15 sustantivos y verbos más repetidos de la oferta — esos son tus keywords objetivo. Compara contra tu CV actual:
              </p>
              <ul>
                <li><strong>Ya presentes.</strong> Confirma que aparezcan al menos una vez textualmente. Negrita solo si la oferta misma los pone en negrita.</li>
                <li><strong>Faltantes pero aplicables.</strong> Agrega a tu sección de habilidades primero, luego entrelázalos en al menos un bullet.</li>
                <li><strong>Faltantes y no aplicables.</strong> Déjalos fuera — nunca fabriques.</li>
              </ul>
              <p>
                No hay un porcentaje objetivo, y quien te dé uno se lo inventó. Usa las palabras de la oferta donde describan trabajo que de verdad hiciste, y para ahí. Un recruiter detecta un CV relleno al instante, y una lista de keywords sin un logro detrás falla la única prueba que importa: la persona que lo lee.
              </p>

              <h2 id="paso3">Paso 3: Reescribe el resumen profesional por oferta</h2>
              <p>
                El resumen profesional es tu oportunidad de adaptación de mayor visibilidad. Actualiza tres cosas cada vez:
              </p>
              <ol>
                <li><strong>El nombre del rol.</strong> &quot;Diseñador de Producto Senior&quot; vs &quot;Lead UX Designer&quot; — usa el lenguaje exacto del título.</li>
                <li><strong>Los top 2 diferenciadores.</strong> Elige los logros más relevantes para <em>esta</em> oferta, no el highlight reel de tu carrera.</li>
                <li><strong>El vocabulario.</strong> Usa los términos específicos de la oferta: si dicen &quot;design systems,&quot; no &quot;librería de componentes,&quot; refleja ese término.</li>
              </ol>

              <h2 id="paso4">Paso 4: Reordena los bullets de experiencia</h2>
              <p>
                Dentro de cada rol, el orden de los bullets importa más de lo que los reclutadores admiten. El primer bullet de tu rol más reciente es la segunda área de mayor atención de la página (después del resumen). Pon tu <strong>logro más relevante a la oferta primero</strong> en cada rol, aunque cronológicamente no fuera lo más reciente dentro del rol.
              </p>
              <p>
                No necesitas reescribir los bullets — solo reordenarlos. Reserva reescrituras completas para los top 3 bullets donde reordenar solo no alcance.
              </p>

              <h2 id="paso5">Paso 5: Ajusta la sección de habilidades</h2>
              <p>
                Tu sección de habilidades es la zona individual de mayor impacto en scoring ATS de todo el CV. Los parsers ATS le dan peso porque estructuralmente es fácil de extraer. Dos reglas:
              </p>
              <ul>
                <li><strong>Top 8-10 habilidades priorizadas a la oferta.</strong> Si la oferta abre con &quot;Python, SQL, Tableau&quot; — esas son tus primeras tres, aunque normalmente abrirías con otra cosa.</li>
                <li><strong>Match exacto en redacción.</strong> Si la oferta dice &quot;JavaScript (ES6+),&quot; no escribas &quot;JS&quot; o &quot;ES6.&quot; Match textual.</li>
              </ul>

              <h2 id="paso6">Paso 6: Incorpora señales de fit con la empresa</h2>
              <p>
                El último 10% de la adaptación es la capa cultural — las señales que dicen &quot;leí el &lsquo;Sobre nosotros.&rsquo;&quot; Inserta una o dos referencias específicas en tu resumen o en tu bullet más fuerte:
              </p>
              <ul>
                <li><strong>Alineación con la misión.</strong> Si destacan accesibilidad, tu trabajo relevante en accesibilidad va en la mitad superior.</li>
                <li><strong>Contexto de industria.</strong> Si has trabajado en su vertical (fintech, salud, edtech), nómbralo explícitamente.</li>
                <li><strong>Señales de escala.</strong> Ajusta al stage de la empresa — las startups quieren vocabulario de builder, las empresas grandes quieren vocabulario de governance.</li>
              </ul>

              <h2 id="ejemplo">Ejemplo: un CV, 3 versiones adaptadas</h2>
              <p>
                Mismo candidato — un diseñador de producto con 6 años de experiencia — tres postulaciones distintas, tres resúmenes adaptados distintos. Nota que los logros son los mismos pero el framing cambia.
              </p>
              <div className="not-prose my-6 overflow-x-auto rounded-2xl border border-[#1a2e4a]/10">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#1a2e4a] text-white">
                      <th className="px-4 py-3 text-left font-semibold">Rol objetivo</th>
                      <th className="px-4 py-3 text-left font-semibold">Apertura del resumen</th>
                      <th className="px-4 py-3 text-left font-semibold">Top 3 habilidades</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {[
                      ["UX Designer Senior en startup fintech", "Diseñador de producto con 6 años construyendo productos fintech consumer-facing, lideré 3 lanzamientos zero-to-one y un aumento del 38% en activación.", "User research · Figma · Design systems"],
                      ["Lead Product Designer en scale-up de salud", "Diseñador de producto con 6 años escalando interfaces en industria regulada, lideré un design system HIPAA-compliant usado por 4 equipos de producto.", "Design systems · Accesibilidad (WCAG 2.2) · Liderazgo cross-funcional"],
                      ["UX Researcher en SaaS empresarial", "Diseñador de producto con 6 años integrando research en decisiones de producto, dirigí 80+ estudios moderados que reorganizaron la roadmap.", "User research · Análisis cualitativo · Comunicación con stakeholders"],
                    ].map(([t, s, k], i) => (
                      <tr key={i} className={i % 2 === 1 ? "bg-[#00D4FF]/5 border-b border-[#1a2e4a]/10" : "border-b border-[#1a2e4a]/10"}>
                        <td className="px-4 py-3 font-semibold text-[#1a2e4a]">{t}</td>
                        <td className="px-4 py-3 text-[#1a2e4a]/80 italic">{s}</td>
                        <td className="px-4 py-3 text-[#1a2e4a]/80">{k}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h2 id="tiempo">¿Cuánto debería tomar?</h2>
              <div className="not-prose my-6 grid sm:grid-cols-3 gap-4">
                {[
                  { icon: Clock, title: "15 minutos (mínimo)", text: "Reescritura de resumen + reorden de habilidades + pasada de keywords sobre los top 3 bullets del rol más reciente." },
                  { icon: Clock, title: "20-25 minutos (recomendado)", text: "Mapeo completo de keywords + reorden de bullets en los top 2 roles + 1 referencia cultural." },
                  { icon: Clock, title: "30 minutos (rol de alto impacto)", text: "Lo anterior + 2-3 reescrituras de bullet + validación con ATS Checker + lectura final por voz." },
                ].map(({ icon: Icon, title, text }, i) => (
                  <div key={i} className="rounded-2xl border border-[#1a2e4a]/10 bg-white p-5">
                    <Icon className="h-5 w-5 mb-3 text-[#00D4FF]" />
                    <p className="font-semibold text-[#1a2e4a] text-sm mb-1.5">{title}</p>
                    <p className="text-sm text-[#1a2e4a]/75 leading-relaxed">{text}</p>
                  </div>
                ))}
              </div>

              <h2 id="herramientas">Herramientas que aceleran la adaptación</h2>
              <div className="not-prose rounded-2xl border border-amber-200 bg-amber-50/50 p-5 sm:p-6 my-8 flex gap-4">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-[#1a2e4a] text-sm sm:text-base mb-1.5">Reduce el tiempo de adaptación a la mitad con las herramientas correctas</p>
                  <p className="text-sm text-[#1a2e4a]/80 leading-relaxed">
                    Con el <Link href={`/${locale}/tools/ats-checker`}>puntaje ATS de Valhalla Resume PRO</Link> ves qué keywords te faltan y dónde hay gaps de densidad frente a la oferta. La función <strong>tailor-cv</strong> de Valhalla Resume PRO lee la oferta, sugiere reorden de habilidades y reescritura de bullets, y produce una versión adaptada sobre cualquiera de las <Link href={`/${locale}/templates`}>143 plantillas ATS-verificadas</Link> — todo en menos de tres minutos por oferta.
                  </p>
                </div>
              </div>

              <h2 id="errores">Errores a evitar al adaptar</h2>
              <div className="not-prose space-y-3 my-8">
                {[
                  { title: "Overfitting a una sola oferta", text: "Algunos candidatos reescriben tanto que el CV solo funciona para un rol. Mantén una base sólida — adapta encima, no reemplaces." },
                  { title: "Keyword stuffing", text: "Repetir la misma keyword 6 veces para gamear el ATS dispara sospecha humana y deduplicación de los ATS modernos. Usa cada keyword 1-3 veces en colocación natural." },
                  { title: "Perder tu voz", text: "Reflejar el vocabulario de la oferta es bueno; sonar como si la oferta hubiera escrito tu CV es malo. Mantén tu framing de logros, tus verbos, tu tono." },
                  { title: "Saltarte la carta de presentación", text: "Adaptar el CV es necesario pero no suficiente. La carta cubre los gaps y el &apos;por qué esta empresa.&apos; Adapta las dos o desperdicias la palanca." },
                  { title: "Olvidar guardar versiones", text: "Después de 20 postulaciones perderás el track de qué enviaste dónde. Guarda cada versión como &quot;NombreApellido_NombreEmpresa_CV.pdf&quot; para preparación de entrevista." },
                ].map(({ title, text }, i) => (
                  <div key={i} className="flex gap-4 rounded-2xl border border-rose-100 bg-rose-50/40 p-4 sm:p-5">
                    <XCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-[#1a2e4a] text-sm sm:text-base mb-1">{title}</p>
                      <p className="text-sm text-[#1a2e4a]/75 leading-relaxed" dangerouslySetInnerHTML={{ __html: text.replace(/&apos;/g, "&#39;") }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="not-prose grid sm:grid-cols-3 gap-4 my-8">
                {[
                  { icon: Target, title: "Descifra antes de editar", text: "Los primeros 5 minutos en la oferta determinan los siguientes 25." },
                  { icon: CheckCircle2, title: "Habilidades son mayor palanca", text: "Reordena tu sección de habilidades primero — es la sección favorita del ATS." },
                  { icon: Clock, title: "Pon timebox por rol", text: "20-30 minutos por postulación de alto impacto. Cap firme." },
                ].map(({ icon: Icon, title, text }, i) => (
                  <div key={i} className="rounded-2xl border border-emerald-100 bg-emerald-50/30 p-5">
                    <Icon className="h-5 w-5 mb-3 text-emerald-600" />
                    <p className="font-semibold text-[#1a2e4a] text-sm mb-1.5">{title}</p>
                    <p className="text-sm text-[#1a2e4a]/75 leading-relaxed">{text}</p>
                  </div>
                ))}
              </div>

              <p>
                Adaptar es la hora de mayor ROI que invertirás en tu búsqueda. Veinte minutos por postulación, seis pasos, repetidos como hábito — y las respuestas del reclutador se acumulan. Elige cinco roles que realmente quieras, corre el proceso para cada uno, y vas a superar a candidatos que enviaron quinientos CVs genéricos la misma semana.
              </p>
            </BlogProse>

            <div className="mt-16">
              <BlogFAQ items={faqs} title="Preguntas frecuentes" />
            </div>

            <div className="mt-16">
              <BlogAtsPreview locale={locale} variant="frontend" />

              <BlogCTA
                locale={locale}
                title="Adapta tu CV en 3 minutos, no en 30."
                description="La función tailor-cv de Valhalla Resume PRO lee la oferta de trabajo, reordena tus habilidades y bullets, corre el chequeo ATS y produce un CV adaptado sobre cualquiera de 143 plantillas ATS-verificadas — todo en menos de tres minutos por postulación."
                buttonLabel="Empezar con Valhalla Resume PRO"
                hint="$15/mes o $99/año · 7 herramientas con IA · Cancela cuando quieras"
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

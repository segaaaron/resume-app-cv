import Link from "next/link"
import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { notFound } from "next/navigation"
import { CheckCircle2, XCircle, Target, Sparkles, AlertTriangle } from "lucide-react"

import BlogArticle from "@/components/blog/BlogArticle"
import BlogHero from "@/components/blog/BlogHero"
import BlogTableOfContents from "@/components/blog/BlogTableOfContents"
import BlogProse from "@/components/blog/BlogProse"
import BlogFAQ from "@/components/blog/BlogFAQ"
import BlogCTA from "@/components/blog/BlogCTA"
import BlogRelatedPosts from "@/components/blog/BlogRelatedPosts"
import BlogSchemas from "@/components/blog/BlogSchemas"

const SLUG = "objetivo-profesional-ejemplos"
const DATE_PUBLISHED = "2026-06-01"
const DATE_MODIFIED = "2026-06-01"
const READING_TIME = 10
const LOCALE_TARGET = "es"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "metadata.blog_objetivo_profesional" })
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

export default async function ObjetivoProfesionalPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  if (locale !== LOCALE_TARGET) notFound()

  const tBlog = await getTranslations("blog")

  const TITLE = "50 Ejemplos de Objetivo Profesional para CV (Guía 2026)"
  const SUBTITLE =
    "El objetivo profesional bien escrito es lo que diferencia un CV que pasa los primeros 7 segundos del que se descarta. Aquí están los 50 ejemplos por categoría, la fórmula que sí funciona y los errores que delatan inexperiencia."
  const TAG = "Objetivo Profesional"

  const toc = [
    { id: "que-es", label: "Qué es un objetivo profesional (y qué no es)" },
    { id: "objetivo-vs-resumen", label: "Objetivo vs resumen profesional: cuándo usar cada uno" },
    { id: "formula", label: "La fórmula de 3 líneas que sí funciona" },
    { id: "ejemplos-egresados", label: "10 ejemplos para recién egresados / estudiantes" },
    { id: "ejemplos-cambio", label: "8 ejemplos para cambio de carrera" },
    { id: "ejemplos-sin-exp", label: "8 ejemplos sin experiencia / primer empleo" },
    { id: "ejemplos-con-exp", label: "10 ejemplos para profesionales con experiencia" },
    { id: "ejemplos-industria", label: "14 ejemplos por industria" },
    { id: "errores", label: "6 errores que matan tu objetivo profesional" },
    { id: "faq", label: "Preguntas frecuentes" },
  ]

  const faqs = [
    {
      q: "¿Es obligatorio incluir un objetivo profesional en el CV?",
      a: "No es obligatorio, pero es recomendable si tienes menos de 3 años de experiencia, estás cambiando de carrera o no tienes experiencia laboral todavía. Si tienes trayectoria establecida, conviene reemplazarlo por un Resumen Profesional, que pone el foco en logros en lugar de aspiraciones.",
    },
    {
      q: "¿Cuál es la diferencia real entre objetivo profesional y resumen profesional?",
      a: "El objetivo dice qué quieres tú (qué buscas, hacia dónde te diriges). El resumen dice qué le aportas tú al empleador (qué has logrado, qué experiencia traes). Los reclutadores prefieren el resumen porque les habla de valor; el objetivo solo se usa cuando no tienes evidencia de logros que mostrar todavía.",
    },
    {
      q: "¿Cuántas líneas debe tener mi objetivo profesional?",
      a: "Tres líneas o aproximadamente 40-60 palabras. Si lo extiendes más, el reclutador deja de leer; si es más corto, suena genérico y sin sustancia. Cada palabra debe aportar — no hay espacio para muletillas como 'persona proactiva y dinámica'.",
    },
    {
      q: "¿Puedo usar el mismo objetivo profesional para todas las ofertas?",
      a: "Técnicamente sí, estratégicamente no. Cambia 2-3 keywords del objetivo por cada oferta que aplicas — los términos que la propia oferta repite. Te toma 90 segundos y aproximadamente duplica tu match en sistemas ATS. El ATS Checker de ReadyCV te muestra exactamente qué cambiar.",
    },
    {
      q: "¿Es buena idea mencionar la empresa específica en mi objetivo?",
      a: "Solo si la candidatura es realmente importante para ti y vas a personalizar todo el CV. Mencionar 'Busco aportar mis habilidades en [Empresa X]' funciona si está hecho con cuidado y solo en esa postulación. Hacerlo a medias se nota como copy-paste y juega en tu contra.",
    },
    {
      q: "¿Cómo lo redacto si todavía no tengo experiencia laboral?",
      a: "Enfócate en tu formación, proyectos académicos, prácticas, voluntariado y habilidades técnicas adquiridas. Ejemplo: 'Estudiante de último año de Ingeniería de Software con dos proyectos en producción y prácticas en empresa fintech. Busco mi primer rol full-time en desarrollo backend para aportar mis bases en Python y SQL.' Concreto, honesto, sin inventar.",
    },
  ]

  const relatedItems = [
    {
      slug: "cv-en-ingles",
      title: "CV en Inglés: Guía Paso a Paso con Ejemplos",
      desc: "El formato real que usan en USA, UK y multinacionales. Estructura, vocabulario por sector y errores típicos.",
      tag: "CV Internacional",
      readingTime: 10,
    },
    {
      slug: "habilidades-para-cv",
      title: "Habilidades para CV: 200+ Skills por Industria",
      desc: "Las habilidades que los reclutadores buscan en 2026, organizadas por sector y nivel.",
      tag: "Habilidades CV",
      readingTime: 11,
    },
    {
      slug: "como-pasar-el-ats",
      title: "Cómo Pasar el Filtro ATS en 2026",
      desc: "Más del 75% de los CVs son rechazados antes de llegar a un humano. Las tácticas que sí funcionan.",
      tag: "ATS",
      readingTime: 7,
    },
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
        keywords={["objetivo profesional ejemplos", "objetivo profesional cv", "objetivo cv ejemplos", "objetivo profesional sin experiencia", "objetivo laboral"]}
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
                El objetivo profesional es el primer bloque de texto que un reclutador lee después de tu nombre. Si está mal escrito, el resto de tu CV ya parte en desventaja. Si está bien escrito, te compra los siguientes 30 segundos de atención — y eso es a menudo todo lo que necesitas para que sigan leyendo hasta tu experiencia y te llamen a entrevista.
              </p>
              <p>
                Esta guía te entrega los 50 ejemplos más prácticos organizados por situación (recién egresado, cambio de carrera, sin experiencia, con trayectoria) y por industria, la fórmula exacta de 3 líneas que funciona en 2026, y los 6 errores que delatan inmediatamente que copiaste el objetivo de una plantilla genérica.
              </p>

              <div className="not-prose my-10">
                <BlogTableOfContents items={toc} title="En esta página" />
              </div>

              <h2 id="que-es">Qué es un objetivo profesional (y qué no es)</h2>
              <p>
                El objetivo profesional es un bloque corto, de 3 líneas o 40-60 palabras, ubicado justo debajo de tus datos de contacto, en el que comunicas tres cosas: <strong>quién eres profesionalmente</strong>, <strong>qué buscas concretamente</strong>, y <strong>qué puedes aportar</strong>. Es el pitch de 30 segundos que ningún reclutador te va a pedir, pero que todos van a leer.
              </p>
              <p>
                Lo que <em>no</em> es: una lista de adjetivos vacíos (&quot;proactivo, comprometido, responsable, con ganas de aprender&quot;), una frase aspiracional sin contenido (&quot;busco un puesto desafiante donde pueda crecer&quot;), o un párrafo biográfico. Esos formatos están obsoletos desde hace al menos diez años. Si tu objetivo se parece a eso, estás señalando al reclutador que tu información sobre búsqueda de empleo viene de un PDF descargado en 2014 — antes de que haya leído siquiera tu experiencia.
              </p>

              <h2 id="objetivo-vs-resumen">Objetivo vs resumen profesional: cuándo usar cada uno</h2>

              <div className="not-prose my-6 overflow-x-auto rounded-2xl border border-[#1a2e4a]/10">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#1a2e4a] text-white">
                      <th className="px-4 py-3 text-left font-semibold">Formato</th>
                      <th className="px-4 py-3 text-left font-semibold">Cuándo usar</th>
                      <th className="px-4 py-3 text-left font-semibold">Enfoque</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    <tr className="border-b border-[#1a2e4a]/10">
                      <td className="px-4 py-3 font-semibold text-[#1a2e4a]">Objetivo profesional</td>
                      <td className="px-4 py-3 text-[#1a2e4a]/80">Sin experiencia · Recién egresado · Cambio de carrera</td>
                      <td className="px-4 py-3 text-[#1a2e4a]/80">Lo que buscas + tu potencial</td>
                    </tr>
                    <tr className="border-b border-[#1a2e4a]/10 bg-[#00D4FF]/5">
                      <td className="px-4 py-3 font-semibold text-[#1a2e4a]">Resumen profesional</td>
                      <td className="px-4 py-3 text-[#1a2e4a]/80">Con 2+ años de experiencia en tu sector</td>
                      <td className="px-4 py-3 text-[#1a2e4a]/80">Lo que has logrado + tu propuesta de valor</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-semibold text-[#1a2e4a]">Perfil profesional</td>
                      <td className="px-4 py-3 text-[#1a2e4a]/80">Híbrido — sirve para ambos</td>
                      <td className="px-4 py-3 text-[#1a2e4a]/80">Identidad profesional + qué aportas</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p>
                <strong>Regla práctica:</strong> si tienes 0-2 años de experiencia, usa &quot;Objetivo Profesional&quot;. Si tienes más de 2 años de experiencia relevante, cámbialo por &quot;Resumen Profesional&quot;. Los reclutadores prefieren el resumen porque les habla en términos de valor demostrado, no de aspiraciones. Pero si todavía no tienes logros que mostrar, no te inventes — usa el objetivo con honestidad.
              </p>

              <h2 id="formula">La fórmula de 3 líneas que sí funciona</h2>

              <blockquote>
                <strong>Línea 1:</strong> [Identidad profesional actual] con [formación / años de experiencia / proyectos relevantes].<br />
                <strong>Línea 2:</strong> Busco [rol concreto] en [tipo de empresa / industria] para [aportar X / aplicar Y / desarrollar Z].<br />
                <strong>Línea 3:</strong> Destaco por [2-3 habilidades clave + 1 logro demostrable o credencial].
              </blockquote>

              <p>Rellenada para un perfil junior:</p>

              <blockquote>
                Ingeniero de Software recién egresado de la Universidad de Chile con dos prácticas profesionales en startups SaaS y un proyecto open-source con 320 stars en GitHub. Busco un puesto Junior Backend Developer en empresa tecnológica para aportar mis bases sólidas en Python, PostgreSQL y diseño de APIs REST. Destaco por mi capacidad de autoaprendizaje, trabajo colaborativo en remoto y haber completado las certificaciones AWS Cloud Practitioner y MongoDB Associate Developer.
              </blockquote>

              <h2 id="ejemplos-egresados">10 ejemplos para recién egresados / estudiantes</h2>
              <ol>
                <li><strong>Ingeniería de Software:</strong> Recién egresado de Ingeniería Informática con dos proyectos full-stack publicados y prácticas de 6 meses en empresa fintech. Busco mi primer rol Junior Backend para aportar conocimientos en Node.js, Express y PostgreSQL. Destaco por mi capacidad de aprendizaje rápido y trabajo en metodologías ágiles.</li>
                <li><strong>Administración de Empresas:</strong> Egresado de Administración de Empresas con mención en Finanzas (promedio 8.6/10). Busco rol de Analista Junior en consultoría o banca para aplicar mi formación en modelado financiero y análisis de datos con Excel avanzado y Power BI.</li>
                <li><strong>Marketing Digital:</strong> Comunicador Social recién titulado con dos pasantías en agencia de marketing digital y un proyecto personal de blog con 12K visitas mensuales. Busco rol de Junior Performance Marketer para crecer en pauta digital y SEO.</li>
                <li><strong>Diseño Gráfico:</strong> Diseñador Gráfico recién graduado con portafolio de 14 proyectos reales (marca, web, editorial) y dominio de Figma, Adobe Creative Suite. Busco rol Junior en estudio de diseño o equipo in-house para aportar capacidad de iteración rápida y atención al detalle.</li>
                <li><strong>Ciencias de Datos:</strong> Egresado de Estadística con magíster en Data Science (PUC) y dos proyectos publicados en Kaggle. Busco rol Junior Data Scientist en empresa tecnológica para aplicar mis bases en Python, scikit-learn y SQL avanzado.</li>
                <li><strong>Periodismo:</strong> Periodista titulado con publicaciones en medios universitarios y experiencia en cobertura digital. Busco rol de Redactor Junior en medio digital o área de comunicaciones corporativas para aportar capacidad de redacción rápida y verificación de fuentes.</li>
                <li><strong>Psicología:</strong> Psicólogo recién egresado con práctica clínica de 600 horas y formación en evaluación neuropsicológica. Busco rol de Psicólogo Junior en centro de salud mental o área organizacional para aportar dominio del DSM-5-TR y herramientas de evaluación estandarizadas.</li>
                <li><strong>Derecho:</strong> Abogado recién titulado con mención en Derecho Laboral y práctica profesional de 1 año en estudio jurídico. Busco rol de Abogado Junior en área laboral o corporativa para aportar redacción de escritos, análisis jurisprudencial y gestión de causas.</li>
                <li><strong>Enfermería:</strong> Enfermera recién titulada con internado clínico de 1.080 horas en hospital de alta complejidad (Urgencia y UCI). Busco rol como Enfermera Asistencial para aplicar mis competencias en triaje, manejo de vía venosa y RCP avanzada.</li>
                <li><strong>Educación / Pedagogía:</strong> Profesora de Educación Básica recién titulada con práctica profesional en colegio municipal y experiencia previa como ayudante en aula multigrado. Busco rol de Profesora Junior para aportar planificación basada en estándares y diferenciación curricular.</li>
              </ol>

              <h2 id="ejemplos-cambio">8 ejemplos para cambio de carrera</h2>
              <ol>
                <li><strong>De Ingeniero Civil a Desarrollador:</strong> Ingeniero Civil con 5 años de experiencia en gestión de proyectos, en transición hacia desarrollo de software tras completar bootcamp full-stack de 9 meses y dos proyectos personales en producción. Busco rol Junior Frontend en producto digital.</li>
                <li><strong>De Profesor a Diseñador UX:</strong> Profesor de matemáticas con 7 años de experiencia, certificado en UX Design por Google y portafolio de 4 casos. Busco rol UX Junior en producto SaaS para aportar mi mirada pedagógica al diseño centrado en usuario.</li>
                <li><strong>De Médico a Health Tech:</strong> Médico cirujano con 6 años de experiencia clínica, en transición hacia Health Tech tras formación en Product Management. Busco rol PM Junior en startup de salud digital para aportar visión clínica y entendimiento del flujo hospitalario real.</li>
                <li><strong>De Periodista a Content Marketer:</strong> Periodista digital con 4 años en medios, en transición a marketing de contenidos. Certificada en HubSpot Inbound y SEO. Busco rol Content Marketer en empresa B2B SaaS para aportar capacidad de investigación y redacción optimizada para conversión.</li>
                <li><strong>De Contador a Analista de Datos:</strong> Contador con 8 años en cierre mensual y reporting, en transición a análisis de datos tras magíster en Data Analytics. Busco rol Analista de Datos para aplicar mi entendimiento profundo de procesos financieros más dominio técnico en SQL, Python y Power BI.</li>
                <li><strong>De Militar a Operaciones:</strong> Oficial del Ejército retirado tras 12 años de carrera, en transición al sector privado en gestión de operaciones. Magíster en Supply Chain en curso. Busco rol Jefe de Operaciones para aportar liderazgo de equipos grandes y experiencia en logística compleja.</li>
                <li><strong>De Ventas a Customer Success:</strong> Vendedora B2B con 5 años en ventas consultivas (cumplimiento promedio 132% de cuota), en transición a Customer Success en empresas SaaS. Busco rol CSM para aplicar mi capacidad de relación con clientes a un modelo de retención y expansión.</li>
                <li><strong>De Banca a Producto Fintech:</strong> Analista financiero con 6 años en banca corporativa, transicionando a producto fintech tras formación en Product Management y proyecto personal de robo-advisor. Busco rol APM o PM Junior en fintech.</li>
              </ol>

              <h2 id="ejemplos-sin-exp">8 ejemplos sin experiencia / primer empleo</h2>
              <ol>
                <li><strong>Primer empleo administrativo:</strong> Estudiante de último año de Administración de Empresas con manejo avanzado de Excel, Power Point y experiencia como tesorera del centro de estudiantes. Busco mi primer empleo de medio tiempo en rol administrativo para aportar organización, atención al detalle y disponibilidad inmediata.</li>
                <li><strong>Primer empleo en retail:</strong> Estudiante de bachillerato (último año, promedio 9.2/10) con experiencia como voluntaria en ferias escolares y manejo de atención al público. Busco mi primer empleo de fin de semana en retail para aportar responsabilidad, presentación impecable y orientación al cliente.</li>
                <li><strong>Primer empleo tech:</strong> Estudiante autodidacta de programación con 3 proyectos publicados en GitHub (React + Node) y certificación FreeCodeCamp en Frontend. Sin experiencia laboral formal. Busco mi primera práctica en desarrollo web frontend para aportar bases sólidas en HTML, CSS y JavaScript moderno.</li>
                <li><strong>Primer empleo en marketing:</strong> Estudiante de Comunicación Audiovisual con experiencia gestionando redes sociales del centro de estudiantes (+2.000 seguidores en 8 meses). Busco mi primera práctica en Community Manager o asistente de marketing digital.</li>
                <li><strong>Primer empleo en hostelería:</strong> Estudiante de Gastronomía (segundo año) con curso de manipulación de alimentos vigente. Busco mi primer empleo como ayudante de cocina o runner en restaurante para aportar disciplina, capacidad de aprender bajo presión y disponibilidad de tardes y fines de semana.</li>
                <li><strong>Primer empleo en docencia:</strong> Estudiante de último semestre de Pedagogía en Inglés con nivel C1 certificado (Cambridge Advanced). Busco mi primer empleo como profesora particular o ayudante en academia para aportar manejo del aula, planificación de lecciones y dominio del idioma.</li>
                <li><strong>Primer empleo en salud:</strong> Estudiante de cuarto año de Kinesiología con prácticas hospitalarias de 320 horas. Busco mi primera oportunidad como asistente kinésico en clínica para aportar bases en evaluación funcional, ejercicio terapéutico y atención al paciente.</li>
                <li><strong>Primer empleo en logística:</strong> Estudiante de Ingeniería Industrial (tercer año) con curso de Lean Six Sigma Yellow Belt. Busco mi primera práctica en operaciones o logística para aportar mentalidad analítica, manejo de Excel avanzado y disponibilidad de medio tiempo.</li>
              </ol>

              <h2 id="ejemplos-con-exp">10 ejemplos para profesionales con experiencia</h2>
              <ol>
                <li><strong>Project Manager senior:</strong> Project Manager con 8 años liderando equipos de 12+ personas en proyectos de TI y operaciones. Certificada PMP y Scrum Master (PSM II). Busco rol de Senior PM o Programa Manager en empresa tecnológica para aportar experiencia en escalamiento de proyectos multinacionales.</li>
                <li><strong>Account Executive:</strong> Ejecutiva de cuentas con 6 años en venta consultiva B2B (SaaS y servicios). Cumplimiento promedio 128% de cuota y cierre de mi cuenta más grande por $480K ACV. Busco rol Senior AE en empresa SaaS midmarket o enterprise.</li>
                <li><strong>Backend Senior:</strong> Ingeniero Backend con 7 años en Python y Go, construyendo sistemas distribuidos para fintech y plataformas SaaS. Lideré reducción de latencia p99 en 54% y migración de monolito a microservicios. Busco rol Staff Engineer enfocado en infraestructura.</li>
                <li><strong>Marketing Manager:</strong> Marketing Manager con 5 años escalando adquisición pagada B2B en SaaS LATAM. Reduje CAC blended 38% y dupliqué volumen de MQL en 12 meses. Busco rol de Head of Growth en startup en Serie A o B.</li>
                <li><strong>Product Designer:</strong> Diseñadora de Producto con 6 años, ownership end-to-end de 3 features clave que aumentaron WAU 27%. Manejo de Figma, sistemas de diseño y research mixto. Busco rol Senior Product Designer en SaaS B2B con cultura de diseño madura.</li>
                <li><strong>Data Engineer:</strong> Data Engineer con 5 años construyendo data warehouses sobre Snowflake y dbt. Diseñé arquitectura que sirve 90+ dashboards diarios a 4 áreas distintas. Busco rol Senior Data Engineer en empresa con producto data-intensive.</li>
                <li><strong>Customer Success Manager:</strong> CSM con 4 años de carrera, dueña de portafolio de $4.2M ARR con NRR de 118%. Lideré la implementación de health score que redujo churn en 22%. Busco rol Senior CSM o Team Lead CS en empresa SaaS.</li>
                <li><strong>Talent Acquisition:</strong> Reclutadora técnica con 5 años cerrando posiciones senior de ingeniería en startups y scale-ups. Tasa de aceptación de oferta de 87%. Busco rol Senior Tech Recruiter o Team Lead en empresa producto con foco en perfiles staff y principal.</li>
                <li><strong>FP&amp;A Analyst:</strong> Analista FP&amp;A con 6 años en empresas SaaS y tecnológicas. Lideré la implementación del modelo driver-based adoptado como estándar oficial para 5 unidades de negocio. Busco rol Senior FP&amp;A o Manager.</li>
                <li><strong>Solutions Engineer:</strong> Solutions Engineer con 4 años apoyando deals enterprise (ACV promedio $180K). POCs personalizados convirtieron al 67%. Busco rol Senior SE en plataforma de developer tools o data infrastructure.</li>
              </ol>

              <h2 id="ejemplos-industria">14 ejemplos por industria</h2>

              <h3>Tecnología</h3>
              <ul>
                <li><strong>DevOps:</strong> Ingeniero DevOps con 5 años escalando infraestructura Kubernetes para SaaS de 8 productos. Reduje gasto cloud en USD 480K/año. Busco rol Senior SRE.</li>
                <li><strong>QA:</strong> QA Engineer con 4 años, dueño del framework de automatización en Playwright que cubre 87% de flujos críticos. Busco rol Senior QA o Lead.</li>
              </ul>

              <h3>Salud</h3>
              <ul>
                <li><strong>Médico general:</strong> Médico general con 4 años de experiencia en atención primaria y urgencias rurales. Certificación en RCP avanzada y manejo de paciente crítico. Busco rol en clínica privada o atención cerrada.</li>
                <li><strong>Tecnólogo médico:</strong> Tecnólogo médico mención laboratorio clínico con 3 años en hospital de alta complejidad. Manejo de equipos automatizados y procesamiento de 200+ muestras diarias. Busco rol en laboratorio privado o investigación clínica.</li>
              </ul>

              <h3>Marketing</h3>
              <ul>
                <li><strong>SEO Specialist:</strong> SEO Specialist con 4 años creciendo blogs B2B de 2K a 180K visitas orgánicas mensuales. Manejo de Ahrefs, Semrush, Search Console. Busco rol Senior SEO o Head of Content.</li>
                <li><strong>Email Marketing:</strong> Email Marketing Manager con 3 años en HubSpot y Klaviyo. Diseñé secuencia de nurturing que generó USD 1.2M de pipeline. Busco rol Senior Email Marketer.</li>
              </ul>

              <h3>Finanzas</h3>
              <ul>
                <li><strong>Auditor:</strong> Auditor Senior Big 4 con 4 años en auditoría externa para sector financiero. Manejo de US GAAP, IFRS y normativa SBIF / CNBV. Busco rol Manager o Senior en banca o fintech.</li>
                <li><strong>Tesorero:</strong> Tesorero corporativo con 5 años gestionando flujo de USD 80M anuales. Lideré refinanciación de deuda de USD 12M con tasa preferencial. Busco rol Treasury Manager.</li>
              </ul>

              <h3>Ventas</h3>
              <ul>
                <li><strong>SDR:</strong> SDR con 2 años booking de meetings calificadas — 312 cerradas en último año (top performer de equipo de 18). Busco salto a AE en empresa SaaS.</li>
                <li><strong>Key Account Manager:</strong> KAM con 6 años manejando portafolio retail enterprise (LATAM). Renovación de 92% y cross-sell de USD 2.1M. Busco rol Senior KAM o Director Comercial.</li>
              </ul>

              <h3>Educación</h3>
              <ul>
                <li><strong>Profesora secundaria:</strong> Profesora de Lenguaje con 7 años en colegios particulares subvencionados. Lideré rediseño curricular en mi establecimiento que subió promedio PAES en 28 puntos. Busco rol Jefa de Departamento o Coordinadora UTP.</li>
              </ul>

              <h3>Ingeniería</h3>
              <ul>
                <li><strong>Ingeniero estructural:</strong> Ingeniero Civil estructural con 6 años en proyectos de edificación en altura (Chile y Perú). Manejo SAP2000, ETABS y normativa NCh 433. Busco rol Senior en oficina de cálculo o consultora.</li>
              </ul>

              <h3>Atención al cliente</h3>
              <ul>
                <li><strong>Team Lead Soporte:</strong> Team Lead de soporte SaaS con 5 años, dueña de equipo de 12 agentes en 3 zonas horarias. CSAT de 94% sostenido. Busco rol Senior Team Lead o Manager.</li>
              </ul>

              <h2 id="errores">6 errores que matan tu objetivo profesional</h2>

              <div className="not-prose space-y-3 my-8">
                {[
                  { title: "Frases hechas y clichés", text: "\"Persona proactiva, dinámica, con ganas de aprender y trabajar en equipo.\" Lo escribe el 95% de los candidatos. Comunica cero información. Reemplaza adjetivos por evidencia concreta." },
                  { title: "Objetivo genérico para todas las ofertas", text: "Si tu objetivo encaja igual de bien para un puesto de finanzas y uno de marketing, no encaja realmente con ninguno. Adapta al menos las 2-3 palabras clave de cada oferta." },
                  { title: "Hablar solo de lo que tú quieres", text: "\"Busco un puesto desafiante donde pueda crecer y aprender.\" No le dice al reclutador qué le aportas tú a la empresa. Equilibra: lo que buscas + lo que ofreces." },
                  { title: "Demasiado largo", text: "Más de 4 líneas y los reclutadores saltan al siguiente bloque. 40-60 palabras es el rango óptimo." },
                  { title: "Usar primera persona obvia", text: "\"Yo soy una persona muy responsable y comprometida...\" Elimina el \"yo soy\". Suena más profesional con sujeto implícito." },
                  { title: "Mencionar el sueldo o la modalidad", text: "El objetivo no es el lugar para pedir teletrabajo, sueldo X o jornada Y. Esa conversación va en la entrevista o en el filtro inicial — no en el documento que decide si te llaman." },
                ].map((m, i) => (
                  <div key={i} className="flex gap-4 rounded-2xl border border-rose-100 bg-rose-50/40 p-4 sm:p-5">
                    <XCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-[#1a2e4a] text-sm sm:text-base mb-1">{m.title}</p>
                      <p className="text-sm text-[#1a2e4a]/75 leading-relaxed">{m.text}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="not-prose grid sm:grid-cols-3 gap-4 my-8">
                {[
                  { icon: CheckCircle2, title: "Específico y honesto", text: "Mejor un objetivo modesto y veraz que uno inflado y poco creíble." },
                  { icon: Target, title: "Adaptado a la oferta", text: "Cambia 2-3 keywords por cada postulación. 90 segundos extra." },
                  { icon: Sparkles, title: "Evidencia mínima", text: "Una credencial, un número, un proyecto concreto. Algo que un reclutador pueda verificar." },
                ].map(({ icon: Icon, title, text }, i) => (
                  <div key={i} className="rounded-2xl border border-emerald-100 bg-emerald-50/30 p-5">
                    <Icon className="h-5 w-5 mb-3 text-emerald-600" />
                    <p className="font-semibold text-[#1a2e4a] text-sm mb-1.5">{title}</p>
                    <p className="text-sm text-[#1a2e4a]/75 leading-relaxed">{text}</p>
                  </div>
                ))}
              </div>

              <div className="not-prose rounded-2xl border border-amber-200 bg-amber-50/50 p-5 sm:p-6 my-8 flex gap-4">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-[#1a2e4a] text-sm sm:text-base mb-1.5">Tip pro — valida con el ATS Checker</p>
                  <p className="text-sm text-[#1a2e4a]/80 leading-relaxed">
                    Pega tu objetivo (junto con el resto de tu CV) y la oferta de trabajo en el <Link href={`/${locale}/tools/ats-checker`}>ATS Checker de ReadyCV</Link>. Te dice qué keywords del posting están faltando, tu match actual y las 3 ediciones de mayor impacto. La mayoría sube su score 20+ puntos en menos de 10 minutos.
                  </p>
                </div>
              </div>

              <p>
                El objetivo profesional bien escrito no es magia ni teoría — es una fórmula clara aplicada con honestidad y adaptación. Cinco minutos invertidos en escribirlo correctamente pueden ser la diferencia entre que tu CV sea leído hasta el final o se descarte en el primer escaneo. Hazlo una vez bien con un ejemplo de esta guía como punto de partida, y úsalo de base para cada nueva postulación.
              </p>
            </BlogProse>

            <div className="mt-16">
              <BlogFAQ items={faqs} title="Preguntas frecuentes" />
            </div>

            <div className="mt-16">
              <BlogCTA
                locale={locale}
                title="Crea tu CV con un objetivo profesional que sí te lleve a entrevista."
                description="ReadyCV PRO te ofrece 111+ plantillas optimizadas para ATS, sugerencias AI de objetivo profesional adaptadas a tu rol objetivo y el ATS Checker que valida tu match en tiempo real. Empieza en menos de 2 minutos."
                buttonLabel="Empezar con ReadyCV PRO"
                hint="$15/mes o $144/año · 7 herramientas AI · Cancela cuando quieras"
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

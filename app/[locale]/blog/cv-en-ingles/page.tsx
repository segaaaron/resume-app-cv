import Link from "next/link"
import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { notFound } from "next/navigation"
import { CheckCircle2, XCircle, AlertTriangle, Globe2, FileText } from "lucide-react"

import BlogArticle from "@/components/blog/BlogArticle"
import BlogHero from "@/components/blog/BlogHero"
import BlogTableOfContents from "@/components/blog/BlogTableOfContents"
import BlogProse from "@/components/blog/BlogProse"
import BlogFAQ from "@/components/blog/BlogFAQ"
import BlogCTA from "@/components/blog/BlogCTA"
import BlogAtsPreview from "@/components/blog/BlogAtsPreview"
import BlogRelatedPosts from "@/components/blog/BlogRelatedPosts"
import BlogSchemas from "@/components/blog/BlogSchemas"

const SLUG = "cv-en-ingles"
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
  const t = await getTranslations({ locale, namespace: "metadata.blog_cv_ingles" })
  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: `https://valhallaresume.com/${locale}/blog/${SLUG}`,
      languages: {
        es: `https://valhallaresume.com/es/blog/${SLUG}`,
        "x-default": `https://valhallaresume.com/es/blog/${SLUG}`,
      },
    },
    openGraph: {
      title: t("title"),
      description: t("description"),
      type: "article",
      url: `https://valhallaresume.com/${locale}/blog/${SLUG}`,
      images: [{ url: "https://valhallaresume.com/og-image.png", width: 1200, height: 630 }],
      publishedTime: DATE_PUBLISHED,
      modifiedTime: DATE_MODIFIED,
      authors: ["Valhalla Resume Team"],
      locale: "es_ES",
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
      images: ["https://valhallaresume.com/og-image.png"],
    },
  }
}

export default async function CVEnInglesPostPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  // Spanish-only post — no English equivalent yet.
  if (locale !== LOCALE_TARGET) notFound()

  const tBlog = await getTranslations("blog")

  const TITLE = "CV en Inglés: Guía Paso a Paso con Ejemplos (Resume 2026)"
  const SUBTITLE =
    "Traducir tu CV al inglés palabra por palabra es el error más común — y la razón por la que tu candidatura queda fuera antes de llegar al reclutador. Aquí está el formato real que usan en Estados Unidos, Reino Unido y multinacionales, con plantillas y vocabulario específico por sector."
  const TAG = "CV Internacional"

  const toc = [
    { id: "resume-vs-cv", label: "Resume vs CV: cuál usar según el país" },
    { id: "diferencias", label: "10 diferencias clave entre el CV español y el resume" },
    { id: "estructura", label: "Estructura del resume americano (sección por sección)" },
    { id: "summary", label: "Cómo escribir tu Professional Summary" },
    { id: "experience", label: "Work Experience: el formato que sí funciona" },
    { id: "vocabulario", label: "Vocabulario profesional por sector" },
    { id: "errores", label: "Errores típicos del hispanohablante en su CV en inglés" },
    { id: "ats", label: "ATS y CV en inglés: lo que cambia" },
    { id: "faq", label: "Preguntas frecuentes" },
  ]

  const faqs = [
    {
      q: "¿Mi CV en inglés debe llevar foto?",
      a: "No. En Estados Unidos, Reino Unido, Canadá, Australia e Irlanda incluir foto es un error grave — muchos sistemas ATS rechazan el archivo automáticamente y los reclutadores entrenados para evitar sesgos lo descartan. La excepción son ciertos países europeos (Alemania, Francia parcialmente) donde sigue siendo aceptado.",
    },
    {
      q: "¿Cuántas páginas debe tener mi resume?",
      a: "Una página si tienes menos de 10 años de experiencia. Dos páginas como máximo absoluto a partir de carrera senior o ejecutiva. El CV español de 3-4 páginas no existe en el mercado anglosajón — un resume largo se interpreta como falta de capacidad de síntesis.",
    },
    {
      q: "¿Pongo mis datos personales como DNI, estado civil o edad?",
      a: "Nunca. En el mercado anglosajón estos datos están prohibidos por ley en muchos casos y considerados poco profesionales en todos. Tu resume solo lleva: nombre completo, teléfono con código internacional, email, ciudad/país, LinkedIn y opcionalmente GitHub/portfolio.",
    },
    {
      q: "¿Traduzco el nombre de mi universidad o empresa?",
      a: "El nombre propio se mantiene en español (Universidad Complutense de Madrid, no Complutense University of Madrid). Sí traduce el tipo de titulación (Licenciatura → Bachelor's Degree) y añade entre paréntesis el equivalente cuando aporta contexto al reclutador internacional.",
    },
    {
      q: "¿Tengo que escribirlo en inglés británico o americano?",
      a: "Adapta al país objetivo. Si aplicas a Estados Unidos: resume, organize, color, optimize. Si aplicas a Reino Unido o Irlanda: CV, organise, colour, optimise. Mezclar ambos en el mismo documento es una señal inmediata de falta de cuidado.",
    },
    {
      q: "¿Cómo escribo niveles de inglés y otros idiomas?",
      a: "Usa los estándares internacionales: Native, Bilingual, Fluent (C1-C2), Professional working proficiency (B2), Limited working proficiency (B1). Evita 'Advanced' o 'Medium' — son ambiguos. Si tienes certificado oficial (TOEFL, IELTS, Cambridge) añade el score entre paréntesis.",
    },
  ]

  const relatedItems = [
    {
      slug: "habilidades-para-cv",
      title: "Habilidades para CV: 200+ Skills por Industria",
      desc: "Las habilidades que los reclutadores buscan en 2026, organizadas por sector y nivel de seniority.",
      tag: "CV",
      readingTime: 8,
    },
    {
      slug: "como-pasar-el-ats",
      title: "Cómo Pasar el Filtro ATS en 2026",
      desc: "Lo que un ATS filtra de verdad es más estrecho de lo que te han contado. Las tácticas que sí funcionan.",
      tag: "ATS",
      readingTime: 7,
    },
    {
      slug: "verbos-de-accion-cv",
      title: "300+ Verbos de Acción para tu Currículum",
      desc: "El vocabulario exacto que transforma una descripción de tareas en una historia de logros.",
      tag: "Redacción",
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
        keywords={[
          "cv en inglés",
          "resume en inglés",
          "cv en ingles ejemplos",
          "como hacer un cv en ingles",
          "resume vs cv",
        ]}
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
                Postular a una multinacional, a una empresa en Estados Unidos o a un puesto remoto en Europa requiere mucho más que correr Google Translate sobre tu currículum. El mercado anglosajón usa una estructura distinta, un vocabulario distinto, y reglas de formato que si las ignoras te quedan fuera en el primer filtro automático del ATS. No es una cuestión de inglés perfecto — es una cuestión de hablar el idioma profesional correcto.
              </p>
              <p>
                Esta guía cubre el formato exacto que esperan recruiters en Estados Unidos, Reino Unido y multinacionales con operaciones en LATAM y España: cuántas páginas, qué secciones, qué orden, qué eliminar del CV europeo, vocabulario específico por sector, y los errores típicos que delatan al hispanohablante en su primer CV en inglés. Al final tendrás todo lo necesario para escribir el tuyo en una tarde.
              </p>

              <div className="not-prose my-10">
                <BlogTableOfContents items={toc} title="En esta página" />
              </div>

              <h2 id="resume-vs-cv">Resume vs CV: cuál usar según el país</h2>
              <p>
                En el mundo anglosajón <strong>&quot;CV&quot;</strong> y <strong>&quot;resume&quot;</strong> no significan lo mismo, y usar el término equivocado al subir tu archivo o al hablar con el reclutador es la primera señal de que no estás familiarizado con el mercado:
              </p>

              <div className="not-prose my-6 overflow-x-auto rounded-2xl border border-[#1a2e4a]/10">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#1a2e4a] text-white">
                      <th className="px-4 py-3 text-left font-semibold">País / Región</th>
                      <th className="px-4 py-3 text-left font-semibold">Término correcto</th>
                      <th className="px-4 py-3 text-left font-semibold">Páginas típicas</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    <tr className="border-b border-[#1a2e4a]/10">
                      <td className="px-4 py-3 font-semibold text-[#1a2e4a]">Estados Unidos · Canadá</td>
                      <td className="px-4 py-3 text-[#1a2e4a]/80">Resume</td>
                      <td className="px-4 py-3 text-[#1a2e4a]/80">1 página (2 si senior)</td>
                    </tr>
                    <tr className="border-b border-[#1a2e4a]/10 bg-[#00D4FF]/5">
                      <td className="px-4 py-3 font-semibold text-[#1a2e4a]">Reino Unido · Irlanda</td>
                      <td className="px-4 py-3 text-[#1a2e4a]/80">CV</td>
                      <td className="px-4 py-3 text-[#1a2e4a]/80">2 páginas</td>
                    </tr>
                    <tr className="border-b border-[#1a2e4a]/10">
                      <td className="px-4 py-3 font-semibold text-[#1a2e4a]">Australia · Nueva Zelanda</td>
                      <td className="px-4 py-3 text-[#1a2e4a]/80">Resume o CV (intercambiable)</td>
                      <td className="px-4 py-3 text-[#1a2e4a]/80">2 páginas</td>
                    </tr>
                    <tr className="border-b border-[#1a2e4a]/10">
                      <td className="px-4 py-3 font-semibold text-[#1a2e4a]">Académico · Investigación (global)</td>
                      <td className="px-4 py-3 text-[#1a2e4a]/80">CV (Curriculum Vitae)</td>
                      <td className="px-4 py-3 text-[#1a2e4a]/80">Sin límite</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-semibold text-[#1a2e4a]">Multinacionales en LATAM/España</td>
                      <td className="px-4 py-3 text-[#1a2e4a]/80">Resume (formato US)</td>
                      <td className="px-4 py-3 text-[#1a2e4a]/80">1-2 páginas</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p>
                Regla práctica: si la oferta está escrita en inglés americano o la empresa tiene HQ en USA, escribe <strong>resume</strong>. Si la oferta es UK, Irlanda o académica, escribe <strong>CV</strong>. Para todo lo demás, resume es la apuesta segura.
              </p>

              <h2 id="diferencias">10 diferencias clave entre el CV español y el resume</h2>
              <p>
                Si tomas tu CV en español, lo traduces y lo mandas tal cual, vas a tener problemas. Estas son las 10 diferencias que tienes que aplicar:
              </p>

              <ol>
                <li><strong>Sin foto.</strong> El resume nunca lleva foto. Punto.</li>
                <li><strong>Sin datos personales.</strong> Nada de DNI, edad, estado civil, nacionalidad ni dirección completa.</li>
                <li><strong>Una página máximo</strong> (USA) o dos páginas (UK). El CV de 3-4 páginas no existe.</li>
                <li><strong>Logros, no tareas.</strong> No describes lo que &quot;era responsable de&quot; — describes lo que conseguiste, cuantificado.</li>
                <li><strong>Verbos de acción al inicio de cada bullet.</strong> &quot;Led, Built, Designed, Reduced…&quot; no &quot;Was in charge of…&quot;</li>
                <li><strong>Orden inverso cronológico estricto.</strong> Lo más reciente arriba, sin excepciones.</li>
                <li><strong>Sin firma manuscrita ni declaración de veracidad.</strong> Eso es de CV europeo.</li>
                <li><strong>Skills al inicio</strong> (después del summary) o al final, pero siempre como sección dedicada.</li>
                <li><strong>Fechas en formato MM/YYYY</strong> (USA) o MMM YYYY (UK), nunca DD/MM/YYYY.</li>
                <li><strong>Email profesional propio</strong> — nada de antoniogamer87@hotmail.com.</li>
              </ol>

              <h2 id="estructura">Estructura del resume americano (sección por sección)</h2>
              <p>
                Este es el orden estándar que esperan reclutadores y ATS en el mercado US. Si tu industria es creativa puedes mover ligeramente el orden, pero las secciones son fijas:
              </p>

              <div className="not-prose my-8 space-y-3">
                {[
                  { num: "01", title: "Header (Contact Information)", text: "Nombre completo (grande), teléfono con código país (+1 / +34 / +52), email profesional, ciudad y país, LinkedIn URL, GitHub/portfolio si aplica." },
                  { num: "02", title: "Professional Summary", text: "3-5 líneas. Quién eres, años de experiencia, especialización, 2 logros cuantificados. Detallado más abajo." },
                  { num: "03", title: "Work Experience", text: "Orden inverso cronológico. Por puesto: Job Title · Company · Location · MM/YYYY – MM/YYYY. Debajo, 3-5 bullets de logros con verbo de acción + métrica." },
                  { num: "04", title: "Skills", text: "Hard skills primero (tecnologías, herramientas, metodologías). Soft skills opcional. Sin barras de progreso ni puntajes inventados." },
                  { num: "05", title: "Education", text: "Bachelor's / Master's Degree in [field], Universidad, Ciudad, fechas. GPA solo si es >3.5/4.0 y eres recién graduado. Sin nota del bachillerato." },
                  { num: "06", title: "Certifications (opcional)", text: "AWS, PMP, Scrum Master, Google Analytics, etc. Solo si vigentes y relevantes al puesto." },
                  { num: "07", title: "Languages", text: "Inglés con nivel estándar (Native, Fluent, Professional). Idioma materno también listado." },
                  { num: "08", title: "Projects / Volunteer / Awards (opcional)", text: "Solo si añaden valor real al puesto que buscas." },
                ].map((s) => (
                  <div key={s.num} className="flex gap-4 rounded-2xl border border-[#1a2e4a]/10 bg-white p-5 hover:border-[#00D4FF]/30 transition-colors">
                    <span className="shrink-0 h-10 w-10 rounded-xl bg-gradient-to-br from-[#1a2e4a] to-[#0f1d30] text-[#00D4FF] font-bold text-sm flex items-center justify-center">
                      {s.num}
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-[#1a2e4a] text-sm sm:text-base mb-1">{s.title}</p>
                      <p className="text-sm text-[#1a2e4a]/75 leading-relaxed">{s.text}</p>
                    </div>
                  </div>
                ))}
              </div>

              <h2 id="summary">Cómo escribir tu Professional Summary</h2>
              <p>
                El Professional Summary reemplaza al &quot;Objetivo Profesional&quot; del CV español. La diferencia es brutal: el objetivo dice qué quieres tú; el summary dice qué le aportas tú al empleador. Sigue este molde:
              </p>

              <blockquote>
                [Seniority] [Job Title] with [X years] of experience [doing what] in [industry]. Proven track record of [quantified result #1] and [quantified result #2]. Expert in [hard skill 1], [hard skill 2], [hard skill 3]. Seeking a [target role] where [your unique value] can [strategic impact].
              </blockquote>

              <p><strong>Ejemplo real (Marketing):</strong></p>
              <blockquote>
                Senior Performance Marketing Manager with 7 years scaling paid acquisition for B2B SaaS in LATAM and Europe. Reduced blended CAC by 38% across Meta and Google while doubling MQL volume. Expert in Google Ads, GA4, HubSpot, and multi-touch attribution. Seeking a growth leadership role where data-driven channel strategy can accelerate Series B expansion.
              </blockquote>

              <p><strong>Ejemplo real (Software Engineer):</strong></p>
              <blockquote>
                Senior Backend Engineer with 6 years building distributed systems for fintech and SaaS companies. Cut p99 API latency by 54% and led migration of monolithic platform to event-driven microservices serving 12M monthly active users. Expert in Go, Kafka, PostgreSQL, and Kubernetes. Looking for a Staff Engineer role focused on platform reliability.
              </blockquote>

              <h2 id="experience">Work Experience: el formato que sí funciona</h2>
              <p>
                Aquí es donde más fallan los CVs traducidos. El formato anglosajón sigue el principio <strong>Verbo + Acción + Resultado cuantificado + Contexto</strong>. Compara:
              </p>

              <div className="not-prose my-6 grid sm:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-rose-100 bg-rose-50/40 p-5">
                  <p className="text-xs font-semibold uppercase tracking-widest text-rose-700 mb-2">Antes (traducción directa)</p>
                  <p className="text-sm text-[#1a2e4a]/80 leading-relaxed">
                    &quot;Was responsible for the management of the marketing team and the execution of digital campaigns to improve company sales.&quot;
                  </p>
                </div>
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-5">
                  <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700 mb-2">Después (formato US)</p>
                  <p className="text-sm text-[#1a2e4a]/80 leading-relaxed">
                    &quot;Led a 6-person marketing team executing paid acquisition across Meta and Google, lifting MQL volume 47% and reducing CAC by $124 in 9 months.&quot;
                  </p>
                </div>
              </div>

              <p>
                Reglas de oro para cada bullet:
              </p>
              <ul>
                <li><strong>Empieza siempre con verbo en pasado</strong> (Led, Built, Designed, Reduced, Launched) — excepto el puesto actual, que va en presente continuo: &quot;Leading&quot;, &quot;Building&quot;.</li>
                <li><strong>Incluye al menos una métrica por bullet</strong>: %, $, número de personas, tiempo ahorrado, usuarios impactados.</li>
                <li><strong>3-5 bullets por puesto reciente</strong>, 2-3 por puestos antiguos.</li>
                <li><strong>Sin punto final</strong> en los bullets (convención US).</li>
              </ul>

              <h2 id="vocabulario">Vocabulario profesional por sector</h2>
              <p>
                Estos son los verbos y términos que realmente se usan en cada sector. Memoriza los de tu industria — son los keywords que el ATS está buscando:
              </p>

              <h3>Software & Tech</h3>
              <p>
                <strong>Verbos:</strong> Architected, Built, Deployed, Refactored, Migrated, Scaled, Shipped, Optimized, Automated, Instrumented.<br />
                <strong>Términos:</strong> Microservices, CI/CD pipeline, On-call rotation, Code review, Pull request, Tech debt, SLA/SLO, Production incident, Greenfield, Brownfield.
              </p>

              <h3>Marketing & Growth</h3>
              <p>
                <strong>Verbos:</strong> Launched, Drove, Generated, Acquired, Retained, Tested, Iterated, Attributed, Scaled, Optimized.<br />
                <strong>Términos:</strong> CAC, LTV, MQL, SQL, Funnel, Attribution, Retention cohort, A/B test, Lift, ROAS, Pipeline, Activation.
              </p>

              <h3>Finanzas & Operaciones</h3>
              <p>
                <strong>Verbos:</strong> Forecasted, Modeled, Reconciled, Audited, Streamlined, Negotiated, Closed, Reported, Implemented, Standardized.<br />
                <strong>Términos:</strong> P&amp;L, Variance analysis, Cash flow, Working capital, GAAP, Close cycle, Headcount planning, Budget vs actuals, Margin.
              </p>

              <h3>Ventas</h3>
              <p>
                <strong>Verbos:</strong> Closed, Prospected, Negotiated, Sourced, Expanded, Renewed, Forecasted, Onboarded, Exceeded, Hit.<br />
                <strong>Términos:</strong> Quota, Pipeline, ACV, ARR, Net retention, Churn, Win rate, Outbound, Inbound, Deal cycle, Upsell, Cross-sell.
              </p>

              <h3>Producto & Diseño</h3>
              <p>
                <strong>Verbos:</strong> Defined, Scoped, Validated, Prototyped, Shipped, Researched, Aligned, Prioritized, Iterated, Measured.<br />
                <strong>Términos:</strong> North Star metric, Roadmap, Discovery, PRD, MVP, Design system, Component library, Wireframe, Usability test, Activation.
              </p>

              <h2 id="errores">Errores típicos del hispanohablante en su CV en inglés</h2>

              <div className="not-prose space-y-3 my-8">
                {[
                  { title: "Falsos amigos peligrosos", text: "\"Actually\" no significa \"actualmente\" (significa \"de hecho\"). \"Eventually\" no significa \"eventualmente\" (significa \"finalmente\"). \"Sensible\" no significa \"sensible\" (significa \"razonable\"). Estos errores delatan inmediatamente que no eres nativo." },
                  { title: "Traducir el nombre de la titulación literal", text: "\"Diplomatura\" no es \"Diplomature\" (no existe). Usa \"Associate's Degree\". \"Licenciatura\" es \"Bachelor's Degree\". \"FP Superior\" es \"Higher Vocational Training Diploma\"." },
                  { title: "Usar 'I' en cada bullet", text: "El resume no usa el yo. Bullets empiezan con verbo: \"Led team of 8\", no \"I led a team of 8\"." },
                  { title: "Calcar la fecha en formato europeo", text: "\"15/03/2024\" en USA se lee como 15 de marzo... pero también puede leerse como mes 15 (inválido). Usa MM/YYYY: 03/2024." },
                  { title: "Listar idiomas como porcentaje", text: "\"English 85%\" no significa nada. Usa estándares: Native, Fluent, Professional working proficiency, Limited working proficiency." },
                  { title: "Incluir hobbies genéricos", text: "\"Reading, traveling, listening to music\" — no aporta nada y consume línea valiosa. Si incluyes hobbies, que sean específicos y diferenciadores (\"Competed in 3 ultra-marathons\", \"Published 4 short stories\")." },
                  { title: "Foto + datos personales por inercia", text: "Eliminar foto, fecha de nacimiento, estado civil y nacionalidad. Esto solo no te elimina del ATS, también es ilegal pedirlo en USA — incluirlo señala inexperiencia." },
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

              <h2 id="ats">ATS y CV en inglés: lo que cambia</h2>
              <p>
                Casi cualquier empresa grande usa un ATS para gestionar la avalancha de candidaturas — pero quien decide sigue siendo una persona. Para un CV en inglés esto añade dos retos extra al hispanohablante:
              </p>

              <div className="not-prose grid sm:grid-cols-2 gap-4 my-8">
                {[
                  { icon: CheckCircle2, color: "emerald", title: "Match exacto de keywords", text: "El ATS no traduce ni interpreta — busca strings literales. Si el job description dice \"agile project management\", esa frase exacta debe aparecer en tu resume." },
                  { icon: CheckCircle2, color: "emerald", title: "Acrónimos completos al menos una vez", text: "Escribe \"Search Engine Optimization (SEO)\" la primera vez. El ATS indexa ambos formatos." },
                  { icon: Globe2, color: "cyan", title: "Job titles en inglés estándar", text: "\"Responsable de Marketing\" no parsea bien. Usa \"Marketing Manager\". \"Encargado de equipo\" → \"Team Lead\"." },
                  { icon: FileText, color: "cyan", title: "Formato .docx o .pdf basados en texto", text: "Nunca PDF escaneado, nunca imagen del CV. El ATS tiene que poder seleccionar texto del archivo." },
                ].map(({ icon: Icon, color, title, text }, i) => (
                  <div key={i} className={`rounded-2xl border p-5 ${color === "emerald" ? "border-emerald-100 bg-emerald-50/30" : "border-[#00D4FF]/20 bg-[#00D4FF]/5"}`}>
                    <Icon className={`h-5 w-5 mb-3 ${color === "emerald" ? "text-emerald-600" : "text-[#00D4FF]"}`} />
                    <p className="font-semibold text-[#1a2e4a] text-sm mb-1.5">{title}</p>
                    <p className="text-sm text-[#1a2e4a]/75 leading-relaxed">{text}</p>
                  </div>
                ))}
              </div>

              <div className="not-prose rounded-2xl border border-amber-200 bg-amber-50/50 p-5 sm:p-6 my-8 flex gap-4">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-[#1a2e4a] text-sm sm:text-base mb-1.5">Tip pro — verifica tu match antes de aplicar</p>
                  <p className="text-sm text-[#1a2e4a]/80 leading-relaxed">
                    Mira cómo el <Link href={`/${locale}/tools/ats-checker`}>puntaje ATS de Valhalla Resume PRO</Link> lee tu resume en inglés contra la job description: te dice qué keywords del posting faltan, tu match score actual y las 3 ediciones de mayor impacto. La mayoría de candidatos sube su score 20+ puntos con 10 minutos de ajustes en el summary y las skills.
                  </p>
                </div>
              </div>

              <p>
                Un CV en inglés bien hecho no es una traducción — es un documento construido desde cero con las reglas del mercado anglosajón. Hazlo una vez correctamente y úsalo de base cada vez que apliques fuera. Es la diferencia entre que tu candidatura llegue a un recruiter o se quede dando vueltas en una carpeta de descartados automáticos.
              </p>
            </BlogProse>

            <div className="mt-16">
              <BlogFAQ items={faqs} title="Preguntas frecuentes" />
            </div>

            <div className="mt-16">
              <BlogAtsPreview locale={locale} variant="frontend" />

              <BlogCTA
                locale={locale}
                title="Crea tu CV en inglés con el formato que sí funciona en el mercado anglosajón."
                description="Valhalla Resume PRO incluye 143 plantillas optimizadas para ATS internacional, sugerencias AI en inglés (US y UK) y el ATS Checker que valida tu match contra cualquier job description. Empieza en menos de 2 minutos."
                buttonLabel="Empezar con Valhalla Resume PRO"
                hint="$15/mes o $99/año · 7 herramientas AI · Cancela cuando quieras"
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

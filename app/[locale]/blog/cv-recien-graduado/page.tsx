import Link from "next/link"
import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { notFound } from "next/navigation"
import { CheckCircle2, XCircle, GraduationCap, Sparkles, AlertTriangle } from "lucide-react"

import BlogArticle from "@/components/blog/BlogArticle"
import BlogHero from "@/components/blog/BlogHero"
import BlogTableOfContents from "@/components/blog/BlogTableOfContents"
import BlogProse from "@/components/blog/BlogProse"
import BlogFAQ from "@/components/blog/BlogFAQ"
import BlogCTA from "@/components/blog/BlogCTA"
import BlogAtsPreview from "@/components/blog/BlogAtsPreview"
import BlogRelatedPosts from "@/components/blog/BlogRelatedPosts"
import BlogSchemas from "@/components/blog/BlogSchemas"

const SLUG = "cv-recien-graduado"
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
  const t = await getTranslations({ locale, namespace: "metadata.blog_cv_recien_graduado" })
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

export default async function CVRecienGraduadoPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  if (locale !== LOCALE_TARGET) notFound()

  const tBlog = await getTranslations("blog")

  const TITLE = "CV para Recién Graduados Universitarios (Guía 2026 + Ejemplos)"
  const SUBTITLE =
    "Tu CV de recién graduado compite contra perfiles con experiencia formal. La estrategia no es inflar — es ordenar prácticas, proyectos académicos y voluntariado como experiencia legítima. Esta guía te enseña cómo."
  const TAG = "CV Sin Experiencia"

  const toc = [
    { id: "intro", label: "Por qué tu CV necesita estrategia diferente" },
    { id: "estructura", label: "Estructura ideal del CV recién graduado" },
    { id: "objetivo", label: "Cómo escribir el objetivo profesional sin experiencia" },
    { id: "educacion", label: "Cómo destacar la educación" },
    { id: "practicas", label: "Prácticas e internships como experiencia" },
    { id: "proyectos", label: "Proyectos académicos: presentarlos como experiencia" },
    { id: "habilidades", label: "Habilidades técnicas y blandas" },
    { id: "extras", label: "Voluntariado, becas y extracurriculares" },
    { id: "ejemplos", label: "5 ejemplos completos por área" },
    { id: "errores", label: "Errores comunes" },
    { id: "faq", label: "Preguntas frecuentes" },
  ]

  const faqs = [
    {
      q: "¿Cuántas páginas debe tener el CV de un recién graduado?",
      a: "Una página, sin excepciones. Si no llenas una página con contenido real, el problema no es la longitud — es que necesitas agregar proyectos académicos, voluntariado o cursos. Dos páginas con poca sustancia se ven peor que una página bien aprovechada.",
    },
    {
      q: "¿Debo poner mi promedio o GPA en el CV?",
      a: "Solo si supera 8.5/10 (o 3.5/4.0 en escala americana), y solo durante los primeros 2-3 años post-graduación. Después de eso, deja de ser relevante. Si estuviste en cuadro de honor o te graduaste con distinción, menciónalo siempre.",
    },
    {
      q: "¿Las prácticas universitarias cuentan como experiencia laboral?",
      a: "Sí, totalmente — siempre que las describas con la misma estructura que un empleo formal: nombre de empresa, cargo (Practicante, Becario, Intern), fechas, y 2-3 bullets con logros cuantificados. La diferencia frente a un trabajo full-time es que indicas explícitamente que fue práctica profesional, no que escondes el contexto.",
    },
    {
      q: "Si no tengo prácticas ni experiencia, ¿qué pongo en el CV?",
      a: "Proyectos académicos de fin de carrera, proyectos personales (apps, blogs, investigaciones), voluntariado con responsabilidades reales, certificaciones online (Coursera, Platzi, edX) con proyectos finales, y trabajos puntuales freelance aunque sean pequeños. Todo eso es experiencia legítima cuando se presenta con métricas y resultados.",
    },
    {
      q: "¿Pongo mis trabajos durante la universidad aunque no sean del área?",
      a: "Solo si transmiten habilidades transferibles relevantes para el rol al que postulas — gestión de tiempo, atención al cliente, trabajo en equipo, manejo de presión. Un trabajo como mesero durante 2 años demuestra responsabilidad y constancia. Lo que no debes hacer es listarlo sin contexto: enfócate en lo que aprendiste, no en el cargo.",
    },
    {
      q: "¿Cómo manejo el hecho de que no tengo experiencia profesional formal?",
      a: "No lo escondas ni te disculpes. Tu objetivo profesional debe enmarcar tu perfil con confianza: &apos;Recién egresado en X con sólida base en Y, busco aplicar Z en mi primer rol profesional&apos;. La honestidad estructurada gana más entrevistas que cualquier intento de inflar logros que no tienes.",
    },
  ]

  const relatedItems = [
    { slug: "objetivo-profesional-ejemplos", title: "50 Ejemplos de Objetivo Profesional para CV", desc: "Ejemplos por categoría incluyendo recién egresados, con la fórmula que funciona en 2026.", tag: "Objetivo Profesional", readingTime: 10 },
    { slug: "habilidades-para-cv", title: "Habilidades para CV: 200+ Skills por Industria", desc: "200+ habilidades organizadas por industria con formato ATS-amigable.", tag: "Habilidades CV", readingTime: 11 },
    { slug: "cv-cambio-carrera", title: "CV para Cambio de Carrera: Guía Completa", desc: "Estrategia, formato y ejemplos antes/después para reposicionar tu perfil.", tag: "Cambio de Carrera", readingTime: 9 },
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
        keywords={["cv recien graduado", "cv sin experiencia", "cv universitario", "primer empleo cv", "cv estudiante"]}
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
                Acabas de terminar la carrera. Tienes pocas o cero líneas de experiencia laboral formal — y compites contra perfiles que llevan dos o tres años en el mercado. La intuición de muchos recién graduados es inflar lo poco que tienen, copiar plantillas genéricas o mentir sutilmente en fechas. Las tres estrategias fracasan.
              </p>
              <p>
                Lo que sí funciona es estructurar de forma honesta lo que ya hiciste durante la carrera: prácticas, proyectos académicos reales, voluntariado con responsabilidad, cursos online con entregables, y un objetivo profesional bien escrito que enmarque tu perfil con seguridad. Esta guía te muestra el orden exacto, qué incluir en cada bloque y 5 ejemplos completos por área.
              </p>

              <div className="not-prose my-10">
                <BlogTableOfContents items={toc} title="En esta página" />
              </div>

              <h2 id="intro">Por qué tu CV de recién graduado necesita estrategia diferente</h2>
              <p>
                Un CV con 8 años de experiencia se construye recortando: tienes demasiado contenido y debes priorizar. El CV de recién graduado se construye <strong>amplificando</strong>: cada práctica, proyecto y curso debe presentarse con la estructura y el peso de un empleo formal. La misma rigurosidad de redacción (verbo de acción + qué hiciste + métrica) aplica.
              </p>

              <h2 id="estructura">Estructura ideal del CV recién graduado</h2>
              <div className="not-prose my-6 overflow-x-auto rounded-2xl border border-[#1a2e4a]/10">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#1a2e4a] text-white">
                      <th className="px-4 py-3 text-left font-semibold">Orden</th>
                      <th className="px-4 py-3 text-left font-semibold">Sección</th>
                      <th className="px-4 py-3 text-left font-semibold">Por qué va ahí</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {[
                      ["1", "Información de contacto", "Nombre, email profesional, teléfono, LinkedIn, ciudad."],
                      ["2", "Objetivo profesional", "Enmarca tu perfil. 2-3 líneas, sin clichés."],
                      ["3", "Educación", "Va antes de experiencia cuando es lo más fuerte que tienes."],
                      ["4", "Prácticas / Experiencia", "Internships, prácticas profesionales, trabajos formales si los hay."],
                      ["5", "Proyectos académicos / personales", "Tesis, proyectos finales, apps, investigaciones — con métricas."],
                      ["6", "Habilidades técnicas", "Software, lenguajes, herramientas — agrupadas por categoría."],
                      ["7", "Idiomas", "Con nivel CEFR (A1-C2) o equivalente certificado."],
                      ["8", "Certificaciones", "Cursos online relevantes con entregable o examen."],
                      ["9", "Voluntariado / Extracurriculares", "Solo si hay responsabilidad real, no decorativo."],
                    ].map(([n, s, p], i) => (
                      <tr key={i} className={i % 2 === 1 ? "bg-[#00D4FF]/5 border-b border-[#1a2e4a]/10" : "border-b border-[#1a2e4a]/10"}>
                        <td className="px-4 py-3 font-semibold text-[#1a2e4a]">{n}</td>
                        <td className="px-4 py-3 font-semibold text-[#1a2e4a]/90">{s}</td>
                        <td className="px-4 py-3 text-[#1a2e4a]/80">{p}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h2 id="objetivo">Cómo escribir el objetivo profesional sin experiencia laboral</h2>
              <p>
                El objetivo profesional para recién egresado tiene una estructura simple: <strong>perfil académico + fortaleza concreta + rol al que aspiras + valor que aportas</strong>. Evita clichés como &quot;soy proactivo&quot; o &quot;trabajo en equipo&quot; — son palabras vacías que ningún reclutador valora.
              </p>
              <div className="not-prose space-y-3 my-6">
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/40 p-5">
                  <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700 mb-2">Ejemplo bien escrito (Marketing)</p>
                  <p className="text-sm text-[#1a2e4a]/85 italic">
                    &quot;Recién egresada en Marketing por la Universidad de Chile, con experiencia en práctica profesional gestionando campañas digitales que generaron +45% de engagement en redes sociales. Busco mi primer rol como Asistente de Marketing Digital donde aplicar mis habilidades en SEO, Google Analytics y producción de contenido.&quot;
                  </p>
                </div>
                <div className="rounded-2xl border border-rose-100 bg-rose-50/40 p-5">
                  <p className="text-xs font-semibold uppercase tracking-widest text-rose-700 mb-2">Ejemplo a evitar</p>
                  <p className="text-sm text-[#1a2e4a]/85 italic">
                    &quot;Joven proactivo, responsable y con ganas de aprender. Trabajo bien en equipo y bajo presión. Busco una oportunidad para desarrollarme profesionalmente en una empresa seria.&quot;
                  </p>
                </div>
              </div>

              <h2 id="educacion">Cómo destacar la educación</h2>
              <p>
                Cuando la educación es tu activo más fuerte, no la resumas a una línea — desarróllala. Incluye: <strong>universidad, carrera, año de egreso, promedio (si es alto), distinciones académicas, materias relevantes para el rol, y proyectos académicos destacados</strong>. Si participaste en intercambios, hackathones, ponencias o publicaciones académicas, va aquí también.
              </p>
              <ul>
                <li><strong>Promedio:</strong> incluir si supera 8.5/10 o 3.5/4.0.</li>
                <li><strong>Distinciones:</strong> cuadro de honor, beca académica, top X% de la promoción.</li>
                <li><strong>Materias relevantes:</strong> 3-5 cursos vinculados al rol que buscas.</li>
                <li><strong>Tesis o proyecto final:</strong> título + resultado o métrica.</li>
              </ul>

              <h2 id="practicas">Prácticas e internships como experiencia legítima</h2>
              <p>
                Tu práctica profesional es experiencia laboral real. Estrúcturala con la misma rigurosidad: empresa, cargo, fechas, y 3 bullets con verbo de acción + acción concreta + impacto cuantificado. Si la práctica fue corta (2-3 meses), no lo escondas — incluye las fechas reales.
              </p>
              <div className="not-prose rounded-2xl border border-[#00D4FF]/20 bg-[#00D4FF]/5 p-5 my-6">
                <p className="text-xs font-semibold uppercase tracking-widest text-[#00D4FF] mb-2">Ejemplo de práctica bien redactada</p>
                <p className="text-sm font-semibold text-[#1a2e4a] mb-1">Practicante de Marketing Digital · Acme Latam · ene 2025 – jun 2025</p>
                <ul className="text-sm text-[#1a2e4a]/85 space-y-1 list-disc pl-5">
                  <li>Gestioné cuentas de Instagram y TikTok con +18 mil seguidores, logrando +45% de engagement vs trimestre anterior</li>
                  <li>Coordiné campaña de lanzamiento de producto que generó 1.200 leads en 4 semanas con presupuesto de USD 800</li>
                  <li>Implementé dashboard de reportes semanales en Google Looker Studio adoptado por el equipo de 6 personas</li>
                </ul>
              </div>

              <h2 id="proyectos">Proyectos académicos como reemplazo de experiencia</h2>
              <p>
                Un proyecto académico bien presentado vale tanto como un empleo de 6 meses. La clave: <strong>nombre del proyecto, contexto (materia, tesis, hackathon), tecnologías/metodologías, resultado o entregable medible</strong>. Si fue grupal, indica tu rol específico.
              </p>
              <div className="not-prose rounded-2xl border border-[#1a2e4a]/10 bg-white p-5 my-6">
                <p className="text-xs font-semibold uppercase tracking-widest text-[#1a2e4a]/70 mb-2">Ejemplo proyecto académico (Ingeniería de Software)</p>
                <p className="text-sm font-semibold text-[#1a2e4a] mb-1">App móvil de reserva de canchas deportivas · Proyecto de tesis · 2024-2025</p>
                <ul className="text-sm text-[#1a2e4a]/85 space-y-1 list-disc pl-5">
                  <li>Desarrollé app full-stack con React Native + Node.js + PostgreSQL para reserva online de canchas en mi ciudad</li>
                  <li>Lideré equipo de 3 personas: arquitectura, backend, pruebas. Defendida con nota 19/20</li>
                  <li>App piloto con 4 canchas asociadas y 80 usuarios registrados durante el período de evaluación</li>
                </ul>
              </div>

              <h2 id="habilidades">Habilidades técnicas y blandas para recién graduados</h2>
              <div className="not-prose my-6 overflow-x-auto rounded-2xl border border-[#1a2e4a]/10">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#1a2e4a] text-white">
                      <th className="px-4 py-3 text-left font-semibold">Área</th>
                      <th className="px-4 py-3 text-left font-semibold">Habilidades técnicas</th>
                      <th className="px-4 py-3 text-left font-semibold">Habilidades blandas relevantes</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {[
                      ["Tecnología", "Python, JavaScript, React, Git, SQL, AWS básico", "Resolución de problemas, aprendizaje continuo"],
                      ["Marketing", "Google Analytics, Meta Ads, SEO, Canva, HubSpot", "Creatividad, análisis de datos, comunicación"],
                      ["Finanzas", "Excel avanzado, modelado financiero, SAP básico, NIIF", "Atención al detalle, pensamiento analítico"],
                      ["Salud", "Atención al paciente, RCP, sistemas EMR, protocolos clínicos", "Empatía, manejo de estrés, ética profesional"],
                      ["Educación", "Diseño de clases, Moodle, Google Classroom, evaluación formativa", "Paciencia, comunicación, planificación"],
                    ].map(([a, t, b], i) => (
                      <tr key={i} className={i % 2 === 1 ? "bg-[#00D4FF]/5 border-b border-[#1a2e4a]/10" : "border-b border-[#1a2e4a]/10"}>
                        <td className="px-4 py-3 font-semibold text-[#1a2e4a]">{a}</td>
                        <td className="px-4 py-3 text-[#1a2e4a]/80">{t}</td>
                        <td className="px-4 py-3 text-[#1a2e4a]/80">{b}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h2 id="extras">Voluntariado, becas y extracurriculares</h2>
              <p>
                Incluye solo si <strong>tuviste responsabilidad real</strong>: liderar un equipo, gestionar un presupuesto, coordinar un evento, enseñar algo. Decorativo (&quot;participé en feria de la facultad&quot;) ocupa espacio sin agregar valor. Las becas académicas, especialmente competitivas, siempre van — son señales fuertes de excelencia.
              </p>

              <h2 id="ejemplos">5 ejemplos completos por área profesional</h2>
              <div className="not-prose space-y-4 my-8">
                <div className="rounded-2xl border border-[#1a2e4a]/10 bg-white p-5">
                  <p className="text-xs font-semibold uppercase tracking-widest text-[#00D4FF] mb-2 flex items-center gap-2"><GraduationCap className="h-3.5 w-3.5" />Tecnología — Desarrollador Junior</p>
                  <p className="text-sm text-[#1a2e4a]/85 leading-relaxed">
                    Sección estrella: <strong>proyectos personales en GitHub</strong>. 2-3 repos públicos con README serio. Tecnologías agrupadas: Frontend (React, TypeScript), Backend (Node.js, Python), DevOps (Git, Docker básico). Práctica profesional + 2 hackathones + tesis técnica. Promedio si supera 8.0.
                  </p>
                </div>
                <div className="rounded-2xl border border-[#1a2e4a]/10 bg-white p-5">
                  <p className="text-xs font-semibold uppercase tracking-widest text-[#00D4FF] mb-2 flex items-center gap-2"><GraduationCap className="h-3.5 w-3.5" />Marketing — Asistente de Marketing Digital</p>
                  <p className="text-sm text-[#1a2e4a]/85 leading-relaxed">
                    Sección estrella: <strong>portfolio de campañas</strong> con métricas (engagement, alcance, CTR). Certificaciones Google Analytics + Meta Blueprint. Práctica profesional + manejo de redes sociales personales con audiencia. Idioma inglés B2+ es decisivo en este sector.
                  </p>
                </div>
                <div className="rounded-2xl border border-[#1a2e4a]/10 bg-white p-5">
                  <p className="text-xs font-semibold uppercase tracking-widest text-[#00D4FF] mb-2 flex items-center gap-2"><GraduationCap className="h-3.5 w-3.5" />Salud — Enfermera/o Junior</p>
                  <p className="text-sm text-[#1a2e4a]/85 leading-relaxed">
                    Sección estrella: <strong>prácticas hospitalarias detalladas</strong> con áreas (UCI, urgencias, pediatría) y procedimientos. Certificaciones (RCP, BLS, ACLS si aplica). Idiomas. Voluntariados en campañas de salud son altamente valorados.
                  </p>
                </div>
                <div className="rounded-2xl border border-[#1a2e4a]/10 bg-white p-5">
                  <p className="text-xs font-semibold uppercase tracking-widest text-[#00D4FF] mb-2 flex items-center gap-2"><GraduationCap className="h-3.5 w-3.5" />Educación — Docente Recién Titulado</p>
                  <p className="text-sm text-[#1a2e4a]/85 leading-relaxed">
                    Sección estrella: <strong>prácticas profesionales</strong> con curso, nivel, número de alumnos y proyectos pedagógicos. Materiales propios creados, plataformas (Moodle, Classroom). Voluntariado educativo con métricas (X niños beneficiados).
                  </p>
                </div>
                <div className="rounded-2xl border border-[#1a2e4a]/10 bg-white p-5">
                  <p className="text-xs font-semibold uppercase tracking-widest text-[#00D4FF] mb-2 flex items-center gap-2"><GraduationCap className="h-3.5 w-3.5" />Finanzas — Analista Junior</p>
                  <p className="text-sm text-[#1a2e4a]/85 leading-relaxed">
                    Sección estrella: <strong>Excel/modelado financiero + proyecto de tesis cuantitativo</strong>. Certificaciones Bloomberg Market Concepts o equivalentes. Práctica en consultora o banco. Promedio alto + inglés C1 son determinantes.
                  </p>
                </div>
              </div>

              <div className="not-prose rounded-2xl border border-amber-200 bg-amber-50/50 p-5 sm:p-6 my-8 flex gap-4">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-[#1a2e4a] text-sm sm:text-base mb-1.5">Antes de postular: valida tu CV contra el ATS</p>
                  <p className="text-sm text-[#1a2e4a]/80 leading-relaxed">
                    Los CVs de recién graduados son los que más fallan en el ATS por falta de keywords del puesto. Con el <Link href={`/${locale}/tools/ats-checker`}>puntaje ATS de ReadyCV PRO</Link> validas tu match con cada oferta antes de enviar. Empieza desde una <Link href={`/${locale}/templates`}>plantilla ATS-verificada</Link> diseñada para perfiles junior.
                  </p>
                </div>
              </div>

              <h2 id="errores">Errores comunes en CV de recién graduado</h2>
              <div className="not-prose space-y-3 my-8">
                {[
                  { title: "Inflar fechas o cargos", text: "Si fuiste practicante 4 meses, ponlo así. Mentir en fechas se detecta en la entrevista y descarta inmediatamente." },
                  { title: "Copiar plantillas de internet sin adaptar", text: "Las plantillas genéricas se notan. Personaliza objetivo, habilidades y bullets para cada oferta concreta." },
                  { title: "Llenar 2 páginas sin contenido", text: "Una página bien aprovechada gana siempre frente a dos páginas con relleno." },
                  { title: "Listar materias de la carrera completas", text: "Solo las 3-5 más relevantes para el rol. No es un certificado analítico." },
                  { title: "Omitir el email profesional", text: "Crea uno con tu nombre. Emails de adolescencia (sk8erboy@...) descartan en segundos." },
                  { title: "No incluir LinkedIn", text: "Un perfil de LinkedIn actualizado es obligatorio en 2026, incluso para recién graduados." },
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

              <div className="not-prose grid sm:grid-cols-3 gap-4 my-8">
                {[
                  { icon: CheckCircle2, title: "Amplifica, no infles", text: "Cada práctica y proyecto con la misma rigurosidad de un empleo formal." },
                  { icon: Sparkles, title: "Honestidad con confianza", text: "Enmarca tu perfil con seguridad — no te disculpes por la falta de experiencia." },
                  { icon: CheckCircle2, title: "Personaliza por oferta", text: "El CV genérico es el principal enemigo del recién graduado." },
                ].map(({ icon: Icon, title, text }, i) => (
                  <div key={i} className="rounded-2xl border border-emerald-100 bg-emerald-50/30 p-5">
                    <Icon className="h-5 w-5 mb-3 text-emerald-600" />
                    <p className="font-semibold text-[#1a2e4a] text-sm mb-1.5">{title}</p>
                    <p className="text-sm text-[#1a2e4a]/75 leading-relaxed">{text}</p>
                  </div>
                ))}
              </div>

              <p>
                Tu CV de recién graduado no compite por experiencia — compite por <strong>potencial bien estructurado</strong>. El reclutador que ve un CV claro, con prácticas y proyectos presentados como experiencia legítima, le dará la entrevista a ese candidato antes que al que escondió su perfil bajo plantillas genéricas.
              </p>
            </BlogProse>

            <div className="mt-16">
              <BlogFAQ items={faqs} title="Preguntas frecuentes" />
            </div>

            <div className="mt-16">
              <BlogAtsPreview locale={locale} variant="data" />

              <BlogCTA
                locale={locale}
                title="Tu primer CV profesional, listo en minutos."
                description="ReadyCV PRO incluye plantillas ATS-verificadas diseñadas específicamente para perfiles junior y recién egresados, con AI que transforma tus prácticas y proyectos académicos en bullets cuantificados. Empieza en menos de dos minutos."
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

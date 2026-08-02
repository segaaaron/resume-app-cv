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
import {
  EJEMPLOS_CV_SIN_EXPERIENCIA,
  HABILIDADES_TECNICAS_QUE_VALEN,
} from "@/lib/blog/cv-sin-experiencia-data"

const SLUG = "cv-sin-experiencia"
const DATE_PUBLISHED = "2026-06-01"
const DATE_MODIFIED = "2026-06-01"
const READING_TIME = 11
const LOCALE_TARGET = "es"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "metadata.blog_cv_sin_experiencia" })
  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: `https://www.valhallaresume.com/${locale}/blog/${SLUG}`,
      languages: {
        es: `https://www.valhallaresume.com/es/blog/${SLUG}`,
        "x-default": `https://www.valhallaresume.com/es/blog/${SLUG}`,
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

export default async function CVSinExperienciaPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  if (locale !== LOCALE_TARGET) notFound()

  const tBlog = await getTranslations("blog")

  const TITLE = "Cómo Hacer un CV Sin Experiencia (Guía Completa 2026 + 8 Ejemplos)"
  const SUBTITLE =
    "El dilema clásico: necesitas experiencia para tener experiencia. Pero un CV sin experiencia bien estructurado — con proyectos, voluntariado y habilidades técnicas reales — vence a CVs genéricos con experiencia mediocre. Aquí está cómo."
  const TAG = "CV Sin Experiencia"

  const toc = [
    { id: "intro", label: "El dilema del CV sin experiencia" },
    { id: "por-que", label: "Por qué necesita enfoque distinto" },
    { id: "estructura", label: "Estructura ideal del CV sin experiencia" },
    { id: "objetivo", label: "Objetivo profesional sin experiencia (fórmula)" },
    { id: "proyectos", label: "Cómo convertir proyectos académicos en experiencia" },
    { id: "habilidades-tecnicas", label: "Habilidades técnicas que valen MÁS que experiencia" },
    { id: "habilidades-blandas", label: "Habilidades blandas que destacar" },
    { id: "voluntariado", label: "Voluntariado, prácticas y cursos online" },
    { id: "educacion", label: "Cómo destacar la educación" },
    { id: "ejemplos", label: "8 ejemplos completos por área" },
    { id: "errores", label: "Errores comunes" },
    { id: "carta", label: "Carta de presentación complementaria" },
    { id: "faq", label: "Preguntas frecuentes" },
  ]

  const faqs = [
    {
      q: "Si nunca trabajé formalmente, ¿qué pongo en la sección de experiencia laboral?",
      a: "Renombra la sección a &quot;Experiencia y Proyectos&quot; y rellénala con prácticas profesionales, proyectos académicos finales, voluntariados con responsabilidad real y trabajos puntuales freelance. Todo se presenta con la misma estructura formal: cargo, organización, fechas y 2-3 bullets con métricas.",
    },
    {
      q: "¿Es mejor un CV sin experiencia de 1 página o de 2?",
      a: "Una página, siempre. Si no llenas una página con contenido sustancial, el problema no es la longitud — son los proyectos, voluntariado y cursos que faltan agregar. Dos páginas con relleno se ven peor que una página bien aprovechada.",
    },
    {
      q: "¿Las certificaciones online (Coursera, Platzi, Google) cuentan como experiencia?",
      a: "Cuentan como educación complementaria fuerte si tienen examen final o proyecto entregable. Una certificación &quot;he visto los videos&quot; sin evaluación no cuenta. Una certificación Google Analytics 4 con examen oficial, sí — y va arriba en tu CV.",
    },
    {
      q: "¿Pongo trabajos de medio tiempo durante la carrera aunque no sean del área?",
      a: "Solo si transmiten habilidades transferibles relevantes — gestión de tiempo, atención al cliente, trabajo en equipo, responsabilidad. Un trabajo de mesero 2 años demuestra constancia. La clave: enfócate en habilidades aprendidas, no en el cargo.",
    },
    {
      q: "¿Es buena idea poner una foto en el CV sin experiencia?",
      a: "Depende del país. España, México y la mayor parte de LATAM: foto profesional sí. USA, UK, Canadá, Australia: no. La foto bien tomada (fondo neutro, ropa formal, sonrisa contenida) puede agregar profesionalismo cuando el contenido es limitado.",
    },
    {
      q: "¿Cómo respondo en la entrevista cuando preguntan &quot;cuéntame de tu experiencia laboral&quot; si no tengo?",
      a: "Reframea la pregunta: &quot;Mi experiencia más relevante hasta ahora ha sido X proyecto académico / voluntariado / práctica donde Y...&quot;. Nunca empieces con &quot;no tengo experiencia&quot; — siempre empieza con lo que sí tienes, en el lenguaje del rol.",
    },
  ]

  const relatedItems = [
    { slug: "cv-recien-graduado", title: "CV para Recién Graduados Universitarios", desc: "La guía paralela enfocada en recién egresados con prácticas y proyectos académicos.", tag: "CV Sin Experiencia", readingTime: 10 },
    { slug: "objetivo-profesional-ejemplos", title: "50 Ejemplos de Objetivo Profesional", desc: "Incluye categoría completa de candidatos sin experiencia laboral con ejemplos.", tag: "Objetivo Profesional", readingTime: 10 },
    { slug: "habilidades-para-cv", title: "Habilidades para CV: 200+ Skills por Industria", desc: "200+ habilidades por industria — el insumo para tu sección de habilidades técnicas.", tag: "Habilidades CV", readingTime: 11 },
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
        keywords={["cv sin experiencia", "curriculum sin experiencia", "primer empleo cv", "cv estudiante", "cv sin experiencia laboral"]}
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
                &quot;Necesitas experiencia para tener experiencia&quot; es el dilema más repetido por candidatos jóvenes — y también el más superable. La realidad: un CV sin experiencia bien estructurado, con proyectos académicos serios, certificaciones reales, habilidades técnicas valiosas y voluntariado con responsabilidad, vence sistemáticamente a CVs genéricos con dos años de experiencia mediocre.
              </p>
              <p>
                Esta guía te enseña la estructura exacta, qué incluir en cada bloque, qué habilidades técnicas hoy valen más que años de trabajo, y entrega 8 ejemplos completos por área profesional para que veas el patrón aplicado.
              </p>

              <div className="not-prose my-10">
                <BlogTableOfContents items={toc} title="En esta página" />
              </div>

              <h2 id="intro">El dilema del CV sin experiencia</h2>
              <p>
                La verdad incómoda es que el mercado <em>sí</em> valora la experiencia — pero también valora la <strong>capacidad demostrada</strong>. Un CV sin experiencia laboral formal puede demostrar capacidad de cinco formas: proyectos académicos cuantificados, certificaciones con examen oficial, dominio de herramientas técnicas, voluntariado con métricas reales y trabajo freelance puntual. Combina las cinco y tu &quot;cero experiencia&quot; se vuelve un perfil con contenido real.
              </p>

              <h2 id="por-que">Por qué tu CV sin experiencia necesita enfoque distinto</h2>
              <ul>
                <li><strong>Tu activo más fuerte no es la trayectoria, sino la educación.</strong> Va arriba, desarrollada, no enterrada al final.</li>
                <li><strong>Las habilidades técnicas pesan más que los cargos.</strong> Excel avanzado, Figma, Python básico, Google Analytics — diferenciadores reales en 2026.</li>
                <li><strong>Cada proyecto debe presentarse como un empleo formal.</strong> Misma estructura: contexto, acción, resultado cuantificado.</li>
                <li><strong>El objetivo profesional reemplaza al resumen de carrera.</strong> Es donde enmarcas tu perfil con confianza para el reclutador.</li>
                <li><strong>El voluntariado con responsabilidad cuenta como experiencia laboral legítima.</strong> Si lideraste algo medible, va igual que un empleo.</li>
              </ul>

              <h2 id="estructura">Estructura ideal del CV sin experiencia</h2>
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
                      ["2", "Objetivo profesional", "Enmarca tu perfil con confianza. 2-3 líneas."],
                      ["3", "Habilidades técnicas", "Tu activo diferenciador — va antes de educación."],
                      ["4", "Educación", "Universidad, carrera, año, promedio (si supera 8.0/10), honors."],
                      ["5", "Experiencia y proyectos", "Prácticas, proyectos académicos finales, freelance puntual, voluntariado con responsabilidad."],
                      ["6", "Certificaciones", "Cursos con examen oficial o proyecto entregable."],
                      ["7", "Voluntariado / Extracurriculares", "Si no fueron en sección 5, van aquí."],
                      ["8", "Idiomas", "Con nivel CEFR (A1-C2) o certificado oficial."],
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

              <h2 id="objetivo">Objetivo profesional sin experiencia (fórmula)</h2>
              <p>
                La fórmula que funciona: <strong>perfil académico + fortaleza concreta demostrable + rol al que aspiras + valor que aportas</strong>. Sin disculparte por la falta de experiencia, sin clichés como &quot;dispuesto a aprender&quot;.
              </p>
              <p>
                Mira los 8 ejemplos por área en la sección de abajo — cada uno aplica la fórmula con vocabulario, fortalezas y métricas específicas del sector.
              </p>

              <h2 id="proyectos">Cómo convertir proyectos académicos en experiencia</h2>
              <p>
                Un proyecto académico bien presentado vale tanto como un empleo de 6 meses. Estrúctúralo como un empleo: <strong>nombre del proyecto, contexto (materia, tesis, hackathon), tu rol específico, tecnologías o metodologías, resultado o entregable medible</strong>.
              </p>
              <div className="not-prose rounded-2xl border border-[#00D4FF]/20 bg-[#00D4FF]/5 p-5 my-6">
                <p className="text-xs font-semibold uppercase tracking-widest text-[#00D4FF] mb-2">Ejemplo: proyecto presentado como experiencia</p>
                <p className="text-sm font-semibold text-[#1a2e4a] mb-1">Desarrolladora Full-Stack · Proyecto de Tesis &quot;ReservaPro&quot; · ago 2024 – may 2025</p>
                <ul className="text-sm text-[#1a2e4a]/85 space-y-1 list-disc pl-5">
                  <li>Diseñé y desarrollé app web de reserva de canchas deportivas con Next.js 15, PostgreSQL y autenticación NextAuth</li>
                  <li>Lideré equipo de 3 personas: arquitectura, backend y testing. Defendida con nota 19/20 ante panel de 3 docentes</li>
                  <li>App piloto en producción con 4 canchas asociadas, 80 usuarios registrados y 12 reservas/semana durante evaluación</li>
                </ul>
              </div>

              <h2 id="habilidades-tecnicas">Habilidades técnicas que valen MÁS que experiencia</h2>
              <p>
                En 2026, hay habilidades técnicas que diferencian un perfil junior tanto que compensan años de experiencia mediocre. Aquí las áreas y herramientas que más mueven la aguja para candidatos sin trayectoria laboral formal:
              </p>
              <div className="not-prose space-y-3 my-6">
                {HABILIDADES_TECNICAS_QUE_VALEN.map((h) => (
                  <div key={h.area} className="rounded-2xl border border-[#1a2e4a]/10 bg-white p-5">
                    <p className="font-semibold text-[#1a2e4a] text-sm sm:text-base mb-2">{h.area}</p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {h.herramientas.map((tool) => (
                        <span key={tool} className="inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-br from-[#00D4FF]/10 to-[#1a2e4a]/5 text-[#1a2e4a] text-xs font-medium border border-[#00D4FF]/15">
                          {tool}
                        </span>
                      ))}
                    </div>
                    <p className="text-sm text-[#1a2e4a]/75 leading-relaxed">{h.razon}</p>
                  </div>
                ))}
              </div>

              <h2 id="habilidades-blandas">Habilidades blandas que destacar sin experiencia</h2>
              <p>
                Sin experiencia laboral, las habilidades blandas se vuelven más importantes — pero también más difíciles de demostrar. La regla: <strong>nunca listes una habilidad blanda sin contexto que la respalde</strong>. &quot;Trabajo en equipo&quot; es palabra vacía; &quot;Trabajo en equipo: lideré grupo de 4 personas en proyecto final con nota 18/20&quot; es real.
              </p>
              <ul>
                <li><strong>Comunicación:</strong> respaldada con ponencias, presentaciones académicas o moderación de grupos.</li>
                <li><strong>Liderazgo:</strong> demostrado con cargo en federación estudiantil, equipo deportivo o ONG.</li>
                <li><strong>Resolución de problemas:</strong> evidenciado en hackathones, competencias técnicas o casos prácticos.</li>
                <li><strong>Adaptabilidad:</strong> respaldada con intercambios académicos, trabajo en países distintos o cambios de carrera.</li>
                <li><strong>Iniciativa:</strong> demostrada con proyectos personales, emprendimientos pequeños o contenido propio.</li>
              </ul>

              <h2 id="voluntariado">Voluntariado, prácticas y cursos online</h2>
              <p>
                Incluye solo voluntariado con <strong>responsabilidad real medible</strong>: lideraste un equipo, gestionaste un presupuesto, coordinaste un evento, enseñaste algo a X personas. El voluntariado decorativo (&quot;participé en feria de la facultad&quot;) ocupa espacio sin agregar valor.
              </p>
              <p>
                Para cursos online, prioriza los que terminan en <strong>certificación con examen oficial o proyecto entregable</strong>: Google Analytics 4 (gratis con examen), Meta Blueprint, HubSpot Academy, AWS Cloud Practitioner Essentials, IBM Data Science. Estos van arriba, junto a las habilidades técnicas. Los cursos de &quot;he visto los videos&quot; sin evaluación, no.
              </p>

              <h2 id="educacion">Cómo destacar la educación</h2>
              <p>
                Cuando es tu activo más fuerte, no la resumas a una línea — desarróllala con todo lo siguiente que aplique:
              </p>
              <ul>
                <li><strong>Promedio:</strong> incluir si supera 8.0/10 o 3.5/4.0.</li>
                <li><strong>Distinciones:</strong> cuadro de honor, beca académica, top 10% de la promoción.</li>
                <li><strong>Materias relevantes:</strong> 3-5 cursos vinculados al rol que buscas.</li>
                <li><strong>Tesis o proyecto final:</strong> título + resultado o métrica.</li>
                <li><strong>Intercambios académicos:</strong> universidad, país, duración.</li>
              </ul>

              <h2 id="ejemplos">8 ejemplos completos por área profesional</h2>
              <div className="not-prose space-y-4 my-8">
                {EJEMPLOS_CV_SIN_EXPERIENCIA.map((e) => (
                  <div key={e.id} className="rounded-2xl border border-[#1a2e4a]/10 bg-white p-5 sm:p-6 hover:shadow-md hover:border-[#1a2e4a]/20 transition-all">
                    <p className="text-xs font-semibold uppercase tracking-widest text-[#00D4FF] mb-2 flex items-center gap-2">
                      <GraduationCap className="h-3.5 w-3.5" />
                      {e.area}
                    </p>
                    <p className="text-sm text-[#1a2e4a]/70 italic mb-3">{e.perfil}</p>
                    <div className="mb-3">
                      <p className="text-xs font-semibold text-[#1a2e4a] mb-1">Sección estrella:</p>
                      <p className="text-sm text-[#1a2e4a]/80">{e.seccionEstrella}</p>
                    </div>
                    <div className="mb-3">
                      <p className="text-xs font-semibold text-[#1a2e4a] mb-1">Objetivo profesional:</p>
                      <p className="text-sm text-[#1a2e4a]/85 italic">&quot;{e.objetivoEjemplo}&quot;</p>
                    </div>
                    <div className="mb-3">
                      <p className="text-xs font-semibold text-[#1a2e4a] mb-1.5">Habilidades clave:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {e.habilidadesClave.map((skill) => (
                          <span key={skill} className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#1a2e4a]/5 text-[#1a2e4a] text-xs font-medium border border-[#1a2e4a]/10">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-emerald-700 mb-1">Refuerzo recomendado:</p>
                      <p className="text-sm text-[#1a2e4a]/75 leading-relaxed">{e.proyectosVoluntariadoTip}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="not-prose rounded-2xl border border-amber-200 bg-amber-50/50 p-5 sm:p-6 my-8 flex gap-4">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-[#1a2e4a] text-sm sm:text-base mb-1.5">Antes de postular: valida contra el ATS</p>
                  <p className="text-sm text-[#1a2e4a]/80 leading-relaxed">
                    Los CVs sin experiencia son los que más fallan en el ATS por falta de keywords del puesto. Con el <Link href={`/${locale}/tools/ats-checker`}>puntaje ATS de Valhalla Resume PRO</Link> validas tu match con cada oferta antes de enviar. Empieza desde una <Link href={`/${locale}/templates`}>plantilla ATS-verificada</Link> diseñada para perfiles junior y sin experiencia formal.
                  </p>
                </div>
              </div>

              <h2 id="errores">Errores comunes en CV sin experiencia</h2>
              <div className="not-prose space-y-3 my-8">
                {[
                  { title: "Inflar fechas, cargos o responsabilidades", text: "Si fuiste practicante 3 meses, ponlo así. Mentir se detecta en la entrevista y descarta inmediatamente." },
                  { title: "Copiar plantillas genéricas de internet sin adaptar", text: "Las plantillas genéricas se notan. Personaliza objetivo, habilidades y proyectos para cada oferta concreta." },
                  { title: "Llenar 2 páginas sin contenido real", text: "Una página bien aprovechada gana siempre frente a dos páginas con relleno. Si no llenas una, agrega proyectos y cursos en lugar de estirar." },
                  { title: "Omitir voluntariado relevante por considerarlo &quot;menor&quot;", text: "Si lideraste algo medible, va en experiencia legítima — no en una sección decorativa al final." },
                  { title: "No incluir LinkedIn actualizado", text: "Perfil de LinkedIn con foto profesional, headline claro y secciones completas es obligatorio en 2026, incluso para perfiles sin experiencia." },
                  { title: "Listar todas las materias de la carrera", text: "Solo las 3-5 más relevantes para el rol. El CV no es un certificado analítico." },
                ].map(({ title, text }, i) => (
                  <div key={i} className="flex gap-4 rounded-2xl border border-rose-100 bg-rose-50/40 p-4 sm:p-5">
                    <XCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-[#1a2e4a] text-sm sm:text-base mb-1" dangerouslySetInnerHTML={{ __html: title }} />
                      <p className="text-sm text-[#1a2e4a]/75 leading-relaxed">{text}</p>
                    </div>
                  </div>
                ))}
              </div>

              <h2 id="carta">Carta de presentación complementaria</h2>
              <p>
                En CVs sin experiencia, la carta de presentación deja de ser opcional — es donde explicas con narrativa cómo tu perfil académico, proyectos y voluntariado te preparan para el rol. Una página, tres párrafos: <strong>por qué este rol tiene sentido en mi historia + qué traigo de mi formación que es valioso + por qué esta empresa específica</strong>.
              </p>

              <div className="not-prose grid sm:grid-cols-3 gap-4 my-8">
                {[
                  { icon: CheckCircle2, title: "Amplifica, no infles", text: "Cada proyecto y voluntariado con la misma rigurosidad de un empleo formal." },
                  { icon: Sparkles, title: "Honestidad con confianza", text: "Enmarca tu perfil con seguridad — no te disculpes por la falta de experiencia." },
                  { icon: CheckCircle2, title: "Habilidades técnicas arriba", text: "Tu activo diferenciador va antes que la educación, no enterrado al final." },
                ].map(({ icon: Icon, title, text }, i) => (
                  <div key={i} className="rounded-2xl border border-emerald-100 bg-emerald-50/30 p-5">
                    <Icon className="h-5 w-5 mb-3 text-emerald-600" />
                    <p className="font-semibold text-[#1a2e4a] text-sm mb-1.5">{title}</p>
                    <p className="text-sm text-[#1a2e4a]/75 leading-relaxed">{text}</p>
                  </div>
                ))}
              </div>

              <p>
                Sin experiencia no significa sin contenido. Significa que el contenido viene de otras fuentes — formación, proyectos, certificaciones, voluntariado, habilidades técnicas reales — y que tu trabajo es presentarlo con la misma estructura formal que tendría un empleo. Hazlo bien y el reclutador termina pensando &quot;esta persona ya está lista para empezar,&quot; no &quot;esta persona no tiene experiencia.&quot;
              </p>
            </BlogProse>

            <div className="mt-16">
              <BlogFAQ items={faqs} title="Preguntas frecuentes" />
            </div>

            <div className="mt-16">
              <BlogAtsPreview locale={locale} variant="data" />

              <BlogCTA
                locale={locale}
                title="Tu primer CV profesional, sin experiencia y con impacto."
                description="Valhalla Resume PRO incluye plantillas ATS-verificadas diseñadas para perfiles sin experiencia y junior, con IA que transforma proyectos académicos, voluntariado y cursos online en bullets cuantificados con estructura profesional. Empieza en menos de dos minutos."
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

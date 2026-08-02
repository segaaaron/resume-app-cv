import Link from "next/link"
import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { notFound } from "next/navigation"
import { CheckCircle2, XCircle, Sparkles, Target, AlertTriangle } from "lucide-react"

import BlogArticle from "@/components/blog/BlogArticle"
import BlogHero from "@/components/blog/BlogHero"
import BlogTableOfContents from "@/components/blog/BlogTableOfContents"
import BlogProse from "@/components/blog/BlogProse"
import BlogFAQ from "@/components/blog/BlogFAQ"
import BlogCTA from "@/components/blog/BlogCTA"
import BlogAtsPreview from "@/components/blog/BlogAtsPreview"
import BlogRelatedPosts from "@/components/blog/BlogRelatedPosts"
import BlogSchemas from "@/components/blog/BlogSchemas"

const SLUG = "habilidades-para-cv"
const SLUG_EN = "resume-skills-by-industry"
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
  const t = await getTranslations({ locale, namespace: "metadata.blog_habilidades_cv" })
  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: `https://www.valhallaresume.com/${locale}/blog/${SLUG}`,
      languages: {
        es: `https://www.valhallaresume.com/es/blog/${SLUG}`,
        en: `https://www.valhallaresume.com/en/blog/${SLUG_EN}`,
        "x-default": `https://www.valhallaresume.com/en/blog/${SLUG_EN}`,
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

type SkillGroup = { title: string; hard: string[]; soft: string[] }

export default async function HabilidadesParaCVPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  if (locale !== LOCALE_TARGET) notFound()

  const tBlog = await getTranslations("blog")

  const TITLE = "Habilidades para CV: 200+ Skills por Industria (Guía 2026)"
  const SUBTITLE =
    "Listar habilidades genéricas o las equivocadas es de las formas más rápidas de perder match en el ATS. Aquí están 200+ habilidades organizadas por industria, el proceso exacto para elegir las tuyas y dónde colocarlas para que un reclutador (y un algoritmo) las vean."
  const TAG = "Habilidades CV"

  const toc = [
    { id: "duras-vs-blandas", label: "Habilidades duras vs blandas (con ejemplos)" },
    { id: "elegir", label: "Cómo elegir las habilidades correctas para tu CV" },
    { id: "por-industria", label: "200+ habilidades por industria" },
    { id: "donde-colocar", label: "Dónde colocar las habilidades en tu CV" },
    { id: "ats", label: "Formato amigable con ATS" },
    { id: "errores", label: "5 errores que arruinan tu sección de habilidades" },
    { id: "faq", label: "Preguntas frecuentes" },
  ]

  const industries: SkillGroup[] = [
    {
      title: "Software y Tecnología",
      hard: [
        "JavaScript",
        "TypeScript",
        "Python",
        "Go",
        "Java",
        "React",
        "Next.js",
        "Node.js",
        "PostgreSQL",
        "MongoDB",
        "Redis",
        "Docker",
        "Kubernetes",
        "AWS (EC2, S3, Lambda)",
        "Google Cloud Platform",
        "Terraform",
        "CI/CD (GitHub Actions)",
        "REST y GraphQL APIs",
        "Diseño de sistemas",
        "Testing unitario y de integración",
      ],
      soft: ["Code review", "Colaboración asíncrona", "Documentación técnica", "Mentoría", "Ownership end-to-end"],
    },
    {
      title: "Datos e IA",
      hard: [
        "SQL avanzado (PostgreSQL, BigQuery)",
        "Python (pandas, numpy, scikit-learn)",
        "PyTorch",
        "TensorFlow",
        "dbt",
        "Airflow",
        "Spark",
        "Databricks",
        "Power BI",
        "Tableau",
        "Looker",
        "Pruebas A/B",
        "Modelado estadístico",
        "Feature engineering",
        "MLOps (MLflow, SageMaker)",
        "Forecasting de series temporales",
        "NLP",
        "Visión por computadora",
        "Inferencia causal",
        "Plataformas de experimentación",
      ],
      soft: ["Gestión de stakeholders", "Storytelling con datos", "Marco de hipótesis"],
    },
    {
      title: "Salud y Enfermería",
      hard: [
        "Valoración del paciente",
        "Terapia intravenosa (IV)",
        "Cuidado de heridas",
        "Triaje",
        "Historia clínica electrónica (Epic, OpenMRS)",
        "Cumplimiento HIPAA / RGPD sanitario",
        "Administración de medicación",
        "Flebotomía",
        "Interpretación de EKG",
        "Monitorización telemétrica",
        "BLS / ACLS / SVB / SVA",
        "RCP avanzada",
        "Supervisión de turno",
        "Documentación del plan de cuidados",
        "Control de infecciones",
        "Monitoreo de signos vitales",
        "Planificación del alta",
      ],
      soft: ["Empatía con el paciente", "Comunicación con familias", "Pase de guardia", "Manejo de crisis"],
    },
    {
      title: "Marketing y Crecimiento",
      hard: [
        "Google Ads",
        "Meta Ads Manager",
        "LinkedIn Ads",
        "Google Analytics 4",
        "SEO (técnico, on-page, link-building)",
        "Marketing de contenidos",
        "Email marketing (HubSpot, Mailchimp)",
        "Marketing automation",
        "Modelos de atribución",
        "Pruebas A/B",
        "CRO (optimización de conversión)",
        "Salesforce",
        "Webflow",
        "WordPress",
        "Figma",
        "Notion",
        "Lifecycle marketing",
        "Account-based marketing (ABM)",
        "Posicionamiento de marca",
      ],
      soft: ["Copywriting", "Briefs interfuncionales", "Gestión de proveedores"],
    },
    {
      title: "Finanzas y Contabilidad",
      hard: [
        "Excel avanzado (tablas dinámicas, BUSCARV/INDICE)",
        "Modelado financiero (3 estados, DCF, LBO)",
        "QuickBooks",
        "NetSuite",
        "SAP",
        "Contpaqi / Aspel (LATAM)",
        "Normativa NIIF / IFRS / US GAAP",
        "Cierre mensual",
        "Análisis de varianzas",
        "Presupuestos y forecasting",
        "Ownership de P&G",
        "Tesorería y flujo de caja",
        "Soporte a auditoría (Big 4)",
        "Cumplimiento fiscal (IVA, IRPF, ISR)",
        "Cuentas por pagar / por cobrar",
        "Conciliaciones bancarias",
        "Certificaciones CPA / CFA / Contador Público",
      ],
      soft: ["Comunicación ejecutiva", "Alineación entre áreas"],
    },
    {
      title: "Ventas y Desarrollo de Negocio",
      hard: [
        "Salesforce",
        "HubSpot CRM",
        "Outreach",
        "Apollo",
        "ZoomInfo",
        "LinkedIn Sales Navigator",
        "Gong",
        "Gestión de pipeline",
        "Forecasting comercial",
        "Metodología MEDDIC / MEDDPICC",
        "SPIN selling",
        "Challenger Sale",
        "Llamadas de discovery",
        "Demo de producto",
        "Negociación de contratos",
        "Expansión de cuentas (land & expand)",
        "Alianzas comerciales",
        "Prospección outbound",
      ],
      soft: ["Escucha activa", "Manejo de objeciones", "Presencia ejecutiva"],
    },
    {
      title: "Educación y Docencia",
      hard: [
        "Planeación de clases",
        "Instrucción diferenciada",
        "Gestión del aula",
        "Diseño curricular",
        "Estándares LOMLOE / SEP / por país",
        "Google Classroom",
        "Moodle",
        "Canvas LMS",
        "Evaluación formativa y sumativa",
        "Aprendizaje híbrido",
        "Estrategias ELE / ELE2",
        "Disciplina restaurativa",
        "Preparación para pruebas estandarizadas",
        "Intervenciones de lectura",
      ],
      soft: ["Reuniones con familias", "Colaboración entre niveles", "Mentoría a estudiantes"],
    },
    {
      title: "Ingeniería (Mecánica, Civil, Eléctrica)",
      hard: [
        "AutoCAD",
        "SolidWorks",
        "Revit",
        "MATLAB",
        "ANSYS",
        "SAP2000",
        "Bluebeam Revu",
        "Análisis por elementos finitos (FEA)",
        "Programación de PLCs",
        "Diseño PCB (Altium)",
        "Six Sigma (Cinta Verde / Negra)",
        "Manufactura Lean",
        "GD&T (Tolerancias geométricas)",
        "Cumplimiento OSHA / normativa local",
        "Gestión del ciclo de vida del proyecto",
        "Listas de materiales (BOM)",
      ],
      soft: ["Coordinación entre disciplinas", "Gestión de proveedores y contratistas"],
    },
    {
      title: "Atención al Cliente y Hostelería",
      hard: [
        "Zendesk",
        "Intercom",
        "Freshdesk",
        "Salesforce Service Cloud",
        "Herramientas de chat en vivo",
        "Macros y flujos automatizados",
        "Categorización de tickets",
        "Gestión de SLA",
        "Sistemas POS",
        "Opera PMS (hoteles)",
        "Sistemas de reservas",
        "Soporte bilingüe (ES/EN)",
        "Manejo de escalamientos",
        "Soporte por voz y email",
        "Redacción de bases de conocimiento",
      ],
      soft: ["Desescalada de conflictos", "Empatía", "Pase de turno", "Conciencia de upsell"],
    },
    {
      title: "Producto, Diseño y UX",
      hard: [
        "Figma",
        "Sketch",
        "Adobe XD",
        "Framer",
        "Maze",
        "Dovetail",
        "Notion",
        "Jira",
        "Linear",
        "Planificación de roadmap",
        "Redacción de PRDs",
        "Investigación de usuarios (cualitativa y cuantitativa)",
        "Pruebas de usabilidad",
        "Arquitectura de información",
        "Sistemas de diseño",
        "Accesibilidad (WCAG 2.2)",
        "Prototipado",
        "Mapeo de user journeys",
      ],
      soft: ["Alineación de stakeholders", "Crítica de diseño", "Escritura asíncrona"],
    },
  ]

  const faqs = [
    {
      q: "¿Cuántas habilidades debo listar en mi CV?",
      a: "Entre 8 y 15 en una sección dedicada. Menos de 8 parece poca preparación; más de 15 diluye el mensaje y obliga al reclutador a saltar la sección. Prioriza las habilidades que aparecen literalmente en la oferta de trabajo y añade 3-5 complementarias.",
    },
    {
      q: "¿Debo listar las habilidades por categorías o como lista plana?",
      a: "Las categorías ganan en todo nivel superior a junior. Agrupa por Técnicas / Herramientas / Metodologías (o equivalente). Las categorías ayudan al reclutador a escanear en 3 segundos y permiten al ATS parsear subsecciones sin perder contexto.",
    },
    {
      q: "¿Vale la pena listar habilidades blandas?",
      a: "Solo si la oferta las nombra explícitamente y solo cuando van acompañadas de evidencia. 'Buena comunicación' es relleno. 'Lideré la reunión semanal de coordinación entre ingeniería, diseño y customer success' demuestra comunicación sin proclamarla. Lleva las habilidades blandas a tus bullets de experiencia siempre que puedas.",
    },
    {
      q: "¿Debo incluir niveles de dominio (Básico, Intermedio, Avanzado)?",
      a: "No. La autoevaluación es ruido — todos los candidatos escriben 'Avanzado' al lado de todo. Si necesitas mostrar profundidad, hazlo a través de tus bullets de experiencia ('Lideré migración de monolito a microservicios para 12M de usuarios'), no junto al nombre de la habilidad.",
    },
    {
      q: "¿Qué hago con habilidades que no encajan en ninguna categoría estándar?",
      a: "Crea una sección llamada 'Especialidades' o 'Conocimiento de Dominio' y agrúpalas ahí. Ejemplos: 'Ensayos clínicos Fase II/III', 'M&A transfronteriza', 'Escalamiento de manufactura para dispositivos médicos'. Los reclutadores valoran más las habilidades específicas de nicho que las genéricas.",
    },
    {
      q: "¿Cómo me aseguro de que mis habilidades pasen el ATS?",
      a: "Usa las cadenas exactas que aparecen en la oferta, deletrea los acrónimos al menos una vez (Search Engine Optimization (SEO)), evita iconos y barras de progreso, y mantén las habilidades en texto plano. El ATS Checker de Valhalla Resume te dice qué keywords del posting están presentes y cuáles faltan — la mayoría sube su match score 20+ puntos con 10 minutos de reescritura de skills.",
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
      slug: "verbos-de-accion-cv",
      title: "300+ Verbos de Acción para tu Currículum",
      desc: "El vocabulario que transforma una descripción de tareas en una historia de logros, por industria.",
      tag: "Redacción",
      readingTime: 7,
    },
    {
      slug: "como-pasar-el-ats",
      title: "Cómo Pasar el Filtro ATS en 2026",
      desc: "Lo que un ATS filtra de verdad es más estrecho de lo que te han contado. Las tácticas que sí funcionan.",
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
        keywords={["habilidades para cv", "skills cv", "habilidades duras", "habilidades blandas", "habilidades por industria", "ATS habilidades"]}
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
                Tu sección de habilidades es la parte más escaneada y menos pensada de tu CV. Los reclutadores le dedican 2-3 segundos antes de decidir si seguir leyendo; los sistemas ATS le dan un peso enorme al momento de puntuar el match de keywords. Aun así, la mayoría de candidatos pega una lista genérica de palabras de moda copiadas de un perfil de LinkedIn que actualizaron por última vez hace tres años.
              </p>
              <p>
                Esta guía soluciona eso. Vas a encontrar el proceso exacto para elegir tus habilidades (no solo listarlas), 200+ habilidades organizadas por diez industrias con desglose de duras y blandas, las reglas de colocación que premia el ATS, y los cinco errores que silenciosamente bajan tu match score. Cada ejemplo aquí es la cadena de texto real que un reclutador quiere ver — no un adjetivo vacío.
              </p>

              <div className="not-prose my-10">
                <BlogTableOfContents items={toc} title="En esta página" />
              </div>

              <h2 id="duras-vs-blandas">Habilidades duras vs blandas (con ejemplos)</h2>
              <p>
                Las <strong>habilidades duras</strong> se enseñan, se miden y normalmente involucran una herramienta, framework o metodología. Las <strong>habilidades blandas</strong> son patrones de comportamiento — más difíciles de verificar, más fáciles de inflar. El ATS valora casi exclusivamente las duras; los reclutadores valoran ambas, pero solo cuando las blandas vienen respaldadas por evidencia.
              </p>

              <div className="not-prose my-6 overflow-x-auto rounded-2xl border border-[#1a2e4a]/10">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#1a2e4a] text-white">
                      <th className="px-4 py-3 text-left font-semibold">Habilidad dura</th>
                      <th className="px-4 py-3 text-left font-semibold">Equivalente blanda</th>
                      <th className="px-4 py-3 text-left font-semibold">Dónde va</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {[
                      ["Administración de Salesforce", "Coordinación entre áreas", "Skills + experiencia"],
                      ["Python (pandas, scikit-learn)", "Marco de hipótesis", "Skills"],
                      ["AutoCAD", "Razonamiento espacial", "Skills"],
                      ["MEDDIC sales framework", "Instinto de discovery", "Bullet de experiencia"],
                      ["Epic / OpenMRS", "Empatía con el paciente", "Skills + evidencia en bullet"],
                      ["A/B testing (Optimizely, VWO)", "Mentalidad experimental", "Skills"],
                    ].map(([h, s, w], i) => (
                      <tr key={i} className={i % 2 === 1 ? "bg-[#00D4FF]/5 border-b border-[#1a2e4a]/10" : "border-b border-[#1a2e4a]/10"}>
                        <td className="px-4 py-3 font-medium text-[#1a2e4a]">{h}</td>
                        <td className="px-4 py-3 text-[#1a2e4a]/80">{s}</td>
                        <td className="px-4 py-3 text-[#1a2e4a]/80">{w}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p>
                Regla práctica: <strong>si una habilidad se puede aprender googleando en menos de 40 horas, es dura</strong>. Si vive en cómo te comportas o comunicas, es blanda. Las duras van en la sección de Habilidades. Las blandas deben aparecer como evidencia dentro de tus bullets de experiencia — nunca como palabras sueltas.
              </p>

              <h2 id="elegir">Cómo elegir las habilidades correctas para tu CV</h2>
              <p>
                Deja de listar cada habilidad que has tocado en tu vida. Usa este proceso de 4 pasos para cada postulación:
              </p>

              <h3>Paso 1 — Extrae el vocabulario de la oferta</h3>
              <p>
                Abre el posting y copia a un documento aparte cada sustantivo o frase nominal que aparezca más de una vez. Herramientas mencionadas, metodologías nombradas, frameworks listados. Esas son tus <strong>keywords obligatorias</strong> — el ATS literalmente busca esas cadenas exactas.
              </p>

              <h3>Paso 2 — Autoevalúate honestamente</h3>
              <p>
                Tres cubetas: <em>dominio</em> (entregaste trabajo real), <em>familiar</em> (lo usaste en un proyecto), <em>desconocido</em>. Solo lista las de dominio y las más fuertes de familiar. Inflar tus skills con cosas desconocidas se detecta en la entrevista técnica y es la razón #1 por la que candidatos senior son rechazados después de un screen prometedor.
              </p>

              <h3>Paso 3 — Mapea al orden de prioridad del puesto</h3>
              <p>
                Lista las habilidades en el orden que el posting prioriza, no alfabéticamente. Si la oferta empieza con &quot;TypeScript, React, GraphQL&quot;, tu sección de skills debe hacer lo mismo. Tanto el ATS como el lector humano hacen pattern-matching con más fuerza en las primeras 3-5 entradas.
              </p>

              <h3>Paso 4 — Rellena los huecos restantes con skills estratégicas adyacentes</h3>
              <p>
                Si te quedan 5 huecos después de las obligatorias, añade habilidades que señalan seniority (diseño de sistemas, mentoría, code review para tech; forecasting de pipeline, MEDDIC para ventas). Son los diferenciadores entre un perfil junior y uno senior con el mismo headline.
              </p>

              <h2 id="por-industria">200+ habilidades por industria</h2>
              <p>
                Estas listas no son exhaustivas — son las habilidades más buscadas y mejor puntuadas por ATS por industria en 2026. Úsalas como punto de partida y adapta con las herramientas específicas que mencione tu oferta objetivo.
              </p>

              {industries.map((ind) => (
                <div key={ind.title} className="not-prose my-8 rounded-2xl border border-[#1a2e4a]/10 bg-gradient-to-br from-white to-[#00D4FF]/3 p-5 sm:p-6">
                  <h3 className="text-lg sm:text-xl font-bold text-[#1a2e4a] mb-4 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#00D4FF]" />
                    {ind.title}
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-widest text-[#1a2e4a]/60 mb-2">Habilidades duras</p>
                      <ul className="space-y-1.5">
                        {ind.hard.map((s) => (
                          <li key={s} className="text-sm text-[#1a2e4a]/85 flex gap-2">
                            <CheckCircle2 className="h-3.5 w-3.5 text-[#00D4FF] shrink-0 mt-1" />
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-widest text-[#1a2e4a]/60 mb-2">Blandas / interpersonales</p>
                      <ul className="space-y-1.5">
                        {ind.soft.map((s) => (
                          <li key={s} className="text-sm text-[#1a2e4a]/85 flex gap-2">
                            <Sparkles className="h-3.5 w-3.5 text-[#00D4FF] shrink-0 mt-1" />
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}

              <h2 id="donde-colocar">Dónde colocar las habilidades en tu CV</h2>
              <p>Hay tres ubicaciones válidas. Elige la que encaje con tu seniority y tu industria:</p>

              <div className="not-prose my-6 overflow-x-auto rounded-2xl border border-[#1a2e4a]/10">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#1a2e4a] text-white">
                      <th className="px-4 py-3 text-left font-semibold">Ubicación</th>
                      <th className="px-4 py-3 text-left font-semibold">Mejor para</th>
                      <th className="px-4 py-3 text-left font-semibold">Trade-off</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    <tr className="border-b border-[#1a2e4a]/10">
                      <td className="px-4 py-3 font-semibold text-[#1a2e4a]">Arriba, bajo el resumen</td>
                      <td className="px-4 py-3 text-[#1a2e4a]/80">Cambio de carrera, roles tech, postulaciones con ATS estricto</td>
                      <td className="px-4 py-3 text-[#1a2e4a]/80">Menos espacio para el resumen narrativo</td>
                    </tr>
                    <tr className="border-b border-[#1a2e4a]/10 bg-[#00D4FF]/5">
                      <td className="px-4 py-3 font-semibold text-[#1a2e4a]">Sidebar (columna derecha)</td>
                      <td className="px-4 py-3 text-[#1a2e4a]/80">Diseño, marketing, perfiles creativos</td>
                      <td className="px-4 py-3 text-[#1a2e4a]/80">Algunos ATS no parsean bien las multi-columna</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-semibold text-[#1a2e4a]">Abajo, tras experiencia</td>
                      <td className="px-4 py-3 text-[#1a2e4a]/80">CV senior / directivo</td>
                      <td className="px-4 py-3 text-[#1a2e4a]/80">Skills indexadas con menor peso por el ATS</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p>
                <strong>Recomendación por defecto para 2026:</strong> arriba, una columna, bajo tu resumen profesional. Esto gana tanto en puntuación ATS (skills indexadas en el tercio superior del documento) como en el escaneo humano de 7 segundos. Usa layout sidebar solo con plantillas verificadas — la <Link href={`/${locale}/templates`}>galería de plantillas de Valhalla Resume</Link> marca cada diseño con su nivel de compatibilidad ATS.
              </p>

              <h2 id="ats">Formato amigable con ATS</h2>

              <div className="not-prose grid sm:grid-cols-2 gap-4 my-8">
                {[
                  { icon: CheckCircle2, color: "emerald", title: "Solo texto plano", text: "Sin iconos junto al nombre de la habilidad. El ATS los elimina y pierdes jerarquía visual. Reserva los iconos para la capa visual de la plantilla." },
                  { icon: CheckCircle2, color: "emerald", title: "Separadas por coma o viñetas", text: "Ambos formatos parsean bien. Las viñetas son más fáciles de escanear; las comas ahorran espacio vertical." },
                  { icon: CheckCircle2, color: "emerald", title: "Acrónimos deletreados una vez", text: "Search Engine Optimization (SEO), Interfaz de Programación de Aplicaciones (API). Indexado bajo ambas formas." },
                  { icon: CheckCircle2, color: "emerald", title: "Mayúsculas exactas a la oferta", text: "Si el posting dice \"JavaScript\", no escribas \"Javascript\" ni \"JS\". El match exacto importa." },
                  { icon: Target, color: "cyan", title: "Agrupa con subtítulos", text: "Lenguajes / Frameworks / Herramientas / Metodologías. El ATS lee los subtítulos; los reclutadores los escanean." },
                  { icon: Target, color: "cyan", title: "Sin barras de progreso", text: "Estrellas, barras y porcentajes no sobreviven al parseo ATS — y se ven amateur ante un reclutador." },
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
                  <p className="font-semibold text-[#1a2e4a] text-sm sm:text-base mb-1.5">Verifica el match de keywords antes de aplicar</p>
                  <p className="text-sm text-[#1a2e4a]/80 leading-relaxed">
                    Con el <Link href={`/${locale}/tools/ats-checker`}>puntaje ATS de Valhalla Resume PRO</Link> ves tu match score contra la oferta, las keywords exactas que faltan y las 3 ediciones de mayor impacto — dentro del editor. Subida media tras una reescritura: +22 puntos.
                  </p>
                </div>
              </div>

              <h2 id="errores">5 errores que arruinan tu sección de habilidades</h2>

              <div className="not-prose space-y-3 my-8">
                {[
                  { title: "Listar cada habilidad que has tocado", text: "Una lista de 30 ítems señala que no sabes priorizar. Tope en 15 y selecciona sin piedad. Las que cortas dicen casi tanto como las que dejas." },
                  { title: "Sobrevalorar tu nivel", text: "Listar \"Dominio de Kubernetes\" cuando solo has desplegado dos servicios es un golpe garantizado a tu credibilidad en la entrevista técnica. Reserva los niveles más altos para trabajo que puedas defender en una profundización." },
                  { title: "Ignorar la oferta", text: "Reusar la misma sección de skills entre postulaciones reduce tu match ATS a la mitad. Cambia 2-3 skills por aplicación — son 90 segundos de trabajo y casi duplican tu tasa de shortlist." },
                  { title: "Mezclar herramientas, metodologías y blandas en una sola lista", text: "\"Salesforce, MEDDIC, trabajo en equipo, Excel, comunicación\" es ilegible. Agrupa por tipo. Tanto el reclutador como el ATS premian la estructura visible." },
                  { title: "Listar herramientas obsoletas como headliner", text: "Poner \"Microsoft Office\" o \"email\" como skill top en 2026 se lee como relleno. Si una habilidad se asume para el rol, no merece un slot." },
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

              <p>
                Tu sección de habilidades es la franja más densa y de mayor valor en términos de keywords de todo tu CV. Trátala como el activo estratégico que es: curadla, agrúpala, demuéstrala y haz match con la oferta. Hazlo bien y tu tasa de shortlist sube de forma medible, cada vez.
              </p>
            </BlogProse>

            <div className="mt-16">
              <BlogFAQ items={faqs} title="Preguntas frecuentes" />
            </div>

            <div className="mt-16">
              <BlogAtsPreview locale={locale} variant="frontend" />

              <BlogCTA
                locale={locale}
                title="Crea una sección de habilidades que pase el ATS y convenza al reclutador."
                description="Valhalla Resume PRO te sugiere las skills exactas para tu rol objetivo, puntúa tu match ATS en tiempo real y ofrece 143 plantillas con compatibilidad ATS verificada. Empieza en menos de 2 minutos."
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

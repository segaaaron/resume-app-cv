import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Script from "next/script"
import Link from "next/link"
import Navbar from "@/components/marketing/Navbar"
import Footer from "@/components/marketing/Footer"
import { Button } from "@/components/ui/button"
import { ArrowRight, CheckCircle } from "lucide-react"
import { setRequestLocale } from "next-intl/server"
import { templatesSEO } from "@/lib/templates-seo"

const BASE_URL = "https://www.valhallaresume.com"

type ProfessionData = {
  slug: string
  relatedBlogSlug?: string
  en: {
    title: string
    h1: string
    description: string
    intro: string
    tips: string[]
    recommended: string[]
    faq: { q: string; a: string }[]
  }
  es: {
    title: string
    h1: string
    description: string
    intro: string
    tips: string[]
    recommended: string[]
    faq: { q: string; a: string }[]
  }
}

const PROFESSIONS: ProfessionData[] = [
  {
    slug: "software-engineer",
    relatedBlogSlug: "cv-para-desarrolladores-de-software",
    en: {
      title: "Software Engineer Resume Template 2026 | ATS-Optimized | Valhalla Resume",
      h1: "Software Engineer Resume Templates",
      description: "Download a free ATS-optimized software engineer resume template. Built for developers, engineers and tech professionals. Highlight your stack, projects and impact. Export to PDF in minutes.",
      intro: "Landing a software engineering role means beating two gatekeepers: the ATS algorithm and the hiring manager's 6-second scan. Your resume needs to pass both. Valhalla Resume's templates are built specifically for technical roles — clean structure, keyword-optimized sections, and modern layouts that highlight your stack and your impact.",
      tips: [
        "Lead with a skills section: list languages, frameworks and tools before your experience",
        "Quantify impact: 'Reduced API latency by 40%' beats 'Improved performance'",
        "Use the ATS Pro template if applying to large tech companies with automated screening",
        "Include a GitHub link or portfolio URL in the contact section",
        "Tailor keywords to the job description using Valhalla Resume's AI ATS Score feature",
      ],
      recommended: ["ATS Pro", "Carbon", "Blueprint", "Executive", "Nordic"],
      faq: [
        { q: "What is the best resume format for software engineers?", a: "A reverse-chronological format with a prominent skills section works best for most engineering roles. If your experience is strong, lead with it. If you're a new grad, lead with skills and projects." },
        { q: "Should a software engineer resume include all programming languages?", a: "No. Include languages and tools relevant to the roles you're targeting. A curated list signals focus; a 40-item dump signals noise." },
        { q: "How long should a software engineer resume be?", a: "One page for fewer than 7 years of experience. Two pages are acceptable for senior engineers with significant impact to document." },
        { q: "Does Valhalla Resume's ATS Score work for software engineering jobs?", a: "Yes. Paste a job description into the ATS Score panel and Valhalla Resume's AI analyzes your CV keyword coverage, skills match and structure — then gives you specific improvements." },
      ],
    },
    es: {
      title: "Plantilla de CV para Desarrollador de Software 2026 | ATS | Valhalla Resume",
      h1: "Plantillas de CV para Desarrolladores de Software",
      description: "Descarga una plantilla de CV para desarrollador optimizada para ATS. Ideal para ingenieros, programadores y perfiles tech. Resalta tu stack, proyectos e impacto. Exporta a PDF en minutos.",
      intro: "Conseguir un rol de desarrollo de software significa superar dos filtros: el algoritmo ATS y el escaneo de 6 segundos del reclutador. Tu CV necesita pasar ambos. Las plantillas de Valhalla Resume están diseñadas para roles técnicos — estructura limpia, secciones optimizadas para palabras clave y layouts modernos que destacan tu stack y tu impacto.",
      tips: [
        "Empieza con una sección de habilidades: lista lenguajes, frameworks y herramientas antes de la experiencia",
        "Cuantifica el impacto: 'Reduje la latencia de la API en un 40%' es mejor que 'Mejoré el rendimiento'",
        "Usa la plantilla ATS Pro si aplicas a grandes empresas con selección automatizada",
        "Incluye tu perfil de GitHub o portafolio en la sección de contacto",
        "Adapta las palabras clave a la oferta usando el ATS Score IA de Valhalla Resume",
      ],
      recommended: ["ATS Pro", "Carbon", "Blueprint", "Executive", "Nordic"],
      faq: [
        { q: "¿Cuál es el mejor formato de CV para desarrolladores de software?", a: "Un formato cronológico inverso con una sección de habilidades prominente funciona mejor para la mayoría de roles de ingeniería. Si tu experiencia es sólida, empieza con ella. Si eres recién graduado, empieza con habilidades y proyectos." },
        { q: "¿Debe un CV de desarrollador incluir todos los lenguajes de programación?", a: "No. Incluye los lenguajes y herramientas relevantes para los roles a los que aplicas. Una lista curada señala enfoque; una lista de 40 elementos señala ruido." },
        { q: "¿Cuánto debe extenderse el CV de un desarrollador?", a: "Una página para menos de 7 años de experiencia. Dos páginas son aceptables para ingenieros senior con impacto significativo que documentar." },
        { q: "¿El ATS Score de Valhalla Resume funciona para ofertas de desarrollo de software?", a: "Sí. Pega una oferta de trabajo en el panel ATS Score y la IA de Valhalla Resume analiza la cobertura de palabras clave, el match de habilidades y la estructura — y te da mejoras específicas." },
      ],
    },
  },
  {
    slug: "marketing",
    relatedBlogSlug: "cv-para-marketing",
    en: {
      title: "Marketing Resume Template 2026 | ATS-Optimized | Valhalla Resume",
      h1: "Marketing Resume Templates",
      description: "Free ATS-optimized marketing resume templates for digital marketers, content strategists, SEO specialists and marketing managers. Show your metrics and get more interviews.",
      intro: "Marketing resumes live and die by metrics. Recruiters in this field want to see numbers: growth percentages, ROAS, follower counts, conversion rates. Valhalla Resume's templates give you the structure to lead with impact, and our AI bullet improver helps you transform vague duties into measurable achievements.",
      tips: [
        "Every bullet point should answer: 'by how much?' — add percentages, follower counts, revenue figures",
        "Use the 'Summary' section to position yourself clearly: content marketer vs performance marketer vs brand strategist",
        "List your tools: Google Analytics, HubSpot, Meta Ads, Semrush, etc.",
        "Include campaign results as standalone achievements, not buried in job descriptions",
        "Use Valhalla Resume's AI Cover Letter generator to write personalized letters for each application",
      ],
      recommended: ["Spark", "Modern", "Fold", "Glass", "Sidebar"],
      faq: [
        { q: "What should a marketing resume include?", a: "Contact info, professional summary, work experience with quantified results, skills (tools and platforms), education, and optionally a portfolio link or notable campaigns section." },
        { q: "Should I include social media metrics on my marketing resume?", a: "Yes — if they're impressive. 'Grew Instagram from 5K to 80K followers in 12 months' is a powerful achievement. Vague descriptions without numbers are forgettable." },
        { q: "Is a one-page marketing resume enough?", a: "For 0-5 years of experience, yes. For senior roles, two pages allow you to document campaign scope and budget management more thoroughly." },
      ],
    },
    es: {
      title: "Plantilla de CV para Marketing 2026 | ATS | Valhalla Resume",
      h1: "Plantillas de CV para Marketing",
      description: "Plantillas de CV para marketing digital, content marketing, SEO, SEM y gerentes de marketing. Optimizadas para ATS. Muestra tus métricas y consigue más entrevistas.",
      intro: "Los CVs de marketing se ganan o se pierden por las métricas. Los reclutadores en este campo quieren ver números: porcentajes de crecimiento, ROAS, seguidores, tasas de conversión. Las plantillas de Valhalla Resume te dan la estructura para liderar con impacto, y el mejorador de bullets IA te ayuda a transformar responsabilidades vagas en logros medibles.",
      tips: [
        "Cada bullet debe responder: '¿en cuánto?' — agrega porcentajes, número de seguidores, cifras de ingresos",
        "Usa la sección 'Resumen' para posicionarte claramente: marketing de contenidos vs performance vs branding",
        "Lista tus herramientas: Google Analytics, HubSpot, Meta Ads, Semrush, etc.",
        "Incluye resultados de campañas como logros independientes, no enterrados en descripciones",
        "Usa el generador de cartas de presentación IA de Valhalla Resume para escribir cartas personalizadas",
      ],
      recommended: ["Spark", "Modern", "Fold", "Glass", "Sidebar"],
      faq: [
        { q: "¿Qué debe incluir un CV de marketing?", a: "Datos de contacto, resumen profesional, experiencia laboral con resultados cuantificados, habilidades (herramientas y plataformas), educación y opcionalmente un link de portafolio o sección de campañas destacadas." },
        { q: "¿Debo incluir métricas de redes sociales en mi CV de marketing?", a: "Sí, si son impresionantes. 'Hice crecer Instagram de 5K a 80K seguidores en 12 meses' es un logro poderoso. Las descripciones vagas sin números son olvidables." },
        { q: "¿Es suficiente un CV de marketing de una página?", a: "Para 0-5 años de experiencia, sí. Para roles senior, dos páginas permiten documentar el alcance de campañas y gestión de presupuesto con más detalle." },
      ],
    },
  },
  {
    slug: "data-scientist",
    en: {
      title: "Data Scientist Resume Template 2026 | ATS-Optimized | Valhalla Resume",
      h1: "Data Scientist Resume Templates",
      description: "ATS-optimized data scientist resume templates. Showcase your Python, SQL, ML skills and research impact. Used by analysts, ML engineers and data professionals. Download in PDF.",
      intro: "Data science hiring is highly technical. Recruiters scan for specific tools, methodologies, and — critically — business impact. Your resume must speak to both the technical reviewer and the business stakeholder. Valhalla Resume's templates help you structure this dual narrative clearly.",
      tips: [
        "Create a dedicated 'Technical Skills' section: languages (Python, R, SQL), frameworks (TensorFlow, PyTorch, scikit-learn), cloud (AWS, GCP, Azure)",
        "Frame every project with: problem → methodology → business result",
        "Include Kaggle rank, GitHub repos or published papers if applicable",
        "Use the ATS Score feature to match keywords to each data science job posting",
        "Quantify model performance: 'Improved churn prediction accuracy from 71% to 89%'",
      ],
      recommended: ["Carbon", "Blueprint", "ATS Pro", "Executive", "Spark"],
      faq: [
        { q: "Should a data scientist resume include all projects?", a: "No. Include 2-4 projects that are most relevant to the role. Quality over quantity — each project entry should clearly state the problem, your approach and the measurable outcome." },
        { q: "How do I show ML experience on a resume without a formal job?", a: "Include personal projects, Kaggle competitions (with rank), open source contributions, or research papers. Valhalla Resume's 'Projects' section is built for this." },
        { q: "What's the best template style for data scientists?", a: "Technical roles benefit from clean, structured layouts that prioritize readability. Carbon (dark mode) works well for creative data roles; ATS Pro is best for corporate analytics positions." },
      ],
    },
    es: {
      title: "Plantilla de CV para Científico de Datos 2026 | ATS | Valhalla Resume",
      h1: "Plantillas de CV para Científicos de Datos",
      description: "Plantillas de CV para data scientists, analistas de datos e ingenieros ML. Muestra tus habilidades en Python, SQL y machine learning. Exporta a PDF en minutos.",
      intro: "La contratación en ciencia de datos es altamente técnica. Los reclutadores buscan herramientas específicas, metodologías y — de forma crítica — impacto en el negocio. Tu CV debe hablarle tanto al revisor técnico como al stakeholder de negocio. Las plantillas de Valhalla Resume te ayudan a estructurar esta narrativa dual con claridad.",
      tips: [
        "Crea una sección de 'Habilidades técnicas' dedicada: lenguajes (Python, R, SQL), frameworks (TensorFlow, PyTorch, scikit-learn), cloud (AWS, GCP, Azure)",
        "Enmarca cada proyecto con: problema → metodología → resultado de negocio",
        "Incluye tu ranking en Kaggle, repositorios de GitHub o artículos publicados si aplica",
        "Usa el ATS Score para hacer match de palabras clave con cada oferta de trabajo",
        "Cuantifica el rendimiento del modelo: 'Mejoré la precisión de predicción de churn del 71% al 89%'",
      ],
      recommended: ["Carbon", "Blueprint", "ATS Pro", "Executive", "Spark"],
      faq: [
        { q: "¿Debe un CV de científico de datos incluir todos los proyectos?", a: "No. Incluye 2-4 proyectos más relevantes para el rol. Calidad sobre cantidad — cada entrada de proyecto debe indicar claramente el problema, tu enfoque y el resultado medible." },
        { q: "¿Cómo muestro experiencia en ML sin un empleo formal?", a: "Incluye proyectos personales, competencias de Kaggle (con ranking), contribuciones open source o artículos de investigación. La sección 'Proyectos' de Valhalla Resume está diseñada para esto." },
        { q: "¿Cuál es la mejor plantilla para científicos de datos?", a: "Los roles técnicos se benefician de layouts limpios y estructurados. Carbon funciona bien para roles de datos creativos; ATS Pro es mejor para posiciones de analítica corporativa." },
      ],
    },
  },
  {
    slug: "nurse",
    en: {
      title: "Nurse Resume Template 2026 | Healthcare | ATS-Optimized | Valhalla Resume",
      h1: "Nurse Resume Templates",
      description: "Free ATS-optimized nurse and healthcare resume templates. Designed for RNs, LPNs, nurse practitioners and healthcare professionals. Highlight certifications, specializations and patient care experience.",
      intro: "Healthcare hiring is credential-driven. Nurse recruiters scan resumes in seconds for licensure (RN, LPN, NP), certifications (BLS, ACLS, PALS), and clinical specialization. Your resume structure must make these credentials instantly visible — not buried in paragraphs of job descriptions.",
      tips: [
        "Put your licensure and certifications at the top, immediately after contact info",
        "List your clinical specializations clearly: ICU, ER, Pediatrics, OB, etc.",
        "Quantify patient load: 'Managed care for 6-8 patients per shift in a 32-bed ICU'",
        "Include EMR systems you've used: Epic, Cerner, Meditech",
        "Use clean, professional templates — avoid overly creative layouts for clinical roles",
      ],
      recommended: ["Professional", "Classic", "ATS Pro", "Modern", "Executive"],
      faq: [
        { q: "What certifications should a nurse include on their resume?", a: "Include all active certifications: BLS, ACLS, PALS, NRP, TNCC, CEN, CCRN, etc. List the certifying body and expiration date. Never omit active credentials." },
        { q: "Should a nurse resume be one page?", a: "For new graduates and nurses with fewer than 5 years of experience, aim for one page. Experienced nurses may use two pages to document clinical rotations, specializations and continuing education." },
        { q: "What's the best resume format for a travel nurse?", a: "Chronological format with clear start/end dates and facility names. Travel nurses should include location (city/state) and the agency for each assignment." },
      ],
    },
    es: {
      title: "Plantilla de CV para Enfermero/a 2026 | Salud | ATS | Valhalla Resume",
      h1: "Plantillas de CV para Enfermería",
      description: "Plantillas de CV para enfermeros, enfermeras y profesionales de la salud. Optimizadas para ATS. Destaca tus certificaciones, especializaciones y experiencia clínica. Descarga en PDF.",
      intro: "La contratación en salud se basa en credenciales. Los reclutadores de enfermería escanean CVs en segundos buscando licencias, certificaciones y especialización clínica. La estructura de tu CV debe hacer que estas credenciales sean inmediatamente visibles — no enterradas en párrafos de descripciones de trabajo.",
      tips: [
        "Coloca tu licencia y certificaciones al inicio, inmediatamente después de los datos de contacto",
        "Lista claramente tus especializaciones clínicas: UCI, Urgencias, Pediatría, Obstetricia, etc.",
        "Cuantifica la carga de pacientes: 'Atendí a 6-8 pacientes por turno en una UCI de 32 camas'",
        "Incluye los sistemas de historia clínica electrónica que has usado: Epic, Cerner, Meditech",
        "Usa plantillas profesionales y limpias — evita layouts demasiado creativos para roles clínicos",
      ],
      recommended: ["Professional", "Classic", "ATS Pro", "Modern", "Executive"],
      faq: [
        { q: "¿Qué certificaciones debe incluir una enfermera en su CV?", a: "Incluye todas las certificaciones activas: BLS, ACLS, PALS, NRP, TNCC, CEN, CCRN, etc. Lista el organismo certificador y la fecha de vencimiento. Nunca omitas credenciales activas." },
        { q: "¿Debe ser de una página el CV de una enfermera?", a: "Para recién graduadas y enfermeras con menos de 5 años de experiencia, apunta a una página. Las enfermeras con más experiencia pueden usar dos páginas para documentar rotaciones clínicas, especializaciones y formación continua." },
        { q: "¿Cuál es el mejor formato de CV para una enfermera viajera?", a: "Formato cronológico con fechas de inicio/fin claras y nombres de centros. Las enfermeras viajeras deben incluir la ubicación y la agencia para cada asignación." },
      ],
    },
  },
  {
    slug: "project-manager",
    en: {
      title: "Project Manager Resume Template 2026 | ATS-Optimized | Valhalla Resume",
      h1: "Project Manager Resume Templates",
      description: "ATS-optimized project manager resume templates for PMs, Scrum Masters and program managers. Showcase certifications (PMP, CAPM), project scope, budget management and team leadership.",
      intro: "Project management resumes need to demonstrate one thing above all else: delivery. Recruiters want to see projects you've shipped, budgets you've managed, teams you've led, and methodologies you've mastered. Valhalla Resume's templates give you the structure to present this evidence convincingly.",
      tips: [
        "List PM certifications prominently: PMP, CAPM, PMI-ACP, CSM, PRINCE2",
        "Quantify project scope: budget ($), team size (#), timeline, and delivery status",
        "Show methodology experience: Agile, Scrum, Waterfall, Kanban, SAFe",
        "Include cross-functional collaboration (stakeholders, vendors, departments)",
        "Use strong action verbs: Delivered, Launched, Orchestrated, Reduced, Scaled",
      ],
      recommended: ["Executive", "Professional", "Blueprint", "Spark", "Modern"],
      faq: [
        { q: "Should I list every project on a PM resume?", a: "No. Select 3-5 high-impact projects per role. For each, document: scope (budget, team size), methodology, your specific contribution, and the quantified outcome." },
        { q: "Is PMP certification required on a project manager resume?", a: "Not required, but highly valued. If you have it, list it prominently. If you're pursuing it, you can list 'PMP (in progress)' with your expected exam date." },
        { q: "How should a Scrum Master format their resume differently?", a: "Emphasize velocity improvements, sprint success rates, team capacity metrics, and impediment resolution. Agile-specific roles need agile-specific proof points." },
      ],
    },
    es: {
      title: "Plantilla de CV para Gerente de Proyectos 2026 | ATS | Valhalla Resume",
      h1: "Plantillas de CV para Gerentes de Proyectos",
      description: "Plantillas de CV para Project Managers, Scrum Masters y gerentes de programa. Muestra certificaciones PMP, alcance de proyectos, gestión de presupuesto y liderazgo de equipos.",
      intro: "Los CVs de gestión de proyectos necesitan demostrar una cosa por encima de todo: entrega. Los reclutadores quieren ver proyectos que hayas completado, presupuestos que hayas gestionado, equipos que hayas liderado y metodologías que domines. Las plantillas de Valhalla Resume te dan la estructura para presentar esta evidencia de manera convincente.",
      tips: [
        "Lista las certificaciones PM prominentemente: PMP, CAPM, PMI-ACP, CSM, PRINCE2",
        "Cuantifica el alcance del proyecto: presupuesto ($), tamaño del equipo (#), cronograma y estado de entrega",
        "Muestra experiencia en metodologías: Agile, Scrum, Waterfall, Kanban, SAFe",
        "Incluye colaboración interfuncional (stakeholders, proveedores, departamentos)",
        "Usa verbos de acción fuertes: Entregué, Lancé, Orquesté, Reduje, Escalé",
      ],
      recommended: ["Executive", "Professional", "Blueprint", "Spark", "Modern"],
      faq: [
        { q: "¿Debo listar todos los proyectos en un CV de PM?", a: "No. Selecciona 3-5 proyectos de alto impacto por rol. Para cada uno, documenta: alcance (presupuesto, tamaño del equipo), metodología, tu contribución específica y el resultado cuantificado." },
        { q: "¿Es obligatoria la certificación PMP en un CV de gerente de proyectos?", a: "No es obligatoria, pero es muy valorada. Si la tienes, colócala prominentemente. Si la estás cursando, puedes indicar 'PMP (en curso)' con tu fecha de examen prevista." },
        { q: "¿Cómo debe formatear su CV un Scrum Master de manera diferente?", a: "Enfatiza mejoras de velocidad, tasas de éxito de sprint, métricas de capacidad del equipo y resolución de impedimentos. Los roles específicos de Agile necesitan pruebas específicas de Agile." },
      ],
    },
  },
  {
    slug: "accountant",
    en: {
      title: "Accountant Resume Template 2026 | ATS-Optimized | Valhalla Resume",
      h1: "Accountant Resume Templates",
      description: "ATS-optimized resume templates for accountants, CPAs, financial analysts and bookkeepers. Showcase your certifications, software skills and financial impact. Download to PDF in minutes.",
      intro: "Accounting resumes are evaluated on precision, credentials, and software proficiency. Hiring managers scan for CPA licensure, ERP systems, and audit or tax specialization. Your resume must communicate technical accuracy and measurable financial impact — two traits that define every strong accounting hire.",
      tips: [
        "List accounting certifications first: CPA, CMA, CIA, ACCA, EA — these are instant credibility signals",
        "Name the software you use: QuickBooks, SAP, Oracle, NetSuite, Excel (including pivot tables and VLOOKUP)",
        "Quantify financial scope: 'Managed $4M in accounts payable' or 'Reduced month-end close by 3 days'",
        "Separate public accounting (audit/tax) from corporate (FP&A, cost accounting) experience clearly",
        "Use Valhalla Resume's ATS Score to match keywords to each job description before applying",
      ],
      recommended: ["Professional", "Classic", "Executive", "Blueprint", "ATS Pro"],
      faq: [
        { q: "Should an accountant's resume be one page?", a: "For accountants with fewer than 8 years of experience, one page is ideal. Senior accountants, controllers, and CFOs may use two pages to fully document their scope of responsibility and financial oversight." },
        { q: "What software should an accountant list on their resume?", a: "List every accounting and ERP system you've used: QuickBooks, SAP, Oracle, NetSuite, Xero, Microsoft Dynamics, and advanced Excel. These keywords are critical for ATS matching in finance job postings." },
        { q: "How should a CPA list their certification on a resume?", a: "Add 'CPA' directly after your name in the header (e.g., 'Jane Smith, CPA') and list it again in a dedicated Certifications section with your state and license number." },
      ],
    },
    es: {
      title: "Plantilla de CV para Contador 2026 | ATS | Valhalla Resume",
      h1: "Plantillas de CV para Contadores",
      description: "Plantillas de CV para contadores, CPAs, analistas financieros y tenedores de libros. Optimizadas para ATS. Destaca tus certificaciones, software y logros financieros.",
      intro: "Los CVs de contabilidad se evalúan por precisión, credenciales y dominio de software. Los reclutadores buscan licencias CPA, sistemas ERP y especialización en auditoría o impuestos. Tu CV debe comunicar precisión técnica e impacto financiero medible — dos rasgos que definen a toda contratación de contabilidad exitosa.",
      tips: [
        "Lista primero las certificaciones contables: CPA, CMA, CIA, ACCA — son señales de credibilidad inmediata",
        "Nombra el software que usas: QuickBooks, SAP, Oracle, NetSuite, Excel avanzado (tablas dinámicas, BUSCARV)",
        "Cuantifica el alcance financiero: 'Gestión de $4M en cuentas por pagar' o 'Reduje el cierre mensual en 3 días'",
        "Separa claramente la contabilidad pública (auditoría/impuestos) de la corporativa (FP&A, costos)",
        "Usa el ATS Score de Valhalla Resume para hacer match de palabras clave antes de aplicar",
      ],
      recommended: ["Professional", "Classic", "Executive", "Blueprint", "ATS Pro"],
      faq: [
        { q: "¿Debe ser de una página el CV de un contador?", a: "Para contadores con menos de 8 años de experiencia, una página es ideal. Contadores senior, controllers y CFOs pueden usar dos páginas para documentar su alcance de responsabilidad y supervisión financiera." },
        { q: "¿Qué software debe listar un contador en su CV?", a: "Lista todos los sistemas contables y ERP que hayas usado: QuickBooks, SAP, Oracle, NetSuite, Xero, Microsoft Dynamics y Excel avanzado. Estas palabras clave son críticas para el matching ATS en ofertas de finanzas." },
        { q: "¿Cómo debe listar un CPA su certificación en el CV?", a: "Agrega 'CPA' directamente después de tu nombre en el encabezado (ej. 'Juan García, CPA') y vuelve a listarlo en una sección de Certificaciones con tu estado y número de licencia." },
      ],
    },
  },
  {
    slug: "teacher",
    en: {
      title: "Teacher Resume Template 2026 | ATS-Optimized | Valhalla Resume",
      h1: "Teacher Resume Templates",
      description: "ATS-optimized resume templates for teachers, educators and school administrators. Highlight certifications, grade levels, curriculum development and student outcomes. Download to PDF.",
      intro: "Teaching resumes must convey two things: credentials and classroom impact. Administrators scan for state licensure, subject area endorsements, grade level experience, and evidence of student achievement. Valhalla Resume's templates help you present this information clearly and pass the automated screening systems many school districts now use.",
      tips: [
        "List your teaching license, state, and endorsements prominently near the top",
        "Specify grade levels and subject areas you've taught — don't make readers search for this",
        "Quantify student outcomes where possible: 'Improved class reading proficiency from 62% to 81% in one year'",
        "Include curriculum frameworks and platforms: Common Core, IB, Google Classroom, Canvas, Schoology",
        "Mention special education experience, ESL/ELL support, or gifted education if applicable",
      ],
      recommended: ["Professional", "Modern", "Classic", "Blueprint", "Sidebar"],
      faq: [
        { q: "Should a teacher resume include a teaching philosophy?", a: "Not on the resume itself — it makes the document too long. Save your philosophy for your cover letter or application essay. The resume should focus on credentials, experience, and measurable outcomes." },
        { q: "How long should a teacher resume be?", a: "One page for new teachers and those with fewer than 5 years of experience. Two pages are appropriate for experienced educators documenting multiple roles, curriculum leadership, or administrative experience." },
        { q: "What certifications should a teacher list on their resume?", a: "List your state teaching license (with subject area and grade level endorsements), any national certifications (like NBPTS), ESL/ELL certification, special education credentials, and subject-specific certifications." },
      ],
    },
    es: {
      title: "Plantilla de CV para Maestro/Docente 2026 | ATS | Valhalla Resume",
      h1: "Plantillas de CV para Docentes",
      description: "Plantillas de CV para maestros, docentes y directivos escolares. Optimizadas para ATS. Destaca certificaciones, niveles educativos, desarrollo curricular y logros estudiantiles.",
      intro: "Los CVs de docentes deben transmitir dos cosas: credenciales e impacto en el aula. Los directivos buscan licencias estatales, habilitaciones por asignatura, experiencia por nivel y evidencias de logro estudiantil. Las plantillas de Valhalla Resume te ayudan a presentar esta información con claridad y a superar los sistemas de selección automatizada que muchos distritos escolares ya utilizan.",
      tips: [
        "Lista tu licencia de enseñanza, estado y habilitaciones prominentemente cerca del inicio",
        "Especifica los niveles y materias que has enseñado — no hagas que los lectores lo busquen",
        "Cuantifica los resultados estudiantiles donde sea posible: 'Mejoré la comprensión lectora del grupo del 62% al 81% en un año'",
        "Incluye marcos curriculares y plataformas: Common Core, IB, Google Classroom, Canvas, Schoology",
        "Menciona experiencia en educación especial, apoyo ESL/ELL o educación para superdotados si aplica",
      ],
      recommended: ["Professional", "Modern", "Classic", "Blueprint", "Sidebar"],
      faq: [
        { q: "¿Debe incluir un maestro su filosofía educativa en el CV?", a: "No en el CV — hace el documento demasiado largo. Guarda tu filosofía para la carta de presentación o el ensayo de solicitud. El CV debe centrarse en credenciales, experiencia y resultados medibles." },
        { q: "¿Cuánto debe extenderse el CV de un maestro?", a: "Una página para maestros nuevos y los que tienen menos de 5 años de experiencia. Dos páginas son apropiadas para docentes con experiencia que documentan múltiples roles, liderazgo curricular o experiencia directiva." },
        { q: "¿Qué certificaciones debe listar un maestro en su CV?", a: "Lista tu licencia docente estatal (con habilitaciones por materia y nivel), certificaciones nacionales, certificación ESL/ELL, credenciales de educación especial y certificaciones específicas por asignatura." },
      ],
    },
  },
  {
    slug: "lawyer",
    en: {
      title: "Lawyer Resume Template 2026 | ATS-Optimized | Valhalla Resume",
      h1: "Lawyer Resume Templates",
      description: "ATS-optimized resume templates for lawyers, attorneys and legal professionals. Showcase bar admissions, practice areas, case outcomes and publications. Download to PDF in minutes.",
      intro: "Legal resumes operate in a highly credential-driven market. Partners and HR at law firms scan for bar admissions, law school prestige, practice area depth, and specific transaction or litigation experience. Your resume must be impeccably formatted — typos or inconsistencies signal the same carelessness that would concern a client.",
      tips: [
        "List all bar admissions prominently: state(s), year admitted, and any federal court admissions",
        "Specify your practice area and case types clearly: M&A, IP litigation, criminal defense, employment law, etc.",
        "Quantify deal or case value where possible: 'Advised on $200M acquisition' or 'Won 8 of 10 bench trials'",
        "Include notable publications, law review articles, or speaking engagements",
        "For BigLaw applications, list class rank or GPA from law school if it was strong (top 15%)",
      ],
      recommended: ["Executive", "Professional", "Classic", "Blueprint", "ATS Pro"],
      faq: [
        { q: "Should a lawyer's resume be different from a standard CV?", a: "Slightly. Legal resumes often include a bar admissions section, a publications section, and may list clerkships prominently. For BigLaw, law school rank and law review membership carry more weight than in other industries." },
        { q: "How long should a lawyer's resume be?", a: "One to two pages for associates and mid-level attorneys. Partners and senior counsel may use two to three pages to document practice areas, notable matters, and thought leadership. Brevity is still valued." },
        { q: "What should a new law graduate include on their resume?", a: "Bar exam status, law school GPA and class rank (if strong), law review or journal membership, moot court, clerkship experience, internships, and clinic work. Extracurriculars are relevant for your first 2 years." },
      ],
    },
    es: {
      title: "Plantilla de CV para Abogado 2026 | ATS | Valhalla Resume",
      h1: "Plantillas de CV para Abogados",
      description: "Plantillas de CV para abogados y profesionales del derecho. Optimizadas para ATS. Destaca admisiones al colegio, áreas de práctica, resultados de casos y publicaciones.",
      intro: "Los CVs jurídicos operan en un mercado altamente orientado a credenciales. Los socios y RR.HH. en despachos de abogados buscan admisiones al colegio, prestigio de la facultad de derecho, profundidad en el área de práctica y experiencia específica en transacciones o litigios. Tu CV debe estar impecablemente formateado — los errores tipográficos o inconsistencias señalan el mismo descuido que preocuparía a un cliente.",
      tips: [
        "Lista todas las admisiones al colegio de abogados prominentemente: estado(s), año de admisión y admisiones ante tribunales federales",
        "Especifica claramente tu área de práctica y tipos de casos: M&A, litigios de PI, defensa penal, derecho laboral, etc.",
        "Cuantifica el valor de operaciones o casos donde sea posible: 'Asesoré en adquisición de $200M' o 'Gané 8 de 10 juicios'",
        "Incluye publicaciones notables, artículos de revistas jurídicas o participaciones como ponente",
        "Para despachos grandes, lista tu rango de clase o GPA de la facultad de derecho si fue sólido (top 15%)",
      ],
      recommended: ["Executive", "Professional", "Classic", "Blueprint", "ATS Pro"],
      faq: [
        { q: "¿Debe ser diferente el CV de un abogado al de otros profesionales?", a: "Ligeramente. Los CVs jurídicos suelen incluir una sección de admisiones al colegio, publicaciones y pueden destacar prácticas judiciales. Para grandes despachos, el rango en la facultad y la membresía en revistas jurídicas pesan más que en otras industrias." },
        { q: "¿Cuánto debe extenderse el CV de un abogado?", a: "Una a dos páginas para asociados y abogados de nivel medio. Los socios y abogados senior pueden usar dos a tres páginas para documentar áreas de práctica, asuntos notables y liderazgo de pensamiento." },
        { q: "¿Qué debe incluir un recién graduado en derecho en su CV?", a: "Estado del examen de barra, GPA y rango de clase en la facultad (si es sólido), membresía en revista jurídica, moot court, experiencia en prácticas judiciales, pasantías y trabajo en clínicas. Las actividades extracurriculares son relevantes para tus primeros 2 años." },
      ],
    },
  },
  {
    slug: "sales",
    en: {
      title: "Sales Resume Template 2026 | ATS-Optimized | Valhalla Resume",
      h1: "Sales Resume Templates",
      description: "ATS-optimized resume templates for sales representatives, account executives and sales managers. Showcase quotas, revenue generated, pipeline managed and sales methodology.",
      intro: "Sales resumes are judged on one thing: numbers. Hiring managers in sales want evidence that you can close. Quota attainment, revenue generated, deal sizes, and ramp time — these are the metrics that decide whether your resume goes to the top of the pile or the bottom. Valhalla Resume's templates give you the structure to lead with proof.",
      tips: [
        "Include quota attainment in every role: '118% of quota in FY2025' is instantly credible",
        "State your deal size and sales cycle length — enterprise and SMB sales require very different skills",
        "List your sales methodology: MEDDIC, Challenger, Sandler, SPIN, Solution Selling",
        "Name your CRM and sales tech stack: Salesforce, HubSpot, Outreach, Gong, LinkedIn Sales Navigator",
        "Include Presidents Club, awards, or top-performer recognition — these signals carry weight",
      ],
      recommended: ["Spark", "Executive", "Modern", "Blueprint", "Professional"],
      faq: [
        { q: "What metrics should a sales rep include on their resume?", a: "Quota attainment (as a percentage), total revenue generated, average deal size, win rate, number of new accounts opened, and any performance rankings (e.g., 'top 10% of 200-person sales org'). At least one metric per role." },
        { q: "Should I include my base salary or OTE on a sales resume?", a: "No. Compensation is discussed during the offer phase, not screened into your resume. Including it limits your negotiating position." },
        { q: "How do I write a sales resume if I missed quota?", a: "Focus on what you can document: pipeline generated, deals progressed, accounts managed, and any improving trend. If your quota was unusually high (common at early-stage startups), briefly contextualize it." },
      ],
    },
    es: {
      title: "Plantilla de CV para Ventas 2026 | ATS | Valhalla Resume",
      h1: "Plantillas de CV para Ventas",
      description: "Plantillas de CV para ejecutivos de ventas, representantes comerciales y gerentes de ventas. Muestra tus cuotas, ingresos generados, pipeline gestionado y metodología de ventas.",
      intro: "Los CVs de ventas se juzgan por una cosa: los números. Los gerentes de contratación en ventas quieren evidencia de que puedes cerrar. Cumplimiento de cuota, ingresos generados, tamaños de deals y tiempo de ramp — estas son las métricas que deciden si tu CV va al tope o al fondo. Las plantillas de Valhalla Resume te dan la estructura para liderar con pruebas.",
      tips: [
        "Incluye el cumplimiento de cuota en cada rol: '118% de la cuota en FY2025' es inmediatamente creíble",
        "Indica el tamaño de tus deals y la duración del ciclo de ventas — las ventas enterprise y SMB requieren habilidades muy diferentes",
        "Lista tu metodología de ventas: MEDDIC, Challenger, Sandler, SPIN, Solution Selling",
        "Nombra tu CRM y herramientas de ventas: Salesforce, HubSpot, Outreach, Gong, LinkedIn Sales Navigator",
        "Incluye Presidents Club, premios o reconocimientos — estas señales tienen peso",
      ],
      recommended: ["Spark", "Executive", "Modern", "Blueprint", "Professional"],
      faq: [
        { q: "¿Qué métricas debe incluir un representante de ventas en su CV?", a: "Cumplimiento de cuota (como porcentaje), ingresos totales generados, tamaño promedio de deal, tasa de cierre, número de nuevas cuentas abiertas y rankings de rendimiento. Al menos una métrica por rol." },
        { q: "¿Debo incluir mi salario base u OTE en un CV de ventas?", a: "No. La compensación se discute en la fase de oferta, no se filtra en el CV. Incluirla limita tu posición negociadora." },
        { q: "¿Cómo escribo un CV de ventas si no alcancé la cuota?", a: "Enfócate en lo que puedes documentar: pipeline generado, deals avanzados, cuentas gestionadas y cualquier tendencia de mejora. Si tu cuota era inusualmente alta (común en startups en etapa temprana), contextualízalo brevemente." },
      ],
    },
  },
  {
    slug: "hr",
    en: {
      title: "HR Resume Template 2026 | Human Resources | ATS-Optimized | Valhalla Resume",
      h1: "HR & Human Resources Resume Templates",
      description: "ATS-optimized resume templates for HR professionals, recruiters, HR business partners and talent managers. Highlight certifications, HRIS platforms and workforce metrics.",
      intro: "HR professionals face the irony of writing a resume that will be screened by systems they know well. The advantage: you understand exactly what recruiters and ATS systems look for. Use that knowledge. Lead with certifications, HRIS proficiency, and the specific metrics that demonstrate your impact on hiring quality, retention, and workforce performance.",
      tips: [
        "List HR certifications first: SHRM-CP, SHRM-SCP, PHR, SPHR, GPHR — they're your primary credentials",
        "Name your HRIS and ATS platforms: Workday, SAP SuccessFactors, ADP, BambooHR, Greenhouse, Lever",
        "Quantify workforce impact: 'Reduced time-to-hire from 42 to 26 days', 'Improved retention by 18%'",
        "Specify your area of HR specialization: talent acquisition, L&D, compensation, HRBP, ER",
        "Include any experience with specific employment laws relevant to your market (FLSA, FMLA, ADA, etc.)",
      ],
      recommended: ["Professional", "Modern", "Blueprint", "Executive", "Classic"],
      faq: [
        { q: "What certifications should an HR professional list on their resume?", a: "SHRM-CP or SHRM-SCP (SHRM), PHR, SPHR, or GPHR (HRCI) are the most recognized. Also include specialized certifications: CCP for compensation, CPLP for L&D, or recruiter certifications like AIRS." },
        { q: "How should an HR resume demonstrate business impact?", a: "Quantify everything you can: time-to-hire, cost-per-hire, turnover rate improvements, training completion rates, employee satisfaction scores, headcount grown under your recruiting. HR is increasingly measured by business outcomes, not activity." },
        { q: "What's the difference between an HR generalist and HRBP resume?", a: "An HRBP resume emphasizes strategic partnership, business alignment, and cross-functional leadership. A generalist resume covers operational breadth. Tailor your summary and experience bullets to reflect the role you're targeting." },
      ],
    },
    es: {
      title: "Plantilla de CV para RRHH 2026 | Recursos Humanos | ATS | Valhalla Resume",
      h1: "Plantillas de CV para Recursos Humanos",
      description: "Plantillas de CV para profesionales de RRHH, reclutadores, HR business partners y gestores de talento. Optimizadas para ATS. Destaca certificaciones, plataformas HRIS y métricas de fuerza laboral.",
      intro: "Los profesionales de RRHH enfrentan la ironía de escribir un CV que será evaluado por sistemas que conocen bien. La ventaja: sabes exactamente qué buscan los reclutadores y los sistemas ATS. Usa ese conocimiento. Empieza con certificaciones, dominio de HRIS y las métricas específicas que demuestran tu impacto en la calidad de contratación, la retención y el rendimiento de la fuerza laboral.",
      tips: [
        "Lista primero las certificaciones de RRHH: SHRM-CP, SHRM-SCP, PHR, SPHR, GPHR — son tus credenciales principales",
        "Nombra tus plataformas HRIS y ATS: Workday, SAP SuccessFactors, ADP, BambooHR, Greenhouse, Lever",
        "Cuantifica el impacto en la fuerza laboral: 'Reduje el tiempo de contratación de 42 a 26 días', 'Mejoré la retención en un 18%'",
        "Especifica tu área de especialización en RRHH: adquisición de talento, L&D, compensación, HRBP, relaciones laborales",
        "Incluye experiencia con leyes laborales relevantes para tu mercado",
      ],
      recommended: ["Professional", "Modern", "Blueprint", "Executive", "Classic"],
      faq: [
        { q: "¿Qué certificaciones debe listar un profesional de RRHH en su CV?", a: "SHRM-CP o SHRM-SCP (SHRM), PHR, SPHR o GPHR (HRCI) son las más reconocidas. También incluye certificaciones especializadas: CCP para compensación, CPLP para L&D o certificaciones de reclutador como AIRS." },
        { q: "¿Cómo debe demostrar impacto empresarial un CV de RRHH?", a: "Cuantifica todo lo que puedas: tiempo de contratación, costo por contratación, mejoras en la tasa de rotación, tasas de finalización de formación, puntuaciones de satisfacción de empleados, headcount crecido bajo tu reclutamiento. Los RRHH se miden cada vez más por resultados empresariales, no por actividad." },
        { q: "¿Cuál es la diferencia entre el CV de un generalista de RRHH y un HRBP?", a: "Un CV de HRBP enfatiza la asociación estratégica, la alineación empresarial y el liderazgo interfuncional. Un CV generalista cubre la amplitud operativa. Adapta tu resumen y bullets de experiencia al rol que buscas." },
      ],
    },
  },
  {
    slug: "designer",
    en: {
      title: "Graphic Designer Resume Template 2026 | ATS-Optimized | Valhalla Resume",
      h1: "Graphic Designer Resume Templates",
      description: "ATS-optimized resume templates for graphic designers, UX/UI designers and creative professionals. Show your tools, portfolio and design impact. Download to PDF in minutes.",
      intro: "Designers face a unique challenge: your resume is also a design artifact. It signals your aesthetic judgment before anyone reads a word. But beauty without ATS-compatibility is invisible. Valhalla Resume's templates balance visual appeal with the structured formatting that automated screening systems require.",
      tips: [
        "Always include a portfolio link in your contact section — it's your strongest proof",
        "List design tools explicitly: Figma, Adobe Creative Suite (Illustrator, Photoshop, InDesign), Sketch, Framer",
        "For UX roles: include research methods (user interviews, usability testing, A/B testing)",
        "Quantify design impact: 'Redesigned checkout flow, increasing conversion by 22%'",
        "Choose a visually distinctive Valhalla Resume template — your resume layout is part of your portfolio",
      ],
      recommended: ["Neon", "Glass", "Bauhaus", "Fold", "Carbon"],
      faq: [
        { q: "Should a designer's resume be creative or conservative?", a: "It depends on the role. For UX roles at tech companies: clean and structured. For agency or branding roles: visually distinctive. For corporate in-house roles: professional with subtle creativity." },
        { q: "Do I need to include a portfolio link on my designer resume?", a: "Yes, always. A designer resume without a portfolio link is significantly weaker. Include Behance, Dribbble, or a personal site. Make the link clickable in your PDF." },
        { q: "What's the best resume format for a junior designer?", a: "Lead with skills and tools (since experience is limited), then education, then projects. Include 2-3 strong portfolio pieces you can discuss in an interview." },
      ],
    },
    es: {
      title: "Plantilla de CV para Diseñador Gráfico 2026 | ATS | Valhalla Resume",
      h1: "Plantillas de CV para Diseñadores",
      description: "Plantillas de CV para diseñadores gráficos, UX/UI y creativos. Optimizadas para ATS. Muestra tus herramientas, portafolio e impacto del diseño. Descarga en PDF.",
      intro: "Los diseñadores enfrentan un desafío único: tu CV también es un artefacto de diseño. Señala tu juicio estético antes de que alguien lea una sola palabra. Pero la belleza sin compatibilidad con ATS es invisible. Las plantillas de Valhalla Resume equilibran el atractivo visual con el formato estructurado que requieren los sistemas de selección automatizada.",
      tips: [
        "Incluye siempre un link de portafolio en tu sección de contacto — es tu prueba más poderosa",
        "Lista las herramientas de diseño explícitamente: Figma, Adobe Creative Suite, Sketch, Framer",
        "Para roles UX: incluye métodos de investigación (entrevistas de usuario, pruebas de usabilidad, A/B testing)",
        "Cuantifica el impacto del diseño: 'Rediseñé el flujo de checkout, aumentando la conversión en un 22%'",
        "Elige una plantilla visualmente distintiva de Valhalla Resume — el layout de tu CV es parte de tu portafolio",
      ],
      recommended: ["Neon", "Glass", "Bauhaus", "Fold", "Carbon"],
      faq: [
        { q: "¿Debe ser creativo o conservador el CV de un diseñador?", a: "Depende del rol. Para roles UX en empresas tech: limpio y estructurado. Para roles en agencias o branding: visualmente distintivo. Para roles corporativos internos: profesional con creatividad sutil." },
        { q: "¿Necesito incluir un link de portafolio en mi CV de diseñador?", a: "Sí, siempre. Un CV de diseñador sin link de portafolio es significativamente más débil. Incluye Behance, Dribbble o un sitio personal. Asegúrate de que el link sea clickeable en tu PDF." },
        { q: "¿Cuál es el mejor formato de CV para un diseñador junior?", a: "Empieza con habilidades y herramientas (ya que la experiencia es limitada), luego educación, luego proyectos. Incluye 2-3 piezas de portafolio sólidas que puedas discutir en una entrevista." },
      ],
    },
  },
]

export async function generateStaticParams() {
  return PROFESSIONS.flatMap((p) =>
    ["es", "en"].map((locale) => ({ locale, profession: p.slug }))
  )
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; profession: string }>
}): Promise<Metadata> {
  const { locale, profession } = await params
  const data = PROFESSIONS.find((p) => p.slug === profession)
  if (!data) return {}
  const content = locale === "es" ? data.es : data.en
  const url = `${BASE_URL}/${locale}/templates/${profession}`

  return {
    title: content.title,
    description: content.description,
    alternates: {
      canonical: url,
      languages: {
        es: `${BASE_URL}/es/templates/${profession}`,
        en: `${BASE_URL}/en/templates/${profession}`,
        "x-default": `${BASE_URL}/en/templates/${profession}`,
      },
    },
    openGraph: {
      title: content.h1,
      description: content.description,
      type: "website",
      url,
      images: [{ url: `${BASE_URL}/og-image.png`, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: content.h1,
      description: content.description,
      images: [`${BASE_URL}/og-image.png`],
    },
  }
}

export default async function ProfessionTemplatePage({
  params,
}: {
  params: Promise<{ locale: string; profession: string }>
}) {
  const { locale, profession } = await params
  setRequestLocale(locale)

  const data = PROFESSIONS.find((p) => p.slug === profession)
  if (!data) notFound()

  const content = locale === "es" ? data.es : data.en
  const url = `${BASE_URL}/${locale}/templates/${profession}`
  const isEs = locale === "es"

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: content.h1,
    description: content.description,
    url,
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: isEs ? "Inicio" : "Home", item: BASE_URL },
        { "@type": "ListItem", position: 2, name: isEs ? "Plantillas" : "Templates", item: `${BASE_URL}/${locale}/templates` },
        { "@type": "ListItem", position: 3, name: content.h1, item: url },
      ],
    },
    mainEntity: {
      "@type": "FAQPage",
      mainEntity: content.faq.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    },
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main id="main-content" className="flex-1">
        {/* Hero */}
        <section className="py-16 sm:py-24 px-4 bg-gradient-to-b from-primary/5 to-background text-center">
          <div className="max-w-3xl mx-auto">
            <span className="inline-block text-xs font-semibold bg-primary/10 text-primary px-3 py-1 rounded-full mb-4">
              {isEs ? "143 Plantillas — ATS Compatible" : "143 Templates — ATS Optimized"}
            </span>
            <h1 className="text-3xl sm:text-5xl font-bold mb-5 leading-tight">{content.h1}</h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">{content.description}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href={`/${locale}/templates`}>
                <Button size="lg" className="gap-2 text-base">
                  {isEs ? "Ver todas las plantillas" : "Browse all templates"} <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href={`/${locale}/register`}>
                <Button size="lg" variant="outline" className="text-base">
                  {isEs ? "Crear mi CV gratis" : "Create my resume free"}
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Intro */}
        <section className="py-12 px-4">
          <div className="max-w-3xl mx-auto">
            <p className="text-lg text-muted-foreground leading-relaxed">{content.intro}</p>
          </div>
        </section>

        {/* Tips */}
        <section className="py-10 px-4 bg-muted/30">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">
              {isEs ? `Consejos para tu CV de ${content.h1.replace("Plantillas de CV para ", "")}` : `Tips for your ${content.h1.replace(" Resume Templates", "")} resume`}
            </h2>
            <ul className="space-y-3">
              {content.tips.map((tip, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Recommended templates */}
        <section className="py-12 px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">
              {isEs ? "Plantillas recomendadas" : "Recommended templates"}
            </h2>
            <p className="text-muted-foreground mb-6">
              {isEs
                ? `Estas plantillas de Valhalla Resume son las más utilizadas por profesionales de ${content.h1.replace("Plantillas de CV para ", "").toLowerCase()}.`
                : `These Valhalla Resume templates are most popular among ${content.h1.replace(" Resume Templates", "").toLowerCase()} professionals.`}
            </p>
            <div className="flex flex-wrap gap-2 mb-8">
              {content.recommended.map((name) => {
                // Map "ATS Pro" → "ats", "Blueprint" → "blueprint", etc. against templatesSEO names.
                const lookup = name.toLowerCase().replace(/\s+pro$/, "").trim()
                const match = templatesSEO.find(
                  (t) => t.name.toLowerCase() === lookup || t.id === lookup,
                )
                if (match) {
                  return (
                    <Link
                      key={name}
                      href={`/${locale}/templates/design/${match.slug}`}
                      className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-sm font-medium rounded-lg transition-colors"
                    >
                      {name} →
                    </Link>
                  )
                }
                return (
                  <span key={name} className="px-3 py-1.5 bg-primary/10 text-primary text-sm font-medium rounded-lg">
                    {name}
                  </span>
                )
              })}
            </div>
            <Link href={`/${locale}/templates`}>
              <Button className="gap-2">
                {isEs ? "Ver todas las plantillas" : "View all templates"} <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-12 px-4 bg-muted/30">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold mb-8">
              {isEs ? "Preguntas frecuentes" : "Frequently asked questions"}
            </h2>
            <div className="space-y-6">
              {content.faq.map((item, i) => (
                <div key={i} className="border-b border-border pb-6 last:border-0">
                  <h3 className="font-semibold mb-2">{item.q}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Related blog post */}
        {data.relatedBlogSlug && (
          <section className="py-8 px-4 border-t border-border">
            <div className="max-w-3xl mx-auto">
              <p className="text-sm text-muted-foreground">
                {isEs ? "Guía relacionada: " : "Related guide: "}
                <Link href={`/${locale}/blog/${data.relatedBlogSlug}`} className="text-primary hover:underline font-medium">
                  {isEs ? "Ver guía completa de CV para este perfil →" : "Read the complete CV guide for this profile →"}
                </Link>
              </p>
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="py-16 px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">
              {isEs ? "Crea tu CV profesional hoy" : "Build your professional resume today"}
            </h2>
            <p className="text-muted-foreground mb-8">
              {isEs
                ? "Valhalla Resume Pro incluye IA para mejorar bullets, ATS Score, carta de presentación y más. Desde $15/mes."
                : "Valhalla Resume Pro includes AI bullet improver, ATS Score, cover letter generator and more. From $15/month."}
            </p>
            <Link href={`/${locale}/register`}>
              <Button size="lg" className="gap-2 text-base">
                {isEs ? "Empezar ahora" : "Get started"} <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>
      <Script id="profession-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Footer />
    </div>
  )
}

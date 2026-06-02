import type { ProfessionInfo, ProfessionCategory } from "./types"

// Profession baseMultiplier is relative to a tech entry baseline (1.0).
// Calibrated against BLS occupational outlook, ONS ASHE, INE EES, INEGI ENOE.
export const PROFESSIONS: ProfessionInfo[] = [
  // ───── TECH ─────
  {
    slug: "software-engineer",
    category: "tech",
    name: { en: "Software Engineer", es: "Ingeniero/a de Software" },
    description: {
      en: "Designs, builds and maintains software systems and applications.",
      es: "Diseña, construye y mantiene sistemas y aplicaciones de software.",
    },
    icon: "Code",
    searchTerms: ["developer", "programmer", "dev", "swe", "desarrollador", "programador"],
    baseMultiplier: 1.0,
  },
  {
    slug: "data-scientist",
    category: "tech",
    name: { en: "Data Scientist", es: "Científico/a de Datos" },
    description: {
      en: "Turns data into insights using statistics, ML and visualization.",
      es: "Convierte datos en información usando estadística, ML y visualización.",
    },
    icon: "BarChart3",
    searchTerms: ["data", "ml engineer", "analytics", "científico de datos"],
    baseMultiplier: 1.1,
  },
  {
    slug: "devops-engineer",
    category: "tech",
    name: { en: "DevOps Engineer", es: "Ingeniero/a DevOps" },
    description: {
      en: "Automates infrastructure, CI/CD pipelines and cloud operations.",
      es: "Automatiza infraestructura, pipelines de CI/CD y operaciones cloud.",
    },
    icon: "Server",
    searchTerms: ["sre", "platform engineer", "infrastructure", "infraestructura"],
    baseMultiplier: 1.05,
  },
  {
    slug: "product-manager",
    category: "tech",
    name: { en: "Product Manager", es: "Product Manager" },
    description: {
      en: "Owns the roadmap, discovery and delivery of digital products.",
      es: "Lidera el roadmap, discovery y entrega de productos digitales.",
    },
    icon: "Compass",
    searchTerms: ["pm", "producto", "product owner"],
    baseMultiplier: 1.15,
  },
  {
    slug: "ux-designer",
    category: "tech",
    name: { en: "UX Designer", es: "Diseñador/a UX" },
    description: {
      en: "Designs user flows, interfaces and research for digital products.",
      es: "Diseña flujos, interfaces e investigación para productos digitales.",
    },
    icon: "Palette",
    searchTerms: ["ui designer", "product designer", "diseñador ux", "diseñador ui"],
    baseMultiplier: 0.9,
  },
  {
    slug: "qa-engineer",
    category: "tech",
    name: { en: "QA Engineer", es: "Ingeniero/a de QA" },
    description: {
      en: "Designs test strategy, automation and quality gates for software.",
      es: "Diseña la estrategia de pruebas, automatización y calidad del software.",
    },
    icon: "ShieldCheck",
    searchTerms: ["tester", "quality", "qa", "automation"],
    baseMultiplier: 0.85,
  },
  {
    slug: "cybersecurity-analyst",
    category: "tech",
    name: { en: "Cybersecurity Analyst", es: "Analista de Ciberseguridad" },
    description: {
      en: "Protects systems, detects threats and runs incident response.",
      es: "Protege sistemas, detecta amenazas y gestiona respuesta a incidentes.",
    },
    icon: "Shield",
    searchTerms: ["security", "infosec", "soc analyst", "seguridad"],
    baseMultiplier: 1.05,
  },
  {
    slug: "cloud-architect",
    category: "tech",
    name: { en: "Cloud Architect", es: "Arquitecto/a Cloud" },
    description: {
      en: "Designs cloud architectures across AWS, Azure or GCP at scale.",
      es: "Diseña arquitecturas cloud en AWS, Azure o GCP a escala.",
    },
    icon: "Cloud",
    searchTerms: ["aws", "azure", "gcp", "solution architect", "arquitecto"],
    baseMultiplier: 1.3,
  },

  // ───── BUSINESS ─────
  {
    slug: "marketing-manager",
    category: "business",
    name: { en: "Marketing Manager", es: "Gerente de Marketing" },
    description: {
      en: "Plans and executes brand, performance and growth marketing.",
      es: "Planifica y ejecuta marketing de marca, performance y crecimiento.",
    },
    icon: "Megaphone",
    searchTerms: ["growth", "marketing", "mercadeo", "marketing digital"],
    baseMultiplier: 0.95,
  },
  {
    slug: "sales-representative",
    category: "business",
    name: { en: "Sales Representative", es: "Representante de Ventas" },
    description: {
      en: "Manages pipeline, qualifies leads and closes deals with clients.",
      es: "Gestiona pipeline, califica leads y cierra ventas con clientes.",
    },
    icon: "Handshake",
    searchTerms: ["sdr", "account executive", "ventas", "vendedor"],
    baseMultiplier: 0.8,
  },
  {
    slug: "business-analyst",
    category: "business",
    name: { en: "Business Analyst", es: "Analista de Negocio" },
    description: {
      en: "Translates business needs into requirements, data and decisions.",
      es: "Traduce necesidades de negocio en requisitos, datos y decisiones.",
    },
    icon: "LineChart",
    searchTerms: ["ba", "business", "analyst", "analista"],
    baseMultiplier: 0.85,
  },
  {
    slug: "financial-analyst",
    category: "business",
    name: { en: "Financial Analyst", es: "Analista Financiero/a" },
    description: {
      en: "Builds models, forecasts and analyses financial performance.",
      es: "Construye modelos, forecasts y analiza el desempeño financiero.",
    },
    icon: "TrendingUp",
    searchTerms: ["fp&a", "finance", "finanzas", "analista financiero"],
    baseMultiplier: 0.9,
  },
  {
    slug: "accountant",
    category: "business",
    name: { en: "Accountant", es: "Contador/a" },
    description: {
      en: "Handles bookkeeping, reporting, tax and audit responsibilities.",
      es: "Gestiona contabilidad, reportes, impuestos y auditoría.",
    },
    icon: "Calculator",
    searchTerms: ["accounting", "contabilidad", "contador", "contadora"],
    baseMultiplier: 0.75,
  },
  {
    slug: "hr-manager",
    category: "business",
    name: { en: "HR Manager", es: "Gerente de RR. HH." },
    description: {
      en: "Owns talent, culture, compensation and people operations.",
      es: "Lidera talento, cultura, compensación y operaciones de personas.",
    },
    icon: "Users",
    searchTerms: ["people", "talent", "recursos humanos", "rrhh"],
    baseMultiplier: 0.85,
  },
  {
    slug: "project-manager",
    category: "business",
    name: { en: "Project Manager", es: "Project Manager" },
    description: {
      en: "Drives project delivery, scope, schedule and stakeholders.",
      es: "Lidera la entrega, alcance, cronograma y stakeholders de proyectos.",
    },
    icon: "ClipboardList",
    searchTerms: ["pm", "scrum master", "gerente de proyecto"],
    baseMultiplier: 0.9,
  },
  {
    slug: "operations-manager",
    category: "business",
    name: { en: "Operations Manager", es: "Gerente de Operaciones" },
    description: {
      en: "Optimises processes, supply chain and operational performance.",
      es: "Optimiza procesos, cadena de suministro y desempeño operativo.",
    },
    icon: "Cog",
    searchTerms: ["ops", "operations", "operaciones", "supply chain"],
    baseMultiplier: 0.9,
  },

  // ───── HEALTHCARE ─────
  {
    slug: "registered-nurse",
    category: "healthcare",
    name: { en: "Registered Nurse", es: "Enfermero/a Titulado/a" },
    description: {
      en: "Delivers patient care across hospitals, clinics and home care.",
      es: "Brinda atención al paciente en hospitales, clínicas y atención domiciliaria.",
    },
    icon: "HeartPulse",
    searchTerms: ["nurse", "rn", "enfermero", "enfermera", "enfermería"],
    baseMultiplier: 0.85,
  },
  {
    slug: "doctor",
    category: "healthcare",
    name: { en: "Doctor / Physician", es: "Médico/a" },
    description: {
      en: "Diagnoses and treats patients across specialties and settings.",
      es: "Diagnostica y trata pacientes en distintas especialidades y entornos.",
    },
    icon: "Stethoscope",
    searchTerms: ["physician", "md", "doctor", "doctora", "médico"],
    baseMultiplier: 1.6,
  },
  {
    slug: "pharmacist",
    category: "healthcare",
    name: { en: "Pharmacist", es: "Farmacéutico/a" },
    description: {
      en: "Dispenses medication and advises patients on safe use.",
      es: "Dispensa medicamentos y asesora a pacientes sobre su uso seguro.",
    },
    icon: "Pill",
    searchTerms: ["pharmacy", "farmacia", "farmacéutico", "farmaceutico"],
    baseMultiplier: 1.1,
  },
  {
    slug: "medical-assistant",
    category: "healthcare",
    name: { en: "Medical Assistant", es: "Asistente Médico/a" },
    description: {
      en: "Supports clinicians with patient care and administrative tasks.",
      es: "Apoya a clínicos con tareas clínicas y administrativas.",
    },
    icon: "Cross",
    searchTerms: ["healthcare", "clinical assistant", "asistente médico"],
    baseMultiplier: 0.55,
  },

  // ───── EDUCATION ─────
  {
    slug: "teacher",
    category: "education",
    name: { en: "Teacher", es: "Docente" },
    description: {
      en: "Plans lessons, teaches students and assesses learning outcomes.",
      es: "Planifica clases, enseña y evalúa resultados de aprendizaje.",
    },
    icon: "GraduationCap",
    searchTerms: ["teacher", "educator", "profesor", "maestro", "maestra"],
    baseMultiplier: 0.7,
  },
  {
    slug: "university-professor",
    category: "education",
    name: { en: "University Professor", es: "Profesor/a Universitario/a" },
    description: {
      en: "Teaches and researches at higher-education institutions.",
      es: "Enseña e investiga en instituciones de educación superior.",
    },
    icon: "BookOpen",
    searchTerms: ["lecturer", "academic", "profesor universitario", "catedrático"],
    baseMultiplier: 1.0,
  },

  // ───── LEGAL ─────
  {
    slug: "lawyer",
    category: "legal",
    name: { en: "Lawyer", es: "Abogado/a" },
    description: {
      en: "Advises clients and represents them in legal matters.",
      es: "Asesora a clientes y los representa en asuntos legales.",
    },
    icon: "Scale",
    searchTerms: ["attorney", "abogado", "abogada"],
    baseMultiplier: 1.2,
  },
  {
    slug: "paralegal",
    category: "legal",
    name: { en: "Paralegal", es: "Auxiliar Jurídico/a" },
    description: {
      en: "Supports lawyers with research, drafting and case management.",
      es: "Apoya a abogados con investigación, redacción y gestión de casos.",
    },
    icon: "FileText",
    searchTerms: ["legal assistant", "asistente legal", "paralegal"],
    baseMultiplier: 0.7,
  },

  // ───── TRADES ─────
  {
    slug: "electrician",
    category: "trades",
    name: { en: "Electrician", es: "Electricista" },
    description: {
      en: "Installs, maintains and repairs electrical systems.",
      es: "Instala, mantiene y repara sistemas eléctricos.",
    },
    icon: "Zap",
    searchTerms: ["electrical", "electricista"],
    baseMultiplier: 0.75,
  },
  {
    slug: "plumber",
    category: "trades",
    name: { en: "Plumber", es: "Plomero/a / Fontanero/a" },
    description: {
      en: "Installs and repairs piping, fixtures and water systems.",
      es: "Instala y repara tuberías, accesorios y sistemas de agua.",
    },
    icon: "Wrench",
    searchTerms: ["plumbing", "plomero", "fontanero", "gasista"],
    baseMultiplier: 0.7,
  },
  {
    slug: "mechanical-engineer",
    category: "trades",
    name: { en: "Mechanical Engineer", es: "Ingeniero/a Mecánico/a" },
    description: {
      en: "Designs and tests mechanical systems and components.",
      es: "Diseña y prueba sistemas y componentes mecánicos.",
    },
    icon: "Settings",
    searchTerms: ["mechanical", "ingeniero mecánico"],
    baseMultiplier: 0.95,
  },
  {
    slug: "civil-engineer",
    category: "trades",
    name: { en: "Civil Engineer", es: "Ingeniero/a Civil" },
    description: {
      en: "Designs infrastructure, buildings and public works.",
      es: "Diseña infraestructura, edificios y obras públicas.",
    },
    icon: "HardHat",
    searchTerms: ["civil", "structural", "ingeniero civil"],
    baseMultiplier: 0.95,
  },

  // ───── SERVICE ─────
  {
    slug: "chef",
    category: "service",
    name: { en: "Chef", es: "Chef" },
    description: {
      en: "Plans menus, leads the kitchen and crafts dishes.",
      es: "Planifica menús, lidera la cocina y crea platos.",
    },
    icon: "ChefHat",
    searchTerms: ["cook", "chef", "cocinero", "cocinera"],
    baseMultiplier: 0.65,
  },
  {
    slug: "customer-service-representative",
    category: "service",
    name: { en: "Customer Service Representative", es: "Representante de Atención al Cliente" },
    description: {
      en: "Helps customers solve issues and answers product questions.",
      es: "Ayuda a clientes a resolver problemas y responde preguntas del producto.",
    },
    icon: "Headphones",
    searchTerms: ["support", "customer service", "atención al cliente", "soporte"],
    baseMultiplier: 0.55,
  },
]

export const PROFESSION_BY_SLUG: Record<string, ProfessionInfo> = Object.fromEntries(
  PROFESSIONS.map((p) => [p.slug, p])
)

export function getProfession(slug: string): ProfessionInfo | undefined {
  return PROFESSION_BY_SLUG[slug]
}

export function getProfessionsByCategory(): Record<ProfessionCategory, ProfessionInfo[]> {
  const out = {} as Record<ProfessionCategory, ProfessionInfo[]>
  for (const p of PROFESSIONS) {
    if (!out[p.category]) out[p.category] = []
    out[p.category].push(p)
  }
  return out
}

export function searchProfessions(query: string): ProfessionInfo[] {
  const q = query.trim().toLowerCase()
  if (!q) return PROFESSIONS
  return PROFESSIONS.filter((p) => {
    if (p.slug.includes(q)) return true
    if (p.name.en.toLowerCase().includes(q)) return true
    if (p.name.es.toLowerCase().includes(q)) return true
    if (p.searchTerms.some((t) => t.toLowerCase().includes(q))) return true
    return false
  })
}

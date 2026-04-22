import { z } from "zod"

// ─── Section Types ───────────────────────────────────────────────────────────

export const PersonalDetailsSchema = z.object({
  firstName: z.string().default(""),
  lastName: z.string().default(""),
  jobTitle: z.string().default(""),
  email: z.string().default(""),
  phone: z.string().default(""),
  address: z.string().default(""),
  city: z.string().default(""),
  country: z.string().default(""),
  postalCode: z.string().default(""),
  website: z.string().default(""),
  linkedin: z.string().default(""),
  github: z.string().default(""),
})

export const WorkExperienceItemSchema = z.object({
  id: z.string(),
  employer: z.string().default(""),
  jobTitle: z.string().default(""),
  city: z.string().default(""),
  startDate: z.string().default(""),
  endDate: z.string().default(""),
  currentlyWorking: z.boolean().default(false),
  description: z.string().default(""),
})

export const EducationItemSchema = z.object({
  id: z.string(),
  institution: z.string().default(""),
  degree: z.string().default(""),
  fieldOfStudy: z.string().default(""),
  city: z.string().default(""),
  startDate: z.string().default(""),
  endDate: z.string().default(""),
  currentlyStudying: z.boolean().default(false),
  description: z.string().default(""),
})

export const SkillItemSchema = z.object({
  id: z.string(),
  name: z.string().default(""),
  level: z.enum(["beginner", "intermediate", "advanced", "expert"]).default("intermediate"),
})

export const LanguageItemSchema = z.object({
  id: z.string(),
  name: z.string().default(""),
  level: z.enum(["elementary", "limited", "professional", "full_professional", "native"]).default("professional"),
})

export const CertificationItemSchema = z.object({
  id: z.string(),
  name: z.string().default(""),
  issuer: z.string().default(""),
  date: z.string().default(""),
  url: z.string().default(""),
})

export const ProjectItemSchema = z.object({
  id: z.string(),
  name: z.string().default(""),
  role: z.string().default(""),
  startDate: z.string().default(""),
  endDate: z.string().default(""),
  description: z.string().default(""),
  url: z.string().default(""),
})

export const VolunteerItemSchema = z.object({
  id: z.string(),
  organization: z.string().default(""),
  role: z.string().default(""),
  startDate: z.string().default(""),
  endDate: z.string().default(""),
  description: z.string().default(""),
})

export const ReferenceItemSchema = z.object({
  id: z.string(),
  name: z.string().default(""),
  company: z.string().default(""),
  phone: z.string().default(""),
  email: z.string().default(""),
})

export const CustomSectionItemSchema = z.object({
  id: z.string(),
  title: z.string().default(""),
  subtitle: z.string().default(""),
  date: z.string().default(""),
  description: z.string().default(""),
})

// ─── Section Block ────────────────────────────────────────────────────────────

export type SectionType =
  | "personalDetails"
  | "summary"
  | "workExperience"
  | "education"
  | "skills"
  | "languages"
  | "certifications"
  | "projects"
  | "volunteer"
  | "references"
  | "hobbies"
  | "custom"

export interface ResumeSection {
  id: string
  type: SectionType
  label: string
  column: "main" | "side"
  pageBreakBefore: boolean
  visible: boolean
  data: unknown
}

// ─── Full Resume Schema ───────────────────────────────────────────────────────

export const ResumeSectionsSchema = z.object({
  personalDetails: z.preprocess((v) => v ?? {}, PersonalDetailsSchema),
  summary: z.string().default(""),
  workExperience: z.array(WorkExperienceItemSchema).default([]),
  education: z.array(EducationItemSchema).default([]),
  skills: z.array(SkillItemSchema).default([]),
  languages: z.array(LanguageItemSchema).default([]),
  certifications: z.array(CertificationItemSchema).default([]),
  projects: z.array(ProjectItemSchema).default([]),
  volunteer: z.array(VolunteerItemSchema).default([]),
  references: z.array(ReferenceItemSchema).default([]),
  hobbies: z.string().default(""),
  customSections: z.array(z.object({
    id: z.string(),
    title: z.string(),
    items: z.array(CustomSectionItemSchema),
  })).default([]),
})

export type ResumeSections = z.infer<typeof ResumeSectionsSchema>
export type PersonalDetails = z.infer<typeof PersonalDetailsSchema>
export type WorkExperienceItem = z.infer<typeof WorkExperienceItemSchema>
export type EducationItem = z.infer<typeof EducationItemSchema>
export type SkillItem = z.infer<typeof SkillItemSchema>
export type LanguageItem = z.infer<typeof LanguageItemSchema>
export type CertificationItem = z.infer<typeof CertificationItemSchema>
export type ProjectItem = z.infer<typeof ProjectItemSchema>
export type VolunteerItem = z.infer<typeof VolunteerItemSchema>
export type ReferenceItem = z.infer<typeof ReferenceItemSchema>

// ─── Resume Config ────────────────────────────────────────────────────────────

export type TemplateId =
  | "classic"
  | "modern"
  | "professional"
  | "elegant"
  | "circular"
  | "vertical"
  | "horizontal"
  | "casual"
  | "chrono"
  | "luxurious"
  | "simple"
  | "metro"
  | "ats"
  | "sharp"
  | "glass"
  | "neon"
  | "nordic"
  | "executive"
  | "sidebar"
  | "fold"
  | "bauhaus"
  | "outline"
  | "spark"
  | "carbon"
  | "blueprint"
  | "riviera"
  | "stripe"
  | "vogue"
  | "coral"
  | "aurora"
  | "helix"
  | "lumiere"
  | "prism"
  | "consul"
  | "rose"
  | "minimal"
  | "nautical"
  | "wave"
  | "cobalt"
  | "banner"
  | "duality"
  | "obsidian"
  | "vertex"
  | "prestige"

export interface ResumeConfig {
  templateId: TemplateId
  colorScheme: string
  fontFamily: string
  fontSize: number
  spacing: number
  photoUrl: string | null
  photoPosition: number   // 0 = top, 50 = center, 100 = bottom (maps to objectPosition Y%)
  language: "es" | "en"
}

export interface ResumeData {
  id: string
  title: string
  config: ResumeConfig
  sections: ResumeSection[]
  sectionData: ResumeSections
  language: string
  updatedAt: string
}

// ─── Template Metadata ────────────────────────────────────────────────────────

export interface TemplateInfo {
  id: TemplateId
  name: string
  description: string
  columns: "single" | "double"
  hasPhoto: boolean
}

export const TEMPLATES: TemplateInfo[] = [
  { id: "classic", name: "Clásico", description: "Simple y adecuado para cualquier industria", columns: "single", hasPhoto: false },
  { id: "modern", name: "Moderno", description: "Atractivo y orientado al futuro", columns: "single", hasPhoto: true },
  { id: "professional", name: "Profesional", description: "Estructura organizada y moderna", columns: "single", hasPhoto: true },
  { id: "elegant", name: "Elegante", description: "Minimalista con bloques de color", columns: "single", hasPhoto: false },
  { id: "circular", name: "Circular", description: "Curvas suaves con acentos de color", columns: "single", hasPhoto: true },
  { id: "vertical", name: "Vertical", description: "Skills junto a la experiencia, dos columnas", columns: "double", hasPhoto: true },
  { id: "horizontal", name: "Horizontal", description: "Maximiza el espacio, encuadre profesional", columns: "double", hasPhoto: false },
  { id: "casual", name: "Casual", description: "Vibrante y llamativo", columns: "single", hasPhoto: false },
  { id: "chrono", name: "Chrono", description: "Enfoque cronológico discreto", columns: "single", hasPhoto: false },
  { id: "luxurious", name: "Lujoso", description: "Tradicional con estética premium", columns: "single", hasPhoto: true },
  { id: "simple", name: "Simple", description: "Limpio y enfocado en logros", columns: "single", hasPhoto: false },
  { id: "metro", name: "Metro", description: "Conservador pero audaz", columns: "double", hasPhoto: false },
  { id: "ats", name: "ATS Pro", description: "Optimizado para sistemas de selección automática", columns: "single", hasPhoto: false },
  { id: "sharp", name: "Sharp", description: "Líneas angulares, máximo impacto visual", columns: "double", hasPhoto: true },
  { id: "glass", name: "Glass", description: "Efecto glassmorphism moderno", columns: "double", hasPhoto: true },
  { id: "neon", name: "Neon", description: "Neobrutalism vibrante para perfiles creativos", columns: "single", hasPhoto: false },
  { id: "nordic", name: "Nordic", description: "Minimalismo escandinavo, mucho espacio en blanco", columns: "single", hasPhoto: false },
  { id: "executive", name: "Executive", description: "Premium para perfiles senior y directivos", columns: "double", hasPhoto: false },
  { id: "sidebar", name: "Sidebar", description: "Sidebar de color sólido con foto circular", columns: "double", hasPhoto: true },
  { id: "fold", name: "Fold", description: "Diseño modular en bloques, muy visual", columns: "double", hasPhoto: false },
  { id: "bauhaus", name: "Bauhaus", description: "Geométrico y bold, inspirado en diseño gráfico", columns: "double", hasPhoto: false },
  { id: "outline", name: "Outline", description: "Ultra-minimalista, solo bordes sin rellenos", columns: "double", hasPhoto: false },
  { id: "spark", name: "Spark", description: "Header degradado dinámico, badges de skills", columns: "double", hasPhoto: false },
  { id: "carbon", name: "Carbon", description: "Dark mode, ideal para perfiles tech y diseño", columns: "double", hasPhoto: true },
  { id: "blueprint", name: "Blueprint", description: "Sidebar navy con foto circular y headings en color", columns: "double", hasPhoto: true },
  { id: "riviera", name: "Riviera", description: "Sidebar oscuro, header con nombre partido en color y blanco", columns: "double", hasPhoto: true },
  { id: "stripe", name: "Stripe", description: "Banda de color completa con foto, dos columnas abajo", columns: "double", hasPhoto: true },
  { id: "vogue", name: "Vogue", description: "Nombre gigante estilo editorial, foto cuadrada en header", columns: "double", hasPhoto: true },
  { id: "coral", name: "Coral", description: "Header centrado con foto, acento lateral en secciones", columns: "double", hasPhoto: true },
  { id: "aurora",  name: "Aurora ✦",  description: "Header fluido con ola SVG, arcos decorativos, diseño orgánico para creativos", columns: "double", hasPhoto: false },
  { id: "helix",   name: "Helix ✦",   description: "Sidebar oscuro con patrón hexagonal SVG y progreso circular para skills", columns: "double", hasPhoto: true },
  { id: "lumiere", name: "Lumière ✦", description: "Art Deco de lujo con ornamentos SVG simétricos, para ejecutivos y directivos", columns: "double", hasPhoto: false },
  { id: "prism",   name: "Prism ⭐",   description: "Sidebar oscuro + section headers con tab curvo SVG, estilo David Martin", columns: "double", hasPhoto: true },
  { id: "consul",  name: "Consul",    description: "Sidebar azul con nombre apilado, foto circular y secciones con línea inferior", columns: "double", hasPhoto: true },
  { id: "rose",     name: "Rose ⚡",     description: "Sidebar rosa cálido con foto circular, secciones elegantes y acento dusty rose", columns: "double", hasPhoto: true },
  { id: "minimal",  name: "Minimal ⚡",  description: "Ultra-limpio con nombre gigante, puntos de rating y máximo espacio blanco", columns: "double", hasPhoto: true },
  { id: "nautical", name: "Nautical ⚡", description: "Sidebar navy estrecho con barras de progreso y nombre bicolor a la derecha", columns: "double", hasPhoto: true },
  { id: "wave",     name: "Wave ⚡",     description: "Header degradado teal con ola SVG curva, badges de contacto y estrellas", columns: "double", hasPhoto: true },
  { id: "cobalt",   name: "Cobalt ⚡",   description: "Sidebar muy oscuro con anillo de foto, barras de skills e iconos de hobbies", columns: "double", hasPhoto: true },
  { id: "banner",   name: "Banner ⚡",   description: "Headers en forma de banner/ribbon SVG navy con foto circular superior", columns: "double", hasPhoto: true },
  { id: "duality",  name: "Duality ⚡",  description: "Panel derecho dark con contenido principal a la izquierda, acento cyan", columns: "double", hasPhoto: true },
  { id: "obsidian", name: "Obsidian ⚡", description: "Fondo oscuro con panel blanco curvo SVG a la derecha, estilo premium", columns: "double", hasPhoto: true },
  { id: "vertex",   name: "Vertex ⚡",   description: "Triángulos decorativos en esquinas, gauges circulares SVG para idiomas", columns: "double", hasPhoto: true },
  { id: "prestige", name: "Prestige ⚡", description: "Fondo crema con bloque navy para resumen, acento cobre/bronce elegante", columns: "double", hasPhoto: true },
]

export const FONT_OPTIONS = [
  "Poppins",
  "Montserrat",
  "Roboto",
  "Lato",
  "Playfair Display",
  "Merriweather",
  "Inter",
  "Open Sans",
  "Raleway",
  "Source Sans 3",
]

// ─── Section labels by language ───────────────────────────────────────────────

const SECTION_LABELS: Record<"es" | "en", Record<string, string>> = {
  es: {
    personalDetails: "Información Personal",
    summary:         "Perfil Profesional",
    workExperience:  "Experiencia Laboral",
    education:       "Educación",
    skills:          "Habilidades",
    languages:       "Idiomas",
    certifications:  "Certificaciones",
    projects:        "Proyectos",
    volunteer:       "Voluntariado",
    references:      "Referencias",
    hobbies:         "Hobbies",
  },
  en: {
    personalDetails: "Personal Details",
    summary:         "Professional Summary",
    workExperience:  "Work Experience",
    education:       "Education",
    skills:          "Skills",
    languages:       "Languages",
    certifications:  "Certifications",
    projects:        "Projects",
    volunteer:       "Volunteer Work",
    references:      "References",
    hobbies:         "Hobbies & Interests",
  },
}

export function buildSections(lang: "es" | "en" = "es"): ResumeSection[] {
  const l = SECTION_LABELS[lang]
  return [
    { id: "personalDetails", type: "personalDetails", label: l.personalDetails, column: "main", pageBreakBefore: false, visible: true,  data: {} },
    { id: "summary",         type: "summary",         label: l.summary,         column: "main", pageBreakBefore: false, visible: true,  data: {} },
    { id: "workExperience",  type: "workExperience",  label: l.workExperience,  column: "main", pageBreakBefore: false, visible: true,  data: {} },
    { id: "education",       type: "education",       label: l.education,       column: "main", pageBreakBefore: false, visible: true,  data: {} },
    { id: "skills",          type: "skills",          label: l.skills,          column: "side", pageBreakBefore: false, visible: true,  data: {} },
    { id: "languages",       type: "languages",       label: l.languages,       column: "side", pageBreakBefore: false, visible: true,  data: {} },
    { id: "certifications",  type: "certifications",  label: l.certifications,  column: "main", pageBreakBefore: false, visible: false, data: {} },
    { id: "projects",        type: "projects",        label: l.projects,        column: "main", pageBreakBefore: false, visible: false, data: {} },
    { id: "volunteer",       type: "volunteer",       label: l.volunteer,       column: "main", pageBreakBefore: false, visible: false, data: {} },
    { id: "references",      type: "references",      label: l.references,      column: "main", pageBreakBefore: false, visible: false, data: {} },
    { id: "hobbies",         type: "hobbies",         label: l.hobbies,         column: "side", pageBreakBefore: false, visible: false, data: {} },
  ]
}

export const DEFAULT_SECTIONS: ResumeSection[] = buildSections("es")

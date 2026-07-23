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
  // Additional social/portfolio links beyond the three first-class fields
  // (Twitter/X, Instagram, Behance, Dribbble, portfolio, YouTube, Stack Overflow…).
  // Kept as an open {network,url} list so a new network never needs a schema change.
  socials: z.array(z.object({
    network: z.string().default(""),
    url: z.string().default(""),
  })).default([]),
  yearsOfExperience: z.string().default(""),
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
  level: z.enum(["a1", "a2", "b1", "b2", "c1", "c2", "native"]).catch("b1"),
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
  | "luxurious"
  | "metro"
  | "ats"
  | "sharp"
  | "glass"
  | "neon"
  | "executive"
  | "sidebar"
  | "fold"
  | "bauhaus"
  | "outline"
  | "spark"
  | "carbon"
  | "riviera"
  | "stripe"
  | "vogue"
  | "coral"
  | "aurora"
  | "lumiere"
  | "consul"
  | "rose"
  | "minimal"
  | "banner"
  | "vertex"
  | "kyoto"
  | "geneva"
  | "windsor"
  | "milan"
  | "zurich"
  | "porto"
  | "barcelona"
  | "vienna"
  | "berlin"
  | "stockholm"
  | "dublin"
  | "helsinki"
  | "lagos"
  | "seoul"
  | "copenhagen"
  | "genevanoir"
  | "reykjavik"
  | "apex"
  | "nova"
  | "cascade"
  | "onyx"
  | "mosaic"
  | "larsson"
  | "thompson"
  | "classicmono"
  | "editorialserif"
  | "boldblock"
  | "timelinevertical"
  | "swissgrid"
  | "charcoalclassic"
  | "navyexecutive"
  | "coralsidebar"
  | "sagebotanical"
  | "iosappcv"
  | "datadriven"
  | "magazinespread"
  | "legalbrief"
  | "engraved"
  | "chalkboard"
  | "academiccv"
  | "psychologist"
  | "chefmenu"
  | "sommelier"
  | "hotelcv"
  | "bartendercv"
  | "medicalchart"
  | "vitalsigns"
  | "vetcv"
  | "pilotlog"
  | "onboardingform"
  | "athletecard"
  | "translatorcv"
  | "herbariumcv"
  | "frontpage"
  | "vinylcv"
  | "callsheet"
  | "copywritermag"
  | "animatorcv"
  | "civileng"
  | "processflow"
  | "risodesigner"
  | "uxtokens"
  | "blueprintcv"
  | "annualreport"
  | "financeterminal"
  | "campaignposter"
  | "salespitch"
  | "ledgercv"
  | "cobalt"
  | "duality"
  | "havana"
  | "helix"
  | "lisbon"
  | "nautical"
  | "prism"
  | "tokyo"
  | "vitae"
  | "elite-atlas"
  | "exec-porcelain"
  | "luxe-noir"
  | "elite-counsel"
  | "elite-aura"
  | "elite-pulse"
  | "elite-cuvee"
  | "elite-cadence"
  | "elite-meridian"
  | "luxe-aurum"
  | "luxe-vellum"
  | "luxe-regent"
  | "luxe-apex"
  | "exec-regency"
  | "exec-sovereign"
  | "exec-citadel"
  | "exec-dynasty"
  | "exec-oxblood"
  | "exec-cobalt"
  | "exec-terra"
  | "exec-nocturne"
  | "exec-platine"
  | "atelier"
  | "bloom"
  | "velvet"
  | "sahara"
  | "pearl"
  | "editorial2"
  | "confetti"
  | "frame"
  | "show-cameo"
  | "show-marquis"
  | "show-soiree"
  | "show-plume"
  | "chef"
  | "teacher"
  | "journalist"
  | "communicator"
  | "filmmaker"
  | "photographer"
  | "architect"
  | "doctor"
  | "fashion"
  | "writer"

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

/** Default template applied when a CV is created or imported without an explicit pick. */
export const DEFAULT_TEMPLATE_ID = "elegant"

export const TEMPLATES: TemplateInfo[] = [
  { id: "classic", name: "Clásico", description: "Simple y adecuado para cualquier industria", columns: "single", hasPhoto: false },
  { id: "modern", name: "Moderno", description: "Atractivo y orientado al futuro", columns: "single", hasPhoto: true },
  { id: "professional", name: "Profesional", description: "Estructura organizada y moderna", columns: "single", hasPhoto: true },
  { id: "elegant", name: "Elegante", description: "Minimalista con bloques de color", columns: "single", hasPhoto: false },
  { id: "circular", name: "Circular", description: "Curvas suaves con acentos de color", columns: "single", hasPhoto: true },
  { id: "vertical", name: "Vertical", description: "Skills junto a la experiencia, dos columnas", columns: "double", hasPhoto: true },
  { id: "horizontal", name: "Horizontal", description: "Maximiza el espacio, encuadre profesional", columns: "double", hasPhoto: false },
  { id: "casual", name: "Casual", description: "Vibrante y llamativo", columns: "single", hasPhoto: false },
  { id: "luxurious", name: "Lujoso", description: "Tradicional con estética premium", columns: "single", hasPhoto: true },
  { id: "metro", name: "Metro", description: "Conservador pero audaz", columns: "double", hasPhoto: false },
  { id: "ats", name: "ATS Pro", description: "Optimizado para sistemas de selección automática", columns: "single", hasPhoto: false },
  { id: "sharp", name: "Sharp", description: "Líneas angulares, máximo impacto visual", columns: "double", hasPhoto: true },
  { id: "glass", name: "Glass", description: "Efecto glassmorphism moderno", columns: "double", hasPhoto: true },
  { id: "neon", name: "Neon", description: "Neobrutalism vibrante para perfiles creativos", columns: "single", hasPhoto: false },
  { id: "executive", name: "Executive", description: "Premium para perfiles senior y directivos", columns: "double", hasPhoto: false },
  { id: "sidebar", name: "Sidebar", description: "Sidebar de color sólido con foto circular", columns: "double", hasPhoto: true },
  { id: "fold", name: "Fold", description: "Diseño modular en bloques, muy visual", columns: "double", hasPhoto: false },
  { id: "bauhaus", name: "Bauhaus", description: "Geométrico y bold, inspirado en diseño gráfico", columns: "double", hasPhoto: false },
  { id: "outline", name: "Outline", description: "Ultra-minimalista, solo bordes sin rellenos", columns: "double", hasPhoto: false },
  { id: "spark", name: "Spark", description: "Header degradado dinámico, badges de skills", columns: "double", hasPhoto: false },
  { id: "carbon", name: "Carbon", description: "Dark mode, ideal para perfiles tech y diseño", columns: "double", hasPhoto: true },
  { id: "riviera", name: "Riviera", description: "Sidebar oscuro, header con nombre partido en color y blanco", columns: "double", hasPhoto: true },
  { id: "stripe", name: "Stripe", description: "Banda de color completa con foto, dos columnas abajo", columns: "double", hasPhoto: true },
  { id: "vogue", name: "Vogue", description: "Nombre gigante estilo editorial, foto cuadrada en header", columns: "double", hasPhoto: true },
  { id: "coral", name: "Coral", description: "Header centrado con foto, acento lateral en secciones", columns: "double", hasPhoto: true },
  { id: "cobalt",   name: "Cobalt ⭐",   description: "Sidebar navy oscuro, tipografía creativa, foto circular, ideal para diseñadores", columns: "double", hasPhoto: true },
  { id: "duality",  name: "Duality ⭐",  description: "Sidebar derecho elegante, foto panorámica, layout bipartito limpio", columns: "double", hasPhoto: true },
  { id: "havana",   name: "Havana ⭐",   description: "Sidebar terracota con degradado, banda de nombre full-width, foto circular", columns: "double", hasPhoto: true },
  { id: "helix",    name: "Helix ⭐",    description: "Sidebar oscuro hexagonal SVG, progreso circular SVG, ideal para perfiles técnicos", columns: "double", hasPhoto: true },
  { id: "lisbon",   name: "Lisbon ⭐",   description: "Sidebar con degradado accent, foto hexagonal, iconos geométricos por sección", columns: "double", hasPhoto: true },
  { id: "nautical", name: "Nautical ⭐", description: "Sidebar navy marino, estética náutica clásica, foto circular con marco", columns: "double", hasPhoto: true },
  { id: "prism",    name: "Prism ⭐",    description: "Sidebar navy profundo, foto circular, iconos de hobbies, estilo David Martin", columns: "double", hasPhoto: true },
  { id: "tokyo",    name: "Tokyo ⭐",    description: "Sidebar casi negro, círculos accent, labels uppercase con puntos decorativos", columns: "double", hasPhoto: true },
  { id: "vitae",    name: "Vitae ⭐",    description: "Sidebar navy clásico, foto circular, section headers con tab ovalado accent", columns: "double", hasPhoto: true },
  { id: "aurora",  name: "Aurora ✦",  description: "Header fluido con ola SVG, arcos decorativos, diseño orgánico para creativos", columns: "double", hasPhoto: false },
  { id: "lumiere", name: "Lumière ✦", description: "Art Deco de lujo con ornamentos SVG simétricos, para ejecutivos y directivos", columns: "double", hasPhoto: false },
  { id: "consul",  name: "Consul",    description: "Sidebar azul con nombre apilado, foto circular y secciones con línea inferior", columns: "double", hasPhoto: true },
  { id: "rose",     name: "Rose ⚡",     description: "Sidebar rosa cálido con foto circular, secciones elegantes y acento dusty rose", columns: "double", hasPhoto: true },
  { id: "minimal",  name: "Minimal ⚡",  description: "Ultra-limpio con nombre gigante, puntos de rating y máximo espacio blanco", columns: "double", hasPhoto: true },
  { id: "banner",   name: "Banner ⚡",   description: "Headers en forma de banner/ribbon SVG navy con foto circular superior", columns: "double", hasPhoto: true },
  { id: "vertex",   name: "Vertex ⚡",   description: "Triángulos decorativos en esquinas, gauges circulares SVG para idiomas", columns: "double", hasPhoto: true },
  { id: "kyoto", name: "Kyoto ✦", description: "Sidebar off-white con marco cuadrado para foto e iconos brushstroke", columns: "double", hasPhoto: true },
  { id: "geneva", name: "Geneva ✦", description: "Nombre centrado en mayúsculas, divisores SVG punteados con icono", columns: "single", hasPhoto: false },
  { id: "windsor", name: "Windsor ✦", description: "Banda navy ejecutiva con nombre blanco y título dorado, foto con marco dorado", columns: "single", hasPhoto: true },
  { id: "milan", name: "Milán ✦", description: "Sidebar derecho carbón con iconos blancos, acento rojo bajo el nombre", columns: "double", hasPhoto: false },
  { id: "zurich", name: "Zürich ✦", description: "Numeración editorial (01 02 03) detrás de cada sección, acento cobre", columns: "single", hasPhoto: false },
  { id: "porto", name: "Porto ✦", description: "Header diagonal con split de color SVG, nombre a caballo entre dos tonos", columns: "single", hasPhoto: false },
  { id: "barcelona", name: "Barcelona ✦", description: "Skills como chips en grid, iconos iOS-style filled, nombre ultra-bold", columns: "double", hasPhoto: false },
  { id: "vienna", name: "Viena ✦", description: "Monograma faint de fondo, línea acento lateral en cada sección", columns: "single", hasPhoto: true },
  { id: "berlin", name: "Berlín ✦", description: "Estética monospace con prefijo › en secciones, chips de skills con borde", columns: "single", hasPhoto: false },
  { id: "stockholm", name: "Estocolmo ✦", description: "Sidebar gris claro con barras de progreso etiquetadas, iconos sky blue", columns: "double", hasPhoto: true },
  { id: "dublin", name: "Dublín ✦", description: "Máxima densidad de contenido, headers en versalitas, divisores SVG lineales", columns: "single", hasPhoto: false },
  { id: "helsinki", name: "Helsinki ✦", description: "Timeline SVG de skills en sidebar estrecho, proyectos con chips de tecnologías", columns: "double", hasPhoto: false },
  { id: "seoul", name: "Seúl ✦", description: "Sidebar oscuro con textura SVG de puntos, indicadores de color por contacto", columns: "double", hasPhoto: true },
  { id: "copenhagen", name: "Copenhague ✦", description: "Secciones con fondos tintados alternos, foto con marco redondeado, editorial suave", columns: "single", hasPhoto: true },
  { id: "genevanoir", name: "Geneva Noir ✦", description: "Header negro, nombre blanco tracking amplio, badges oscuros en secciones, acento eléctrico", columns: "single", hasPhoto: false },
  { id: "reykjavik", name: "Reikiavik ✦", description: "Labels de sección rotados 90° en margen izquierdo, layout asimétrico distintivo", columns: "double", hasPhoto: false },
  { id: "apex",    name: "Apex ⭐",    description: "Header diagonal con clipPath de color, badges pill en secciones, dos columnas limpias", columns: "double", hasPhoto: true },
  { id: "nova",    name: "Nova ⭐",    description: "Header editorial split: nombre gigante izquierda + bloque color derecha, numeración 01·02·03", columns: "single", hasPhoto: true },
  { id: "cascade", name: "Cascade ⭐", description: "Sidebar con degradado accent→dark, ola SVG decorativa, timeline con dots en main", columns: "double", hasPhoto: true },
  { id: "onyx",    name: "Onyx ⭐",    description: "Full dark mode premium, tarjetas de superficie por entrada, barras neon en sidebar", columns: "double", hasPhoto: true },
  { id: "mosaic",   name: "Mosaic ⭐",   description: "Header bento con bloque gris + bloque accent, chips skill con borde, section tiles cuadrados", columns: "double", hasPhoto: true },
  { id: "thompson", name: "Thompson ⭐", description: "Header oscuro full-width con foto circular overlap, nombre grande uppercase, sidebar progress bars, bullets hollow en experiencia", columns: "double", hasPhoto: true },
  { id: "larsson",  name: "Larsson ⭐",  description: "Sidebar navy oscuro, foto en marco rombo, contact con labels, dot rating skills, section headers con línea", columns: "double", hasPhoto: true },
  { id: "classicmono",      name: "Classic Mono ⭐",      description: "Editorial minimal, sidebar con foto circular, skills bars finas, monospace", columns: "double", hasPhoto: true },
  { id: "editorialserif",   name: "Editorial Serif ⭐",   description: "Magazine style, cream, drop cap, 3 columnas, Playfair Display", columns: "single", hasPhoto: false },
  { id: "boldblock",        name: "Bold Block ⭐",         description: "Brutalist, header oscuro con círculo decorativo, tags de stack, foto rounded", columns: "double", hasPhoto: true },
  { id: "timelinevertical", name: "Timeline Vertical ⭐", description: "Spine central, alternado izq/der, pull quote, serif display", columns: "single", hasPhoto: true },
  { id: "swissgrid",        name: "Swiss Grid ⭐",         description: "Grid internacional, número gigante de años, 12 columnas, monospace técnico", columns: "single", hasPhoto: false },
  { id: "charcoalclassic",  name: "Charcoal Classic ⭐", description: "Header pill oscuro redondeado, sidebar con skill bars, software badges", columns: "double", hasPhoto: true },
  { id: "navyexecutive",    name: "Navy Executive ⭐",   description: "Sidebar navy + marfil, acentos dorados, Playfair Display serif", columns: "double", hasPhoto: true },
  { id: "coralsidebar",     name: "Coral Sidebar ⭐",    description: "Sidebar coral derecho, nombre grande 56px, chips de stack redondeados", columns: "double", hasPhoto: true },
  { id: "sagebotanical",    name: "Sage Botanical ⭐",   description: "Header sage con curva, 2 columnas, tipografía DM Serif italic", columns: "double", hasPhoto: true },
  { id: "datadriven",       name: "Data Driven ⭐",      description: "Número gigante de años, métricas en strip, sparkline SVG footer", columns: "double", hasPhoto: false },
  { id: "legalbrief",      name: "Legal Brief ⭐",      description: "Memorial curricular estilo brief legal, márgenes rojos, firma cursiva", columns: "single", hasPhoto: false },
  { id: "engraved",        name: "Engraved ⭐",          description: "Marco doble dorado, monograma SVG, tipografía Cormorant grabada", columns: "single", hasPhoto: false },
  { id: "academiccv",      name: "Academic CV ⭐",       description: "CV académico sobrio, línea negra, columna fecha/contenido, EB Garamond", columns: "single", hasPhoto: false },
  { id: "psychologist",    name: "Psychologist ⭐",      description: "Header partido olive/terracotta, tipografía Lora, warm journal style", columns: "double", hasPhoto: true },
  { id: "hotelcv",        name: "Hotel CV ⭐",           description: "Estética concierge de hotel de lujo, tarjeta de bienvenida y datos estructurados", columns: "single", hasPhoto: true },
  { id: "translatorcv",   name: "Translator CV ⭐",        description: "Dos columnas bilingüe en papel crema, tipografía EB Garamond itálica, edición clásica", columns: "double", hasPhoto: false },
  { id: "risodesigner",         name: "Riso Designer ⭐",          description: "Estética risografía indie, bloques de color, tipografía bold contrastante", columns: "double", hasPhoto: false },
  { id: "uxtokens",             name: "UX Tokens ⭐",              description: "Sistema de diseño card dark, etiquetas tipo design token, paleta verde/azul", columns: "double", hasPhoto: true },
  { id: "blueprintcv",          name: "Blueprint CV ⭐",           description: "Plano técnico azul con grid de coordenadas, habitaciones etiquetadas por sección", columns: "double", hasPhoto: false },
  { id: "salespitch",           name: "Sales Pitch ⭐",            description: "Diapositiva de pitch deck, métricas en caja oscura, dos columnas con chips de habilidades", columns: "double", hasPhoto: false },
  // ─── Elite / Exec / Luxe — premium showpieces (planillas-lujosas-Jun-2026) ───
  { id: "elite-atlas",          name: "Atlas ✦",                  description: "Creative Director · Showpiece estructurado con panel charcoal, numeración editorial 01·02·03 y acento ochre", columns: "double", hasPhoto: true },
  { id: "exec-porcelain",       name: "Porcelain ✦",              description: "Executive ivory & champagne wave — masthead centrado, guilloché SVG y serif Cormorant para perfiles directivos", columns: "single", hasPhoto: false },
  { id: "luxe-noir",            name: "Noir ✦",                   description: "Obsidian & gold — monograma SVG sellado, marco filigrana en esquinas y composición serif para perfiles luxe", columns: "single", hasPhoto: false },
  // ─── Elite / Exec / Luxe — lote completo (planillas-lujosas-Jun-2026) ───
  { id: "elite-counsel",        name: "Counsel ✦",                description: "Lawyer · Dark luxe editorial con panel lateral derecho charcoal, acento dorado y tipografía serif para perfiles legales", columns: "double", hasPhoto: true },
  { id: "elite-aura",           name: "Aura ✦",                   description: "Designer · Banda hero con degradado violeta-rosa, gauges de habilidades y partículas sparkle para perfiles creativos", columns: "single", hasPhoto: false },
  { id: "elite-pulse",          name: "Pulse ✦",                  description: "Marketing · Header bold navy con espina timeline magenta y tipografía impactante para perfiles de marketing", columns: "single", hasPhoto: false },
  { id: "elite-cuvee",          name: "Cuvée ✦",                  description: "Chef · Menú luxe sobre fondo obsidian, secciones bordeadas en oro y tipografía serif para perfiles culinarios", columns: "double", hasPhoto: true },
  { id: "elite-cadence",        name: "Cadence ✦",                description: "Filmmaker · Estética cinematográfica ámbar, banda amber rule y timeline sobre fondo oscuro para perfiles audiovisuales", columns: "single", hasPhoto: true },
  { id: "elite-meridian",       name: "Meridian ✦",               description: "Doctor · Clinical luxe con banda teal, paneles blancos y layout estructurado para perfiles médicos", columns: "single", hasPhoto: false },
  { id: "luxe-aurum",           name: "Aurum ✦",                  description: "Cream & gold — gauges de habilidades en anillos SVG dorados, fondo crema cálido para perfiles signature", columns: "double", hasPhoto: true },
  { id: "luxe-vellum",          name: "Vellum ✦",                 description: "Ivory editorial — guilloché SVG en ondas, tipografía centrada serif y estructura editorial para perfiles luxe", columns: "single", hasPhoto: false },
  { id: "luxe-regent",          name: "Régent ✦",                 description: "Emerald executive — banda métrica de trayectoria, fondo esmeralda y composición ejecutiva para perfiles directivos", columns: "single", hasPhoto: false },
  { id: "luxe-apex",            name: "Luxe Apex ✦",              description: "Charcoal tech-luxe — marca de compás SVG, tipografía mono y fondo oscuro técnico para perfiles tech-executive", columns: "single", hasPhoto: false },
  { id: "exec-regency",         name: "Regency ✦",                description: "Executive · Bandas editoriales horizontales negro-dorado, serif headline para perfiles ejecutivos de alto nivel", columns: "single", hasPhoto: false },
  { id: "exec-sovereign",       name: "Sovereign ✦",              description: "Executive · Rail navy lateral izquierdo, marco circular de retrato y grid estructurado para perfiles C-suite", columns: "double", hasPhoto: true },
  { id: "exec-citadel",         name: "Citadel ✦",                description: "Executive · Doble marco Art-Deco navy, banda masthead invertida y chevrones dorados para perfiles ejecutivos premium", columns: "single", hasPhoto: false },
  { id: "exec-dynasty",         name: "Dynasty ✦",                description: "Executive · Rosetones ornamentales en esquinas, guilloché diagonal y monograma diamante sobre fondo obsidian", columns: "single", hasPhoto: false },
  { id: "exec-oxblood",         name: "Oxblood ✦",                description: "Executive · Panel lateral bordeaux, sello de cera SVG y tipografía serif para perfiles ejecutivos con carácter", columns: "double", hasPhoto: false },
  { id: "exec-cobalt",          name: "Exec Cobalt ✦",            description: "Executive · Fondo midnight, constelación de nodos platino SVG y tipografía técnica para perfiles tech-executive", columns: "single", hasPhoto: false },
  { id: "exec-terra",           name: "Terra ✦",                  description: "Executive · Arco arquitectónico terracota, toques tierra y tipografía serif warm para perfiles ejecutivos creativos", columns: "single", hasPhoto: false },
  { id: "exec-nocturne",        name: "Nocturne ✦",               description: "Executive · Banda plum, acentos rose-gold y gauges de anillos SVG para perfiles ejecutivos con estética nocturna", columns: "single", hasPhoto: false },
  { id: "exec-platine",         name: "Platine ✦",                description: "Executive · Black & platinum, numerales outline de índice y layout minimalista elegante para perfiles C-suite", columns: "single", hasPhoto: false },
  // ─── Signature / Tpl ───
  { id: "atelier",              name: "Atelier ✦",                description: "Editorial magazine — tipografía serif oversize, pullquote lateral y layout de revista para perfiles creativos", columns: "single", hasPhoto: true },
  { id: "bloom",                name: "Bloom ✦",                  description: "Creative pastel — blobs degradados suaves, hero centrado con foto circular y chips de habilidades con colores", columns: "single", hasPhoto: true },
  { id: "velvet",               name: "Velvet ✦",                 description: "Product purple — degradado violeta oscuro, iniciales como watermark y layout de dos columnas para perfiles de producto", columns: "double", hasPhoto: true },
  { id: "sahara",               name: "Sahara ✦",                 description: "Editorial earth tones — panel lateral tierra, tipografía serif warm y composición de columna para perfiles creativos", columns: "double", hasPhoto: true },
  { id: "pearl",                name: "Pearl ✦",                  description: "Luxe ivory & rose-gold — héroe centrado blanco, acentos dorados y layout minimal elegante para perfiles premium", columns: "single", hasPhoto: true },
  // ─── Flagship Premium ───
  { id: "editorial2",           name: "Gazette ✦",                description: "Newspaper flyer — años gigantes en tipografía editorial, layout periódico y composición de portada para perfiles creativos", columns: "double", hasPhoto: false },
  { id: "confetti",             name: "Confetti ✦",               description: "Gradient circular — foto circular con marco degradado, fondo vibrante y layout festivo para perfiles creativos", columns: "single", hasPhoto: true },
  { id: "frame",                name: "Frame ✦",                  description: "Teal border & QR — marco teal estructurado, código QR decorativo y layout limpio para perfiles modernos", columns: "single", hasPhoto: false },
  // ─── Showcase ───
  { id: "show-cameo",           name: "Caméo ✦",                  description: "Fashion symmetric blush — composición simétrica rosa, tipografía couture y layout de moda para perfiles fashion", columns: "single", hasPhoto: true },
  { id: "show-marquis",         name: "Marquis ✦",                description: "Scientist emerald band — banda verde esmeralda, layout científico estructurado para perfiles académicos", columns: "double", hasPhoto: false },
  { id: "show-soiree",          name: "Soirée ✦",                 description: "DJ black & champagne deco — fondo negro total, detalles champagne art-deco y composición nocturna para perfiles creativos", columns: "double", hasPhoto: true },
  { id: "show-plume",           name: "Plume ✦",                  description: "Writer warm editorial — pluma SVG, tipografía serif cálida y drop-cap dinámico para perfiles de escritura y contenido", columns: "single", hasPhoto: false },
  // ─── By Profession ───
  { id: "chef",                 name: "Le Chef ✦",                description: "Chef charcoal & copper — fondo carbón oscuro, acentos cobre y menú de secciones para perfiles culinarios", columns: "single", hasPhoto: true },
  { id: "teacher",              name: "Teacher ✦",                description: "Teacher warm & friendly — estética pizarra, colores mint cálidos y layout estructurado para perfiles educativos", columns: "single", hasPhoto: true },
  { id: "journalist",           name: "The Record ✦",             description: "Journalist newsprint — layout periódico con drop-cap, doble columna y tipografía editorial para perfiles de medios", columns: "double", hasPhoto: true },
  { id: "communicator",         name: "Broadcast ✦",              description: "Comms magenta gradient — gradiente magenta, barras de idiomas y composición dinámica para perfiles de comunicaciones", columns: "single", hasPhoto: true },
  { id: "filmmaker",            name: "Reel ✦",                   description: "Filmmaker cinematic — perforaciones de film, estética ámbar cinematográfica y layout de créditos para perfiles audiovisuales", columns: "single", hasPhoto: true },
  { id: "photographer",         name: "Aperture ✦",               description: "Photographer contact sheet — grid de contact sheet con marcos numerados, apertura SVG y layout fotográfico", columns: "single", hasPhoto: true },
  { id: "architect",            name: "Drafting ✦",               description: "Architect blueprint grid — fondo de cuadrícula técnica, tipografía mono DWG y layout de plano para perfiles de arquitectura", columns: "single", hasPhoto: false },
  { id: "doctor",               name: "Vitals ✦",                 description: "Doctor clinical teal — pulso SVG, sidebar teal clínico y barras de idiomas para perfiles médicos", columns: "double", hasPhoto: true },
  { id: "fashion",              name: "Atelier Fashion ✦",        description: "Fashion blush couture — aguja SVG, tipografía italiana blush y composición couture para perfiles de moda", columns: "single", hasPhoto: true },
  { id: "writer",               name: "Manuscript ✦",             description: "Writer literary serif — pluma SVG, nombre serif oversize y pullquote con sepia para perfiles de escritura", columns: "single", hasPhoto: false },
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

export const SECTION_LABELS: Record<"es" | "en", Record<string, string>> = {
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

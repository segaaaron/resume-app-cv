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
  | "lumiere"
  | "consul"
  | "rose"
  | "minimal"
  | "wave"
  | "banner"
  | "vertex"
  | "prestige"
  | "oslo"
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
  | "neobrutalist"
  | "sagebotanical"
  | "terminalcv"
  | "iosappcv"
  | "datadriven"
  | "boardingpass"
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
  | "postcardcv"
  | "medicalchart"
  | "vitalsigns"
  | "vetcv"
  | "notebookcv"
  | "fieldjournal"
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
  | "codeeditor"
  | "civileng"
  | "mechanical"
  | "devopsterminal"
  | "processflow"
  | "risodesigner"
  | "uxtokens"
  | "sketchbookillustrator"
  | "blueprintcv"
  | "contactsheet"
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
  | "obsidian"
  | "prism"
  | "tokyo"
  | "vitae"

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
  { id: "cobalt",   name: "Cobalt ⭐",   description: "Sidebar navy oscuro, tipografía creativa, foto circular, ideal para diseñadores", columns: "double", hasPhoto: true },
  { id: "duality",  name: "Duality ⭐",  description: "Sidebar derecho elegante, foto panorámica, layout bipartito limpio", columns: "double", hasPhoto: true },
  { id: "havana",   name: "Havana ⭐",   description: "Sidebar terracota con degradado, banda de nombre full-width, foto circular", columns: "double", hasPhoto: true },
  { id: "helix",    name: "Helix ⭐",    description: "Sidebar oscuro hexagonal SVG, progreso circular SVG, ideal para perfiles técnicos", columns: "double", hasPhoto: true },
  { id: "lisbon",   name: "Lisbon ⭐",   description: "Sidebar con degradado accent, foto hexagonal, iconos geométricos por sección", columns: "double", hasPhoto: true },
  { id: "nautical", name: "Nautical ⭐", description: "Sidebar navy marino, estética náutica clásica, foto circular con marco", columns: "double", hasPhoto: true },
  { id: "obsidian", name: "Obsidian ⭐", description: "Una columna oscura con photo header panorámica, estética dark premium", columns: "single", hasPhoto: true },
  { id: "prism",    name: "Prism ⭐",    description: "Sidebar navy profundo, foto circular, iconos de hobbies, estilo David Martin", columns: "double", hasPhoto: true },
  { id: "tokyo",    name: "Tokyo ⭐",    description: "Sidebar casi negro, círculos accent, labels uppercase con puntos decorativos", columns: "double", hasPhoto: true },
  { id: "vitae",    name: "Vitae ⭐",    description: "Sidebar navy clásico, foto circular, section headers con tab ovalado accent", columns: "double", hasPhoto: true },
  { id: "aurora",  name: "Aurora ✦",  description: "Header fluido con ola SVG, arcos decorativos, diseño orgánico para creativos", columns: "double", hasPhoto: false },
  { id: "lumiere", name: "Lumière ✦", description: "Art Deco de lujo con ornamentos SVG simétricos, para ejecutivos y directivos", columns: "double", hasPhoto: false },
  { id: "consul",  name: "Consul",    description: "Sidebar azul con nombre apilado, foto circular y secciones con línea inferior", columns: "double", hasPhoto: true },
  { id: "rose",     name: "Rose ⚡",     description: "Sidebar rosa cálido con foto circular, secciones elegantes y acento dusty rose", columns: "double", hasPhoto: true },
  { id: "minimal",  name: "Minimal ⚡",  description: "Ultra-limpio con nombre gigante, puntos de rating y máximo espacio blanco", columns: "double", hasPhoto: true },
  { id: "wave",     name: "Wave ⚡",     description: "Header degradado teal con ola SVG curva, badges de contacto y estrellas", columns: "double", hasPhoto: true },
  { id: "banner",   name: "Banner ⚡",   description: "Headers en forma de banner/ribbon SVG navy con foto circular superior", columns: "double", hasPhoto: true },
  { id: "vertex",   name: "Vertex ⚡",   description: "Triángulos decorativos en esquinas, gauges circulares SVG para idiomas", columns: "double", hasPhoto: true },
  { id: "prestige", name: "Prestige ⚡", description: "Fondo crema con bloque navy para resumen, acento cobre/bronce elegante", columns: "double", hasPhoto: true },
  { id: "oslo", name: "Oslo ✦", description: "Minimalismo tipográfico puro con iconos geométricos SVG por sección", columns: "single", hasPhoto: false },
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
  { id: "lagos", name: "Lagos ✦", description: "Sidebar verde bosque con foto y borde blanco, línea acento lateral en body", columns: "double", hasPhoto: true },
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
  { id: "neobrutalist",     name: "Neo Brutalist ⭐",    description: "Cards con bordes gruesos y sombra dura, fondo crema, colores primarios", columns: "double", hasPhoto: false },
  { id: "sagebotanical",    name: "Sage Botanical ⭐",   description: "Header sage con curva, 2 columnas, tipografía DM Serif italic", columns: "double", hasPhoto: true },
  { id: "terminalcv",       name: "Terminal CV ⭐",      description: "Xcode dark UI, syntax highlighting colores, sidebar de archivos", columns: "single", hasPhoto: false },
  { id: "iosappcv",         name: "iOS App CV ⭐",       description: "Interfaz iOS nativa, status bar, cards redondeadas, tab bar inferior", columns: "single", hasPhoto: true },
  { id: "datadriven",       name: "Data Driven ⭐",      description: "Número gigante de años, métricas en strip, sparkline SVG footer", columns: "double", hasPhoto: false },
  { id: "boardingpass",     name: "Boarding Pass ⭐",    description: "Metáfora ticket de avión, 3 tickets apilados, código de barras", columns: "single", hasPhoto: false },
  { id: "magazinespread",   name: "Magazine Spread ⭐",  description: "Editorial Playfair Display, drop cap, tres columnas, footer tags", columns: "single", hasPhoto: false },
  { id: "legalbrief",      name: "Legal Brief ⭐",      description: "Memorial curricular estilo brief legal, márgenes rojos, firma cursiva", columns: "single", hasPhoto: false },
  { id: "engraved",        name: "Engraved ⭐",          description: "Marco doble dorado, monograma SVG, tipografía Cormorant grabada", columns: "single", hasPhoto: false },
  { id: "chalkboard",      name: "Chalkboard ⭐",        description: "Pizarrón verde oscuro, tipografía Caveat/Permanent Marker, borrador", columns: "double", hasPhoto: false },
  { id: "academiccv",      name: "Academic CV ⭐",       description: "CV académico sobrio, línea negra, columna fecha/contenido, EB Garamond", columns: "single", hasPhoto: false },
  { id: "psychologist",    name: "Psychologist ⭐",      description: "Header partido olive/terracotta, tipografía Lora, warm journal style", columns: "double", hasPhoto: true },
  { id: "chefmenu",       name: "Chef Menu ⭐",         description: "Formato carta de restaurante con secciones por plato y tipografía serif gastronómica", columns: "single", hasPhoto: false },
  { id: "sommelier",      name: "Sommelier ⭐",          description: "Etiqueta de vino girada, banda lateral, tipografía elegante con notas de cata", columns: "double", hasPhoto: false },
  { id: "hotelcv",        name: "Hotel CV ⭐",           description: "Estética concierge de hotel de lujo, tarjeta de bienvenida y datos estructurados", columns: "single", hasPhoto: true },
  { id: "bartendercv",    name: "Bartender CV ⭐",       description: "Pizarrón dark con chalk, receta de cóctel como metáfora del perfil profesional", columns: "double", hasPhoto: false },
  { id: "postcardcv",     name: "Postcard CV ⭐",        description: "Diseño postal vintage con sellos, matasellos y tipografía manuscrita", columns: "single", hasPhoto: true },
  { id: "medicalchart",   name: "Medical Chart ⭐",      description: "Historial clínico con cabecera verde médico, cuadrícula de datos y cruz decorativa", columns: "double", hasPhoto: false },
  { id: "vitalsigns",     name: "Vital Signs ⭐",        description: "Monitor de signos vitales, ECG SVG animado, métricas de contacto como indicadores", columns: "double", hasPhoto: false },
  { id: "vetcv",          name: "Vet CV ⭐",             description: "Encabezado marrón cálido con ilustración de mascota SVG, estilo veterinario acogedor", columns: "double", hasPhoto: true },
  { id: "notebookcv",     name: "Notebook CV ⭐",        description: "Estilo cuaderno Jupyter con celdas de código, outputs y markdown. Ideal para data scientists", columns: "single", hasPhoto: false },
  { id: "fieldjournal",   name: "Field Journal ⭐",      description: "Cuaderno de campo con líneas de fondo, tipografía Garamond, mapa SVG y pie de página de coordenadas", columns: "double", hasPhoto: false },
  { id: "pilotlog",       name: "Pilot Log ⭐",           description: "Cuaderno de vuelo ICAO, tabla de carrera, stats de contacto en formato logbook", columns: "single", hasPhoto: false },
  { id: "onboardingform", name: "Onboarding Form ⭐",     description: "Formulario de alta de empleado, campos con subrayado, checks de habilidades, firma cursiva", columns: "single", hasPhoto: false },
  { id: "athletecard",    name: "Athlete Card ⭐",         description: "Tarjeta coleccionable deportiva, barras de atributos 0-99, stats de temporada, borde naranja", columns: "double", hasPhoto: true },
  { id: "translatorcv",   name: "Translator CV ⭐",        description: "Dos columnas bilingüe en papel crema, tipografía EB Garamond itálica, edición clásica", columns: "double", hasPhoto: false },
  { id: "herbariumcv",    name: "Herbarium CV ⭐",          description: "Marco botánico doble, ilustración SVG de vid, tipografía Garamond, estilo especímen de herbario", columns: "double", hasPhoto: false },
  { id: "frontpage",      name: "Front Page ⭐",            description: "Portada de periódico estilo periodismo clásico, columnas de texto, titular dramático en Playfair Display", columns: "single", hasPhoto: false },
  { id: "vinylcv",        name: "Vinyl CV ⭐",              description: "Portada de vinilo LP con disco SVG, tracklist de experiencia, fondo negro y dorado", columns: "double", hasPhoto: false },
  { id: "callsheet",      name: "Call Sheet ⭐",            description: "Hoja de llamado de producción cinematográfica, tabla de elenco, bloques de producción en amarillo y negro", columns: "single", hasPhoto: false },
  { id: "copywritermag",  name: "Copywriter Mag ⭐",        description: "Doble página de revista literaria, gran titular tipográfico, cuerpo en dos columnas estilo ensayo", columns: "double", hasPhoto: false },
  { id: "animatorcv",     name: "Animator CV ⭐",           description: "Tira de fotogramas animados, círculo saltarín SVG, chips de software en azul, estética 2D animation studio", columns: "double", hasPhoto: false },
  { id: "codeeditor",     name: "Code Editor ⭐",           description: "Tema dark Catppuccin Mocha, layout de editor de código con syntax highlighting y barra de estado", columns: "single", hasPhoto: false },
  { id: "civileng",       name: "Civil Eng ⭐",              description: "Fondo crema, encabezado bold, línea de tiempo SVG tipo plano estructural, paleta naranja/verde", columns: "double", hasPhoto: false },
  { id: "mechanical",     name: "Mechanical ⭐",             description: "Diagrama exploded view SVG con callouts numerados, estética de plano técnico industrial", columns: "double", hasPhoto: false },
  { id: "devopsterminal", name: "DevOps Terminal ⭐",        description: "Terminal log dark con niveles INFO/WARN/OK/ERR, paleta verde neón, estructura tipo tail -f", columns: "single", hasPhoto: false },
  { id: "processflow",          name: "Process Flow ⭐",          description: "Mapa de proceso DMAIC con flechas SVG tipo ingeniería industrial, paleta azul/naranja", columns: "double", hasPhoto: false },
  { id: "risodesigner",         name: "Riso Designer ⭐",          description: "Estética risografía indie, bloques de color, tipografía bold contrastante", columns: "double", hasPhoto: false },
  { id: "uxtokens",             name: "UX Tokens ⭐",              description: "Sistema de diseño card dark, etiquetas tipo design token, paleta verde/azul", columns: "double", hasPhoto: true },
  { id: "sketchbookillustrator",name: "Sketchbook ⭐",             description: "Papel de cuaderno con líneas, margen rojo, tipografía manuscrita Caveat", columns: "double", hasPhoto: true },
  { id: "blueprintcv",          name: "Blueprint CV ⭐",           description: "Plano técnico azul con grid de coordenadas, habitaciones etiquetadas por sección", columns: "double", hasPhoto: false },
  { id: "contactsheet",         name: "Contact Sheet ⭐",          description: "Hoja de contacto fotográfico, tira de negativos SVG, paleta oscura tipo cuarto oscuro", columns: "double", hasPhoto: true },
  { id: "annualreport",         name: "Annual Report ⭐",          description: "Informe anual corporativo, Playfair serif, tabla de resultados, sparkline SVG de carrera", columns: "double", hasPhoto: false },
  { id: "financeterminal",      name: "Finance Terminal ⭐",       description: "Estética terminal Bloomberg, fondo oscuro, texto verde/ámbar, tabla de track record", columns: "double", hasPhoto: false },
  { id: "campaignposter",       name: "Campaign Poster ⭐",        description: "Cartel de campaña política, gran titular HIRE [NAME]!, badge giratorio, fondos bold", columns: "single", hasPhoto: true },
  { id: "salespitch",           name: "Sales Pitch ⭐",            description: "Diapositiva de pitch deck, métricas en caja oscura, dos columnas con chips de habilidades", columns: "double", hasPhoto: false },
  { id: "ledgercv",             name: "Ledger CV ⭐",              description: "Libro contable con filas de debe/haber, entradas tipo asiento contable, balance final", columns: "single", hasPhoto: false },
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

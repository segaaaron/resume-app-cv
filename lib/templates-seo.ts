/**
 * SEO metadata layer for the CV templates (count = TEMPLATES.length).
 *
 * Strategy:
 * 1. Source of truth = `TEMPLATES` in /types/resume.ts.
 * 2. For each template we DERIVE base SEO metadata (slug, layout, hasPhoto)
 *    from the registry, and ENRICH 40+ priority templates with curated copy.
 * 3. Templates without curated copy still get usable, non-invented metadata
 *    generated from name + description + visual category.
 *
 * No template names are invented — every entry maps 1:1 to an existing file
 * under /components/resume/templates/.
 */

import { TEMPLATES, type TemplateInfo } from "@/types/resume"
import { PRO_IDS } from "@/components/editor/template-switcher/template-data"

export type TemplateCategory =
  | "modern"
  | "classic"
  | "creative"
  | "minimal"
  | "professional"
  | "ats"
  | "tech"
  | "executive"

export type TemplateLayout =
  | "single-column"
  | "two-column"
  | "sidebar-left"
  | "sidebar-right"

export type TemplateSEO = {
  id: string
  slug: string
  /** Registry name — Spanish, the language the catalog was authored in. */
  name: string
  /** Same template, English display name. Equal to `name` for the proper nouns. */
  nameEn: string
  category: TemplateCategory
  tags: string[]
  bestFor: { en: string[]; es: string[] }
  description: { en: string; es: string }
  longDescription: { en: string; es: string }
  features: { en: string[]; es: string[] }
  colors: { primary: string; accent: string }
  layout: TemplateLayout
  hasPhoto: boolean
  isPro: boolean
}

// ─── Curated copy for high-priority templates ────────────────────────────────
// 40 templates get hand-tuned SEO copy. Rest fall back to derivation.
type CuratedEntry = Partial<Omit<TemplateSEO, "id" | "slug" | "name" | "hasPhoto" | "isPro">> & {
  category: TemplateCategory
  colors: { primary: string; accent: string }
  layout: TemplateLayout
}

const CURATED: Record<string, CuratedEntry> = {
  ats: {
    category: "ats",
    layout: "single-column",
    colors: { primary: "#1f2937", accent: "#1a2e4a" },
    tags: ["ats-friendly", "single-column", "minimal", "recommended"],
    bestFor: {
      en: ["Software Engineers", "Accountants", "Project Managers", "Analysts", "Corporate Roles"],
      es: ["Ingenieros de Software", "Contadores", "Gerentes de Proyectos", "Analistas", "Roles Corporativos"],
    },
    description: {
      en: "Pure-text single-column resume engineered to pass any Applicant Tracking System without parsing errors.",
      es: "CV de una sola columna en texto puro, diseñado para superar cualquier ATS sin errores de parseo.",
    },
    longDescription: {
      en: "ATS Pro is the safest choice when your application will be screened by automated systems. No tables, no graphics, no columns — just clean semantic text that recruiters and HR software can read flawlessly. Built for the single-column reading order systems like Workday, Greenhouse, Lever, Taleo and iCIMS parse most reliably.",
      es: "ATS Pro es la opción más segura cuando tu aplicación será evaluada por sistemas automáticos. Sin tablas, sin gráficos, sin columnas — solo texto semántico limpio que reclutadores y software de RRHH pueden leer perfectamente. Construida para el orden de lectura de una columna que sistemas como Workday, Greenhouse, Lever, Taleo e iCIMS parsean de forma más confiable.",
    },
    features: {
      en: ["Single column structure", "Semantic HTML headings", "Selectable text, no images or icons", "Standard section headings", "Print-perfect at A4 and Letter"],
      es: ["Estructura de una columna", "Encabezados HTML semánticos", "Texto seleccionable, sin imágenes ni iconos", "Encabezados de sección estándar", "Impresión perfecta en A4 y Carta"],
    },
  },
  aurora: {
    category: "creative",
    layout: "two-column",
    colors: { primary: "#4c1d95", accent: "#8b5cf6" },
    tags: ["creative", "two-column", "decorative-svg", "modern"],
    bestFor: {
      en: ["Designers", "Marketers", "Content Creators", "Brand Strategists"],
      es: ["Diseñadores", "Marketers", "Creadores de Contenido", "Estrategas de Marca"],
    },
    description: {
      en: "Flowing header with SVG wave, decorative arcs and organic layout for creative professionals.",
      es: "Header fluido con ola SVG, arcos decorativos y layout orgánico para profesionales creativos.",
    },
    longDescription: {
      en: "Aurora makes a confident creative statement without sacrificing readability. The decorative SVG header signals craft and attention to detail — perfect for designers, content strategists and creative leads who want their resume to stand out in a stack.",
      es: "Aurora hace una declaración creativa con confianza sin sacrificar legibilidad. El header decorativo SVG señala oficio y atención al detalle — perfecto para diseñadores, estrategas de contenido y líderes creativos que quieren destacar.",
    },
    features: {
      en: ["Decorative SVG header", "Two-column premium layout", "Soft gradient accents", "Print-optimized", "Custom typography pairing"],
      es: ["Header decorativo SVG", "Layout premium de dos columnas", "Acentos en gradiente suave", "Optimizado para impresión", "Combinación tipográfica personalizada"],
    },
  },
  modern: {
    category: "modern",
    layout: "single-column",
    colors: { primary: "#1d1d20", accent: "#7c3aed" },
    tags: ["modern", "photo", "single-column", "ats-friendly"],
    bestFor: {
      en: ["Product Managers", "Marketing Managers", "Consultants", "Sales Leaders"],
      es: ["Product Managers", "Gerentes de Marketing", "Consultores", "Líderes de Ventas"],
    },
    description: {
      en: "Future-forward layout with photo header, balanced typography and high ATS compatibility.",
      es: "Layout futurista con foto en header, tipografía equilibrada y alta compatibilidad ATS.",
    },
    longDescription: {
      en: "Modern combines a contemporary visual identity with strong ATS performance. The single-column structure ensures parser compatibility, while the photo header and bold accent color give your resume immediate visual presence.",
      es: "Modern combina identidad visual contemporánea con sólido rendimiento ATS. La estructura de una columna asegura compatibilidad con parsers, mientras que el header con foto y el color accent fuerte dan a tu CV presencia visual inmediata.",
    },
    features: {
      en: ["Photo-enabled header", "ATS-friendly structure", "Bold accent color", "Generous whitespace", "Print-ready"],
      es: ["Header con foto", "Estructura ATS-friendly", "Color accent atrevido", "Espacio en blanco generoso", "Lista para imprimir"],
    },
  },
  classic: {
    category: "classic",
    layout: "single-column",
    colors: { primary: "#2a72d7", accent: "#1a2e4a" },
    tags: ["classic", "single-column", "ats-friendly", "universal"],
    bestFor: {
      en: ["Finance", "Law", "Healthcare", "Corporate", "Education"],
      es: ["Finanzas", "Derecho", "Salud", "Corporativo", "Educación"],
    },
    description: {
      en: "Timeless single-column resume suitable for any industry. Maximum ATS compatibility.",
      es: "CV de una columna atemporal, adecuado para cualquier industria. Máxima compatibilidad ATS.",
    },
    longDescription: {
      en: "Classic is the safe-and-strong choice. Its conservative structure works in every industry — from law firms and banks to hospitals and universities. Recruiters know exactly where to look, ATS systems parse it cleanly, and your content gets the focus it deserves.",
      es: "Classic es la opción segura y sólida. Su estructura conservadora funciona en cualquier industria — desde despachos jurídicos y bancos hasta hospitales y universidades. Los reclutadores saben dónde buscar, los ATS lo parsean limpiamente y tu contenido recibe el foco que merece.",
    },
    features: {
      en: ["Maximum ATS compatibility", "Universal industry fit", "Single-column structure", "Classic typography", "Print-perfect"],
      es: ["Máxima compatibilidad ATS", "Universal por industria", "Estructura de una columna", "Tipografía clásica", "Impresión perfecta"],
    },
  },
  executive: {
    category: "executive",
    layout: "two-column",
    colors: { primary: "#1e3a5f", accent: "#c4a052" },
    tags: ["executive", "premium", "two-column", "senior", "leadership"],
    bestFor: {
      en: ["CEOs", "VPs", "Directors", "Senior Managers", "Board Members"],
      es: ["CEOs", "VPs", "Directores", "Gerentes Senior", "Miembros de Junta"],
    },
    description: {
      en: "Premium two-column layout designed for C-level executives and senior leadership profiles.",
      es: "Layout premium de dos columnas diseñado para ejecutivos C-level y perfiles de liderazgo senior.",
    },
    longDescription: {
      en: "Executive delivers gravitas. The two-column layout with gold accents and serif typography signals seniority and authority — exactly what selection committees and executive recruiters expect when evaluating leadership candidates.",
      es: "Executive transmite autoridad. El layout de dos columnas con acentos dorados y tipografía serif señala seniority — exactamente lo que los comités de selección y reclutadores ejecutivos esperan al evaluar candidatos de liderazgo.",
    },
    features: {
      en: ["Two-column executive layout", "Gold accent details", "Serif typography", "Leadership-focused structure", "Premium print quality"],
      es: ["Layout ejecutivo de dos columnas", "Detalles en acento dorado", "Tipografía serif", "Estructura orientada al liderazgo", "Calidad de impresión premium"],
    },
  },
  professional: {
    category: "professional",
    layout: "single-column",
    colors: { primary: "#0f172a", accent: "#0ea5e9" },
    tags: ["professional", "photo", "ats-friendly", "single-column"],
    bestFor: {
      en: ["Healthcare", "HR", "Operations", "Consulting", "Banking"],
      es: ["Salud", "RRHH", "Operaciones", "Consultoría", "Banca"],
    },
    description: {
      en: "Organized and modern structure for professional service industries.",
      es: "Estructura organizada y moderna para industrias de servicios profesionales.",
    },
    longDescription: {
      en: "Professional balances a contemporary look with rigorous structure. The navy header anchors the page while the single-column body keeps the resume ATS-friendly. A reliable choice for HR, consulting, healthcare and any role where polish matters.",
      es: "Professional equilibra una estética contemporánea con estructura rigurosa. El header navy ancla la página mientras que el cuerpo de una columna mantiene el CV amigable con ATS. Una elección fiable para RRHH, consultoría, salud y cualquier rol donde la pulcritud importa.",
    },
    features: {
      en: ["Professional navy header", "Photo-enabled", "ATS-compatible", "Strong information hierarchy", "Print-perfect"],
      es: ["Header navy profesional", "Acepta foto", "Compatible con ATS", "Jerarquía de información sólida", "Impresión perfecta"],
    },
  },
  minimal: {
    category: "minimal",
    layout: "two-column",
    colors: { primary: "#111827", accent: "#6b7280" },
    tags: ["minimal", "two-column", "photo", "premium"],
    bestFor: {
      en: ["Designers", "Architects", "Product Managers", "Creative Directors"],
      es: ["Diseñadores", "Arquitectos", "Product Managers", "Directores Creativos"],
    },
    description: {
      en: "Ultra-clean layout with giant name typography, dot ratings and maximum whitespace.",
      es: "Layout ultra-limpio con nombre tipográfico gigante, puntos de rating y máximo espacio en blanco.",
    },
    longDescription: {
      en: "Minimal is design discipline made resume. Every pixel earns its place: the giant name typography, the dot rating system for skills, and the generous whitespace combine into a confident, sophisticated document.",
      es: "Minimal es disciplina de diseño hecha CV. Cada píxel gana su lugar: la tipografía gigante del nombre, el sistema de puntos para skills y el espacio en blanco generoso se combinan en un documento sofisticado y confiado.",
    },
    features: {
      en: ["Editorial typography", "Dot rating skills", "Two-column premium", "Maximum whitespace", "Print-optimized"],
      es: ["Tipografía editorial", "Skills con puntos de rating", "Premium dos columnas", "Máximo espacio en blanco", "Optimizado para impresión"],
    },
  },
  carbon: {
    category: "tech",
    layout: "sidebar-left",
    colors: { primary: "#0f172a", accent: "#22d3ee" },
    tags: ["dark-mode", "tech", "two-column", "photo"],
    bestFor: {
      en: ["Software Engineers", "DevOps", "Data Scientists", "Cybersecurity"],
      es: ["Ingenieros de Software", "DevOps", "Científicos de Datos", "Ciberseguridad"],
    },
    description: {
      en: "Dark-mode tech resume with cyan accents. Perfect for engineering and design roles.",
      es: "CV tech en modo oscuro con acentos cyan. Perfecto para roles de ingeniería y diseño.",
    },
    longDescription: {
      en: "Carbon is the dark-mode resume for technical professionals. The slate-and-cyan palette reads as engineering culture, while the structured sidebar keeps your stack, certifications and tools front-and-center.",
      es: "Carbon es el CV en modo oscuro para profesionales técnicos. La paleta slate-cyan se lee como cultura de ingeniería, mientras que el sidebar estructurado mantiene tu stack, certificaciones y herramientas al frente.",
    },
    features: {
      en: ["Dark-mode aesthetic", "Cyan tech accent", "Left sidebar", "Stack-forward structure", "Photo header"],
      es: ["Estética dark mode", "Acento cyan tech", "Sidebar izquierdo", "Estructura stack-first", "Header con foto"],
    },
  },
  blueprint: {
    category: "tech",
    layout: "sidebar-left",
    colors: { primary: "#1e3a5f", accent: "#2a72d7" },
    tags: ["tech", "engineering", "two-column", "photo"],
    bestFor: {
      en: ["Engineers", "Architects", "Construction Managers", "Technical Leads"],
      es: ["Ingenieros", "Arquitectos", "Gerentes de Construcción", "Líderes Técnicos"],
    },
    description: {
      en: "Navy sidebar with circular photo and color headings. Engineering-aesthetic resume.",
      es: "Sidebar navy con foto circular y encabezados en color. CV con estética de ingeniería.",
    },
    longDescription: {
      en: "Blueprint draws from architectural drafting traditions. The navy sidebar with circular photo, paired with color-coded section headings, makes credentials and certifications instantly scannable — ideal for engineering and technical leadership roles.",
      es: "Blueprint se inspira en tradiciones de dibujo arquitectónico. El sidebar navy con foto circular, junto a encabezados de sección codificados por color, hace credenciales y certificaciones instantáneamente escaneables.",
    },
    features: {
      en: ["Architectural aesthetic", "Navy sidebar", "Color-coded sections", "Circular photo", "Print-perfect"],
      es: ["Estética arquitectónica", "Sidebar navy", "Secciones codificadas por color", "Foto circular", "Impresión perfecta"],
    },
  },
  neon: {
    category: "creative",
    layout: "single-column",
    colors: { primary: "#ec4899", accent: "#000000" },
    tags: ["creative", "brutalist", "single-column", "bold"],
    bestFor: {
      en: ["Designers", "Creative Directors", "Advertising", "Branding"],
      es: ["Diseñadores", "Directores Creativos", "Publicidad", "Branding"],
    },
    description: {
      en: "Vibrant neobrutalist design with hard shadows. For confident creative profiles.",
      es: "Diseño neobrutalista vibrante con sombras duras. Para perfiles creativos seguros.",
    },
    longDescription: {
      en: "Neon embraces neobrutalism — the post-minimal design movement defined by hard shadows, raw blocks and unapologetic color. It signals creative confidence and is best suited to design-forward industries where standing out is part of the job.",
      es: "Neon abraza el neobrutalismo — el movimiento post-minimal definido por sombras duras, bloques crudos y color sin disculpas. Señala confianza creativa y se adapta mejor a industrias orientadas al diseño donde destacar es parte del trabajo.",
    },
    features: {
      en: ["Neobrutalist design", "Hard shadow blocks", "Bold color palette", "High visual impact", "Creative-industry focus"],
      es: ["Diseño neobrutalista", "Bloques de sombra dura", "Paleta de color atrevida", "Alto impacto visual", "Enfoque industria creativa"],
    },
  },
}

// ─── Category inference for non-curated templates ────────────────────────────

function inferCategory(t: TemplateInfo): TemplateCategory {
  const id = t.id.toLowerCase()
  // The 15 `ats*` templates (AtsMeridian, AtsVerdant, …) were falling through to
  // "classic": only the exact id "ats" was matched. That mislabelled their tags,
  // colors and generated copy ("ATS Meridian … classic design").
  if (id === "ats" || id.startsWith("ats")) return "ats"
  if (/(code|tech|terminal|carbon|blueprint|cyber|helix|prism|finance)/.test(id)) return "tech"
  if (/(executive|lumiere|navyexecutive|consul|windsor|exec-|elite-|luxe-)/.test(id)) return "executive"
  if (/(creative|aurora|neon|bauhaus|risodesigner|magazinespread|vogue|frontpage|callsheet|vinylcv|copywritermag|animatorcv|chalkboard|herbariumcv|campaignposter)/.test(id)) return "creative"
  if (/(minimal|simple|nordic|outline|chrono|geneva|oslo|kyoto|copenhagen|swissgrid|dublin|berlin|reykjavik|stockholm|helsinki|barcelona|lagos|seoul|porto|milan|zurich)/.test(id)) return "minimal"
  if (/(modern|professional|spark|glass|metro|fold|sidebar|consul|sharp|cobalt|duality|havana|lisbon|nautical|tokyo|vitae|apex|nova|cascade|onyx|mosaic|larsson|thompson)/.test(id)) return "modern"
  return "classic"
}

function inferLayout(t: TemplateInfo): TemplateLayout {
  if (t.columns === "single") return "single-column"
  // Sidebar templates from registry descriptions
  const sidebarRight = ["duality", "milan", "coralsidebar"]
  if (sidebarRight.includes(t.id)) return "sidebar-right"
  const sidebarLeft = [
    "carbon", "blueprint", "cobalt", "havana", "helix", "lisbon", "nautical",
    "prism", "tokyo", "vitae", "consul", "sidebar", "stockholm", "lagos", "seoul",
    "larsson", "classicmono", "charcoalclassic", "navyexecutive", "cascade",
    "thompson",
  ]
  if (sidebarLeft.includes(t.id)) return "sidebar-left"
  return "two-column"
}




const CATEGORY_COLORS: Record<TemplateCategory, { primary: string; accent: string }> = {
  ats:          { primary: "#1f2937", accent: "#1a2e4a" },
  classic:      { primary: "#2a72d7", accent: "#1a2e4a" },
  modern:       { primary: "#1d1d20", accent: "#00D4FF" },
  minimal:      { primary: "#111827", accent: "#6b7280" },
  professional: { primary: "#0f172a", accent: "#0ea5e9" },
  executive:    { primary: "#1e3a5f", accent: "#c4a052" },
  tech:         { primary: "#0f172a", accent: "#22d3ee" },
  creative:     { primary: "#4c1d95", accent: "#ec4899" },
}

const CATEGORY_TAGS: Record<TemplateCategory, string[]> = {
  ats:          ["ats-friendly", "single-column", "recommended"],
  classic:      ["classic", "ats-friendly", "universal"],
  modern:       ["modern", "ats-friendly"],
  minimal:      ["minimal", "premium", "whitespace"],
  professional: ["professional", "ats-friendly"],
  executive:    ["executive", "premium", "leadership"],
  tech:         ["tech", "engineering", "developer"],
  creative:     ["creative", "designer", "decorative"],
}

const CATEGORY_BEST_FOR: Record<TemplateCategory, { en: string[]; es: string[] }> = {
  ats:          { en: ["Corporate Roles", "Tech", "Finance", "Healthcare"], es: ["Roles Corporativos", "Tech", "Finanzas", "Salud"] },
  classic:      { en: ["Finance", "Law", "Healthcare", "Education"], es: ["Finanzas", "Derecho", "Salud", "Educación"] },
  modern:       { en: ["Product Managers", "Marketers", "Consultants"], es: ["Product Managers", "Marketers", "Consultores"] },
  minimal:      { en: ["Designers", "Architects", "Strategists"], es: ["Diseñadores", "Arquitectos", "Estrategas"] },
  professional: { en: ["HR", "Consulting", "Healthcare", "Operations"], es: ["RRHH", "Consultoría", "Salud", "Operaciones"] },
  executive:    { en: ["C-Level", "VPs", "Directors", "Senior Leadership"], es: ["C-Level", "VPs", "Directores", "Liderazgo Senior"] },
  tech:         { en: ["Software Engineers", "DevOps", "Data Scientists"], es: ["Ingenieros de Software", "DevOps", "Científicos de Datos"] },
  creative:     { en: ["Designers", "Creative Directors", "Content Creators"], es: ["Diseñadores", "Directores Creativos", "Creadores de Contenido"] },
}

const CATEGORY_EN: Record<TemplateCategory, string> = {
  ats:          "ATS-safe",
  classic:      "classic",
  modern:       "modern",
  minimal:      "minimal",
  professional: "professional",
  executive:    "executive",
  tech:         "technical",
  creative:     "creative",
}

const CATEGORY_ES: Record<TemplateCategory, string> = {
  ats:          "compatible con ATS",
  classic:      "clásica",
  modern:       "moderna",
  minimal:      "minimalista",
  professional: "profesional",
  executive:    "ejecutiva",
  tech:         "técnica",
  creative:     "creativa",
}

const LAYOUT_EN: Record<TemplateLayout, string> = {
  "single-column": "a single-column layout",
  "two-column":    "a two-column layout",
  "sidebar-left":  "a left-sidebar layout",
  "sidebar-right": "a right-sidebar layout",
}

const LAYOUT_ES: Record<TemplateLayout, string> = {
  "single-column": "layout de una columna",
  "two-column":    "layout de dos columnas",
  "sidebar-left":  "layout con sidebar izquierdo",
  "sidebar-right": "layout con sidebar derecho",
}

function slugify(id: string): string {
  return id
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function cleanName(name: string): string {
  // Remove decorative marks the registry uses (⭐, ✦, ⚡)
  return name.replace(/[⭐✦⚡]/g, "").trim()
}

// ─── English display names ───────────────────────────────────────────────────
// The registry (`TEMPLATES` in types/resume.ts) was authored in Spanish, so a
// handful of templates carry a translated common word or a Spanish exonym for a
// city. Rendering those on /en produced titles like "Clásico Resume Template"
// and "Estocolmo Resume Template". Only the entries that actually differ are
// listed; every other name is a proper noun and is identical in both languages.
const EN_NAMES: Record<string, string> = {
  classic: "Classic",
  modern: "Modern",
  professional: "Professional",
  elegant: "Elegant",
  luxurious: "Luxurious",
  milan: "Milan",
  zurich: "Zurich",
  vienna: "Vienna",
  berlin: "Berlin",
  stockholm: "Stockholm",
  dublin: "Dublin",
  seoul: "Seoul",
  copenhagen: "Copenhagen",
  reykjavik: "Reykjavik",
}

/** Display name for a template in the requested locale. */
export function templateName(t: Pick<TemplateSEO, "name" | "nameEn">, locale: string): string {
  return locale === "es" ? t.name : t.nameEn
}

function buildTemplateSEO(t: TemplateInfo): TemplateSEO {
  const curated = CURATED[t.id]
  const category = curated?.category ?? inferCategory(t)
  const layout = curated?.layout ?? inferLayout(t)
  const colors = curated?.colors ?? CATEGORY_COLORS[category]
  const tags = curated?.tags ?? CATEGORY_TAGS[category]
  const bestFor = curated?.bestFor ?? CATEGORY_BEST_FOR[category]
  const name = cleanName(t.name)
  const nameEn = EN_NAMES[t.id] ?? name

  // `t.description` is Spanish (the registry's authoring language). Interpolating
  // it into the English fallback shipped 133 /en pages with a half-Spanish meta
  // description ("ATS Meridian resume template — ATS-safe con banda de color…").
  // The English copy is derived from facts we already hold in English instead:
  // category, layout and whether the header carries a photo.
  const layoutEn = LAYOUT_EN[layout]
  const layoutEs = LAYOUT_ES[layout]
  const headerEn = t.hasPhoto ? "a photo header" : "a text-only header"

  const description = curated?.description ?? {
    en: `${nameEn} resume template — ${CATEGORY_EN[category]} design on ${layoutEn} with ${headerEn}. ATS-friendly and fully editable in Valhalla Resume.`,
    es: `Plantilla de CV ${name} — ${t.description}. Compatible con ATS y totalmente editable en Valhalla Resume.`,
  }

  const longDescription = curated?.longDescription ?? {
    en: `The ${nameEn} template pairs a ${CATEGORY_EN[category]} aesthetic with a recruiter-ready ${layoutEn} and ${headerEn}. Build your CV in Valhalla Resume's editor, customize colors and typography, then export to PDF — ready to send to recruiters in minutes.`,
    es: `La plantilla ${name} combina una estética ${CATEGORY_ES[category]} con estructura práctica lista para reclutadores. ${t.description}. Construye tu CV en el editor de Valhalla Resume, personaliza colores y tipografía, luego exporta a PDF — listo para enviar en minutos.`,
  }

  const features = curated?.features ?? {
    en: [
      `${layoutEn.charAt(0).toUpperCase()}${layoutEn.slice(1)}`,
      t.hasPhoto ? "Photo-enabled header" : "Text-first header",
      "Editable in real time",
      // Word export was removed from the product — do not advertise it.
      "Export to PDF",
      "ATS-friendly structure",
    ],
    es: [
      `${layoutEs.charAt(0).toUpperCase()}${layoutEs.slice(1)}`,
      t.hasPhoto ? "Header con foto" : "Header text-first",
      "Editable en tiempo real",
      "Exporta a PDF",
      "Estructura compatible con ATS",
    ],
  }

  return {
    id: t.id,
    slug: slugify(t.id),
    name,
    nameEn,
    category,
    tags,
    bestFor,
    description,
    longDescription,
    features,
    colors,
    layout,
    hasPhoto: t.hasPhoto,
    isPro: PRO_IDS.includes(t.id),
  }
}

// ─── Exported dataset ────────────────────────────────────────────────────────

export const templatesSEO: TemplateSEO[] = TEMPLATES.map(buildTemplateSEO)

export function getTemplateSEO(slug: string): TemplateSEO | undefined {
  return templatesSEO.find((t) => t.slug === slug)
}

export function getTemplateSEOById(id: string): TemplateSEO | undefined {
  return templatesSEO.find((t) => t.id === id)
}

export function getRelatedTemplates(slug: string, limit = 6): TemplateSEO[] {
  const current = getTemplateSEO(slug)
  if (!current) return []
  // Same category first, then same layout, exclude self
  return templatesSEO
    .filter((t) => t.slug !== slug)
    .sort((a, b) => {
      const aScore =
        (a.category === current.category ? 3 : 0) +
        (a.layout === current.layout ? 2 : 0) +
        (a.hasPhoto === current.hasPhoto ? 1 : 0)
      const bScore =
        (b.category === current.category ? 3 : 0) +
        (b.layout === current.layout ? 2 : 0) +
        (b.hasPhoto === current.hasPhoto ? 1 : 0)
      return bScore - aScore
    })
    .slice(0, limit)
}

// lib/ats/vocabulary.ts
// One vocabulary for every ATS keyword comparison in the product.
//
// Two lists used to answer the same question without knowing about each other:
//   ats-matcher.ts       ALIAS_GROUPS — 13 groups, paid ats-score
//   skills-dictionary.ts ATS_SKILLS — 244 curated terms, free /tools/ats-checker
//
// The aliases that fix the paid matcher's worst misses (aws → amazon web
// services, gcp → google cloud, liderazgo → leadership) were already sitting in
// the dictionary it ignored. This joins them, so both scorers answer "is this
// skill present?" the same way.
//
// WORD_ALIASES in ai-helpers.ts stays separate on purpose: it is title
// morphology (dev→developer, sr→senior) used to decide whether the model's
// wording is grounded in what the user typed. Different question, different
// list — merging them would put "senior" in a skills vocabulary.
import { ATS_SKILLS } from "./skills-dictionary"

/**
 * Lowercase, accent-stripped, punctuation-normalised. Keeps + # . / and - so
 * "c++", "c#", "node.js" and "ci/cd" survive as themselves.
 */
export function normalizeTerm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9+#./\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

/**
 * Alias groups the dictionary does not cover: role and process vocabulary
 * rather than named skills. Kept here so there is exactly one place to add one.
 */
const EXTRA_ALIAS_GROUPS: readonly string[][] = [
  ["continuous integration", "ci/cd", "cicd", "integracion continua"],
  ["project manager", "project management", "pm", "gestion de proyectos", "jefe de proyecto"],
  ["user experience", "ux", "experiencia de usuario"],
  ["user interface", "ui", "interfaz de usuario"],
  ["search engine optimization", "seo", "posicionamiento web"],
  ["leadership", "liderazgo", "team lead", "lider de equipo"],
  ["communication", "comunicacion"],
  ["teamwork", "trabajo en equipo"],
  ["problem solving", "resolucion de problemas"],
  ["data analysis", "analisis de datos"],
  ["customer service", "atencion al cliente", "servicio al cliente"],
  ["quality assurance", "qa", "aseguramiento de calidad"],
  // Bilingual vocabulary OUTSIDE engineering. Measured: 10 of 16 common pairs
  // were unknown, and almost all of the gaps were non-tech — healthcare,
  // education, legal, construction, hospitality, operations. A nurse listing
  // "Atención al paciente" against an English posting was told "patient care"
  // was missing, which cost real ATS points and offered a duplicate to add.
  // These serve every surface at once: the ATS matcher, the dedup, the
  // proven-skills card and tailor.
  ["team leadership", "liderazgo de equipos", "team management", "gestion de equipos", "direccion de equipos"],
  ["risk management", "gestion de riesgos", "administracion de riesgos"],
  ["inventory management", "control de inventarios", "gestion de inventarios", "manejo de inventarios"],
  ["patient care", "atencion al paciente", "cuidado del paciente", "cuidados del paciente"],
  ["lesson planning", "planificacion curricular", "planificacion de clases", "diseño curricular"],
  ["contract drafting", "redaccion de contratos", "elaboracion de contratos"],
  ["blueprint reading", "lectura de planos", "interpretacion de planos"],
  ["food safety", "manipulacion de alimentos", "seguridad alimentaria", "inocuidad alimentaria"],
  ["cost control", "control de costos", "gestion de costos", "control de gastos"],
  ["time management", "gestion del tiempo", "administracion del tiempo"],
  ["critical thinking", "pensamiento critico"],
  ["decision making", "toma de decisiones"],
  ["conflict resolution", "resolucion de conflictos", "manejo de conflictos"],
  ["public speaking", "oratoria", "hablar en publico", "presentaciones en publico"],
  ["occupational safety", "seguridad industrial", "seguridad ocupacional", "salud ocupacional"],
  ["medication administration", "administracion de medicamentos"],
  ["vital signs", "signos vitales", "toma de signos vitales"],
  ["classroom management", "manejo de aula", "gestion del aula"],
  ["labor law", "derecho laboral"],
  ["site supervision", "supervision de obra", "supervision de obras"],
  // Bilingual engineering vocabulary. A Spanish CV writes "Revisión de código"
  // and an English posting asks for "code review": without these the matcher
  // reported a skill the candidate demonstrably has as MISSING, and then offered
  // to add the English spelling next to the Spanish one — two entries for one
  // skill, which reads as machine-written and is exactly what gets a CV binned.
  ["code review", "code reviews", "revision de codigo", "revisiones de codigo"],
  ["memory management", "gestion de memoria", "manejo de memoria"],
  ["debugging", "depuracion"],
  ["unit testing", "unit tests", "pruebas unitarias", "tests unitarios"],
  ["testing", "pruebas", "qa testing"],
  ["networking", "redes"],
  ["performance optimization", "optimizacion de rendimiento", "optimizacion del rendimiento"],
  ["application lifecycle", "ciclo de vida de la aplicacion", "ciclo de vida"],
  ["crash reporting", "reporte de fallos", "reportes de fallos"],
  ["dependency injection", "inyeccion de dependencias"],
  ["design patterns", "patrones de diseno"],
  ["software architecture", "arquitectura de software"],
  ["modular architecture", "arquitectura modular"],
  ["functional programming", "programacion funcional"],
  ["reactive programming", "programacion reactiva"],
  ["concurrency", "concurrencia", "multi-threading", "multithreading", "hilos"],
  ["mobile development", "desarrollo movil"],
  ["web development", "desarrollo web"],
  ["backend", "back-end", "back end", "servicios backend"],
  ["frontend", "front-end", "front end"],
  ["accessibility", "accesibilidad"],
  ["usability", "usabilidad"],
  ["maintainability", "mantenibilidad"],
  ["scalability", "escalabilidad"],
  ["technical debt", "deuda tecnica"],
  ["mentoring", "mentoria", "mentoring junior developers"],
  ["agile", "agil", "metodologias agiles", "metodologia agil"],
  ["code quality", "calidad de codigo", "calidad del codigo"],
  ["release management", "gestion de releases", "gestion de versiones"],
  ["offline capabilities", "capacidades offline", "modo offline"],
  ["local storage", "almacenamiento local"],
  ["data synchronization", "sincronizacion de datos"],
  ["api integration", "integracion de apis", "integracion de api"],
]

/**
 * normalized term → the set of every term equivalent to it.
 * Built once: ~244 dictionary entries plus the groups above.
 */
const EQUIVALENCE: Map<string, Set<string>> = (() => {
  const map = new Map<string, Set<string>>()

  const link = (terms: string[]) => {
    const norm = terms.map(normalizeTerm).filter(Boolean)
    if (norm.length < 2) {
      // A term with no aliases still needs an entry so lookups are uniform.
      if (norm[0] && !map.has(norm[0])) map.set(norm[0], new Set([norm[0]]))
      return
    }
    // Merge with anything already linked, so groups that share a term unify.
    const merged = new Set<string>()
    for (const t of norm) {
      merged.add(t)
      const existing = map.get(t)
      if (existing) for (const e of existing) merged.add(e)
    }
    for (const t of merged) map.set(t, merged)
  }

  for (const skill of ATS_SKILLS) link([skill.term, ...(skill.aliases ?? [])])
  for (const group of EXTRA_ALIAS_GROUPS) link([...group])

  return map
})()

/**
 * LAS VARIANTES LAS PONE LA VACANTE, NO NUESTRA LISTA.
 *
 * ── EL DEFECTO DE FONDO QUE ESTO CIERRA (CEO, 2026-08-28) ─────────────────
 *
 * El modelo lee el aviso y dice QUÉ se exige — eso ya era genérico. Pero
 * después la pregunta «¿el CV lo dice?» la contestaba un diccionario de 1.002
 * términos escrito a mano, y ahí el conocimiento del dominio dejaba de ser del
 * puesto y pasaba a ser nuestro.
 *
 * Con «CI/CD» el CV que dice «integración continua» matchea, porque alguien
 * escribió ese alias. Con «soldadura MIG», el CV que dice «soldadura por arco
 * con gas de protección» matchea sólo si alguien se acordó de la soldadura. No
 * es un hueco que se llene escribiendo más entradas: siempre falta el oficio
 * que nadie escribió, y el usuario no ve un término sin alias — ve que su
 * puntaje no sube por algo que sí puso en su CV.
 *
 * Ahora las variantes vienen del modelo que leyó ESA vacante, en
 * `ATSExtractedKeywords.termVariants`, y viajan por el mismo camino que
 * `hardWeights`.
 *
 * ORDEN Y FALLA ABIERTA. Lo del aviso primero, el diccionario después, y sin
 * variantes el comportamiento es EXACTAMENTE el anterior: un análisis viejo en
 * caché o un cliente que no las devuelve no rompe nada.
 *
 * UNA VARIANTE SÓLO PUEDE AGREGAR FORMAS DE MATCHEAR, NUNCA QUITARLAS. Por eso
 * el peor caso es acreditar un término de más, nunca perder uno que el CV dice.
 */
/**
 * EL MISMO OFICIO EN FEMENINO ES EL MISMO OFICIO.
 *
 * ── EL DEFECTO (medido de punta a punta, 2026-08-28) ───────────────────────
 *
 * La vacante dice «Cajero de banco» y el CV dice «Cajera». No matcheaba, y el
 * título son QUINCE PUNTOS del puntaje: una mujer sacaba 0 en esa categoría por
 * el mismo puesto que un hombre. Medido: «Cajero»/«Cajera», «Enfermero»/
 * «Enfermera», «Soldador»/«Soldadora» — ninguno matcheaba.
 *
 * ── POR QUÉ ESTO NO ES UNA LISTA ──────────────────────────────────────────
 *
 * Es morfología del español y vale igual para todos los oficios: los nombres de
 * agente terminan en -ero/-era, -or/-ora, -dor/-dora. Se deriva del SUFIJO, no
 * de un catálogo de profesiones — no hay nada que mantener y no le falta el
 * oficio que nadie escribió.
 *
 * Y es ANGOSTO a propósito: sólo esos sufijos. Un cambio de -o a -a a secas
 * juntaría «banco» con «banca» y «puerto» con «puerta», que son palabras
 * distintas. Exigir el sufijo de agente deja esas afuera.
 */
function generoAlterno(palabra: string): string | null {
  const p = palabra.toLowerCase()
  // -ero → -era («cajero», «enfermero», «panadero»)
  if (/[a-zñ]{2}ero$/.test(p)) return `${p.slice(0, -1)}a`
  if (/[a-zñ]{2}era$/.test(p)) return `${p.slice(0, -1)}o`
  // -or → -ora. Acá el femenino AGREGA una letra, no la cambia: «soldador» no
  // termina en «o», y reemplazarla era un no-op que dejaba fuera media lista de
  // oficios («soldadora», «contadora», «operadora», «supervisora»).
  if (/[a-zñ]{2}or$/.test(p)) return `${p}a`
  if (/[a-zñ]{2}ora$/.test(p)) return p.slice(0, -1)
  return null
}

/** El término con cada palabra en su otro género, cuando lo tiene. */
function conGeneroAlterno(term: string): string | null {
  const palabras = term.split(/\s+/)
  let cambió = false
  const out = palabras.map((w) => {
    const alt = generoAlterno(w)
    if (alt) { cambió = true; return alt }
    return w
  })
  return cambió ? out.join(" ") : null
}

export function expandTerm(keyword: string, variants?: Readonly<Record<string, string[]>>): string[] {
  const norm = normalizeTerm(keyword)
  if (!norm) return []
  const delAviso = variants?.[keyword] ?? variants?.[norm] ?? []
  const group = EQUIVALENCE.get(norm)
  const base = group ? [...group] : [norm]
  const out = new Set(base)
  for (const b of base) {
    const alt = conGeneroAlterno(b)
    if (alt) out.add(alt)
  }
  if (delAviso.length === 0) return [...out]
  for (const v of delAviso) {
    const n = normalizeTerm(v)
    if (n) out.add(n)
  }
  return [...out]
}

/**
 * Does the shared vocabulary recognise this as a capability?
 *
 * Broader than isKnownSkill, which reads only the curated dictionary: this also
 * covers the equivalence groups, where "unit testing", "functional programming" and
 * "code review" live. Callers deciding WHAT A THING IS — a skill or a credential,
 * a term or a sentence — need the whole vocabulary, not half of it.
 */
export function isKnownVocabularyTerm(term: string): boolean {
  const norm = normalizeTerm(term)
  return !!norm && EQUIVALENCE.has(norm)
}

/** How many terms the shared vocabulary knows. Surfaced for diagnostics. */
export const VOCABULARY_SIZE = EQUIVALENCE.size

export function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

/**
 * True when `keyword`, or any equivalent term, appears in already-normalized
 * text as a whole token.
 *
 * Word boundaries are enforced by hand rather than \b: \b treats "+" and "#" as
 * boundaries, so "c++" would match inside "c" and "c#" inside "c". Checking the
 * surrounding character instead keeps those intact.
 */
/**
 * Palabras que un CV mete ENTRE las de un requisito sin cambiar lo que dice.
 *
 * Cerrada y lingüística: artículos, preposiciones y conectores de los dos
 * idiomas. No sabe de oficios ni de rubros — «el», «los», «de» y «the» son los
 * mismos para un soldador y para un abogado.
 */
const RELLENO_ENTRE = new Set([
  "el", "la", "los", "las", "un", "una", "unos", "unas", "de", "del", "al",
  "en", "y", "o", "a", "con", "para", "por", "su", "sus", "lo",
  "the", "a", "an", "of", "in", "on", "and", "or", "to", "for", "with", "at", "its", "their",
])

/**
 * True cuando `keyword`, o un equivalente, aparece en el texto ya normalizado.
 *
 * ── POR QUÉ NO ALCANZA CON BUSCAR LA FRASE LITERAL (medido, 2026-08-28) ────
 *
 * Un aviso nombra el requisito como sustantivo y un CV escribe lo que la
 * persona HIZO. Con la frase contigua, un CV que dice exactamente lo mismo no
 * cobraba nada. Medido de punta a punta sobre un CV de cajera contra su
 * vacante, con la API real:
 *
 *   la vacante pide   «Atención al cliente en ventanilla»
 *   el CV dice        «Atendí A LOS clientes en ventanilla»   → no matcheaba
 *
 * Dos palabras vacías en el medio y el candidato pierde el punto. No se arregla
 * pidiendo más variantes: no se puede enumerar dónde va cada artículo.
 *
 * Así que un término de varias palabras matchea cuando sus palabras aparecen EN
 * ORDEN y lo único que puede haber entre ellas es relleno. La lista de relleno
 * es cerrada y gramatical; no sabe de oficios. Un término de UNA palabra sigue
 * exigiendo la palabra entera, con los mismos límites de siempre.
 *
 * Sigue siendo estricto en lo que importa: las palabras del requisito tienen
 * que estar TODAS y en su orden. «Atención al cliente» no matchea un CV que
 * diga «atención» en un renglón y «cliente» tres líneas abajo, porque entre
 * ellas hay palabras que no son relleno.
 */
export function termPresent(
  keyword: string,
  haystackNorm: string,
  variants?: Readonly<Record<string, string[]>>,
): boolean {
  return expandTerm(keyword, variants).some((v) => {
    if (!v) return false
    const re = new RegExp(`(^|[^a-z0-9])${escapeRegExp(v)}([^a-z0-9+#]|$)`)
    if (re.test(haystackNorm)) return true

    const palabras = v.split(/\s+/).filter(Boolean)
    if (palabras.length < 2) return false
    // El patrón: cada palabra del término, y entre una y la siguiente sólo
    // relleno. Se arma con las MISMAS reglas de límite que la búsqueda literal.
    const hueco = `(?:\\s+(?:${[...RELLENO_ENTRE].join("|")}))*\\s+`
    const cuerpo = palabras.map((w) => escapeRegExp(w)).join(hueco)
    return new RegExp(`(^|[^a-z0-9])${cuerpo}([^a-z0-9+#]|$)`).test(haystackNorm)
  })
}

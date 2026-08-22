// lib/ats/requirement-satisfied.ts
//
// ¿El CV cumple ESTE requisito? La pregunta parece trivial y no lo es.
//
// EL CASO REPORTADO. La vacante pedía "Licenciatura en Ingeniería Comercial,
// Administración de Empresas, Marketing o carreras afines". El CV dice, textual,
// "Licenciatura en Ingeniería Comercial — Universidad Mayor de San Simón". El
// panel lo listaba como REQUISITO QUE NO CUMPLE y le bajaba el techo del score.
//
// Se juntaron dos fallas:
//
//   1. El modelo devuelve el requisito como la FRASE ENTERA de la oferta, con sus
//      alternativas incluidas, aunque el prompt le pide "forma canónica".
//   2. El matcher preguntaba si esa frase entera aparecía en el CV. Una frase con
//      alternativas no aparece NUNCA — ni cumpliéndola. Era un falso negativo
//      estructural: imposible de satisfacer para cualquier candidato.
//
// Un requisito que nadie puede cumplir no es un requisito: es un bug que le dice
// al usuario que no aplique a un puesto para el que sí califica.
//
// CÓMO SE RESUELVE, y por qué así:
//
//   · "A, B o C"  → ALTERNATIVAS. Basta UNA. Es lo que la oferta quiso decir.
//   · "A, B y C"  → CONJUNCIÓN. Hacen falta TODAS, y se reporta la que falta,
//                   no la frase entera: "no cumplís X" es accionable, "no cumplís
//                   este párrafo" no.
//
// Cada parte se compara por sus PALABRAS CON CONTENIDO, no por el texto literal:
// "administración de cartera de clientes" lo cumple un CV que dice "Gestión de
// cartera de clientes". Exigir la cadena exacta es lo que causó el bug.
//
// LA DIRECCIÓN DEL ERROR IMPORTA. Un falso positivo —decirle que cumple cuando no—
// lo manda a una entrevista a quedar mal. Por eso una parte sólo se da por
// cumplida cuando TODAS sus palabras con contenido están en el CV, y los envoltorios
// ("manejo comprobado de", "conocimientos en") se descartan porque describen el
// grado de dominio, no el requisito.

import { normalizeTerm } from "./vocabulary"

/** Palabras que no aportan al significado del requisito. */
const NOISE = new Set([
  // Conectores y artículos, es/en
  "el", "la", "los", "las", "un", "una", "unos", "unas", "de", "del", "al", "en", "y", "o",
  "con", "por", "para", "a", "the", "a", "an", "and", "or", "of", "to", "in", "on", "with", "for",
  // Envoltorios que describen el DOMINIO, no el requisito
  "manejo", "comprobado", "comprobada", "conocimiento", "conocimientos", "experiencia",
  "solidos", "solidas", "fuertes", "fuerte", "buen", "buena", "excelente", "excelentes",
  "capacidad", "habilidad", "habilidades", "dominio", "nivel", "titulo", "grado",
  "proven", "strong", "solid", "excellent", "good", "knowledge", "ability", "skills",
  "experience", "degree", "understanding", "hands-on",
  // Coletillas de "o similares"
  "afines", "afin", "similares", "similar", "relacionadas", "relacionados", "related", "equivalent",
])

const ALT_SPLIT = /\s+(?:o|u|or)\s+|\s*\/\s*/i
const AND_SPLIT = /\s*,\s*|\s+(?:y|e|and)\s+/i

const contentWords = (part: string): string[] =>
  normalizeTerm(part).split(" ").filter((w) => w.length > 2 && !NOISE.has(w))

/**
 * Palabras que significan lo mismo dentro de un requisito.
 *
 * Deliberadamente mínimo y local: son los verbos de "hacerse cargo de algo", que
 * en un CV en español se escriben de cuatro maneras. Medido en el caso reportado:
 * la vacante pedía "administración de cartera de clientes" y el CV dice "Gestión
 * de cartera de clientes" — un reclutador diría que sí, y la comparación literal
 * decía que no.
 *
 * NO se toca el vocabulario global (`EXTRA_ALIAS_GROUPS`): eso alimenta el score
 * de todo el producto y sus grupos son por FRASE. Acá hace falta a nivel de
 * PALABRA, y sólo para juzgar un requisito.
 */
const WORD_EQUIVALENTS: readonly string[][] = [
  ["gestion", "administracion", "manejo", "direccion", "management"],
  ["cliente", "clientes", "customer", "customers"],
  ["venta", "ventas", "sales"],
  ["equipo", "equipos", "team", "teams"],
]
const EQUIV = new Map<string, string[]>()
for (const g of WORD_EQUIVALENTS) for (const w of g) EQUIV.set(w, g)

const wordPresent = (w: string, hay: string): boolean =>
  hay.includes(w) || (EQUIV.get(w)?.some((alt) => hay.includes(alt)) ?? false)

/** Una parte se cumple cuando TODAS sus palabras con contenido están en el CV. */
function partSatisfied(part: string, haystackNorm: string): boolean {
  const words = contentWords(part)
  if (words.length === 0) return false
  return words.every((w) => wordPresent(w, haystackNorm))
}

export interface RequirementVerdict {
  satisfied: boolean
  /** Lo que de verdad falta. Vacío si se cumple. Sirve para IMPRIMIR el hueco. */
  missingParts: string[]
}

/**
 * `haystack` es el texto del CV ya concatenado (educación, habilidades, puestos).
 * Se normaliza acá para que quien llama no tenga que acordarse.
 */
export function checkRequirement(requirement: string, haystack: string): RequirementVerdict {
  const hay = normalizeTerm(haystack)
  const req = requirement.trim()
  if (!req || !hay) return { satisfied: false, missingParts: req ? [req] : [] }

  // La frase entera, tal cual: el camino corto y el más seguro.
  if (partSatisfied(req, hay)) return { satisfied: true, missingParts: [] }

  // "A, B o C" — la oferta ofrece opciones y basta una.
  if (ALT_SPLIT.test(req)) {
    const alts = req.split(ALT_SPLIT).map((s) => s.trim()).filter(Boolean)
    if (alts.length > 1) {
      // Cada alternativa puede a su vez ser compuesta ("Licenciatura en X, Y o Z").
      const flat = alts.flatMap((a) => a.split(AND_SPLIT).map((s) => s.trim())).filter(Boolean)
      if (flat.some((a) => partSatisfied(a, hay))) return { satisfied: true, missingParts: [] }
      return { satisfied: false, missingParts: [req] }
    }
  }

  // "A, B y C" — hacen falta todas; se reporta SÓLO la que falta.
  const parts = req.split(AND_SPLIT).map((s) => s.trim()).filter((s) => contentWords(s).length > 0)
  if (parts.length > 1) {
    const missing = parts.filter((p) => !partSatisfied(p, hay))
    return { satisfied: missing.length === 0, missingParts: missing }
  }

  return { satisfied: false, missingParts: [req] }
}

/**
 * El CV entero como texto, para preguntarle si cumple un requisito.
 *
 * Incluye EDUCACIÓN y CERTIFICACIONES a propósito: el caso reportado era un
 * título que estaba en el CV y que la comprobación nunca miró — el matcher
 * trabaja sobre el texto que recibe, y si el título no viaja ahí, no existe.
 */
export function requirementHaystack(sectionData: Record<string, unknown>): string {
  const out: string[] = []
  const push = (v: unknown) => { if (typeof v === "string" && v.trim()) out.push(v) }
  const rows = (k: string) => (Array.isArray(sectionData[k]) ? sectionData[k] as Record<string, unknown>[] : [])

  const pd = (sectionData.personalDetails ?? {}) as Record<string, unknown>
  push(pd.jobTitle); push(sectionData.summary)
  for (const w of rows("workExperience")) { push(w.jobTitle); push(w.employer); push(w.description) }
  for (const e of rows("education")) { push(e.degree); push(e.institution); push(e.fieldOfStudy); push(e.description) }
  for (const c of rows("certifications")) { push(c.name); push(c.issuer) }
  for (const s of rows("skills")) push(s.name)
  for (const l of rows("languages")) { push(l.name); push(l.level) }
  for (const p of rows("projects")) { push(p.name); push(p.description) }
  for (const c of rows("courses")) { push(c.name); push(c.institution) }
  return out.join(" \n ")
}

/**
 * Los requisitos que el CV realmente NO cumple.
 *
 * Un compuesto se reduce a la parte que falta: si la vacante pide tres cosas y
 * el candidato tiene dos, la lista dice la tercera, no el párrafo entero. Eso es
 * la diferencia entre un aviso accionable y uno que se ignora.
 *
 * La MISMA respuesta alimenta la lista que se imprime y el conteo que entra al
 * score. Antes eran dos comprobaciones distintas y la que estaba mal era la del
 * número, que es la que el usuario no puede auditar.
 */
/**
 * Títulos que compiten entre sí, aunque lleguen en renglones distintos.
 *
 * EL SEGUNDO ACTO DEL MISMO BUG. Arreglado el requisito compuesto, el modelo
 * empezó a partir las alternativas él mismo: la vacante pedía "Ingeniería
 * Comercial, Administración de Empresas, Marketing o afines" y devolvía TRES
 * requisitos sueltos, uno por carrera. Al llegar separados se pierde que son
 * alternativas, y juzgados de a uno sólo puede cumplirse uno: los otros dos
 * figuran como incumplidos para cualquier candidato del planeta. Otra vez un
 * requisito imposible, ahora por el otro lado.
 *
 * Nadie exige DOS licenciaturas distintas. Cuando varios requisitos piden el
 * mismo tipo de credencial, son opciones — y tener una alcanza.
 *
 * Sólo agrupa credenciales (licenciatura, título, grado, ingeniería, carrera).
 * Dos requisitos que piden herramientas distintas NO son alternativas: ahí sí
 * hacen falta las dos, y agruparlas le diría al usuario que cumple algo que no
 * cumple.
 */
const CREDENTIAL_HEADS = [
  "licenciatura", "licenciado", "titulo", "grado", "carrera", "ingenieria", "ingeniero",
  "degree", "bachelor", "bsc", "ba", "licenciature",
]

function credentialGroup(requirement: string): string | null {
  const words = normalizeTerm(requirement).split(" ")
  const head = words.find((w) => CREDENTIAL_HEADS.includes(w))
  return head ? (head === "licenciado" ? "licenciatura" : head === "ingeniero" ? "ingenieria" : head) : null
}

export function refineMissingRequirements(
  requirements: string[],
  sectionData: Record<string, unknown>,
): string[] {
  const hay = requirementHaystack(sectionData)
  if (!hay.trim()) return requirements

  // Un grupo de credenciales satisfecho satisface a todos sus miembros: son la
  // misma exigencia escrita en varios renglones.
  const satisfiedGroups = new Set<string>()
  for (const r of requirements) {
    const g = credentialGroup(r)
    if (g && checkRequirement(r, hay).satisfied) satisfiedGroups.add(g)
  }

  const out: string[] = []
  for (const r of requirements) {
    const g = credentialGroup(r)
    if (g && satisfiedGroups.has(g)) continue
    const v = checkRequirement(r, hay)
    if (v.satisfied) continue
    out.push(...(v.missingParts.length ? v.missingParts : [r]))
  }
  return out
}

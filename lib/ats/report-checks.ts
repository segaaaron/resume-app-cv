import type { ReportTerm } from "./report"
import { distance } from "fastest-levenshtein"
import { isKnownSkill } from "@/lib/ats/skills-dictionary"
import { normalizeTerm, termPresent } from "@/lib/ats/vocabulary"
import { parseBullets } from "@/lib/services/ai/shared/bullets"

// lib/ats/report-checks.ts
//
// LOS CHEQUEOS QUE ALIMENTAN EL INFORME, EN UN SOLO SITIO.
//
// ── POR QUÉ SE FUSIONARON (CEO, 2026-08-28) ─────────────────────────────────
//
// Eran siete archivos y los siete tenían UN SOLO consumidor: el informe. No eran
// abstracciones compartidas, eran trozos del informe guardados aparte — siete
// nombres que había que aprender para leer una sola cosa.
//
// La responsabilidad es una: mirar el CV y devolver un hallazgo. Cada chequeo
// sigue siendo una función pura y probada por su cuenta; lo que desapareció es
// el archivo por chequeo, no la separación entre ellos.


// ─────────────────────────────────────────────────────────────────────────
// passive-voice
// ─────────────────────────────────────────────────────────────────────────
// lib/ats/passive-voice.ts
//
// LA VOZ PASIVA EN UNA VIÑETA: EL TRABAJO SIN DUEÑO.
//
// «Se implementó el pipeline de CI» y «El pipeline fue implementado» describen el
// mismo trabajo y borran al que lo hizo. Es la misma pérdida que `WEAK_OPENERS`
// —«Responsable de», «Participé en»— por otra puerta gramatical: la frase existe,
// la acción existe, y el candidato no aparece.
//
// La doctrina ya lo pide del lado del modelo: primera persona implícita, verbo de
// acción en pasado. Faltaba el detector determinista que lo NOMBRA en el CV que
// el usuario ya tiene escrito, que es lo único que cierra el círculo: la doctrina
// gobierna lo que la IA escribe, esto gobierna lo que él trajo.
//
// ── QUÉ NO SE MARCA, Y POR QUÉ IMPORTA MÁS QUE LO QUE SÍ ───────────────────
//
// En español la pasiva refleja con «se» es ambigua: «se coordinó con el equipo»
// es pasiva, pero «se especializó en pagos» es pronominal y perfectamente
// correcta. Marcar toda forma con «se» llenaría el panel de falsos positivos
// sobre líneas bien escritas — el error que hace que la gente deje de leer los
// avisos. Se exige la estructura completa (participio o auxiliar), nunca el «se»
// suelto.

/** Terminaciones de participio que cierran una pasiva en español. */
const ES_PARTICIPLE = "[a-záéíóúñ]+(?:ado|ados|ada|adas|ido|idos|ida|idas)"

/**
 * ── EL DEFECTO QUE ESTE ARCHIVO PAGÓ AL NACER (2026-08-22) ────────────────
 *
 * La primera versión cerraba los patrones españoles con `\b` y NO detectaba
 * «Se implementó el pipeline». Causa: en JavaScript `\b` es ASCII, y «ó» no es
 * un carácter de palabra para esa definición — así que entre «ó» y el espacio no
 * hay frontera y el patrón nunca cerraba. Todo el detector era mudo justo en las
 * formas acentuadas, que en español son LA MAYORÍA de los pasados.
 *
 * Lo cazó el test en la primera corrida. Ahora se cierra con un lookahead de
 * «no viene una letra» bajo la bandera `u`, que sí entiende acentos y ñ.
 */
const FIN = "(?![\\p{L}])"

const PASSIVE_PATTERNS: RegExp[] = [
  // ES · pasiva perifrástica: "fue/fueron/es/son/será + participio"
  new RegExp(`(?<![\\p{L}])(?:fue|fueron|era|eran|es|son|ser[aá]|ser[aá]n|ha\\s+sido|han\\s+sido)\\s+${ES_PARTICIPLE}${FIN}`, "iu"),
  // ES · pasiva refleja CON verbo conjugado en tercera: "se implementó", "se realizaron"
  // Exige la forma -ó/-aron/-ieron, que es donde la autoría se pierde de verdad.
  /**
   * ── CÓMO SE SEPARA LA PASIVA REFLEJA DE LA PRONOMINAL ────────────────────
   *
   * «Se implementó EL pipeline» es pasiva: el sujeto es la cosa, el autor
   * desapareció. «Se especializó EN pagos» es pronominal y está perfectamente
   * escrita — marcarla sería un falso positivo sobre una línea buena, que es el
   * error que hace que la gente deje de leer los avisos.
   *
   * Las separa lo que viene DESPUÉS del verbo: una preposición abre un
   * complemento («en pagos», «de la caja», «con el equipo») y eso es pronominal;
   * cualquier otra cosa —un artículo o un sustantivo pelado— es el sujeto
   * paciente de una pasiva («el pipeline», «auditorías mensuales»).
   *
   * La primera versión no hacía esta distinción y el test la cazó con
   * «Se especializó en pagos».
   */
  new RegExp(
    `(?<![\\p{L}])se\\s+[a-záéíóúñ]+(?:ó|aron|ieron)\\s+(?!(?:en|con|por|a|al|de|del|como|para|sobre|entre|hacia|hasta|desde)(?![\\p{L}]))`,
    "iu",
  ),
  // EN · "was/were/is/are/been + past participle" (regular -ed y los irregulares
  // que de verdad aparecen en un CV; una lista corta y explícita evita el falso
  // positivo de "was responsible", que ya cazan los WEAK_OPENERS).
  /\b(?:was|were|is|are|been|being)\s+(?:[a-z]+ed|built|written|led|made|driven|taken|given|held|kept|run|sent|shown|brought|chosen|done)\b/i,
]

/** ¿Esta línea está escrita en pasiva? */
export function isPassiveVoice(text: string): boolean {
  const t = text.trim()
  if (!t) return false
  return PASSIVE_PATTERNS.some((re) => re.test(t))
}

export interface PassiveBullet {
  targetId: string
  jobTitle: string
  index: number
  text: string
}

/** Las viñetas en pasiva, con su puesto y su posición. Tope para no inundar. */
export function findPassiveBullets(
  roles: Array<{ id?: string; jobTitle?: string; bullets: string[] }>,
  max = 6,
): PassiveBullet[] {
  const out: PassiveBullet[] = []
  for (const role of roles) {
    if (!role.id) continue
    role.bullets.forEach((text, index) => {
      if (out.length >= max) return
      if (isPassiveVoice(text)) {
        out.push({ targetId: role.id as string, jobTitle: role.jobTitle?.trim() ?? "", index, text: text.trim() })
      }
    })
  }
  return out
}


// ─────────────────────────────────────────────────────────────────────────
// keyword-density
// ─────────────────────────────────────────────────────────────────────────
// lib/ats/keyword-density.ts
//
// EL RELLENO DE KEYWORDS, MEDIDO — no deducido del puntaje.
//
// ── QUÉ AVISÁBAMOS ANTES, Y POR QUÉ NO ALCANZA ─────────────────────────────
//
// El panel avisaba de sobre-optimización cuando el PUNTAJE pasaba cierto techo.
// Eso es un proxy, y de los malos: un CV honesto que de verdad cubre la vacante
// saca un puntaje alto y recibía el reproche; y uno que repite «Salesforce»
// catorce veces en dos puestos puede quedar por debajo del techo y no recibir
// nada. El aviso miraba el resultado en vez de la conducta.
//
// Acá se mide la conducta: cuántas veces dice el CV cada término y qué
// proporción del texto ocupa. Un reclutador humano lo nota en la primera pasada
// —«esto está escrito para la máquina»— y es la única forma de sobre-optimizar
// que un filtro sí penaliza en los sistemas que puntúan.
//
// ── LOS DOS UMBRALES, Y DE DÓNDE SALEN ─────────────────────────────────────
//
// No hay una cifra canónica publicada, así que se eligen de forma DEFENDIBLE y
// se dice que son elegidos, igual que `scoring-config` hace con sus pesos:
//
//   · REPEATS: 6 apariciones del mismo término. Un CV normal nombra su
//     herramienta principal una vez en habilidades y una o dos veces por puesto
//     donde la usó: con tres puestos, cuatro o cinco es lo natural. Seis empieza
//     a ser una decisión, no un relato.
//   · SHARE: 2% del texto ocupado por UN solo término. Con 500 palabras —la
//     banda de mayor tasa de entrevista— eso es diez apariciones de la misma
//     palabra, que ya no se lee como un CV.
//
// Falla del lado de callar: se exige que se cumplan LAS DOS condiciones. Avisar
// de más sobre esto es peor que no avisar, porque empuja a sacar un término que
// el candidato de verdad usa, y ahí perdería la coincidencia que traía.


/** Elegidos, no medidos contra un corpus. Ver el comentario de arriba. */
export const STUFFING_REPEATS = 6
export const STUFFING_SHARE = 0.02

export interface StuffedTerm {
  term: string
  /** Veces que aparece en el CV. */
  count: number
  /** Qué proporción del texto ocupa, redondeada a un decimal (2.4 = 2,4%). */
  sharePct: number
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

/**
 * Los términos que el CV repite tanto que se lee escrito para la máquina.
 *
 * Sólo se miran los términos que la VACANTE pide: repetir una palabra cualquiera
 * es un problema de redacción y ya tiene dueño (`repeated-content`). Repetir una
 * keyword es lo que un lector interpreta como relleno deliberado.
 */
export function findStuffedTerms(resumeText: string, postingTerms: readonly string[]): StuffedTerm[] {
  const total = countWords(resumeText)
  if (total < 80 || postingTerms.length === 0) return []
  const hay = normalizeTerm(resumeText)
  const out: StuffedTerm[] = []
  const seen = new Set<string>()

  for (const raw of postingTerms) {
    const term = raw.trim()
    const norm = normalizeTerm(term)
    if (!norm || seen.has(norm)) continue
    seen.add(norm)
    const escaped = norm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    const count = (hay.match(new RegExp(`\\b${escaped}\\b`, "g")) ?? []).length
    if (count < STUFFING_REPEATS) continue
    // Las palabras que ocupa: un término de dos palabras ocupa el doble.
    const share = (count * norm.split(/\s+/).length) / total
    if (share < STUFFING_SHARE) continue
    out.push({ term, count, sharePct: Math.round(share * 1000) / 10 })
  }
  return out.sort((a, b) => b.count - a.count)
}


// ─────────────────────────────────────────────────────────────────────────
// personal-data
// ─────────────────────────────────────────────────────────────────────────
// lib/ats/personal-data.ts
//
// FOTO Y DATOS PERSONALES: LO QUE ES NORMAL EN UN PAÍS DESCARTA EN OTRO.
//
// ── POR QUÉ ESTO INFORMA Y NO ARREGLA (orden del CEO, 2026-08-22) ──────────
//
//   «Agregá esta parte pero sólo como información, sin que se pueda ejecutar
//    algún cambio.»
//
// Y es la decisión correcta, no una limitación. Los datos de mercado (2026):
// el 68% de las empresas con presencia global prefiere CVs sin foto incluso
// donde la costumbre local la acepta; en EE.UU. y Reino Unido se descarta por
// precaución legal —Title VII, ADEA—, porque recibir una foto los expone a un
// reclamo por sesgo. En México, Brasil y Argentina la foto es estándar y sacarla
// puede leerse como un CV incompleto.
//
// O sea: NO existe una respuesta correcta que el producto pueda aplicar solo. La
// misma foto es un acierto o un descarte según a dónde se postule, y eso lo sabe
// el candidato, no nosotros. Un botón de «quitar la foto» estaría adivinando el
// país del reclutador; una nota que le dice el dato lo deja decidir con la
// información que hoy no tiene.
//
// Por eso estos hallazgos viajan como INFORMATIVOS: sin botón, sin peso en el
// puntaje, y sin la frase de «esto sólo lo sabés vos», que promete cerrar un
// chequeo que acá no se cierra nunca — porque no hay nada que cerrar.

/** Un dato personal que en varios mercados se pide NO poner. */
export type SensitiveKind = "birth_date" | "age" | "marital_status" | "nationality" | "id_number" | "gender"

export interface PersonalDataFindings {
  /** El CV lleva foto cargada. */
  hasPhoto: boolean
  /** Los datos sensibles encontrados, sin repetir. */
  sensitive: SensitiveKind[]
}

/**
 * Patrones por dato, en los dos idiomas.
 *
 * Se busca la ETIQUETA, no el valor: «Fecha de nacimiento:» es inequívoco,
 * mientras que un número de ocho dígitos suelto puede ser cualquier cosa. Buscar
 * el valor daría falsos positivos sobre el trabajo del candidato, que es el
 * error caro: un aviso equivocado sobre datos personales asusta.
 */
const PERSONAL_DATA_PATTERNS: Array<{ kind: SensitiveKind; re: RegExp }> = [
  { kind: "birth_date", re: /\b(fecha\s+de\s+nacimiento|nacid[oa]\s+el|date\s+of\s+birth|d\.?o\.?b\.?)\b/i },
  { kind: "age", re: /\b(edad\s*:|\d{2}\s*años\b|age\s*:|\d{2}\s*years\s+old\b)/i },
  { kind: "marital_status", re: /\b(estado\s+civil|marital\s+status|casad[oa]\b|solter[oa]\b|married\b|single\b\s*\||divorciad[oa]\b)/i },
  { kind: "nationality", re: /\b(nacionalidad|nationality)\s*:/i },
  /**
   * El documento se busca COMO ETIQUETA, nunca como palabra suelta.
   *
   * La primera versión marcaba cualquier «cédula» y disparó sobre una viñeta que
   * describía el trabajo del candidato: «Gestioné la cédula de identidad digital
   * del municipio para 20.000 vecinos». Un aviso equivocado sobre datos
   * personales asusta, y encima sobre la línea que cuenta lo que hizo. Lo cazó el
   * test antes de salir. Ahora se exige la forma de dato: dos puntos, o el número
   * pegado.
   */
  { kind: "id_number", re: /\b(?:d\.?n\.?i\.?|c\.?i\.|r\.?u\.?t\.?|curp|c[eé]dula|passport|social\s+security)\s*(?:n[°º]|no\.?|number|nro\.?)?\s*[:#]\s*\S|\b(?:d\.?n\.?i\.?|curp|r\.?u\.?t\.?)\s+[\d.,-]{6,}/i },
  { kind: "gender", re: /\b(g[eé]nero|sexo|gender)\s*:/i },
]

/**
 * El texto donde estos datos aparecen de verdad.
 *
 * Casi siempre llegan de un CV IMPORTADO: el extractor no supo mapear «Datos
 * personales» y lo dejó en una sección propia, o quedó dentro del resumen. La
 * experiencia laboral se incluye porque un import mal cortado puede haber
 * empujado la cabecera adentro del primer puesto.
 */
function personalText(sectionData: Record<string, unknown>): string {
  const parts: string[] = []
  const pd = sectionData.personalDetails as { address?: string } | undefined
  if (pd?.address) parts.push(pd.address)
  if (typeof sectionData.summary === "string") parts.push(sectionData.summary)
  if (typeof sectionData.hobbies === "string") parts.push(sectionData.hobbies)

  const custom = Array.isArray(sectionData.customSections)
    ? (sectionData.customSections as Array<{ title?: string; items?: Array<{ title?: string; subtitle?: string; description?: string }> }>)
    : []
  for (const c of custom) {
    parts.push(c.title ?? "")
    for (const i of c.items ?? []) parts.push(i.title ?? "", i.subtitle ?? "", i.description ?? "")
  }

  const work = Array.isArray(sectionData.workExperience)
    ? (sectionData.workExperience as Array<{ description?: string }>)
    : []
  for (const j of work) parts.push(j.description ?? "")

  return parts.filter(Boolean).join("\n")
}

export function findPersonalData(
  sectionData: Record<string, unknown>,
  hasPhoto: boolean,
): PersonalDataFindings {
  const text = personalText(sectionData)
  const sensitive: SensitiveKind[] = []
  for (const { kind, re } of PERSONAL_DATA_PATTERNS) {
    if (re.test(text) && !sensitive.includes(kind)) sensitive.push(kind)
  }
  return { hasPhoto, sensitive }
}


// ─────────────────────────────────────────────────────────────────────────
// stale-terms
// ─────────────────────────────────────────────────────────────────────────
// lib/ats/stale-terms.ts
//
// EL TÉRMINO QUE SÓLO VIVE EN UN PUESTO VIEJO (F3).
//
// ── POR QUÉ IMPORTA ────────────────────────────────────────────────────────
//
// La investigación sobre los ATS reales lo dice y nuestro propio puntaje ya lo
// aplica al TÍTULO: la misma palabra pesa distinto según cuándo la usaste.
// «iOS Developer hace ocho años» no es la misma señal que «iOS Developer ahora».
// Para las habilidades, en cambio, el CV entero cuenta igual: un término que
// sólo aparece en un puesto que terminó en 2016 suma lo mismo que uno de tu
// trabajo actual.
//
// ── Y POR QUÉ ESTO NO TOCA EL PUNTAJE ──────────────────────────────────────
//
// Se midió lo que pasa cuando se pondera una señal así (ver la nota de
// `ats-matcher.ts` sobre la prioridad): mover el número por una señal que
// todavía no está calibrada contra resultados hace que el mismo CV valga cosas
// distintas sin que el candidato haya tocado nada. Acá se INFORMA: el candidato
// ve qué término quedó viejo y decide si sigue usándolo. Peso cero, como la
// brecha de años.

/** Años desde el final de un puesto a partir de los cuales su evidencia "envejece". */
export const STALE_AFTER_YEARS = 6

interface Role {
  jobTitle?: string
  description?: string
  startDate?: string
  endDate?: string
  currentlyWorking?: boolean
}

export interface StaleTerm {
  term: string
  /** El puesto más reciente que lo menciona. */
  jobTitle: string
  /** Año en que terminó ese puesto. */
  year: number
}

function endYear(r: Role, currentYear: number): number {
  if (r.currentlyWorking || !r.endDate?.trim()) return currentYear
  const years = `${r.endDate}`.match(/20\d{2}|19\d{2}/g)
  return years ? Math.max(...years.map(Number)) : currentYear
}

/**
 * Los términos de la vacante que el CV demuestra SÓLO en puestos viejos.
 *
 * Un término que aparece en cualquier puesto reciente no entra: la señal está
 * fresca y no hay nada que avisar. Tampoco entra el que no aparece en ningún
 * lado — ése ya lo reporta el hallazgo de término faltante, y decir dos veces lo
 * mismo es exactamente lo que este proyecto viene cerrando.
 */
export function findStaleTerms(
  postingTerms: readonly string[],
  sectionData: Record<string, unknown>,
  now = new Date(),
): StaleTerm[] {
  const work = (sectionData.workExperience ?? []) as Role[]
  if (work.length === 0) return []
  const currentYear = now.getFullYear()

  const roles = work.map((r) => ({
    jobTitle: r.jobTitle?.trim() ?? "",
    year: endYear(r, currentYear),
    // `termPresent` compara contra texto NORMALIZADO — es la misma función con
    // la que el matcher cuenta la cobertura, y pasarle el crudo hace que no
    // encuentre nada. Sin esto el aviso no se disparaba nunca.
    text: normalizeTerm([r.jobTitle ?? "", ...parseBullets(r.description ?? "")].join(" ")),
  }))

  const out: StaleTerm[] = []
  const vistos = new Set<string>()
  for (const term of postingTerms) {
    const key = normalizeTerm(term)
    if (!key || vistos.has(key)) continue
    const donde = roles.filter((r) => termPresent(term, r.text))
    if (donde.length === 0) continue
    const masReciente = donde.reduce((a, b) => (b.year > a.year ? b : a))
    if (currentYear - masReciente.year < STALE_AFTER_YEARS) continue
    vistos.add(key)
    out.push({ term, jobTitle: masReciente.jobTitle, year: masReciente.year })
  }
  return out
}


// ─────────────────────────────────────────────────────────────────────────
// verdict-contradiction
// ─────────────────────────────────────────────────────────────────────────
/**
 * ¿El veredicto niega algo que el informe cuenta como presente?
 *
 * ── EL ÚLTIMO CANAL SIN CONTRASTAR ─────────────────────────────────────────
 *
 * «El que manda es el ATS. Si tenés otras cosas que validar, deberías validar
 * contra la respuesta del ATS y no a ciegas» (CEO, 2026-08-21).
 *
 * El veredicto es prosa libre del modelo, pintada tal cual. Es lo único del
 * análisis que NO se puede volver un chequeo —no nombra una línea, da el
 * criterio—, y por eso sobrevivió cuando los hallazgos sin acción se dejaron de
 * emitir. Pero puede afirmar un hecho falso sobre el CV, y el usuario no tiene
 * cómo saberlo: al lado hay una tabla que dice lo contrario, y la contradicción
 * se lee como que el panel se equivoca en todo.
 *
 * ── POR QUÉ ESTA FUNCIÓN ES TAN ESTRECHA ───────────────────────────────────
 *
 * Un filtro sobre prosa es peligroso: si se pasa de largo, calla justo la
 * lectura que el usuario paga. Así que sólo dispara ante una contradicción
 * DEMOSTRABLE — el veredicto niega explícitamente un término que el matcher
 * contó en el CV — y devuelve CUÁL, no un booleano, para poder medir si alguna
 * vez dispara y con qué.
 *
 * Todo lo demás pasa: los juicios («se lee genérico»), las recomendaciones, las
 * advertencias sobre la vacante. Nada de eso es contrastable, y no nos toca
 * opinar sobre ello.
 */

/** «no menciona X», «falta X», «no aparece X», y sus formas en inglés. */
const NEGATIONS = [
  // es — el término va después
  /\bno\s+(?:se\s+)?menciona[sn]?\b/gi,
  /\bno\s+(?:se\s+)?incluye[sn]?\b/gi,
  /\bno\s+aparece[n]?\b/gi,
  /\bno\s+(?:se\s+)?(?:hace|hacés|haces)\s+referencia\s+a\b/gi,
  /\b(?:falta[n]?|carece\s+de|ausencia\s+de|sin\s+mención\s+(?:a|de))\b/gi,
  // en
  /\b(?:does\s+not|doesn't|do\s+not|don't)\s+mention\b/gi,
  /\bno\s+mention\s+of\b/gi,
  /\b(?:is|are)\s+missing\b/gi,
  /\blacks\b/gi,
  /\bnever\s+mentions?\b/gi,
]

/**
 * Cuánto texto después de la negación cuenta como «lo negado».
 *
 * Una ventana corta a propósito: «no menciona Salesforce, aunque sí Excel» no
 * puede leerse como que niega Excel. Sesenta caracteres cubren la frase que
 * sigue a la negación y poco más.
 */
const WINDOW = 60

function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

/**
 * Los términos que el veredicto dice que faltan y el informe cuenta presentes.
 *
 * Vacío = no hay contradicción demostrable, y el veredicto se muestra entero.
 */
export function verdictContradictions(verdict: string, terms: readonly ReportTerm[]): string[] {
  if (!verdict.trim()) return []
  // Sólo lo que el CV DICE: de un término ausente, negarlo es correcto.
  const present = terms.filter((t) => t.cv > 0)
  if (present.length === 0) return []

  const flat = normalize(verdict)
  const found = new Set<string>()

  for (const re of NEGATIONS) {
    // `lastIndex` se comparte entre llamadas en un regex global: se reinicia o
    // la segunda pasada arranca desde donde quedó la primera y pierde aciertos.
    re.lastIndex = 0
    for (const m of flat.matchAll(re)) {
      const after = flat.slice(m.index + m[0].length, m.index + m[0].length + WINDOW)
      for (const t of present) {
        const needle = normalize(t.term)
        // Términos de una letra o dos no se juzgan: aparecen dentro de otras
        // palabras y darían un falso positivo que calla el veredicto entero.
        if (needle.length >= 3 && after.includes(needle)) found.add(t.term)
      }
    }
  }
  return [...found]
}


// ─────────────────────────────────────────────────────────────────────────
// near-miss
// ─────────────────────────────────────────────────────────────────────────
// lib/ats/near-miss.ts
//
// Typo / near-miss detector. A real ATS matches keywords by EXACT (stemmed) text,
// so "React Navite", "GrahpQL" or "Objetive-C" silently fail to match "React
// Native", "GraphQL", "Objective-C" — the candidate loses the keyword to a
// spelling slip they cannot see. Our own keyword score is blind to this too: it
// just reports the requirement as "missing", never as "you misspelled it".
//
// This module closes that gap deterministically. For each JD requirement that is
// NOT present in the CV, it looks for a CV phrase that is one or two edits away —
// a probable typo — and surfaces "you wrote X, the job wants Y". No LLM.
//
// It runs against the EXACT-missing set on purpose: the semantic (embedding) pass
// can quietly credit "React Navite" as "React Native present", which hides the
// typo while the real ATS still fails on it. Catching it here keeps the warning
// honest regardless of what the semantic pass decided.

export interface NearMiss {
  /** The requirement as the job/canonical form spells it (what the ATS looks for). */
  keyword: string
  /** What the CV actually says — the probable typo, in the CV's own casing. */
  typed: string
}

/** Max edit distance that still reads as a typo (not a different word), by length. */
function maxEditDistance(normLen: number): number {
  if (normLen <= 4) return 1
  return 2
}

/** Strip surrounding punctuation for display without touching the inner spelling. */
function trimEdges(s: string): string {
  return s.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}+#.]+$/gu, "")
}

/**
 * Find probable typos in the CV for the given required keywords.
 *
 * @param jdKeywords requirement keywords (hard skills + must-haves) in canonical form
 * @param cvText     the candidate's full CV text
 */
export function findNearMisses(jdKeywords: string[], cvText: string): NearMiss[] {
  const cvNorm = normalizeTerm(cvText)
  if (!cvNorm) return []

  // Parallel arrays: original words (for display) and their normalized forms
  // (for comparison). Empty normalized tokens (pure punctuation) are dropped from
  // both so an n-gram never straddles a gap.
  const rawWords = cvText.split(/\s+/).map(trimEdges).filter(Boolean)
  const words = rawWords
    .map((w) => ({ orig: w, norm: normalizeTerm(w) }))
    .filter((w) => w.norm.length > 0)

  const seen = new Set<string>()
  const out: NearMiss[] = []

  for (const kwRaw of jdKeywords) {
    const kw = normalizeTerm(kwRaw)
    if (kw.length < 4) continue // too short: an edit of 1 is a different word
    // Already in the CV (exact or via alias)? Then it is not a typo — skip.
    if (termPresent(kwRaw, cvNorm)) continue

    const n = kw.split(" ").filter(Boolean).length
    const budget = maxEditDistance(kw.replace(/\s/g, "").length)

    let best: { d: number; orig: string; norm: string } | null = null
    for (let i = 0; i + n <= words.length; i++) {
      const slice = words.slice(i, i + n)
      const candNorm = slice.map((w) => w.norm).join(" ")
      // A length gap wider than the budget can never be a typo — skip the costly
      // distance call. (guards "React" vs "React Native" style subset noise.)
      if (Math.abs(candNorm.length - kw.length) > budget) continue
      const d = distance(kw, candNorm)
      if (best === null || d < best.d) {
        best = { d, orig: slice.map((w) => w.orig).join(" "), norm: candNorm }
      }
    }

    if (!best || best.d < 1 || best.d > budget) continue
    // The candidate is itself a real, distinct skill (Vue vs Vuex, Java vs JavaScript)
    // → not a typo, a different technology. Don't "correct" it.
    if (isKnownSkill(best.norm)) continue

    const key = kw
    if (seen.has(key)) continue
    seen.add(key)
    out.push({ keyword: kwRaw, typed: best.orig })
    if (out.length >= 6) break
  }

  return out
}


// ─────────────────────────────────────────────────────────────────────────
// repeated-content
// ─────────────────────────────────────────────────────────────────────────
// lib/ats/repeated-content.ts
//
// Un texto que se repite a sí mismo. La comprobación que faltaba.
//
// EL CASO REPORTADO, y el bucle que explicaba: el panel detectaba —bien— que el
// resumen del candidato estaba DUPLICADO ("He trabajado en ventas… Competente en
// prospección… He trabajado en ventas… Competente en prospección…") y ofrecía un
// arreglo. El arreglo que el modelo devolvía venía TAMBIÉN duplicado. El usuario
// lo aplicaba, guardaba, volvía a correr el ATS y el mismo defecto aparecía otra
// vez — porque nunca se había ido.
//
// Nadie comprobaba lo evidente: que el arreglo arregle. El guard de invención
// mira cifras y marcas; el de reescritura cosmética mira si cambió lo suficiente;
// ninguno se preguntaba si el texto propuesto sigue teniendo el defecto que
// motivó la propuesta.
//
// Determinista y barato: es contar frases repetidas.

/** Frases de contenido, normalizadas para comparar sin ruido de puntuación. */
function sentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim())
    .filter((s) => s.split(" ").length >= 6)
}

/**
 * ¿El texto dice dos veces lo mismo?
 *
 * Compara por conjunto de palabras con contenido, no por cadena exacta: el
 * modelo repite el párrafo con una coma distinta, y una comparación literal deja
 * pasar justo el caso que hay que cazar.
 */
export function hasRepeatedContent(text: string): boolean {
  const list = sentences(text)
  if (list.length < 2) return false
  const seen: Set<string>[] = []
  for (const s of list) {
    const words = new Set(s.split(" ").filter((w) => w.length > 3))
    if (words.size < 4) continue
    for (const prev of seen) {
      const shared = [...words].filter((w) => prev.has(w)).length
      // 80% de las palabras con contenido compartidas = es la misma frase dicha
      // otra vez, aunque el orden o la puntuación cambien.
      if (shared / Math.max(words.size, prev.size) >= 0.8) return true
    }
    seen.push(words)
  }
  return false
}

/**
 * ¿La propuesta arregla la repetición que motivó la propuesta?
 *
 * `false` cuando el original repetía y el arreglo sigue repitiendo: ahí el botón
 * "Aplicar este texto" sólo gasta el clic del usuario y devuelve el problema en
 * la vuelta siguiente.
 */
export function fixesRepetition(original: string, proposed: string): boolean {
  if (!hasRepeatedContent(original)) return true
  return !hasRepeatedContent(proposed)
}

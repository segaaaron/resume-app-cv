// lib/ats/posting-priority.ts
//
// CUÁNTO INSISTE LA VACANTE EN CADA TÉRMINO, LEÍDO DEL AVISO.
//
// ── QUÉ FALLÓ ANTES, Y POR QUÉ ESTO ES OTRA COSA ───────────────────────────
//
// El plan de F2 quería ponderar las duras por prioridad. El primer intento usó
// el ORDEN en que el extractor las devolvía, y se midió antes de dejarlo entrar:
// con el peso más conservador que distingue algo, el mismo CV y la misma
// vacante daban 81 o 62 según en qué orden llegara la lista. Diecinueve puntos,
// con un techo de tres.
//
// El defecto no era el peso: era la FUENTE. Ese orden lo decide un modelo y
// puede salir distinto entre dos lecturas del mismo aviso, así que el puntaje
// dejaba de ser reproducible — y reproducible es la única promesa fuerte que
// este número puede hacer, porque contra resultados de contratación no está
// validado.
//
// Acá la prioridad se MIDE SOBRE EL TEXTO del aviso: dónde aparece el término y
// cuántas veces. Mismo aviso, mismo peso, siempre, sin modelo en el medio. Es
// una función pura y determinista, y por eso se puede afirmar lo que el intento
// anterior no podía.
//
// ── LAS TRES SEÑALES, Y POR QUÉ ESTAS ──────────────────────────────────────
//
// Son las que un aviso usa para decir «esto importa», y las tres se leen sin
// interpretar nada:
//
//   · EN EL TÍTULO. Si el puesto se llama «iOS Developer», Swift no es un
//     detalle del cuerpo. Es la señal más fuerte y la más barata de leer.
//   · REPETIDO. Un término que el aviso nombra tres veces está insistiendo.
//     Uno que aparece una sola vez, en una lista, no.
//   · BAJO «DESEABLE». Casi todo aviso separa lo que exige de lo que suma, con
//     un encabezado. Un término que SÓLO vive ahí abajo es, literalmente, lo que
//     el propio aviso llama opcional.
//
// No se inventa un cuarto criterio ni se usa un diccionario de importancia: eso
// volvería a ser opinión nuestra disfrazada de medición.
//
// ── LOS TOPES, QUE NO SON DECORACIÓN ───────────────────────────────────────
//
// El peso vive en [MIN, MAX] y esa banda es angosta a propósito. Un peso sin
// techo hace que una vacante repetitiva mande sobre el puntaje, que es la misma
// volatilidad que hizo fallar el gate la primera vez, ahora por otra puerta.
import { normalizeTerm, termPresent } from "./vocabulary"

/** El peso de un término que el aviso nombra una vez, en el cuerpo. */
export const BASE_WEIGHT = 1

/**
 * La banda. Entre el término más y el menos exigido hay un factor de 3: alcanza
 * para que agregar «deseables» no hunda la cobertura, y no tanto como para que
 * un aviso repetitivo decida el número.
 */
export const MIN_WEIGHT = 0.5
export const MAX_WEIGHT = 1.5

/**
 * Repeticiones a partir de las cuales el aviso está insistiendo, no listando.
 *
 * Sin `export`: nadie fuera de acá tiene por qué conocer el umbral, y una
 * constante exportada que nadie importa es ruido que después alguien lee como
 * si fuera parte del contrato.
 */
const INSISTS_AT = 3

/**
 * ── LO DESEABLE LO DICE EL AVISO, NO UNA LISTA NUESTRA (CEO, 2026-08-28) ────
 *
 * Acá había `OPTIONAL_HEADINGS`: catorce encabezados —«deseable», «plus», «nice
 * to have», «se valorará»— que se buscaban dentro del texto para saber dónde
 * empezaba la parte opcional. Dos defectos, y los dos le costaban puntaje al
 * candidato:
 *
 *  · UN AVISO QUE LO DIGA DE OTRA FORMA no existía para la lista. «Valorable»,
 *    «no imprescindible», «suma», cualquier giro que nadie escribió, y todo el
 *    aviso quedaba como EXIGIDO: el candidato perdía puntos por requisitos que
 *    la empresa nunca exigió.
 *  · Y ya se pagó el falso positivo: «plusvalía» contiene «plus», así que una
 *    vacante de contador abría su sección opcional en la primera línea y SAP y
 *    Excel quedaban descontados a la mitad.
 *
 * Ahora lo dice el modelo que leyó ESE aviso, en `optionalTerms`, con cualquier
 * palabra y en cualquier idioma. Sin lista, sin encabezados, sin posición.
 *
 * FALLA CERRADO Y SEGURO: sin `optionalTerms` nada se descuenta y todo pesa como
 * exigido — que es el lado correcto del error, porque descontar de más le baja el
 * puntaje a alguien por algo que el aviso sí pedía.
 */
/**
 * Cuántas veces el aviso nombra el término.
 *
 * Cuenta sobre el texto normalizado y con la MISMA prueba de presencia que usa
 * el matcher, así que un término que el puntaje considera presente es el mismo
 * que acá cuenta. Dos varas distintas para «¿está?» sería el defecto que este
 * proyecto viene cerrando en todos lados.
 */
function countOccurrences(term: string, postingNorm: string): number {
  const t = normalizeTerm(term)
  if (!t) return 0
  let veces = 0
  let desde = 0
  // Se avanza por el texto preguntando por el término en lo que queda: así el
  // conteo hereda los alias y los límites de palabra de `termPresent` en vez de
  // reimplementar una búsqueda que podría discrepar con el puntaje.
  for (;;) {
    const resto = postingNorm.slice(desde)
    if (!termPresent(t, resto)) break
    const at = resto.indexOf(t)
    if (at === -1) {
      // El aviso lo nombra por un ALIAS —dice «integración continua» donde el
      // término extraído es «CI/CD»—: está nombrado, así que cuenta una vez y
      // se corta, porque no se puede avanzar sobre una cadena que no está.
      //
      // Contarlo como CERO era un bug con consecuencia: el descuento de
      // «deseable» exige `veces > 0`, así que un término que el aviso ponía en
      // deseables por su alias NO se descontaba y pesaba como uno exigido.
      veces++
      break
    }
    veces++
    desde += at + t.length
    if (veces > 50) break // un aviso no repite más que eso; corta un texto raro
  }
  return veces
}

export interface PriorityInput {
  /** El texto del aviso, tal como lo pegó el usuario. */
  posting: string
  /** El título del puesto, si el aviso lo declara. */
  jobTitle?: string
  /**
   * Las duras que el propio aviso presenta como deseables, dichas por el modelo
   * que lo leyó. Sin ellas nada se descuenta: todo pesa como exigido.
   */
  optionalTerms?: readonly string[]
}

/**
 * El peso de cada término, medido sobre el aviso.
 *
 * Devuelve un mapa `término normalizado → peso`. Los términos que el aviso no
 * nombra —porque el extractor los dedujo— se quedan en `BASE_WEIGHT`: no se les
 * puede medir insistencia, y castigarlos sería inventar.
 */
export function measurePostingPriority(
  terms: readonly string[],
  { posting, jobTitle = "", optionalTerms = [] }: PriorityInput,
): Record<string, number> {
  const postingNorm = normalizeTerm(posting)
  const titleNorm = normalizeTerm(jobTitle)
  const deseables = new Set(optionalTerms.map((t: string) => normalizeTerm(t)).filter(Boolean))

  const out: Record<string, number> = {}
  for (const term of terms) {
    const key = normalizeTerm(term)
    if (!key || key in out) continue

    let peso = BASE_WEIGHT

    // En el título del puesto: la señal más fuerte que da un aviso.
    if (titleNorm && termPresent(key, titleNorm)) peso += 0.5

    const veces = countOccurrences(key, postingNorm)
    if (veces >= INSISTS_AT) peso += 0.25

    // El aviso lo presentó como un plus y no como requisito. Lo dice él, no
    // nosotros: sin `optionalTerms` nadie pierde peso.
    if (deseables.has(key)) peso -= 0.5

    out[key] = Math.min(MAX_WEIGHT, Math.max(MIN_WEIGHT, peso))
  }
  return out
}

/**
 * El peso de un término, con el default cuando no se midió.
 *
 * Falla ABIERTO: sin mapa —una vacante que no viajó, un re-cálculo viejo— todo
 * vale lo mismo y el puntaje es el de siempre. Una pieza opcional nunca puede
 * tumbar el número.
 */
export function weightOf(term: string, weights?: Record<string, number>): number {
  if (!weights) return BASE_WEIGHT
  const w = weights[normalizeTerm(term)]
  if (typeof w !== "number" || !Number.isFinite(w)) return BASE_WEIGHT
  // Se acota acá y no sólo al medir, porque el mapa también llega DESDE EL
  // CLIENTE en el re-cálculo instantáneo. Sin esto, un cliente que mandara todo
  // en cero dejaba el denominador en cero y la cobertura en «no medible»; y uno
  // con pesos enormes podía inflar su propio puntaje. La banda es la misma que
  // produce la medición, así que acotar no cambia nada legítimo.
  return Math.min(MAX_WEIGHT, Math.max(MIN_WEIGHT, w))
}

/**
 * LAS QUE ENTRAN CUANDO NO ENTRAN TODAS.
 *
 * ── LA ORDEN (CEO, 2026-08-27) ──────────────────────────────────────────────
 *
 *   «Quiero que entren 20, y las principales deberían ser los skills que
 *    solicita el puesto.»
 *
 * El prompt ya pedía ese orden, pero el orden lo devuelve un modelo y puede
 * cambiar entre dos lecturas del mismo aviso — medido en este proyecto, y es la
 * razón de que el peso se mida sobre el TEXTO. Cortar por el orden del modelo
 * era quedarse con su opinión justo en el momento en que más importa: cuando hay
 * que descartar.
 *
 * Vive acá, y no dentro del módulo de análisis, para que se pueda EJECUTAR en un
 * test. La primera versión de este corte se probó replicando el `sort` dentro del
 * propio test: eso da verde con el módulo desconectado, que es el defecto que
 * este proyecto ya pagó más de una vez.
 *
 * Sin mapa —modo «sólo título», o un aviso vacío— todos pesan igual y el orden
 * del modelo se conserva: falla abierto, sin reordenar por criterio propio.
 *
 * @param tope cuántas entran. Devuelve la lista tal cual si no sobra ninguna.
 */
export function topHardSkills(
  terms: readonly string[],
  tope: number,
  input: PriorityInput,
): string[] {
  if (terms.length <= tope) return [...terms]
  const pesos = measurePostingPriority(terms, input)
  return terms
    .map((term, i) => ({ term, i }))
    // Por peso medido; el empate lo decide el orden en que llegaron, que es la
    // única señal que queda. Orden estable, sin criterio nuestro encima.
    .sort((a, b) => (weightOf(b.term, pesos) - weightOf(a.term, pesos)) || (a.i - b.i))
    .slice(0, tope)
    .map((x) => x.term)
}

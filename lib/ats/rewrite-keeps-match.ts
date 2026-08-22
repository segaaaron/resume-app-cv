import { normalizeTerm, termPresent } from "./vocabulary"

/**
 * UNA REESCRITURA NO PUEDE BAJARTE EL PUNTAJE.
 *
 * ── EL DEFECTO, MEDIDO CONTRA LA API REAL (2026-08-21) ─────────────────────
 *
 * Corriendo el ATS sobre ocho CVs, aplicando todo lo que ofrecía y volviendo a
 * medir, uno salió PEOR de lo que entró:
 *
 *   en-security-guard    23 → 16
 *
 * Apretás un botón rotulado como mejora y perdés siete puntos. No hay defensa
 * posible para eso: el panel te cobró el uso, te cobró el cooldown, y te dejó
 * más lejos del puesto que antes de apretar.
 *
 * ── POR QUÉ NINGÚN GUARD LO VEÍA ───────────────────────────────────────────
 *
 * Los guards de reescritura se escribieron de a uno, cada vez que un daño se
 * observó: la cifra borrada, el contenido perdido, el cambio cosmético, la
 * tercera persona. Cada uno mira el TEXTO. Ninguno mira LA VACANTE.
 *
 * Así que una reescritura más rica, con verbo fuerte, que conserva las cifras y
 * dice más palabras —y que en el camino deja afuera «Salesforce»— pasa los cinco
 * y le cuesta al candidato la mayor palanca del informe: las duras pesan .45.
 *
 * ── POR QUÉ ESTO NO ES UN SEXTO HEURÍSTICO ─────────────────────────────────
 *
 * «El que manda es el ATS. Si tenés otras cosas que validar, deberías validar
 * contra la respuesta del ATS y no a ciegas» (CEO, 2026-08-21).
 *
 * Este archivo no inventa una forma nueva de decidir si un término está. Usa
 * `termPresent` y `normalizeTerm` — las MISMAS dos funciones con las que
 * `coverage()` cuenta la cobertura, reexportadas ahí como `keywordPresent` y
 * `normalize`. Por construcción el guard y el puntaje no pueden discrepar: si
 * esto dice que el término se cayó, la cobertura va a contar uno menos, y al
 * revés. Un guard con su propia regex habría sido el sexto criterio y la sexta
 * forma de contradecir la pantalla.
 */

/**
 * Los términos de la vacante que la línea DECÍA y la reescritura ya no dice.
 *
 * Vacío es la respuesta normal y correcta: la enorme mayoría de las reescrituras
 * conservan lo que tocan, y muchas agregan. Sólo se nombra lo que se perdió.
 *
 * ── LO QUE DELIBERADAMENTE NO HACE ─────────────────────────────────────────
 *
 * No exige que la reescritura AGREGUE términos. Eso sería empujar al relleno de
 * keywords, que es justo lo que el aviso de sobre-optimización del panel
 * desaconseja. La regla es asimétrica a propósito: perder lo que ya tenías es un
 * daño; no ganar nada nuevo es simplemente no haber ganado.
 *
 * Tampoco mira términos que la línea NO tenía. Si la vacante pide «Salesforce» y
 * esta viñeta nunca lo dijo, la reescritura no lo pierde — ese hueco es trabajo
 * de la tabla de términos, que tiene su propio botón.
 */
export function droppedPostingTerms(
  original: string,
  rewritten: string,
  posting: readonly string[],
): string[] {
  if (!original.trim() || !rewritten.trim() || posting.length === 0) return []
  const antes = normalizeTerm(original)
  const después = normalizeTerm(rewritten)
  const perdidos: string[] = []
  for (const term of posting) {
    if (!term.trim()) continue
    if (termPresent(term, antes) && !termPresent(term, después)) perdidos.push(term)
  }
  return perdidos
}

/** Atajo legible para los guards, que sólo necesitan el sí o el no. */
export function losesPostingTerm(
  original: string,
  rewritten: string,
  posting: readonly string[],
): boolean {
  return droppedPostingTerms(original, rewritten, posting).length > 0
}

/**
 * EL CONTRATO DE «LO QUE LA VACANTE PIDE», para todo endpoint que toca el CV.
 *
 * ── LA REGLA, DEL CEO, REPETIDA TRES VECES (2026-08-22) ────────────────────
 *
 *   «El ATS manda. Todo lo que tenga el ATS debe consultar al ATS, y así con
 *    todos los componentes o IA que tengas. Todo se coordina con el ATS; no
 *    quiero que hagan cosas por separado.»
 *
 * Auditados los ocho módulos de IA, DOS editaban el CV sin que el ATS estuviera
 * nunca en la sala: `improve-bullet` reemplaza una viñeta y `improve-summary`
 * reemplaza el resumen — y ninguno de sus dos tipos de entrada tenía siquiera un
 * campo para la vacante. Sus prompts decían «incorporá 1-2 keywords del sector»:
 * el MODELO adivinaba cuáles importan, mirando el título del puesto.
 *
 * Las dos mitades del daño:
 *   · lo que se PIERDE — la reescritura puede dejar afuera un término que la
 *     línea ya decía, y eso baja el puntaje (las duras pesan .45);
 *   · lo que NO se GANA — el modelo teje keywords inventadas por él en vez de
 *     las que esta vacante pide por nombre.
 *
 * Este tope existe porque el prompt tiene presupuesto: treinta términos es lo
 * mismo que ya usa el ejecutor para su bloque de la oferta, así que los dos
 * hablan del mismo recorte y ninguno ve una lista que el otro no vio.
 */
export const POSTING_TERMS_IN_PROMPT = 30

/**
 * Los términos de la vacante listos para un prompt: sin vacíos, sin repetidos,
 * y recortados al mismo tope en todos lados.
 *
 * Se normaliza para DEDUPLICAR, nunca para mostrar: al usuario y al modelo les
 * llega el término tal como la vacante lo escribió. Un «CRM» convertido en «crm»
 * dentro del prompt le enseña al modelo a escribirlo mal en el CV.
 */
export function postingTermsForPrompt(
  hardSkills: readonly string[] = [],
  softSkills: readonly string[] = [],
): string[] {
  const vistos = new Set<string>()
  const out: string[] = []
  for (const t of [...hardSkills, ...softSkills]) {
    const limpio = t?.trim()
    if (!limpio) continue
    const clave = normalizeTerm(limpio)
    if (!clave || vistos.has(clave)) continue
    vistos.add(clave)
    out.push(limpio)
    if (out.length >= POSTING_TERMS_IN_PROMPT) break
  }
  return out
}

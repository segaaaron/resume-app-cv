import type { ReportTerm } from "./report"

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

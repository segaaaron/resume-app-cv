// lib/ats/figure-slots.ts
//
// Una cifra que el CV no respalda NO se tira: se le pregunta al usuario.
//
// QUÉ HACÍAMOS Y POR QUÉ ESTABA MAL. Si el modelo proponía "Reduje la mora un
// 30%" y ese 30% no estaba en el CV, la sugerencia entera se descartaba en
// silencio. El razonamiento era correcto a medias —esa cifra no se puede
// escribir en el CV de nadie— pero la conclusión era pobre: la reescritura solía
// ser MEJOR que la línea original en todo lo demás, y el usuario perdía la mejora
// completa por un número que él sí conoce.
//
// Decisión del CEO (2026-08-19): mostrarla igual, marcar dónde va la cifra y
// pedirle el dato. La herramienta sabe DÓNDE una métrica tiene impacto —eso es
// justamente lo que el usuario no sabe— y él sabe CUÁL es. Cada uno pone lo suyo.
//
// LO QUE NO CAMBIA: al CV nunca entra un número que el usuario no escribió, ni un
// corchete. El hueco vive en la pantalla, se llena antes de aplicar, y si no se
// llena no se aplica. Esa regla es la que impide que un `[X%]` termine impreso
// delante de un reclutador, y sigue intacta.

/**
 * Cifras que AFIRMAN algo: un porcentaje, un monto, o un número que cuantifica la
 * palabra que le sigue. Ignora los años sueltos.
 *
 * ── POR QUÉ NO ES «CUALQUIER DÍGITO» (medido, 2026-08-25) ───────────────────
 *
 * Al volverse el dueño de «¿esta cifra está respaldada?» —antes lo decidía una
 * lista cerrada de nueve unidades que dejaba pasar «10 to 15 edge cases»—, la
 * primera versión marcaba cualquier número. Y eso acusaba a `alert(1)` dentro de
 * un texto escapado: un dígito suelto no es una afirmación sobre el candidato, y
 * el guard de la carta reintentaba por él. Lo cazó su propio test.
 *
 * La regla es la que ya usa `bullet-strength` para reconocer un resultado: un
 * número CUANTIFICA cuando lo sigue una palabra. Por eso el número entra en la
 * coincidencia y la palabra sólo se mira —así el hueco reemplaza la cifra y deja
 * el sustantivo en su lugar—.
 */
const FIGURE = /\d+(?:[.,]\d+)?\s*%|\$\s?\d+(?:[.,]\d+)*|\b\d+(?:[.,]\d+)*\b(?=\s+\p{L}{3,})/gu

const digitsOf = (s: string) => s.replace(/[^\d]/g, "")

/** Un año suelto (1990-2099) es contexto temporal, no una métrica de impacto. */
const isYear = (raw: string): boolean => /^\d{4}$/.test(raw.trim()) && +raw >= 1900 && +raw <= 2099

/**
 * Las cifras del texto propuesto que NO aparecen en lo que el candidato declaró.
 *
 * Compara por dígitos: "1.400" y "1,400" son la misma cifra escrita en dos
 * locales, y tratarlas como distintas convertiría un dato real del usuario en
 * un invento.
 */
export function unsourcedFigures(rewrite: string, source: string): string[] {
  const inSource = new Set((source.match(FIGURE) ?? []).map(digitsOf))
  const out: string[] = []
  for (const raw of rewrite.match(FIGURE) ?? []) {
    if (isYear(raw)) continue
    const d = digitsOf(raw)
    if (!d || inSource.has(d)) continue
    if (!out.includes(raw)) out.push(raw)
  }
  return out
}

/** El hueco que se pinta en pantalla. NUNCA se escribe así en el CV. */
export const FIGURE_SLOT = "___"

/**
 * El mismo texto con las cifras sin respaldo convertidas en huecos.
 *
 * Se devuelve para MOSTRAR, no para guardar: quien llama tiene que exigir que el
 * usuario complete cada hueco antes de habilitar el botón de aplicar.
 */
export function withFigureSlots(rewrite: string, source: string): { text: string; slots: string[] } {
  const slots = unsourcedFigures(rewrite, source)
  let text = rewrite
  for (const f of slots) text = text.split(f).join(FIGURE_SLOT)
  return { text, slots }
}

/** ¿Ya no queda ningún hueco por llenar? Es la condición para poder aplicar. */
export function slotsFilled(text: string): boolean {
  return !text.includes(FIGURE_SLOT)
}

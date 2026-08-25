// lib/ats/applied-memory.ts
//
// Qué arreglos ya aceptó el usuario en ESTE CV. Sobrevive al análisis siguiente.
//
// POR QUÉ EXISTE. Al aplicar un arreglo el CV cambia, y como la clave de caché
// del análisis incluye el texto del CV, la corrida siguiente le pregunta al
// modelo DE CERO. El modelo entonces vuelve a opinar sobre el párrafo que él
// mismo acababa de escribir y propone una variante — el usuario lo lee como
// "me está sugiriendo lo que ya tengo", y tiene razón.
//
// El panel ya recordaba lo aplicado, pero sólo hasta la siguiente corrida
// (`setAppliedItems(new Set())` al re-analizar). Esa memoria tenía que durar más
// que el análisis, porque el problema aparece justamente DESPUÉS.
//
// EN `localStorage` Y NO EN LA BASE, a propósito: guardar esto en el servidor
// pide una migración, y una migración es infraestructura que se pregunta antes.
// Lo que se guarda no es contenido del CV sino la FIRMA de un texto ya aceptado
// —palabras sueltas y ordenadas alfabéticamente, sin frases— y sólo sirve para
// no repetir una sugerencia. Si el usuario cambia de navegador, lo peor que pasa
// es que el panel vuelva a ofrecer algo: exactamente como se comportaba antes.

const KEY_PREFIX = "cvv:ats:applied:"
/** Tope por CV: la memoria es una ayuda, no un archivo histórico. */
const MAX_SIGNATURES = 60

const keyFor = (resumeId: string) => `${KEY_PREFIX}${resumeId}`

function read(resumeId: string): string[] {
  if (typeof window === "undefined" || !resumeId) return []
  try {
    const raw = window.localStorage.getItem(keyFor(resumeId))
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === "string") : []
  } catch {
    // Cuota llena, modo privado, JSON corrupto: la memoria es opcional y su
    // fallo NUNCA puede romper el panel. Sin memoria se ve como se veía antes.
    return []
  }
}

export function appliedSignatures(resumeId: string): string[] {
  return read(resumeId)
}

export function rememberApplied(resumeId: string, signature: string): void {
  if (typeof window === "undefined" || !resumeId || !signature) return
  try {
    const next = [signature, ...read(resumeId).filter((s) => s !== signature)].slice(0, MAX_SIGNATURES)
    window.localStorage.setItem(keyFor(resumeId), JSON.stringify(next))
  } catch { /* ver arriba: opcional por diseño */ }
}

/**
 * DESHACER TIENE QUE BORRAR LA MEMORIA DE ESE ARREGLO, o esconde el defecto.
 *
 * ── POR QUÉ (2026-08-25) ────────────────────────────────────────────────────
 *
 * Esta memoria existe para que el panel no vuelva a proponer lo que el usuario
 * ya aceptó. Si al revertir dejáramos la firma puesta, el texto original vuelve
 * al CV **y el hallazgo que lo señalaba queda filtrado para siempre**: el
 * defecto sigue ahí y el panel deja de verlo. Un deshacer que esconde el
 * problema es peor que no deshacer.
 *
 * Borra UNA firma, no la memoria entera: lo demás que el usuario aceptó sigue
 * valiendo.
 */
export function forgetOneApplied(resumeId: string, signature: string): void {
  if (typeof window === "undefined" || !resumeId || !signature) return
  try {
    const next = read(resumeId).filter((s) => s !== signature)
    if (next.length > 0) window.localStorage.setItem(keyFor(resumeId), JSON.stringify(next))
    else window.localStorage.removeItem(keyFor(resumeId))
  } catch { /* opcional por diseño */ }
}

/** Al borrar o reemplazar el CV entero, lo aceptado antes ya no describe nada. */
export function forgetApplied(resumeId: string): void {
  if (typeof window === "undefined" || !resumeId) return
  try { window.localStorage.removeItem(keyFor(resumeId)) } catch { /* opcional */ }
}

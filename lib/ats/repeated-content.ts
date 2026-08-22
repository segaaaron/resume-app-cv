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

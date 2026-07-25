/**
 * PageFlow Engine — API pública del motor de paginación v2 (F0 spike).
 *
 * Flujo: measureAtoms(DOM) → breakIntoPages(atoms) → PageLayout → preview+print.
 * El breaker es puro; el measurer aísla el DOM. Ningún consumidor de prod
 * importa esto todavía (spike aislado, cero riesgo de regresión).
 */
export * from "./types"
export { breakIntoPages, type BreakOptions } from "./breaker"
export { measureAtoms, measureA4UsableHeight } from "./measurer"

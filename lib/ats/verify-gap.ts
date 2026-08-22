// lib/ats/verify-gap.ts
//
// De qué es la diferencia entre el score estimado y el del PDF real.
//
// POR QUÉ ESTO NO ES OBVIO. Los dos números no salen del mismo motor: el estimado
// es `computeATSMatch` sobre los datos estructurados, y el verificado es
// `analyzeAts` sobre el texto que un parser extrae del PDF. Son dos varas
// distintas A PROPÓSITO (directiva en `ats-matcher.ts:9`, no se unifican). Restar
// una de otra da un número, pero ese número NO es «lo que pierde tu diseño»
// mientras nadie mire el diseño.
//
// EL DEFECTO QUE CIERRA (reportado por el CEO, 2026-08-21): el panel mostraba
// «cambiá a una plantilla de una columna» a un CV que YA estaba en una plantilla
// de una columna. La causa estaba quemada en la copia. El mismo error ya se había
// pagado una vez en la copia en texto plano del mismo panel.

export type VerifyGapCause =
  /** El PDF parsea fiel: no hay nada que explicar. */
  | "faithful"
  /** La plantilla penaliza de verdad — ahí sí, el consejo del diseño aplica. */
  | "layout"
  /** Plantilla limpia, pero el parser no encontró cosas concretas: se nombran. */
  | "parse"
  /** Plantilla limpia y parser sin quejas: la diferencia es de medición. */
  | "scale"

/** Debajo de esto la diferencia es ruido entre dos varas, no un defecto. */
export const FAITHFUL_MAX_DELTA = 8

export function verifyGapCause(input: {
  estimated: number
  real: number
  /** `"caution"` = la plantilla penaliza al parsear (dos columnas). */
  templateSafety: string | null | undefined
  /** Lo que el análisis del PDF REAL echó en falta. */
  parseIssues: readonly string[]
}): VerifyGapCause {
  if (input.estimated - input.real < FAITHFUL_MAX_DELTA) return "faithful"
  if (input.templateSafety === "caution") return "layout"
  return input.parseIssues.length > 0 ? "parse" : "scale"
}

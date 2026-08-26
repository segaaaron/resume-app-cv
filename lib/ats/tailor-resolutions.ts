// lib/ats/tailor-resolutions.ts
//
// Lo que el ejecutor escribió, listo para la tarjeta.
//
// ESTE ARCHIVO SE ENCOGIÓ, y eso es el resultado del arreglo de fondo.
//
// Antes tenía que EMPAREJAR: tailor devolvía reescrituras apuntando a un puesto
// y un índice, el informe hablaba de hallazgos con id propio, y acá se cruzaban.
// Ese cruce era donde vivía el defecto medido el 2026-08-20 — el modelo devolvió
// para el índice 0 una reescritura de la viñeta 1, y aplicarla habría borrado una
// línea y duplicado otra.
//
// Ahora tailor recibe el `checkId` y lo devuelve tal cual, así que no hay nada
// que emparejar: no puede desalinear porque no elige a qué línea apunta. Lo único
// que queda por hacer acá es traer el texto ACTUAL de la línea, para que la
// tarjeta pueda mostrar el antes y el después juntos.
//
// El guard `rewriteBelongsTo` sigue en el módulo, del lado del servidor: que el
// contrato haga imposible el error no es razón para dejar de comprobarlo.

import type { AtsReport, ReportResolution } from "./report"
import { allChecks } from "./report"

/** Una reescritura tal como la entrega `useTailorCV`. */
export interface TailorRewriteOut {
  checkId: string
  text: string
  /** La línea que este texto reemplaza, tal como la vio quien la reescribió. */
  original?: string
  metricHint?: string
  demonstrates?: string
  needsFigureConfirm?: boolean
}

export interface TailorOutput {
  rewrites: readonly TailorRewriteOut[]
  /** El resumen adaptado, o `null` si el informe no lo pidió. */
  tailoredSummary?: string | null
  /** El resumen que hay hoy, para el mismo antes/después. */
  currentSummary?: string
}

/** El texto que la línea tiene HOY, para poder comparar antes de aplicar. */
type BulletReader = (targetId: string, index: number) => string

/**
 * Une cada reescritura con el hallazgo que cierra y con el texto que reemplaza.
 *
 * Descarta lo que ningún hallazgo reclamó: si el informe no lo pidió, el panel no
 * tiene dónde mostrarlo, y mostrarlo igual sería devolverle a tailor la potestad
 * de abrir trabajo por su cuenta.
 */
export function tailorResolutions(
  report: AtsReport,
  out: TailorOutput,
  readBullet: BulletReader,
): ReportResolution[] {
  const known = new Map(allChecks(report).map((c) => [c.id, c]))
  const resolutions: ReportResolution[] = []

  for (const r of out.rewrites) {
    const check = known.get(r.checkId)
    if (!check || !r.text.trim()) continue
    const a = check.action
    /**
     * EL «ANTES» LO DICE QUIEN ESCRIBIÓ, no el índice al pintar.
     *
     * Volver a leer por índice en el render enfrentaba la reescritura de una
     * línea con el texto de otra en cuanto el usuario aplicaba algo en el medio
     * y los índices se corrían. `readBullet` queda como respaldo para respuestas
     * de antes de este cambio, no como la fuente.
     */
    const before = r.original?.trim()
      ? r.original
      : a?.kind === "rewrite_bullet" && a.targetId && typeof a.index === "number"
      ? readBullet(a.targetId, a.index)
      : ""
    resolutions.push({
      checkId: r.checkId,
      text: r.text,
      before,
      ...(r.needsFigureConfirm ? { needsFigureConfirm: true } : {}),
      ...(r.metricHint ? { metricHint: r.metricHint } : {}),
      ...(r.demonstrates ? { demonstrates: r.demonstrates } : {}),
    })
  }

  const summary = out.tailoredSummary?.trim()
  if (summary) {
    // `null` es una respuesta legítima: el informe no pidió el resumen, o ya
    // estaba bien. Sin texto no hay resolución, y la tarjeta apaga el botón en
    // vez de ofrecer aplicar un vacío que borraría el párrafo del candidato.
    const check = allChecks(report).find((c) => c.action?.kind === "rewrite_summary" && c.owner === "tailor")
    if (check) resolutions.push({ checkId: check.id, text: summary, before: out.currentSummary ?? "" })
  }

  return resolutions
}

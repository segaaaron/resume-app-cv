// lib/ats/applied-checks.ts
//
// QUÉ HALLAZGOS SIGUEN CERRADOS. La pregunta, fuera del componente.
//
// ── EL DEFECTO (barrido de cierre, 2026-08-25) ───────────────────────────────
//
// «Aplicado» era un `Set<string>` de ids dentro del panel que sólo SUMABA: nueve
// lugares hacían `add` y el único `delete` era la vuelta atrás. No había reset en
// ninguna parte, ni al re-analizar.
//
// Y los ids son estables (`format.decorative_glyphs`, `search.title`,
// `tips.metric.job-1.2`), así que un defecto que VUELVE —pegar otra vez una
// viñeta con flecha, sacarle la cifra a una línea a mano— reaparecía en el
// informe con el mismo id, la tarjeta lo pintaba en verde y no ofrecía botón.
// Callejón sin salida hasta recargar el editor.
//
// ── LA REGLA ─────────────────────────────────────────────────────────────────
//
// Un hallazgo no es su id: es su id MÁS lo que señala. Se guarda la huella del
// hallazgo en el momento en que se aplicó, y cuenta como cerrado sólo mientras el
// informe siga describiéndolo igual. Si vuelve señalando otra cosa —otra línea,
// otro conteo, otro texto—, es un hallazgo nuevo y recupera su botón.
//
// ── Y POR QUÉ VIVE ACÁ Y NO EN EL PANEL ──────────────────────────────────────
//
// Porque dentro de un componente de dos mil líneas el único test posible es leer
// que la línea existe, y este proyecto ya midió que eso da verde con la función
// desconectada. Acá se ejecuta.

import type { ReportCheck } from "./report"

/** Lo que el hallazgo dice y a qué apunta. Su estado entra: pasar de aviso a crítico es otro hallazgo. */
export function fingerprintOfCheck(c: ReportCheck): string {
  return JSON.stringify([c.state, c.params ?? null, c.evidence ?? null])
}

/**
 * Los que siguen cerrados, de todo lo que el usuario cerró alguna vez.
 *
 * Un hallazgo que YA NO ESTÁ en el informe se conserva marcado: no hay tarjeta
 * que pintar, y olvidarlo sólo agregaría trabajo al conjunto sin cambiar nada en
 * pantalla. Lo que se descarta es el que volvió DISTINTO.
 */
export function appliedIdsFrom(
  marks: ReadonlyMap<string, string>,
  checks: readonly ReportCheck[],
): Set<string> {
  const vivos = new Map(checks.map((c) => [c.id, c]))
  const out = new Set<string>()
  for (const [id, huella] of marks) {
    const c = vivos.get(id)
    if (!c || fingerprintOfCheck(c) === huella) out.add(id)
  }
  return out
}

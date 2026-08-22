// lib/ats/action-plan.ts
//
// UNA lista de cosas por hacer. La misma pregunta contestada una sola vez.
//
// EL PROBLEMA, reportado con capturas: el panel mostraba TRES fuentes opinando
// sobre el MISMO bullet sin saber una de la otra —los arreglos críticos (IA), los
// bullets a mejorar (determinista) y tailor (otra llamada de IA)—, así que una
// sección proponía fusionar dos líneas mientras otra proponía reescribir una de
// ellas. El usuario leía dos órdenes contradictorias sobre el mismo texto y no
// sabía cuál seguir.
//
// Y peor: al aplicar un arreglo el CV cambia, la clave de caché cambia y el
// modelo vuelve a opinar DE CERO. Cada corrida traía hallazgos nuevos y a veces
// una variante de lo que él mismo acababa de escribir. No existía una lista de
// pendientes: existía una foto nueva cada vez, así que la tarea no terminaba
// nunca. Eso es lo que hacía sentir el panel como un pozo sin fondo.
//
// LAS TRES REGLAS, que es todo lo que hace este archivo:
//
//   1. UN OBJETIVO, UNA TAREA. Si dos fuentes hablan del mismo bullet, gana la de
//      más impacto y la otra no se muestra. Nunca dos órdenes sobre un texto.
//   2. LO APLICADO NO VUELVE. Se recuerda la firma del texto que el usuario
//      aceptó; si una corrida posterior propone algo equivalente, se descarta.
//   3. SIN ACCIÓN NO SE MUESTRA. Un diagnóstico sin botón es una crítica sin
//      salida — el usuario ve el problema y no puede hacer nada con él.
//
// Determinista y sin modelo: decidir QUÉ mostrar es aritmética sobre lo que ya
// se calculó. El modelo sólo hace falta para ESCRIBIR.

import { normalizeTerm } from "./vocabulary"

export type PlanSource = "critical" | "bullet" | "merge" | "soft" | "structure"

/** Orden de autoridad cuando dos fuentes apuntan al mismo texto. */
const SOURCE_RANK: Record<PlanSource, number> = {
  critical: 0,  // un defecto que descalifica gana siempre
  merge: 1,     // fusionar cambia la estructura: antes que pulir una de las dos
  bullet: 2,
  soft: 3,
  structure: 4,
}

export interface PlanInput {
  /** Qué texto/campo toca. Dos ítems con el mismo `target` son el mismo trabajo. */
  target: string
  source: PlanSource
  severity: "high" | "medium" | "low"
  /** El texto que se escribiría en el CV, si lo hay. Sirve para la memoria. */
  proposedText?: string
  /** Sin esto el ítem no se muestra: una crítica sin salida no es una tarea. */
  actionable: boolean
}

/**
 * Firma de un texto, para reconocerlo aunque vuelva con otras comas.
 *
 * No es un hash del literal: el modelo reescribe SU PROPIO texto con variaciones
 * mínimas y una comparación exacta no lo reconoce. Se compara el conjunto de
 * palabras con contenido, que es lo que sobrevive a una reescritura cosmética.
 */
export function textSignature(text: string): string {
  const words = normalizeTerm(text)
    .split(" ")
    .filter((w) => w.length > 3)
  return [...new Set(words)].sort().slice(0, 24).join(" ")
}

/**
 * ¿Este texto es, en lo que importa, uno que el usuario ya aceptó?
 *
 * Umbral alto (80% de las palabras con contenido) a propósito: descartar de más
 * le esconde una mejora real. La dirección segura del error es mostrar de más,
 * no de menos — pero mostrar EXACTAMENTE lo mismo otra vez es lo que hartó al
 * usuario, y eso es lo que esto corta.
 */
export function matchesApplied(text: string, appliedSignatures: string[]): boolean {
  const sig = textSignature(text)
  if (!sig) return false
  const words = new Set(sig.split(" "))
  if (words.size === 0) return false
  return appliedSignatures.some((prev) => {
    const prevWords = prev.split(" ").filter(Boolean)
    if (prevWords.length === 0) return false
    const shared = prevWords.filter((w) => words.has(w)).length
    return shared / Math.max(words.size, prevWords.length) >= 0.8
  })
}

/**
 * La lista final: sin duplicados por objetivo, sin lo ya aplicado y sin lo que
 * no tiene botón. Conserva el orden de entrada dentro de la misma prioridad, así
 * que quien llama decide el orden fino y esto sólo quita.
 */
export function buildActionPlan<T extends PlanInput>(items: T[], appliedSignatures: string[] = []): T[] {
  const best = new Map<string, T>()
  for (const item of items) {
    if (!item.actionable) continue
    if (item.proposedText && matchesApplied(item.proposedText, appliedSignatures)) continue
    const prev = best.get(item.target)
    if (!prev || SOURCE_RANK[item.source] < SOURCE_RANK[prev.source]) best.set(item.target, item)
  }
  return items.filter((i) => best.get(i.target) === i)
}

/**
 * El CV está listo para mandar.
 *
 * Existe porque el panel no tenía final: siempre quedaba algo en pantalla y el
 * usuario nunca sabía si podía enviar. Un score alto SIN tareas críticas es una
 * respuesta legítima y hay que darla en voz alta — es la mitad del valor de la
 * herramienta, y es lo que convierte una lista de reproches en un semáforo.
 */
export const READY_SCORE = 80

export function isReadyToSend(score: number | null | undefined, criticalCount: number): boolean {
  return typeof score === "number" && score >= READY_SCORE && criticalCount === 0
}

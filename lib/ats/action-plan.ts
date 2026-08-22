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

import { FILLER_WORDS } from "@/lib/services/ai/shared/text-similarity"
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
    // `normalizeTerm` CONSERVA punto, barra y guion —los necesita para «node.js»
    // o «CI/CD»—, así que el punto final de una frase quedaba pegado y volvía
    // «mensual.» distinto de «mensual». Esta firma promete reconocer el texto
    // «aunque vuelva con otras comas»; sin esto no lo hacía con el punto final.
    .map((w) => w.replace(/^[.\-/]+|[.\-/]+$/g, ""))
    // > 2 y no > 3. Medido: con el corte en 3 se caían «red», «web», «app», «QA»
    // — justo las palabras que DISTINGUEN dos viñetas del mismo puesto («la capa
    // de red» vs «la capa de dominio»), y sin ellas las dos firmas quedaban
    // idénticas y la segunda línea se suprimía como si fuera la primera.
    .filter((w) => w.length > 2)
  return [...new Set(words)].sort().slice(0, 24).join(" ")
}

/**
 * ¿Este texto es, en lo que importa, uno que el usuario ya aceptó?
 *
 * ── EL DEFECTO MEDIDO (2026-08-22) ─────────────────────────────────────────
 *
 * Esto comparaba la PROPORCIÓN de palabras compartidas con un corte en 0.80, y
 * suprimía viñetas que no tenían nada que ver:
 *
 *   «…en SwiftUI para el flujo de PAGOS»  vs  «…para el flujo de ONBOARDING» → 0.833
 *   «pruebas unitarias sobre la capa de RED» vs «…de DOMINIO»                → 0.833
 *   «Atendí clientes en ventanilla del banco» vs la misma más larga          → 0.667
 *
 * Las dos bandas —la misma línea reescrita (0.80-0.833) y dos líneas distintas
 * (0.667-0.833)— SE SOLAPAN. Ningún umbral las separa; el proyecto ya aprendió
 * eso mismo con `sharesSubject` y los pares de fusión. La proporción era la
 * pregunta equivocada.
 *
 * ── LA PREGUNTA CORRECTA: ¿SUSTITUYÓ O AMPLIÓ? ─────────────────────────────
 *
 * Una reescritura de la MISMA línea conserva todo lo que decía y agrega: no
 * pierde ninguna palabra con contenido. Dos líneas DISTINTAS se diferencian
 * justamente porque una SUSTITUYE un término por otro — pagos por onboarding,
 * red por dominio. Eso es binario, no gradual, y no depende de un umbral.
 *
 * Falla hacia MOSTRAR DE MÁS, que es la dirección que el propio diseño de esta
 * memoria declara como segura: esconderle una mejora real es peor que ofrecerle
 * algo que ya vio. Y «esto no cambia nada» tiene otro dueño río arriba
 * —`isTrivialEdit` / `isCosmeticReword`—, que es quien corta las variantes
 * cosméticas de un texto ya aceptado.
 */
export function matchesApplied(text: string, appliedSignatures: string[]): boolean {
  const sig = textSignature(text)
  if (!sig) return false
  const words = new Set(sig.split(" "))
  if (words.size === 0) return false
  return appliedSignatures.some((prev) => {
    const prevWords = prev.split(" ").filter(Boolean)
    if (prevWords.length === 0) return false
    // Si algo que el texto aceptado decía ya NO está, esta línea habla de otra
    // cosa: no es la misma con otras comas.
    // Sólo las palabras con CONTENIDO: cambiar «con» por «usando» es reescritura,
    // no otra línea. Es la misma lista que usa `addsNoInformation`, no una copia.
    const perdidas = prevWords.filter((w) => !words.has(w) && !FILLER_WORDS.has(w))
    if (perdidas.length > 0) return false
    // Y lo que se agregó no puede ser media línea nueva: eso ya es otro aporte.
    return prevWords.length / words.size >= 0.7
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

// lib/ats/write-gate.ts
//
// EL MOTOR: TODO LO QUE QUIERA ESCRIBIR EN EL CV PASA POR ACÁ.
//
// ── QUÉ PROBLEMA CIERRA ────────────────────────────────────────────────────
//
// Las mismas comprobaciones vivían sueltas dentro de seis módulos, y cada uno
// corría un subconjunto distinto: la matriz medida daba huecos en todos —el
// resumen sin cifra intacta, la carta sin términos, la fusión sin «aporta algo»,
// el ejecutor sin el chequeo de datos declarados—. Ninguno era un bug de copia divergente: eran
// huecos de composición, que es lo que pasa cuando la lista de reglas vive en el
// cuerpo de cada función en vez de en su definición.
//
// Acá cada escritor DECLARA su lista y el motor la corre. Un escritor nuevo que
// se olvide una regla se ve en su declaración, no seis meses después en una
// captura.
//
// ── POR QUÉ DEVUELVE LA PRIMERA QUE FALLA ──────────────────────────────────
//
// Porque los módulos cuentan por motivo (`droppedFigure`, `droppedTerm`…) y esos
// números alimentan las métricas de guards y el reintento. Devolver la primera
// mantiene el conteo idéntico al de antes y hace que la migración no pueda
// cambiar lo que el usuario ve.
//
// ── POR QUÉ EL ORDEN LO PONE QUIEN LLAMA ───────────────────────────────────
//
// El orden canónico —corregir, integridad, pertenencia, ganancia— es el que debe
// usar todo escritor nuevo. Los que ya existían traen el suyo, y cambiarlo en la
// misma mudanza haría imposible saber si una diferencia de salida vino del
// motor o del reordenamiento. Se alinean después, de a uno y con su medición.
import { figureDegraded, hardCodedFactKind } from "@/lib/services/ai/shared/ai-helpers"
import { isRedundantRewrite, dropsContentWithoutGain, contentDroppedFrom, rewriteBelongsTo } from "@/lib/services/ai/shared/text-similarity"
import { toFirstPersonOpener, assessDescription } from "@/lib/services/ai/shared/bullet-quality"
import { hasCliche } from "@/lib/services/ai/shared/cliches"
import { droppedPostingTerms } from "@/lib/ats/rewrite-keeps-match"
import { bulletFloorMisses, countWords, floorNudge, type FloorMiss } from "@/lib/ats/output-floor"

export type GateRule =
  /** Corrige la apertura a primera persona y el idioma. Nunca descarta. */
  | "person"
  /** La reescritura habla de la línea que se le dio, no de otra del mismo puesto. */
  | "belongs_to_line"
  /** Sólo hechos que el candidato declaró: fuera el placeholder y la marca que él nunca escribió. */
  | "only_declared_facts"
  /** Y la cifra: descartar (postura B) o dejarla viajar a confirmar (postura A). */
  | "figure_policy"
  /** La cifra que el CV ya decía sigue ahí, y sigue siendo de su verbo. */
  | "figure_intact"
  /** No aporta: idéntica, sinónimos, reordenada o con relleno colgado. */
  | "adds_value"
  /** Sobre una línea ya fuerte: quita contenido y no agrega nada concreto. */
  | "no_lateral_loss"
  /** No suelta ninguna palabra con contenido de la(s) original(es). */
  | "keeps_content"
  /** No suelta un término por el que la vacante puntúa. */
  | "keeps_terms"
  /** El piso: verbo de acción, sin frase vacía, mínimo de palabras y ganancia. */
  | "output_floor"

/** El orden canónico. Todo escritor nuevo declara esta lista, o un subconjunto. */
export const CANONICAL_ORDER: readonly GateRule[] = [
  "person",
  "belongs_to_line",
  "only_declared_facts",
  "figure_policy",
  "figure_intact",
  "keeps_content",
  "keeps_terms",
  "adds_value",
  "no_lateral_loss",
  "output_floor",
]

export interface GateInput {
  /** Lo que el modelo escribió. */
  text: string
  /** La línea que reemplaza. Ausente = nace de cero (una habilidad, una carta). */
  original?: string
  /** El CV del que puede salir un dato sin ser quemado. */
  source?: string
  /** Los términos por los que la vacante puntúa. */
  postingTerms?: readonly string[]
  /** El panel ya dijo qué está mal: un cambio chico ES el arreglo. */
  diagnosed?: boolean
  /**
   * Qué hacer con una cifra que el CV no dice.
   *  - `confirm` (postura A): el texto nace de un relato suyo → viaja a confirmar.
   *  - `drop`    (postura B): se escribe de cero → la cifra sería del modelo.
   */
  figurePolicy?: "confirm" | "drop"
  /** Para `belongs_to_line`: las líneas del puesto y el índice pedido. */
  lines?: readonly string[]
  index?: number
  /** Para `keeps_content`: las originales cuyo contenido debe sobrevivir. */
  mergedFrom?: readonly string[]
  language: string
}

export type GateResult =
  | { ok: true; text: string; needsFigureConfirm: boolean }
  | {
    ok: false
    rule: GateRule
    misses?: FloorMiss[]
    nudge?: string
    /**
     * Lo que se perdió, cuando la regla puede nombrarlo.
     *
     * La promesa del motor es que cada regla devuelva QUÉ falta, no sólo que
     * falló: un veredicto mudo obliga al reintento a adivinar. `keeps_content` y
     * `keeps_terms` fallaban en silencio y el escritor que las necesitaba
     * —la fusión, que le dice al modelo qué palabra se comió— no podía usarlas.
     */
    dropped?: string[]
  }

/**
 * Corre las reglas declaradas, en el orden declarado, sobre el texto propuesto.
 *
 * `person` es la única que MODIFICA: corrige y sigue. Todo lo que viene después
 * juzga el texto ya corregido — al revés validaríamos algo que después cambia.
 */
export function runWriteGate(input: GateInput, rules: readonly GateRule[]): GateResult {
  let text = input.text
  let needsFigureConfirm = false
  const terms = [...(input.postingTerms ?? [])]

  // El escritor declara QUÉ reglas corre; el orden lo decide el motor.
  //
  // Sin esto, `person` —la única que MODIFICA el texto— corría tercera en el
  // ejecutor y no corría en la viñeta, así que las reglas anteriores juzgaban un
  // texto que después cambiaba: el comentario de arriba prometía un invariante
  // que ninguno de los dos escritores cumplía. Y dos escritores con la misma
  // lista en distinto orden culpaban a reglas distintas del mismo defecto, que
  // es justo lo que el reintento le dice al modelo.
  const declaradas = new Set(rules)
  for (const rule of CANONICAL_ORDER) {
    if (!declaradas.has(rule)) continue
    switch (rule) {
      case "person":
        text = toFirstPersonOpener(text, input.language)
        break

      case "belongs_to_line":
        if (input.lines && typeof input.index === "number"
          && rewriteBelongsTo(text, [...input.lines], input.index) !== input.index) {
          return { ok: false, rule }
        }
        break

      case "only_declared_facts": {
        const kind = hardCodedFactKind(text, input.source ?? "")
        if (kind === "placeholder" || kind === "brand") return { ok: false, rule }
        break
      }

      case "figure_policy": {
        const kind = hardCodedFactKind(text, input.source ?? "")
        if (kind === "figure") {
          // Postura B: se escribe de cero, así que la cifra sería del modelo.
          if (input.figurePolicy === "drop") return { ok: false, rule }
          // Postura A: nace de un relato suyo — viaja marcada para que la confirme.
          needsFigureConfirm = true
        }
        break
      }

      case "figure_intact":
        if (input.original && figureDegraded(input.original, text)) return { ok: false, rule }
        break

      case "adds_value":
        if (input.original && isRedundantRewrite(input.original, text, { postingTerms: terms, diagnosed: input.diagnosed })) {
          return { ok: false, rule }
        }
        break

      case "no_lateral_loss": {
        const o = input.original
        if (o) {
          const fuerte = assessDescription(o).weakOpenerIndices.length === 0 && !hasCliche(o)
          if (fuerte && dropsContentWithoutGain(o, text)) return { ok: false, rule }
        }
        break
      }

      case "keeps_content": {
        // `contentDroppedFrom` compara UNA fuente contra el resultado: una fusión
        // tiene dos, y cada una tiene que sobrevivir por su cuenta.
        const fuentes = input.mergedFrom ?? (input.original ? [input.original] : [])
        const perdidas = fuentes.flatMap((f) => contentDroppedFrom(f, text))
        if (perdidas.length > 0) return { ok: false, rule, dropped: perdidas }
        break
      }

      case "keeps_terms": {
        // La fusión juzga contra sus DOS originales; el resto, contra el suyo.
        const base = input.mergedFrom?.length ? input.mergedFrom.join("\n") : input.original
        if (base && terms.length > 0) {
          const sueltos = droppedPostingTerms(base, text, terms)
          if (sueltos.length > 0) return { ok: false, rule, dropped: sueltos }
        }
        break
      }

      case "output_floor": {
        const o = input.original
        const misses = bulletFloorMisses(text, o
          ? {
            original: o,
            gainedTerm: terms.length > 0 && droppedPostingTerms(text, o, terms).length > 0,
            /**
             * ── EL RELLENO COLGADO PASA POR ACÁ, Y ES UN BORDE MEDIDO ────────
             *
             * `saysMore` es «tiene más palabras», así que colgar «… de manera
             * exitosa y eficiente» satisface la exigencia de ganancia y la
             * reescritura pasa el motor entero. Se midieron TRES formas de
             * cerrarlo y las tres se cayeron:
             *
             *   contar sólo palabras con contenido  → el relleno sigue pasando
             *                                         («manera», «eficiente» son
             *                                         palabras de contenido)
             *   quitar `saysMore` del todo          → RECHAZA 38 DE 40 mejoras
             *                                         reales del banco de CVs
             *   excluir las palabras evaluativas    → el relleno sigue pasando;
             *                                         cerrarlo pedía agrandar una
             *                                         lista enumerada, que es
             *                                         justo lo que se está sacando
             *
             * El costo de dejarlo pasar es chico y acotado: la línea conserva su
             * contenido, su cifra y sus términos —todos los demás guards siguen
             * corriendo—, y lo peor que llega es una cola sin valor. El costo de
             * cerrarlo es perder 38 de cada 40 mejoras buenas.
             *
             * Queda acá para que nadie lo reintente creyendo que es un descuido.
             */
            saysMore: countWords(text) > countWords(o),
          }
          : {})
        if (misses.length > 0) return { ok: false, rule, misses, nudge: floorNudge(misses, input.language) }
        break
      }
    }
  }

  return { ok: true, text, needsFigureConfirm }
}

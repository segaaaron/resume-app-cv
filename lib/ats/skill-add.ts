import { findDuplicateSkill } from "@/lib/ats/skill-dedup"
import { displaySkill } from "@/lib/ats/skill-catalog"
import { isPlausibleSkill } from "@/lib/ats/skill-validation"
import type { SkillItem } from "@/types/resume"

/**
 * QUÉ PASA CUANDO SE AGREGA UNA HABILIDAD AL CV, decidido fuera del componente.
 *
 * ── POR QUÉ VIVE ACÁ Y NO DENTRO DEL PANEL ─────────────────────────────────
 *
 * Esta decisión escribe en el CV del usuario, y vivía dentro de un componente de
 * 1.744 líneas mezclada con toasts, estado local y un re-scoring. Ahí el único
 * test posible era leer que la línea existiera — y un test que lee el código da
 * verde con la función desconectada. El proyecto ya pagó exactamente eso con
 * `applyAllPlan`: el bucle vivía dentro del componente y el test que lo "cubría"
 * pasaba con la función sin conectar.
 *
 * Acá se ejecuta y se lee lo que devuelve. El componente se queda con lo suyo:
 * avisar y escribir.
 *
 * ── LAS TRES RESPUESTAS, Y POR QUÉ SON TRES Y NO UN BOOLEANO ───────────────
 *
 * «No se pudo» y «ya estaba» le piden cosas distintas al usuario: la primera
 * dice que ese término no es una habilidad suya, la segunda que ya la tiene
 * escrita de otra forma. Un booleano las juntaba y el panel tenía que adivinar
 * cuál mensaje mostrar.
 */

export type SkillAddPlan =
  /** No parece una habilidad: es su empleador, su ciudad o su propio cargo. */
  | { kind: "not_a_skill"; term: string }
  /** Ya está, tal cual o bajo otra grafía. Se marca como puesta igual. */
  | { kind: "already_there"; name: string }
  /** Entra, con el nombre normalizado y la fila lista. */
  | { kind: "add"; name: string; skills: SkillItem[] }

/**
 * Las comillas y la puntuación con que el modelo devuelve un término.
 *
 * El modelo entrecomilla («"Salesforce"») y cierra con punto o coma según dónde
 * caiga en su frase. Sin esta limpieza el CV terminaba con una habilidad llamada
 * literalmente `"Salesforce".`
 */
const WRAPPING = /^["'“”]+|["'“”.,;:]+$/g

export function planSkillAdd(
  keyword: string,
  sectionData: Record<string, unknown>,
  newId: () => string,
): SkillAddPlan {
  const cleaned = keyword.trim().replace(WRAPPING, "").trim()

  // Validado contra el motor de habilidades, no sólo por largo: una conocida se
  // acepta de una, y cualquier otra tiene que PARECER una habilidad y no ser el
  // empleador, la ciudad o el cargo del propio candidato.
  if (!isPlausibleSkill(cleaned, sectionData)) return { kind: "not_a_skill", term: cleaned }

  const name = displaySkill(cleaned)
  const existing = (sectionData.skills ?? []) as SkillItem[]

  // Misma grafía, o la misma habilidad escrita distinto / en el otro idioma. La
  // lista no puede ganar un gemelo de algo que ya está: «objective-c» al lado de
  // «Objective-C» es el defecto que la normalización viene a evitar.
  const already =
    existing.some((s) => s.name.toLowerCase() === name.toLowerCase()) ||
    !!findDuplicateSkill(name, existing.map((s) => s.name))
  if (already) return { kind: "already_there", name }

  return {
    kind: "add",
    name,
    skills: [...existing, { id: newId(), name, level: "intermediate" as const }],
  }
}

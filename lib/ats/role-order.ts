import { roleRecency } from "@/lib/ats/resume-integrity"
import type { WorkExperienceItem } from "@/types/resume"

/**
 * REORDENAR LA EXPERIENCIA, DEL PUESTO MÁS RECIENTE AL MÁS ANTIGUO.
 *
 * ── POR QUÉ VIVE ACÁ Y NO DENTRO DEL PANEL ─────────────────────────────────
 *
 * Reordena el historial laboral del usuario: si se equivoca, le mueve los
 * puestos de sitio en su propio CV. Vivía dentro de un componente de 1.700
 * líneas, donde lo único que un test podía hacer era comprobar que la línea
 * existiera. Acá se ejecuta con historiales de verdad y se lee qué sale.
 *
 * ── LA REGLA SUTIL, QUE ES TODA LA FUNCIÓN ─────────────────────────────────
 *
 * UN PUESTO SIN FECHA LEGIBLE CONSERVA SU POSICIÓN. No se manda al final ni se
 * adivina dónde va: los puestos con fecha se ordenan entre sí ocupando las
 * posiciones que los puestos con fecha YA ocupaban, y los demás se quedan donde
 * estaban. Así un historial a medio fechar se mejora, nunca se revuelve.
 *
 * Inventar un orden es el mismo tipo de daño que inventar una fecha: el CV
 * termina afirmando algo que el candidato no dijo.
 *
 * `null` = ya está en orden y no hay nada que aplicar. Que no es lo mismo que
 * «no se pudo»: el panel necesita distinguirlos para no ofrecer un botón que
 * responda «ya estaba bien» al hallazgo que acaba de señalar el desorden.
 */
export function planRoleReorder(work: readonly WorkExperienceItem[]): WorkExperienceItem[] | null {
  if (work.length < 2) return null

  // La MISMA lectura que usa el chequeo. Antes esto parseaba sólo MM/AAAA y
  // trataba un año pelado como ilegible, así que en un CV escrito «2015 – 2016»
  // todas las filas puntuaban `null`, no se ordenaba nada, y el botón respondía
  // «ya está en orden» justo al hallazgo que acababa de decir lo contrario.
  const rank = (j: WorkExperienceItem): number | null =>
    roleRecency({
      jobTitle: j.jobTitle,
      startDate: j.startDate,
      endDate: j.endDate,
      currentlyWorking: j.currentlyWorking,
    })

  const dated = work.map((j, i) => ({ j, i, r: rank(j) })).filter((x) => x.r !== null)
  if (dated.length < 2) return null

  const slots = dated.map((x) => x.i)
  // Empate por fecha: gana el que ya venía primero. Sin este desempate el orden
  // de dos puestos del mismo año dependería del algoritmo de sort.
  const sorted = [...dated].sort((a, b) => (b.r as number) - (a.r as number) || a.i - b.i)
  if (sorted.every((x, k) => x.i === slots[k])) return null

  const next = [...work]
  slots.forEach((slot, k) => { next[slot] = sorted[k].j })
  return next
}

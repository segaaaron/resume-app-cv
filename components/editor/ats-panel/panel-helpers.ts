// Pure decisions lifted out of ATSScorePanel.tsx.
//
// The panel is the largest file in the codebase and the one the CEO reports bugs in most
// often. Nothing here touches component state, so it can be read, reasoned about and —
// for the first time — unit-tested on its own (`__tests__/lib/ats-panel-helpers.test.ts`).
// The rest of the panel still needs a render harness before it can be split further.

import type { WorkExperienceItem } from "@/types/resume"
import { repairableDefects } from "@/lib/services/ai/shared/repairable-defects"
import { isContentOptimized } from "../hooks/useOptimizedGuard"

/**
 * Share of bullets that should carry a figure. Not every line takes one — an
 * "improved code quality" cannot be counted honestly — and a resume where every
 * single line ends in a percentage is the manufactured pattern the credibility
 * check exists to catch. Half is the shape of a well-written history.
 */
export const HEALTHY_METRIC_PCT = 50

/**
 * Rows of the "bullets to improve" list shown at once.
 *
 * A CV with forty bullets produced twenty-four rows, which reads as "your resume
 * is broken" rather than as work to get through. Six matches the number of lines
 * a single role should carry (writing-checks), so a full page of this list is
 * about one role's worth of decisions.
 */
export const BULLETS_PAGE = 6

/**
 * Where in the CV a finding lands, in the user's words.
 *
 * The report quoted a line and named a problem but never said WHICH section or
 * role it belonged to — on a resume with five jobs and forty bullets, "this
 * bullet" is not an address. The action already carries the target because the
 * buttons need it; this just says it out loud, so a finding with no button is
 * still findable by hand.
 */
export function fixLocationLabel(
  action: { kind: string; targetId?: string; index?: number } | undefined,
  jobs: WorkExperienceItem[],
  t: (k: string, v?: Record<string, string | number>) => string,
): string | null {
  if (!action) return null
  if (action.kind === "rewrite_summary") return t("fix_where_summary")
  if (action.kind === "add_skill") return t("fix_where_skills")
  if (action.kind === "fix_dates") return t("fix_where_dates")
  if (action.kind === "rewrite_bullet" && action.targetId) {
    const job = jobs.find((j) => j.id === action.targetId)
    if (!job) return null
    const where = [job.jobTitle, job.employer].filter(Boolean).join(" · ")
    return action.index === undefined
      ? where
      : t("fix_where_bullet", { job: where, n: action.index + 1 })
  }
  return null
}

/**
 * What a rewrite of this bullet could still fix.
 *
 * Delegates to the shared rule instead of deciding here. This function used to
 * count a missing figure as a defect, which the endpoint refuses to treat as one
 * — so the panel drew a button whose only possible answer was "already well
 * written". Empty means: do not offer the rewrite.
 */
export function bulletDefects(text: string): string[] {
  return repairableDefects(text)
}

/**
 * May the AI still be asked to rewrite this job's bullets?
 *
 * Two conditions, both cheap and local. There has to be a defect a rewrite can
 * repair, AND the text must not be what the AI wrote last time — the ATS panel
 * used to only WRITE that mark and never read it, so a bullet the model had just
 * produced could be sent straight back to the model from here. Every such press
 * pays for an answer we already have.
 */
export function canAskAI(jobId: string, description: string, bullet: string): boolean {
  if (repairableDefects(bullet).length === 0) return false
  return !isContentOptimized(`opt_bullet_${jobId}`, description)
}

/**
 * CÓMO RESPONDE UN BOTÓN DEL PANEL AL TOCARLO. Un lenguaje, no quince decisiones.
 *
 * ── EL DEFECTO (auditoría de diseño, 2026-08-27) ────────────────────────────
 *
 * Quince de los dieciocho botones del informe no tenían NINGÚN estado de hover:
 * fondo fijo, sin cambio al pasar por encima y sin acuse al pulsar. La regla de
 * la casa lo prohíbe con todas las letras —«botones sin estado hover elaborado»—
 * y el efecto es el que el CEO describe como básico: la pantalla no contesta.
 *
 * Dos componentes SÍ lo tenían (`hover:brightness`), así que lo que faltaba no
 * era inventar un tratamiento sino aplicar el que ya existía a todos. Repetir la
 * clase en cada botón habría sido quince decisiones que se separan con el
 * tiempo; acá hay una.
 *
 * `brightness` funciona sobre CUALQUIER fondo —los del panel son tokens, no
 * clases de Tailwind—, así que un solo tratamiento sirve para el botón sólido,
 * el de borde y el fantasma sin escribir tres variantes.
 *
 * El acuse de pulsación es un `scale` mínimo: suficiente para que se sienta el
 * click, corto para que no distraiga, y sin mover el layout —`transform` no
 * reflows—. Y se anula con `prefers-reduced-motion`, que es una preferencia del
 * sistema y no una opinión nuestra.
 */
export const PRESSABLE =
  "transition-[filter,transform] duration-150 hover:brightness-95 active:scale-[0.97] " +
  "motion-reduce:transition-none motion-reduce:active:scale-100 " +
  "disabled:pointer-events-none disabled:opacity-60"

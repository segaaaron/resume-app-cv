// lib/ats/stale-terms.ts
//
// EL TÉRMINO QUE SÓLO VIVE EN UN PUESTO VIEJO (F3).
//
// ── POR QUÉ IMPORTA ────────────────────────────────────────────────────────
//
// La investigación sobre los ATS reales lo dice y nuestro propio puntaje ya lo
// aplica al TÍTULO: la misma palabra pesa distinto según cuándo la usaste.
// «iOS Developer hace ocho años» no es la misma señal que «iOS Developer ahora».
// Para las habilidades, en cambio, el CV entero cuenta igual: un término que
// sólo aparece en un puesto que terminó en 2016 suma lo mismo que uno de tu
// trabajo actual.
//
// ── Y POR QUÉ ESTO NO TOCA EL PUNTAJE ──────────────────────────────────────
//
// Se midió lo que pasa cuando se pondera una señal así (ver la nota de
// `ats-matcher.ts` sobre la prioridad): mover el número por una señal que
// todavía no está calibrada contra resultados hace que el mismo CV valga cosas
// distintas sin que el candidato haya tocado nada. Acá se INFORMA: el candidato
// ve qué término quedó viejo y decide si sigue usándolo. Peso cero, como la
// brecha de años.
import { termPresent, normalizeTerm } from "@/lib/ats/vocabulary"
import { parseBullets } from "@/lib/services/ai/shared/bullets"

/** Años desde el final de un puesto a partir de los cuales su evidencia "envejece". */
export const STALE_AFTER_YEARS = 6

interface Role {
  jobTitle?: string
  description?: string
  startDate?: string
  endDate?: string
  currentlyWorking?: boolean
}

export interface StaleTerm {
  term: string
  /** El puesto más reciente que lo menciona. */
  jobTitle: string
  /** Año en que terminó ese puesto. */
  year: number
}

function endYear(r: Role, currentYear: number): number {
  if (r.currentlyWorking || !r.endDate?.trim()) return currentYear
  const years = `${r.endDate}`.match(/20\d{2}|19\d{2}/g)
  return years ? Math.max(...years.map(Number)) : currentYear
}

/**
 * Los términos de la vacante que el CV demuestra SÓLO en puestos viejos.
 *
 * Un término que aparece en cualquier puesto reciente no entra: la señal está
 * fresca y no hay nada que avisar. Tampoco entra el que no aparece en ningún
 * lado — ése ya lo reporta el hallazgo de término faltante, y decir dos veces lo
 * mismo es exactamente lo que este proyecto viene cerrando.
 */
export function findStaleTerms(
  postingTerms: readonly string[],
  sectionData: Record<string, unknown>,
  now = new Date(),
): StaleTerm[] {
  const work = (sectionData.workExperience ?? []) as Role[]
  if (work.length === 0) return []
  const currentYear = now.getFullYear()

  const roles = work.map((r) => ({
    jobTitle: r.jobTitle?.trim() ?? "",
    year: endYear(r, currentYear),
    // `termPresent` compara contra texto NORMALIZADO — es la misma función con
    // la que el matcher cuenta la cobertura, y pasarle el crudo hace que no
    // encuentre nada. Sin esto el aviso no se disparaba nunca.
    text: normalizeTerm([r.jobTitle ?? "", ...parseBullets(r.description ?? "")].join(" ")),
  }))

  const out: StaleTerm[] = []
  const vistos = new Set<string>()
  for (const term of postingTerms) {
    const key = normalizeTerm(term)
    if (!key || vistos.has(key)) continue
    const donde = roles.filter((r) => termPresent(term, r.text))
    if (donde.length === 0) continue
    const masReciente = donde.reduce((a, b) => (b.year > a.year ? b : a))
    if (currentYear - masReciente.year < STALE_AFTER_YEARS) continue
    vistos.add(key)
    out.push({ term, jobTitle: masReciente.jobTitle, year: masReciente.year })
  }
  return out
}

"use client"

import { useTranslations } from "next-intl"
import { Check, Plus, Sparkles } from "lucide-react"
import type { ReportTerm } from "@/lib/ats/report"

/**
 * Los términos, con su cuenta a los dos lados.
 *
 * POR QUÉ EL CONTEO Y NO UNA LISTA. «Te falta esta habilidad» hay que creerlo;
 * «la vacante lo pide 3 veces y tu CV lo dice 0» se verifica leyendo. Creer es
 * exactamente lo que el CEO dejó de hacer con este panel, y un número que él puede
 * comprobar por su cuenta es lo que lo devuelve.
 *
 * Y la tercera columna, que es la que un reclutador mira de verdad: un término
 * que sólo vive en la lista de habilidades es una AFIRMACIÓN; el mismo término
 * dentro de una viñeta con fecha es una PRUEBA. Los dos suman igual para el
 * filtro, y no valen lo mismo para la persona.
 *
 * ── EL REDISEÑO, Y QUÉ DEFECTO CIERRA CADA PIEZA ───────────────────────────
 *
 * Reportado con captura en un riel de ~320px: la tabla partía «Generación de
 * leads calificados» a mitad de palabra, repetía el chip «sólo en la lista» diez
 * veces seguidas y mostraba «— / 1» sin decir qué era cada número.
 *
 *   · SE FUE LA CABECERA DE TABLA. «TÉRMINO · VACANTE/CV» era una fila gris de
 *     formulario que gastaba ancho en explicar dos columnas que ya no existen.
 *     En su lugar, los términos se AGRUPAN por estado, y el encabezado del grupo
 *     dice el estado una vez en vez de un chip por fila.
 *   · EL TÉRMINO SE LLEVA EL RENGLÓN ENTERO. Compartía la línea con el conteo y
 *     dos botones: en 296px útiles le quedaban unos 130 y se cortaba solo. Ahora
 *     el conteo y la acción bajan a una segunda línea.
 *   · EL COLOR YA NO ES EL ÚNICO INDICADOR (WCAG). El punto de color se quedó,
 *     pero el estado lo dice el encabezado del grupo con palabras.
 *   · «— / 1» PASÓ A SER UNA FRASE. Dos números pegados por una barra obligan a
 *     recordar cuál lado es cuál; «lo pide 3 · lo decís 0» se lee sin leyenda.
 */

/** Los tres estados, en el orden en que conviene trabajarlos. */
type Group = "missing" | "listed" | "proven"

const GROUP_DOT: Record<Group, string> = {
  missing: "var(--a-bad)",
  listed: "var(--a-warn)",
  proven: "var(--a-ok)",
}

const GROUP_ORDER: readonly Group[] = ["missing", "listed", "proven"]

interface Props {
  terms: ReportTerm[]
  /** Agrega el término a Habilidades. Determinista, sin llamada al modelo. */
  onAdd?: (term: string) => void
  /** Se lo pasa a tailor para que lo escriba dentro de una viñeta. */
  onWeave?: (term: string) => void
  addedTerms?: ReadonlySet<string>
  busyTerm?: string | null
}

export default function TermTable({ terms, onAdd, onWeave, addedTerms, busyTerm }: Props) {
  const t = useTranslations("editor.ats")
  if (terms.length === 0) return null

  const groupOf = (x: ReportTerm, added: boolean): Group => {
    if (x.cv === 0 && !added) return "missing"
    return x.listOnly ? "listed" : "proven"
  }

  // Lo que falta primero: es lo accionable. Después lo afirmado sin respaldo, que
  // es trabajo real aunque el filtro ya lo cuente. Lo probado, al final.
  const groups = new Map<Group, ReportTerm[]>()
  for (const row of terms) {
    const g = groupOf(row, addedTerms?.has(row.term) ?? false)
    const bucket = groups.get(g)
    if (bucket) bucket.push(row)
    else groups.set(g, [row])
  }
  for (const bucket of groups.values()) bucket.sort((a, b) => b.jd - a.jd)

  return (
    <div className="flex flex-col gap-3.5">
      {GROUP_ORDER.filter((g) => (groups.get(g)?.length ?? 0) > 0).map((g) => {
        const rows = groups.get(g) ?? []
        return (
          <section key={g}>
            {/* El estado, dicho UNA vez. Antes era un chip por fila: diez chips
                amarillos idénticos apilados que no distinguían nada entre sí. */}
            <h4 className="mb-1.5 flex items-center gap-1.5 px-0.5">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: GROUP_DOT[g] }} />
              <span
                className="text-[9.5px] font-bold uppercase tracking-[0.07em]"
                style={{ color: "var(--a-muted)" }}
              >
                {t(`term_group_${g}`)}
              </span>
              <span
                className="rounded-full px-1.5 py-0.5 text-[9.5px] font-bold tabular-nums"
                style={{ background: "var(--a-surface-3)", color: "var(--a-muted-2)" }}
              >
                {rows.length}
              </span>
            </h4>

            <ul
              className="overflow-hidden rounded-xl border"
              style={{ borderColor: "var(--a-border)", background: "var(--a-surface)" }}
            >
              {rows.map((row, i) => {
                const added = addedTerms?.has(row.term) ?? false
                const present = row.cv > 0 || added
                const shown = added ? row.cv + 1 : row.cv
                const canWeave = !!onWeave && (row.cv === 0 || row.listOnly) && !added
                const canAdd = !!onAdd && row.cv === 0 && !added
                return (
                  <li
                    key={row.term}
                    className="px-3 py-2.5"
                    style={i > 0 ? { borderTop: "1px solid var(--a-border)" } : undefined}
                  >
                    {/* RENGLÓN PROPIO. Compartir la línea con el conteo y los
                        botones era lo que lo partía a mitad de palabra. */}
                    <p
                      className="text-[12.5px] font-semibold leading-snug [overflow-wrap:anywhere]"
                      style={{ color: "var(--a-ink-2)" }}
                    >
                      {row.term}
                    </p>

                    <div className="mt-1.5 flex items-center gap-2">
                      {/* Los dos números, dichos. Un «3 / 0» obliga a recordar
                          cuál lado es cuál; una frase corta no.
                          El guion del lado de la vacante NO es un cero: el
                          extractor normalizó el término y puede no aparecer con
                          esas palabras exactas en el aviso. Decir «0» ahí sería
                          justamente la clase de dato que esta tabla promete que
                          se puede auditar leyendo. */}
                      <span
                        className="min-w-0 flex-1 truncate text-[10.5px] tabular-nums"
                        style={{ color: "var(--a-muted)" }}
                        title={row.jd > 0 ? t("term_counts_hint") : t("term_jd_uncounted")}
                      >
                        {row.jd > 0 ? t("term_meta_jd", { jd: row.jd }) : t("term_meta_jd_unknown")}
                        <span className="mx-1" style={{ color: "var(--a-border-2)" }}>·</span>
                        <span style={{ color: present ? "var(--a-ok)" : "var(--a-bad)", fontWeight: 700 }}>
                          {t("term_meta_cv", { cv: shown })}
                        </span>
                      </span>

                      <span className="flex shrink-0 items-center gap-1">
                        {added && (
                          <span
                            className="flex items-center gap-1 text-[10.5px] font-bold"
                            style={{ color: "var(--a-ok)" }}
                          >
                            <Check className="h-3 w-3" /> {t("term_added")}
                          </span>
                        )}
                        {/* Agregarlo a la lista es determinista y gratis. */}
                        {canAdd && (
                          <button
                            type="button"
                            onClick={() => onAdd?.(row.term)}
                            title={t("term_add")}
                            aria-label={t("term_add")}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border transition-colors hover:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                            style={{
                              borderColor: "var(--a-border-2)",
                              color: "var(--a-ink-2)",
                              background: "var(--a-surface-2)",
                              // El anillo de foco tiene que VERSE: `--a-accent`
                              // da 2.41:1 sobre blanco y desaparecía. La tinta
                              // del mismo acento da 6.81:1.
                              outlineColor: "var(--a-accent-ink)",
                            }}
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {/* Escribirlo DENTRO de una viñeta es lo que lo vuelve prueba. */}
                        {canWeave && (
                          <button
                            type="button"
                            onClick={() => onWeave?.(row.term)}
                            disabled={busyTerm === row.term}
                            title={t("term_weave")}
                            aria-label={t("term_weave")}
                            className="flex h-8 w-8 items-center justify-center rounded-lg transition-transform hover:scale-[1.06] disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                            style={{
                              background: "var(--a-ai-soft)",
                              color: "var(--a-ai-ink)",
                              boxShadow: "var(--a-sh-sm)",
                              outlineColor: "var(--a-ai)",
                            }}
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </span>
                    </div>
                  </li>
                )
              })}
            </ul>
          </section>
        )
      })}

      <p className="px-0.5 text-[10.5px] leading-snug" style={{ color: "var(--a-muted)" }}>
        {t("term_evidence_note")}
      </p>
    </div>
  )
}

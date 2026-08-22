"use client"

import { useTranslations } from "next-intl"
import type { ReportTerm } from "@/lib/ats/report"

/**
 * Afirmado contra probado.
 *
 * LA PREGUNTA QUE CONTESTA, y por qué no la contesta el puntaje: para el filtro,
 * un término dentro de una viñeta con fecha y el mismo término solo en la lista de
 * habilidades valen EXACTAMENTE lo mismo — los dos aparecen en el texto. Para la
 * persona que lee después, uno es una prueba y el otro una afirmación.
 *
 * Por eso este número no mueve la nota y hay que decirlo: es la diferencia entre
 * pasar el filtro y sostener la entrevista. Un CV con 40 habilidades listadas y
 * ninguna respaldada pasa el primero y se cae en la segunda.
 */
interface Props {
  terms: readonly ReportTerm[]
}

export default function KeywordContextPanel({ terms }: Props) {
  const t = useTranslations("editor.ats")

  // Sólo las que el CV realmente dice: de las que faltan no hay nada que probar.
  const claimed = terms.filter((x) => x.cv > 0)
  if (claimed.length === 0) return null

  const listOnly = claimed.filter((x) => x.listOnly)
  const evidenced = claimed.length - listOnly.length
  const pct = Math.round((evidenced / claimed.length) * 100)
  const risky = pct < 60

  return (
    <div className="overflow-hidden rounded-xl border" style={{ borderColor: "var(--a-border)", background: "var(--a-surface)" }}>
      <div className="px-3 pt-3">
        <div className="flex items-baseline justify-between gap-2">
          <span className="min-w-0 text-[11px] font-bold" style={{ color: "var(--a-ink-2)" }}>
            {t("ctx_title")}
          </span>
          <span className="shrink-0 text-[17px] font-bold tabular-nums" style={{ color: risky ? "var(--a-warn)" : "var(--a-ok)" }}>
            {pct}
            <small className="ml-0.5 text-[10px]">%</small>
          </span>
        </div>

        <div className="mt-2 h-[7px] w-full overflow-hidden rounded-full" style={{ background: "var(--a-track)" }}>
          <span
            className="block h-full transition-[width] duration-500"
            style={{ width: `${pct}%`, background: risky ? "var(--a-warn)" : "var(--a-ok)" }}
          />
        </div>

        <p className="mt-1.5 text-[10.5px] leading-snug" style={{ color: "var(--a-muted)" }}>
          {t("ctx_caption", { evidenced, claimed: claimed.length })}
        </p>
      </div>

      {/* LA LISTA SE FUE, EL NÚMERO SE QUEDA.
          Acá vivían los mismos términos que la tabla de abajo ya enumera y
          resuelve — cuarta copia del mismo dato, y la única sin botón. Este
          bloque contesta UNA pregunta que nadie más contesta: qué proporción de
          lo que decís está respaldado. Enumerar cuáles es trabajo de la tabla. */}
    </div>
  )
}

"use client"

import { useTranslations } from "next-intl"
import { Sparkles } from "lucide-react"
import type { AtsReport, ReportBullet } from "@/lib/ats/report"
import { solvableChecks } from "@/lib/ats/report"

/**
 * Todas las viñetas, medidas de una.
 *
 * POR QUÉ AGREGADO Y NO SÓLO POR TARJETA. La anatomía dentro de una corrección
 * contesta «¿esta línea mejoró?». Esta vista contesta la otra pregunta, que es la
 * que decide si el CV se manda: «¿cuántas de mis líneas dicen algo medible?».
 * Sin ella el usuario arregla tres viñetas, no sabe si eso mueve la aguja, y
 * vuelve a preguntarle al panel lo mismo la próxima vez.
 *
 * LA BANDA, Y POR QUÉ ES UNA BANDA. El objetivo es 60–70% con cifra, no 100%: un
 * CV donde TODAS las líneas terminan en un número se lee fabricado, y ése es el
 * riesgo del que este producto avisa una pantalla más arriba. Un objetivo simple
 * («más números») empujaría exactamente hacia donde no queremos.
 */

const TARGET_MIN = 60
const TARGET_MAX = 70

interface Props {
  report: AtsReport
  /** Abre el ejecutor sobre el hallazgo que toca esa línea. */
  onSolve: (checkId: string) => void
}

export default function BulletQualityPanel({ report, onSolve }: Props) {
  const t = useTranslations("editor.ats")
  const bullets = report.bullets
  if (bullets.length === 0) return null

  const withMetric = bullets.filter((b) => b.metric).length
  const withVerb = bullets.filter((b) => b.verb).length
  const withKeyword = bullets.filter((b) => b.keywords.length > 0).length
  const rich = bullets.filter((b) => b.verb && b.metric && b.keywords.length > 0).length
  const pct = Math.round((withMetric / bullets.length) * 100)
  const inBand = pct >= TARGET_MIN && pct <= TARGET_MAX
  const avgWords = Math.round(bullets.reduce((s, b) => s + b.words, 0) / bullets.length)

  /** El hallazgo que ya apunta a esa línea, si el informe emitió uno. */
  const checkFor = (b: ReportBullet): string | undefined =>
    solvableChecks(report).find((c) => {
      const a = c.action
      return a?.kind === "rewrite_bullet" && a.targetId === b.targetId && a.index === b.index
    })?.id

  return (
    <div className="overflow-hidden rounded-xl border" style={{ borderColor: "var(--a-border)", background: "var(--a-surface)" }}>
      <div className="px-3 pt-3">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-[11px] font-bold" style={{ color: "var(--a-ink-2)" }}>
            {t("bq_title")}
          </span>
          <span className="text-[17px] font-bold tabular-nums" style={{ color: inBand ? "var(--a-ok)" : "var(--a-warn)" }}>
            {pct}
            <small className="ml-0.5 text-[10px]">%</small>
          </span>
        </div>

        {/* La banda dibujada: se ve que pasarse también es salirse. */}
        <div className="relative mt-2 h-[7px] w-full overflow-hidden rounded-full" style={{ background: "var(--a-track)" }}>
          <span
            className="absolute inset-y-0"
            style={{ left: `${TARGET_MIN}%`, width: `${TARGET_MAX - TARGET_MIN}%`, background: "var(--a-ok-soft)" }}
          />
          <span
            className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-500"
            style={{ width: `${Math.min(100, pct)}%`, background: inBand ? "var(--a-ok)" : "var(--a-warn)", opacity: .85 }}
          />
        </div>
        <p className="mt-1.5 text-[10.5px] leading-snug" style={{ color: "var(--a-muted)" }}>
          {t("bq_caption", { withMetric, total: bullets.length, min: TARGET_MIN, max: TARGET_MAX, rich })}
        </p>
      </div>

      <div className="mt-2.5 grid grid-cols-4 gap-px" style={{ background: "var(--a-border)" }}>
        {[
          { n: `${withVerb}/${bullets.length}`, k: "bq_verb", bad: withVerb < bullets.length },
          { n: `${withMetric}/${bullets.length}`, k: "bq_metric", bad: pct < TARGET_MIN },
          { n: `${withKeyword}/${bullets.length}`, k: "bq_keyword", bad: withKeyword < bullets.length },
          { n: String(avgWords), k: "bq_words", bad: avgWords > 25 || avgWords < 15 },
        ].map((s) => (
          <div key={s.k} className="px-2 py-2 text-center" style={{ background: "var(--a-surface)" }}>
            <span className="block text-[13px] font-bold tabular-nums" style={{ color: s.bad ? "var(--a-warn)" : "var(--a-ink)" }}>
              {s.n}
            </span>
            <span className="block text-[9px] leading-tight" style={{ color: "var(--a-muted-2)" }}>{t(s.k)}</span>
          </div>
        ))}
      </div>

      <ul className="max-h-[280px] overflow-y-auto border-t" style={{ borderColor: "var(--a-border)" }}>
        {bullets.map((b) => {
          const checkId = checkFor(b)
          const complete = b.verb && b.metric && b.keywords.length > 0
          return (
            <li
              key={`${b.targetId}-${b.index}`}
              className="flex items-start gap-2 border-b px-3 py-2 last:border-b-0"
              style={{ borderColor: "var(--a-border)" }}
            >
              {/* V · # · K — las tres señales, encendidas o no. Es lo que convierte
                  «mejorá tus viñetas» en «a ésta le falta el número». */}
              <span className="mt-0.5 flex shrink-0 gap-0.5" title={t("bq_anatomy_hint")}>
                {([["V", b.verb], ["#", b.metric], ["K", b.keywords.length > 0]] as const).map(([g, on]) => (
                  <i
                    key={g}
                    className="flex h-[15px] w-[15px] items-center justify-center rounded-[3px] text-[8.5px] font-bold not-italic"
                    style={
                      on
                        ? { background: "var(--a-ok-soft)", color: "var(--a-ok-ink)" }
                        : { background: "var(--a-surface-3)", color: "var(--a-muted-2)" }
                    }
                  >
                    {g}
                  </i>
                ))}
              </span>

              <span className="min-w-0 flex-1">
                <span
                  className="block text-[11px] leading-snug"
                  style={{ color: complete ? "var(--a-muted)" : "var(--a-ink-2)" }}
                >
                  {b.text}
                </span>
                {b.keywords.length > 0 && (
                  <span className="mt-0.5 block text-[9.5px]" style={{ color: "var(--a-accent-ink)" }}>
                    {b.keywords.slice(0, 4).join(" · ")}
                  </span>
                )}
              </span>

              <span className="flex shrink-0 items-center gap-1.5">
                <span
                  className="text-[9.5px] font-bold tabular-nums"
                  style={{ color: b.words > 25 || b.words < 15 ? "var(--a-warn)" : "var(--a-muted-2)" }}
                >
                  {t("bq_words_short", { n: b.words })}
                </span>
                {/* Botón sólo cuando el informe ya tiene un hallazgo para esa línea.
                    Fabricar uno acá sería abrir trabajo desde la vista, que es
                    justo lo que este rediseño le quitó a cada tarjeta. */}
                {checkId && (
                  <button
                    type="button"
                    onClick={() => onSolve(checkId)}
                    title={t("solve_with_tailor")}
                    aria-label={t("solve_with_tailor")}
                    className="flex h-6 w-6 items-center justify-center rounded-md"
                    style={{ background: "var(--a-ai-soft)", color: "var(--a-ai-ink)" }}
                  >
                    <Sparkles className="h-3 w-3" />
                  </button>
                )}
              </span>
            </li>
          )
        })}
      </ul>

      <p className="border-t px-3 py-2 text-[10.5px] leading-snug" style={{ borderColor: "var(--a-border)", color: "var(--a-muted)" }}>
        {t("bq_note")}
      </p>
    </div>
  )
}

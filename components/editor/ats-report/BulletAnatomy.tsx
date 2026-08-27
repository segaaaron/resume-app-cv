"use client"

import { useTranslations } from "next-intl"
import { hasAnyMetric } from "@/lib/services/ai/shared/ai-helpers"
import { opensWeakly } from "@/lib/services/ai/shared/bullet-quality"

/**
 * La viñeta, medida a los dos lados.
 *
 * POR QUÉ SE MIDE Y NO SE AFIRMA. Un botón que dice «mejorar» pide un acto de fe:
 * el usuario no sabe qué cambió ni por qué eso es mejor. Con las tres señales
 * antes y después, la decisión deja de ser confiar y pasa a ser leer — y cuando
 * la reescritura NO mejora una de las tres, se ve, que es justo lo que un panel
 * honesto tiene que dejar ver.
 *
 * Las tres señales salen de los mismos módulos que usan los guards del servidor
 * (`hasAnyMetric`, `WEAK_OPENERS`). Reimplementarlas acá habría creado una cuarta
 * opinión sobre si una línea tiene cifra — exactamente lo que este rediseño vino
 * a terminar.
 */

/** Objetivo de largo, el mismo que el ranking de viñetas ya usa. */
const WORD_MIN = 15
const WORD_MAX = 25

/**
 * El comentario de arriba prometía no crear «una cuarta» copia de esta pregunta,
 * y esta función ERA esa cuarta copia: consultaba la lista en vez de al dueño, y
 * por eso marcaba «abre con acción» sobre «Active use of…».
 */
function opensWithAction(text: string): boolean {
  const clean = text.toLowerCase().replace(/^[\s•·▪◦‣∙●○*–—-]+/, "").trim()
  if (!clean) return false
  return !opensWeakly(clean)
}

function wordsOf(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

function keywordsIn(text: string, terms: readonly string[]): string[] {
  const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "")
  const hay = norm(text)
  return terms.filter((term) => {
    const escaped = norm(term).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    return new RegExp(`\\b${escaped}\\b`).test(hay)
  })
}

interface Props {
  before: string
  after: string
  /** Los términos que la vacante pide, para saber cuáles aterrizaron. */
  terms: readonly string[]
}

export default function BulletAnatomy({ before, after, terms }: Props) {
  const t = useTranslations("editor.ats")

  const rows = [
    { key: "anatomy_verb", now: opensWithAction(before), next: opensWithAction(after) },
    { key: "anatomy_metric", now: hasAnyMetric(before), next: hasAnyMetric(after) },
    { key: "anatomy_keyword", now: keywordsIn(before, terms).length > 0, next: keywordsIn(after, terms).length > 0 },
  ]
  const wBefore = wordsOf(before)
  const wAfter = wordsOf(after)
  const inRange = (w: number) => w >= WORD_MIN && w <= WORD_MAX
  const landed = keywordsIn(after, terms).filter((k) => !keywordsIn(before, terms).includes(k))

  const mark = (ok: boolean) => (
    <span className="text-[12px] font-bold" style={{ color: ok ? "var(--a-ok)" : "var(--a-muted-2)" }}>
      {ok ? "✓" : "—"}
    </span>
  )

  return (
    <div className="rounded-lg border px-3 py-2.5" style={{ borderColor: "var(--a-border)", background: "var(--a-surface-2)" }}>
      <div className="grid grid-cols-[1fr_auto_auto] items-center gap-x-4 gap-y-1.5">
        <span />
        <span className="text-[9px] font-bold uppercase tracking-[0.08em]" style={{ color: "var(--a-muted-2)" }}>
          {t("anatomy_now")}
        </span>
        <span className="text-[9px] font-bold uppercase tracking-[0.08em]" style={{ color: "var(--a-muted-2)" }}>
          {t("anatomy_after")}
        </span>

        {rows.map((r) => (
          <ExpandRow key={r.key} label={t(r.key)} now={mark(r.now)} next={mark(r.next)} />
        ))}

        <ExpandRow
          label={t("anatomy_length", { min: WORD_MIN, max: WORD_MAX })}
          now={<Words n={wBefore} ok={inRange(wBefore)} />}
          next={<Words n={wAfter} ok={inRange(wAfter)} />}
        />
      </div>

      {landed.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t pt-2" style={{ borderColor: "var(--a-border)" }}>
          <span className="text-[9.5px] font-bold uppercase tracking-[0.06em]" style={{ color: "var(--a-muted-2)" }}>
            {t("anatomy_landed")}
          </span>
          {landed.slice(0, 6).map((k) => (
            <span key={k} className="rounded px-1.5 py-0.5 text-[10px] font-semibold"
              style={{ background: "var(--a-accent-soft)", color: "var(--a-accent-ink)" }}>
              {k}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function ExpandRow({ label, now, next }: { label: string; now: React.ReactNode; next: React.ReactNode }) {
  return (
    <>
      <span className="text-[11px]" style={{ color: "var(--a-ink-2)" }}>{label}</span>
      <span className="text-center">{now}</span>
      <span className="text-center">{next}</span>
    </>
  )
}

function Words({ n, ok }: { n: number; ok: boolean }) {
  return (
    <span className="text-[11px] font-bold tabular-nums" style={{ color: ok ? "var(--a-ok)" : "var(--a-warn)" }}>
      {n}
    </span>
  )
}

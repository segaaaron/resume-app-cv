"use client"

import { useEffect, useMemo, useState } from "react"
import { createPortal } from "react-dom"
import { useTranslations } from "next-intl"
import { Loader2, Sparkles, X } from "lucide-react"
import {
  recoverablePoints,
  resolutionFor,
  solvableChecks,
  weavableTerms,
  type AtsReport,
  type ReportResolution,
  type ReportSectionId,
} from "@/lib/ats/report"
import FixCard from "./FixCard"
import TermCard from "./TermCard"

/**
 * EL EJECUTOR. Resuelve lo que el informe listó, y nada más.
 *
 * De dónde saca el trabajo: `tailorWorkload(report)`. No de la oferta, no de una
 * segunda lectura del CV, no de un diagnóstico propio. Esa es la regla del CEO
 * —«el ATS muestra lo que falta, tailor lo soluciona»— hecha estructura: si un
 * hallazgo no está en el informe, acá no hay dónde ponerlo.
 *
 * Antes tailor devolvía su propio `missingSkills`, su propio `softSkillSuggestions`,
 * su propio resumen y su propio diagnóstico de métricas, y el panel desempataba a
 * mano contra los del análisis. Cuatro diagnósticos duplicados para las mismas
 * preguntas, y el usuario leyendo dos órdenes distintas sobre el mismo texto.
 */

/**
 * Abre en «todas», como el diseño aprobado.
 *
 * Con «pendientes» por defecto, la tarjeta DESAPARECÍA al aplicarla: el usuario
 * perdía la confirmación de que su clic hizo algo y el botón de deshacer quedaba
 * detrás de un filtro que no tenía motivo para tocar. Cosas que se esfuman al
 * resolverlas es exactamente lo que hacía sentir el panel un pozo.
 */
type Filter = "all" | "open" | "done" | ReportSectionId

interface Props {
  report: AtsReport
  /** Lo que el ejecutor escribió, indexado por hallazgo. */
  resolutions: readonly ReportResolution[]
  appliedIds: ReadonlySet<string>
  onApply: (checkId: string) => void
  onUndo: (checkId: string) => void
  onRemove?: (checkId: string) => void
  onApplyAll: () => void
  onClose: () => void
  /** Abre enfocando un hallazgo puntual, cuando se entró desde el riel. */
  focusCheckId?: string | null
  /** Con qué filtro abre. El veredicto del reclutador entra en «opcionales». */
  initialFilter?: Filter
  /** Colocar un término que falta: la palanca más grande del puntaje. */
  onWeaveTerm?: (term: string) => void
  onAddTerm?: (term: string) => void
  addedTerms?: ReadonlySet<string>
  busyTerm?: string | null
  busy?: boolean
}

export default function TailorModal({
  report, resolutions, appliedIds, onApply, onUndo, onRemove, onApplyAll, onClose, focusCheckId, initialFilter, onWeaveTerm, onAddTerm, addedTerms, busyTerm, busy,
}: Props) {
  const t = useTranslations("editor.ats")
  const [filter, setFilter] = useState<Filter>(initialFilter ?? "all")

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", onEsc)
    return () => window.removeEventListener("keydown", onEsc)
  }, [onClose])

  // Al entrar desde un hallazgo puntual, se lo trae a la vista en lugar de dejar
  // al usuario buscándolo en una lista de veinte tarjetas. Corre después del
  // primer pintado, que es cuando la tarjeta existe en el DOM.
  useEffect(() => {
    if (!focusCheckId) return
    // Los términos NO son tarjetas de hallazgo: se marcan con `data-term`, uno
    // por habilidad. Entrar desde «10 habilidades están sólo en la lista» no
    // encontraba nada con `data-check` y el modal abría arriba de todo, en
    // silencio — el usuario aterrizaba lejos de lo que acababa de pedir.
    const el =
      document.querySelector(`[data-check="${CSS.escape(focusCheckId)}"]`) ??
      (focusCheckId === "search.listed_only" ? document.querySelector("[data-term]") : null)
    el?.scrollIntoView({ block: "center", behavior: "smooth" })
  }, [focusCheckId])

  const workload = useMemo(() => solvableChecks(report), [report])
  // Los términos que faltan son trabajo del ejecutor, no una tabla al costado:
  // las duras pesan .45 y eran lo único caro que quedaba fuera de acá.
  // Incluye los «sólo en la lista»: para el filtro ya cuentan, para quien
  // entrevista no — y su única salida visible vivía en una tabla al costado
  // mientras el hallazgo que los cuenta decía que no había ninguna.
  const terms2 = useMemo(
    () => (onWeaveTerm ? weavableTerms(report).filter((x) => x.cv > 0 || !addedTerms?.has(x.term)) : []),
    [report, onWeaveTerm, addedTerms],
  )
  const pending = workload.filter((c) => !appliedIds.has(c.id))
  const pendingTotal = pending.length + terms2.length
  const gain = useMemo(() => recoverablePoints(report), [report])
  const terms = useMemo(() => report.terms.map((x) => x.term), [report.terms])

  const shown = workload.filter((c) => {
    if (filter === "all") return true
    if (filter === "open") return !appliedIds.has(c.id)
    if (filter === "done") return appliedIds.has(c.id)
    return c.section === filter
  })

  const sectionsPresent = [...new Set([...workload.map((c) => c.section), ...terms2.map((x) => x.section)])]
  const filters: Array<[Filter, string]> = [
    ["all", t("filter_all", { count: workload.length + terms2.length })],
    ["open", t("filter_open", { count: pendingTotal })],
    ["done", t("filter_done", { count: appliedIds.size })],
    ...sectionsPresent.map((s): [Filter, string] => [s, t(`section_${s}`)]),
  ]

  // El modal sólo existe tras un clic, así que no hay pasada de servidor que
  // proteger — pero el guard mantiene el componente seguro si alguien lo monta
  // desde un árbol renderizado en el servidor.
  if (typeof document === "undefined") return null

  return createPortal(
    <div
      className="ats-panel fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: "rgba(20,20,15,.55)" }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={t("tailor_title_short")}
    >
      <section
        className="flex max-h-[88vh] w-full max-w-[840px] flex-col overflow-hidden rounded-2xl"
        style={{ background: "var(--a-bg)", boxShadow: "var(--a-sh-lg)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start gap-3 border-b px-5 py-4"
          style={{ borderColor: "var(--a-border)", background: "var(--a-surface)" }}>
          <div className="min-w-0 flex-1">
            <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em]"
              style={{ color: "var(--a-ai)" }}>
              <Sparkles className="h-3 w-3" /> {t("tailor_title_short")}
            </span>
            <h2 className="mt-1 text-[17px] font-bold leading-tight" style={{ color: "var(--a-ink)" }}>
              {pendingTotal > 0 ? t("tailor_pending", { count: pendingTotal }) : t("tailor_all_done")}
            </h2>
            <p className="mt-1 text-[11.5px] leading-relaxed" style={{ color: "var(--a-muted)" }}>
              {t("tailor_sub")}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <span className="block text-[22px] font-bold leading-none tabular-nums" style={{ color: "var(--a-ink)" }}>
              {report.score}
            </span>
            {gain > 0 && (
              <span className="mt-0.5 block text-[10px] font-bold" style={{ color: "var(--a-ok)" }}>
                +{gain}
              </span>
            )}
            <span className="mt-0.5 block text-[8.5px] font-semibold uppercase tracking-[0.08em]" style={{ color: "var(--a-muted-2)" }}>
              {t("axis_match")}
            </span>
          </div>
          <button type="button" onClick={onClose} aria-label={t("close")}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border"
            style={{ borderColor: "var(--a-border)", color: "var(--a-muted)" }}>
            <X className="h-3.5 w-3.5" />
          </button>
        </header>

        <div className="flex flex-wrap items-center gap-2 border-b px-5 py-2.5"
          style={{ borderColor: "var(--a-border)", background: "var(--a-surface-2)" }}>
          <div className="flex flex-wrap gap-1.5">
            {filters.map(([id, label]) => (
              <button key={id} type="button" onClick={() => setFilter(id)}
                className="rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors"
                style={
                  filter === id
                    ? { background: "var(--a-ink)", color: "var(--a-bg)" }
                    : { background: "var(--a-surface-3)", color: "var(--a-muted)" }
                }>
                {label}
              </button>
            ))}
          </div>
          {/* APLICAR TODO APLICA TODO. Decía «aplicar las 5» con 10 pendientes:
              el mismo hueco que el botón del riel, un nivel más abajo. Los
              términos entran acá porque son la palanca más grande del puntaje. */}
          {pendingTotal > 0 && (
            <button type="button" onClick={onApplyAll} disabled={busy}
              className="ml-auto flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11.5px] font-bold text-white disabled:opacity-60"
              style={{ background: "var(--a-ai)" }}>
              {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
              {t("tailor_apply_all", { count: pendingTotal })}
            </button>
          )}
        </div>

        <div className="flex flex-col gap-3 overflow-y-auto px-5 py-4">
          {shown.map((c, i) => (
            <FixCard
              key={c.id}
              check={c}
              order={i + 1}
              resolution={resolutionFor(resolutions, c.id)}
              terms={terms}
              applied={appliedIds.has(c.id)}
              onApply={onApply}
              onUndo={onUndo}
              onRemove={onRemove}
              focused={focusCheckId === c.id}
              busy={busy}
            />
          ))}
          {(filter === "all" || filter === "open" || filter === "hard" || filter === "soft" || filter === "other") &&
            terms2
              .filter((x) => filter === "all" || filter === "open" || x.section === filter)
              .map((x, i) => (
                <TermCard
                  key={`term-${x.term}`}
                  term={x}
                  order={shown.length + i + 1}
                  onWeave={(term) => onWeaveTerm?.(term)}
                  onAdd={(term) => onAddTerm?.(term)}
                  added={!!addedTerms?.has(x.term)}
                  busy={busyTerm === x.term}
                />
              ))}

          {shown.length === 0 && terms2.length === 0 && (
            <p className="py-8 text-center text-[12px]" style={{ color: "var(--a-muted-2)" }}>
              {t("tailor_empty_filter")}
            </p>
          )}

          {/* Lo que separa esta herramienta de una que infla números. */}
          <p className="pt-1 text-[10.5px] leading-relaxed" style={{ color: "var(--a-muted-2)" }}>
            {t("tailor_footnote")}
          </p>
        </div>
      </section>
    </div>,
    document.body,
  )
}

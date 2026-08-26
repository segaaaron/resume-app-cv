"use client"

import { useEffect, useMemo, useState } from "react"
import { createPortal } from "react-dom"
import { Z_MODAL } from "@/lib/ui/z-layers"
import { useTranslations } from "next-intl"
import { Loader2, Sparkles, X } from "lucide-react"
import {
  applyAllPlan,
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
/** Las pestañas del ejecutor. Exportado porque el panel elige con cuál abrirlo. */
export type TailorFilter = "all" | "open" | "done" | ReportSectionId
type Filter = TailorFilter

interface Props {
  report: AtsReport
  /** Lo que el ejecutor escribió, indexado por hallazgo. */
  resolutions: readonly ReportResolution[]
  appliedIds: ReadonlySet<string>
  onApply: (checkId: string) => void
  onRemove?: (checkId: string) => void
  /** Y con qué reemplazarla: un término que la vacante pide y el CV no dice. */
  onReplaceWithTerm?: (term: string) => void
  /** Fusionar las dos gemelas en una, cuando comparten puesto. */
  onMergePair?: (checkId: string) => void
  onApplyAll: () => void
  onClose: () => void
  /** Abre enfocando un hallazgo puntual, cuando se entró desde el riel. */
  focusCheckId?: string | null
  /**
   * El término que se pidió resolver, para aterrizar en SU tarjeta.
   *
   * El riel ya no escribe la viñeta por su cuenta: manda acá. Sin esto el modal
   * abría arriba de todo y el usuario tenía que buscar entre ocho tarjetas la
   * que acababa de pedir.
   */
  focusTerm?: string | null
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
  report, resolutions, appliedIds, onApply, onRemove, onReplaceWithTerm, onMergePair, onApplyAll, onClose, focusCheckId, focusTerm, initialFilter, onWeaveTerm, onAddTerm, addedTerms, busyTerm, busy,
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

  /** Lo mismo para un término: el riel manda acá y hay que aterrizar en su tarjeta. */
  useEffect(() => {
    if (!focusTerm) return
    document
      .querySelector(`[data-term="${CSS.escape(focusTerm)}"]`)
      ?.scrollIntoView({ block: "center", behavior: "smooth" })
  }, [focusTerm, filter])

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
  /**
   * LO QUE «APLICAR TODO» APLICA DE VERDAD, contado por quien lo aplica.
   *
   * `pendingTotal` es todo el trabajo abierto, y ahí adentro viven las propuestas
   * de CORTE, que el botón masivo no toca a propósito: borrar líneas del CV de
   * alguien no se hace en un clic sin ver cuáles. Contarlas en la etiqueta era el
   * mismo defecto que este panel ya pagó tres veces — un número que cuenta lo que
   * la función SABE en vez de lo que la función HACE.
   */
  /** Lo que el ejecutor ya escribió y no espera un dato del candidato. */
  const listas = useMemo(
    () => new Set(resolutions.filter((r) => r.text.trim() && !r.needsFigureConfirm).map((r) => r.checkId)),
    [resolutions],
  )
  const applyAll = useMemo(
    // EL BOTÓN CUENTA LO QUE HACE. Las reescrituras que piden un número abren
    // una pantalla por cabeza y el masivo no las toca: contarlas acá sería
    // prometer un trabajo que el clic no ejecuta — el defecto que este panel ya
    // pagó tres veces.
    () => applyAllPlan(report, appliedIds, addedTerms, listas),
    [report, appliedIds, addedTerms, listas],
  )
  const applyAllTotal = applyAll.checkIds.length + applyAll.terms.length
  const gain = useMemo(() => recoverablePoints(report), [report])
  const terms = useMemo(() => report.terms.map((x) => x.term), [report.terms])

  /**
   * Los términos que ESTA pestaña muestra.
   *
   * Vivía en línea dentro del JSX y el mensaje de «no hay nada acá» miraba
   * `terms2` —el total— en vez de esto. En «Aplicados», con cero tarjetas y
   * términos pendientes en otra sección, no salía ni la lista ni el mensaje:
   * un hueco mudo. Un solo lugar decide qué se pinta y qué cuenta como vacío.
   */
  const termsShown = useMemo(
    () =>
      filter === "all" || filter === "open" || filter === "hard" || filter === "soft" || filter === "other"
        ? terms2.filter((x) => filter === "all" || filter === "open" || x.section === filter)
        : [],
    [terms2, filter],
  )

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
    /**
     * «APLICADOS N» CUENTA LO QUE LA PESTAÑA PINTA, no todo lo que se aplicó.
     *
     * ── EL DEFECTO (barrido de la vista del ejecutor, CEO 2026-08-25) ────────
     *
     * Decía `appliedIds.size` —TODO lo aplicado en el panel— mientras la pestaña
     * renderiza `workload.filter(aplicado)`. Los dos difieren siempre que se
     * aplica algo que no es trabajo del ejecutor (reordenar fechas, agregar una
     * habilidad, cortar una línea), y sobre todo DESPUÉS DEL RE-CÁLCULO: un
     * hallazgo resuelto desaparece del informe, así que su id sigue en el
     * conjunto y ya no tiene tarjeta. El chip decía «Aplicados 7» y la pestaña
     * abría vacía — el usuario leía que su trabajo se había perdido.
     *
     * Es el mismo defecto que este panel ya pagó tres veces: un número que
     * cuenta lo que la función SABE en vez de lo que la pantalla MUESTRA.
     */
    ["done", t("filter_done", { count: workload.filter((c) => appliedIds.has(c.id)).length })],
    ...sectionsPresent.map((s): [Filter, string] => [s, t(`section_${s}`)]),
  ]

  // El modal sólo existe tras un clic, así que no hay pasada de servidor que
  // proteger — pero el guard mantiene el componente seguro si alguien lo monta
  // desde un árbol renderizado en el servidor.
  if (typeof document === "undefined") return null

  return createPortal(
    <div
      className="ats-panel fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex: Z_MODAL, background: "rgba(20,20,15,.55)" }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={t("tailor_title_short")}
    >
      <section
        /*
          ALTURA FIJA, NO «HASTA». Era `max-h-[88vh]` sin altura: la caja se
          encogía al contenido, así que pasar de «Todas 8» a «Aplicados 0» hacía
          saltar el modal de casi toda la pantalla a una franja — y el usuario
          perdía el punto donde estaba mirando en cada clic de filtro. Los
          filtros cambian QUÉ se ve, no cuánto mide la ventana.
          El tope en píxeles evita el defecto opuesto: en una pantalla muy alta,
          88vh con dos tarjetas es una caja casi vacía.
        */
        className="flex h-[88vh] max-h-[760px] w-full max-w-[840px] flex-col overflow-hidden rounded-2xl"
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
          {applyAllTotal > 0 && (
            <button type="button" onClick={onApplyAll} disabled={busy}
              className="ml-auto flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11.5px] font-bold text-white disabled:opacity-60"
              style={{ background: "var(--a-ai)" }}>
              {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
              {t("tailor_apply_all", { count: applyAllTotal })}
            </button>
          )}
        </div>

        {/* `flex-1 min-h-0` es lo que hace que el scroll ocurra ACÁ ADENTRO. Sin
            `min-h-0` un hijo flex no baja de su altura de contenido, así que el
            `overflow-y-auto` no enganchaba nunca: en vez de scrollear, la lista
            empujaba la caja. */}
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-5 py-4">
          {shown.map((c, i) => (
            <FixCard
              key={c.id}
              check={c}
              order={i + 1}
              resolution={resolutionFor(resolutions, c.id)}
              terms={terms}
              applied={appliedIds.has(c.id)}
              onApply={onApply}
              onRemove={onRemove}
              onReplace={onReplaceWithTerm}
              onMerge={onMergePair}
              focused={focusCheckId === c.id}
              busy={busy}
            />
          ))}
          {termsShown.map((x, i) => (
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

          {/*
            EL VACÍO ES EL DE ESTA PESTAÑA, no el del informe entero.
            Decía `shown.length === 0 && terms2.length === 0`, y los términos
            sólo se pintan en all/open/hard/soft/other. En «Aplicados» con cero
            tarjetas y términos pendientes en otra sección, las dos condiciones
            no se cumplían a la vez: no salía el mensaje y quedaba un hueco mudo
            — que además era la mitad del salto de altura.
          */}
          {shown.length === 0 && termsShown.length === 0 && (
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

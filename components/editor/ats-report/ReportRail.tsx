"use client"

import { useTranslations } from "next-intl"
import { AlertTriangle, Sparkles } from "lucide-react"
import {
  criticalChecks,
  isReadyToSend,
  openChecks,
  recoverablePoints,
  solvableChecks,
  weavableTerms,
  type AtsReport,
  type ReportCheck,
  type ReportSectionId,
} from "@/lib/ats/report"
import ScoreDial from "./ScoreDial"
import CheckRow from "./CheckRow"
import ReportSectionCard from "./ReportSectionCard"
import TermTable from "./TermTable"
import BulletQualityPanel from "./BulletQualityPanel"

/**
 * EL INFORME. Lo único que este riel lee es `report`.
 *
 * Es la regla entera, hecha estructura: antes llegaban ocho fuentes sueltas y cada
 * tarjeta decidía por su cuenta qué pintar, así que una misma viñeta terminaba
 * señalada para reescribir, borrar y adaptar al mismo tiempo. Acá no hay de dónde
 * sacar una segunda opinión — si algo no está en el informe, no se muestra.
 *
 * Y el orden importa: primero el número con su veredicto, después lo que falta,
 * y recién al final el detalle por sección. Alguien con diez postulaciones que
 * mandar hoy no debería tener que leer el informe entero para saber si puede.
 */

interface Props {
  report: AtsReport
  /** Abre el ejecutor. Sin `checkId` = todo lo pendiente. */
  onSolve: (checkId?: string) => void
  /** Ejecuta el arreglo determinista de un hallazgo `auto`. */
  onFix?: (checkId: string) => void
  onAddTerm?: (term: string) => void
  onWeaveTerm?: (term: string) => void
  addedTerms?: ReadonlySet<string>
  busyTerm?: string | null
  busy?: boolean
}

export default function ReportRail({
  report, onSolve, onFix, onAddTerm, onWeaveTerm, addedTerms, busyTerm, busy,
}: Props) {
  const t = useTranslations("editor.ats")

  const crits = criticalChecks(report)
  const open = openChecks(report)
  const workload = solvableChecks(report)
  // Los términos que faltan cuentan como trabajo: son la palanca más grande del
  // puntaje (.45 las duras) y el botón no puede ofrecer menos de lo que resuelve.
  const missing = weavableTerms(report).filter((x) => x.cv > 0 || !addedTerms?.has(x.term))
  const solvable = workload.length + missing.length
  const recoverable = recoverablePoints(report)
  const ready = isReadyToSend(report)

  const renderCheck = (c: ReportCheck) => (
    <CheckRow
      check={c}
      onSolve={c.owner === "tailor" ? () => onSolve(c.id) : undefined}
      onFix={c.owner === "auto" ? onFix : undefined}
      busy={busy}
    />
  )

  // Cada sección, SUS términos. Sin este filtro «duras» y «blandas» pintaban la
  // misma tabla completa dos veces — el cruce que este rediseño vino a terminar,
  // reaparecido adentro. Lo cazó el pase de QA antes de que llegara a pantalla.
  const termsOf = (section: ReportSectionId) => report.terms.filter((x) => x.section === section)

  return (
    <aside
      className="ats-panel flex h-full w-full flex-col gap-3 overflow-y-auto p-4"
      style={{ background: "var(--a-bg)", color: "var(--a-ink)" }}
    >
      <ScoreDial
        score={report.score}
        criticalCount={crits.length}
        criticalSolvable={crits.filter((c) => !!c.action && c.action.kind !== "manual").length}
        recoverable={recoverable}
      />

      {/* La respuesta que el panel nunca daba: podés mandarlo. Un panel que sólo
          sabe enumerar reproches es uno que no termina nunca. */}
      {ready && (
        <div
          className="rounded-xl px-3.5 py-3 text-[12px] font-semibold leading-snug"
          style={{ background: "var(--a-ok-soft)", color: "var(--a-ok-ink)" }}
        >
          {t("ready_title")}
        </div>
      )}

      {/* LA SEGUNDA PREGUNTA, la que decide la entrevista.
          El puntaje contesta «¿pasa el filtro?». Esta contesta «¿le cree quien lo
          lee?» — y no trae hallazgos propios: casi todo lo que penaliza ya está
          abajo como chequeo con su botón. Acá va la conclusión, no la lista. */}
      {/* LA NOTA DE CREDIBILIDAD SE FUE DEL RIEL.
          Era un segundo puntaje al lado del principal —un «95» con la etiqueta
          «lo que concluye quien lo lee»— sin un solo botón. Dos números que
          cuentan cosas distintas, uno al lado del otro, se leen como una
          contradicción aunque los dos sean ciertos: el defecto que este panel ya
          pagó tres veces.

          El cálculo NO se borra: los hallazgos de credibilidad que tienen algo
          que arreglar siguen entrando al informe como chequeos, con su sección y
          su salida. Lo que se va es el número suelto. */}

      {/* Pasado el umbral el riesgo cambia de dueño: deja de ser el filtro y pasa
          a ser la persona que lee al final. */}
      {report.overOptimised && (
        <div
          className="flex gap-2 rounded-xl px-3.5 py-3 text-[11.5px] leading-snug"
          style={{ background: "var(--a-warn-soft)", color: "var(--a-ink-2)" }}
        >
          <AlertTriangle className="h-4 w-4 shrink-0" style={{ color: "var(--a-warn)" }} />
          <span>{t("over_optimised")}</span>
        </div>
      )}

      {/* Tres números, y ninguno repite al de arriba: cuántas duras cubiertas,
          cuántos chequeos abiertos, cuántos términos sin decir. El dial dice la
          nota; esto dice de qué está hecha. */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { n: `${report.terms.filter((x) => x.section === "hard" && x.cv > 0).length}/${report.terms.filter((x) => x.section === "hard").length}`,
            k: "tally_hard", tone: "var(--a-ok)" },
          { n: String(open.length), k: "tally_open", tone: "var(--a-warn)" },
          { n: String(report.terms.filter((x) => x.cv === 0).length), k: "tally_missing", tone: "var(--a-bad)" },
        ].map((x) => (
          <div key={x.k} className="rounded-xl px-2.5 py-2 text-center" style={{ background: "var(--a-surface)", border: "1px solid var(--a-border)" }}>
            <span className="block text-[16px] font-bold leading-none tabular-nums" style={{ color: x.tone }}>{x.n}</span>
            <span className="mt-1 block text-[9px] leading-tight" style={{ color: "var(--a-muted-2)" }}>{t(x.k)}</span>
          </div>
        ))}
      </div>

      {/* Un solo botón grande, y dice cuánto mueve. */}
      {solvable > 0 && (
        <button
          type="button"
          onClick={() => onSolve()}
          disabled={busy}
          className="flex items-center gap-2 rounded-xl px-3.5 py-3 text-left text-[12.5px] font-bold transition-opacity disabled:opacity-60"
          style={{ background: "var(--a-ai)", color: "#fff", boxShadow: "var(--a-sh-md)" }}
        >
          <Sparkles className="h-4 w-4 shrink-0" />
          <span className="flex-1">{t("solve_n", { count: solvable })}</span>
        </button>
      )}

      {/* El conteo de abiertos ya está en las tres fichas de arriba. Repetirlo acá
          lo ponía al lado del botón, que cuenta OTRA cosa —lo que el ejecutor
          puede cerrar— y las dos cifras se leían como una contradicción: «7 sin
          resolver» junto a «resolver 1 pendiente». Cada número, un solo lugar. */}
      <div className="pt-1">
        <span className="text-[9.5px] font-bold uppercase tracking-[0.12em]" style={{ color: "var(--a-muted-2)" }}>
          {t("report_sections")}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {report.sections.map((section) => (
          <ReportSectionCard
            key={section.id}
            section={section}
            // Las que puntúan, abiertas: son las que mueven el número.
            defaultOpen={section.scoreCategory !== null && section.checks.length > 0}
            renderCheck={renderCheck}
          >
            {termsOf(section.id).length > 0 && (
              <TermTable
                terms={termsOf(section.id)}
                onAdd={onAddTerm}
                onWeave={onWeaveTerm}
                addedTerms={addedTerms}
                busyTerm={busyTerm}
              />
            )}
            {/* Afirmado contra probado: vive en «duras» porque es sobre esas
                habilidades que un reclutador pregunta en la entrevista. */}
            {/* LA BARRA «AFIRMADO CONTRA PROBADO» SE FUE. Cero botones, cero
                acciones: un porcentaje y una barra que el usuario no podía usar
                para nada. Lo que ese número resumía —qué términos están sólo en
                la lista— ya vive en la tabla de acá abajo, agrupado y CON el
                botón que los resuelve. */}
            {/* La calidad de las viñetas es lo que mira la persona, no el filtro:
                por eso vive en la sección que declara no mover el número. */}
            {section.id === "tips" && <BulletQualityPanel report={report} onSolve={(id) => onSolve(id)} />}
          </ReportSectionCard>
        ))}
      </div>

      {/* Lo que el número NO promete. Decirlo es lo que separa una herramienta de
          una promesa: un ATS real no puntúa un CV, filtra y ordena por búsquedas. */}
      <p className="mt-1 text-[10.5px] leading-relaxed" style={{ color: "var(--a-muted-2)" }}>
        {t("rail_disclaimer")}
      </p>
    </aside>
  )
}

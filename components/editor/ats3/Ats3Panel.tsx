"use client"

// components/editor/ats3/Ats3Panel.tsx
//
// LA PANTALLA DEL MOTOR v3.
//
// ── LAS DOS REGLAS QUE ORDENAN ESTE ARCHIVO ─────────────────────────────────
// 1. Un número, un lugar. Dos cifras que cuentan cosas distintas, una al lado de
//    la otra, se leen como una mentira aunque las dos sean ciertas. Acá el dial,
//    el encabezado y cada tarjeta salen todos del MISMO objeto `score`.
// 2. Ningún hallazgo sin puerta. Una tarjeta que señala algo y no ofrece cómo
//    resolverlo es un reproche, y un reproche no es un producto.
//
// Todo lo que decide vive en `lib/ats3/`. Acá no se calcula un puntaje, ni una
// ganancia, ni si una reescritura es buena.

import { useMemo, useState } from "react"
import { useTranslations } from "next-intl"
import { Lightbulb, Loader2, Target } from "lucide-react"
import { useResumeStore } from "@/stores/resumeStore"
import { useAts3 } from "./useAts3"
import type { Placeholder, AnchoredSuggestion, TriageDecision } from "@/lib/ats3/contracts"
import type { ResumeSections } from "@/types/resume"
// LA PANTALLA DE SIEMPRE. El motor cambió debajo; el informe que el usuario
// aprendió a leer —dial, secciones, filas de chequeo, tabla de términos— no.
import { ScoreDial, ReportSectionCard, CheckRow, TermTable, PRESSABLE } from "./report-ui"
import { sectionsOf, termsOfSpec, headlineOf } from "./view-model"


/** El texto del CV donde un término puede estar demostrado. */
function cvText(data: ResumeSections): string {
  return [
    data.summary ?? "",
    ...(data.workExperience ?? []).map((r) => `${r.jobTitle ?? ""} ${r.employer ?? ""} ${r.description ?? ""}`),
    ...(data.skills ?? []).map((s) => s.name ?? ""),
  ].join(" \n ")
}



export default function Ats3Panel() {
  const t = useTranslations("editor.ats3")
  /** La copia de la pantalla de entrada, que el producto ya tenía escrita. */
  const tv = useTranslations("editor.ats")
  // El CV y su idioma salen del store, no de props: quien monta el panel no
  // tiene por qué saber de qué depende el motor, y un dato que viaja por dos
  // caminos termina discrepando en uno.
  const resumeId = useResumeStore((s: { resumeId: string | null }) => s.resumeId)
  const language = useResumeStore((s: { config?: { language?: string } }) => s.config?.language)
  // El CV, para CONTAR los términos de la tabla. Se cuenta sobre el documento
  // vivo, no sobre una estimación: "lo pide 4 veces, tu CV lo dice 0" es una
  // afirmación que el usuario puede comprobar leyendo.
  const sectionData = useResumeStore((s: { sectionData: ResumeSections }) => s.sectionData)
  const a = useAts3(resumeId ?? "", language === "en" ? "en" : "es")

  /** Los hallazgos, dichos en la forma que la pantalla ya sabía pintar. */
  const todos = useMemo(() => [...a.regressed, ...a.findings], [a.findings, a.regressed])
  const secciones = useMemo(() => sectionsOf(a.score, todos), [a.score, todos])
  const regresados = useMemo(() => new Set(a.regressed.map((f) => f.id)), [a.regressed])
  /** Las cuatro cifras de la cabecera salen juntas: no pueden discrepar. */
  const cabecera = useMemo(() => headlineOf(a.score, secciones), [a.score, secciones])
  const términos = useMemo(
    () => termsOfSpec(a.spec, a.covered, a.jd, cvText(sectionData), a.audit?.softCoverage ?? []),
    [a.spec, a.covered, a.jd, sectionData, a.audit],
  )

  /**
   * "Ya está bien" NO es un fallo: el modelo leyó la línea y dice que no hay
   * nada que mejorar. Pintarlo como rechazo enseña a desconfiar de una
   * respuesta honesta.
   */
  const rechazo = a.rejected ? (
    <p
      className={`rounded-lg px-3 py-2 text-xs ${
        a.rejected.reason === "already_good" ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"
      }`}
    >
      {a.rejected.reason === "already_good"
        ? t("already_good")
        : `${t("rewrite_rejected")}${a.rejected.detail ? ` · ${a.rejected.detail}` : ""}`}
    </p>
  ) : null

  return (
    <div className="ats-panel flex flex-col gap-5">
      <JobBox
        value={a.jd}
        onChange={a.setJd}
        onRun={a.analyze}
        loading={a.loading}
        title={tv("title")}
        proBadge={tv("pro_badge")}
        description={tv("description")}
        placeholder={tv("placeholder")}
        hint={tv("hint")}
        cta={a.loading ? t("analyzing") : tv("analyze")}
      />

      {a.error && (
        <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {t("failed")} · {a.error}
        </p>
      )}

      {a.score && (
        <>
          {/* EL DIAL, con lo que se puede recuperar y qué es lo crítico —no
              sólo cuántos hay: un número sin su objeto es una alarma que el
              usuario aprende a ignorar. */}
          <ScoreDial
            score={cabecera.score}
            criticalCount={cabecera.criticalCount}
            criticalSolvable={cabecera.criticalSolvable}
            criticalDetail={cabecera.detail}
            recoverable={cabecera.recoverable}
          />

          {a.calls === 0 && (
            // Servir del caché no es un detalle técnico: es la promesa de que
            // volver a analizar no cuesta nada y no devuelve otra cosa.
            <p className="text-xs" style={{ color: "var(--a-muted)" }}>{t("served_from_cache")}</p>
          )}

          {a.suppressed > 0 && (
            // Lo resuelto se cuenta, no desaparece: es lo que impide que
            // arreglar algo se sienta como que el panel siempre pide más.
            <p className="text-xs" style={{ color: "var(--a-muted)" }}>{t("already_solved", { n: a.suppressed })}</p>
          )}

          {secciones.map((sección) => (
            <ReportSectionCard
              key={sección.id}
              section={sección}
              defaultOpen={sección.scored && sección.checks.length > 0}
              renderCheck={(check) => (
                <div key={check.id} className="flex flex-col gap-1">
                  {/* VOLVIÓ A APARECER. Un hallazgo que reaparece sobre una línea
                      que el usuario ya tocó no es lo mismo que uno nuevo, y
                      callarlo es lo que hace sentir el panel un bucle. */}
                  {regresados.has(check.id) && (
                    <span
                      className="self-start rounded-full px-2 py-0.5 text-[10px] font-bold"
                      style={{ background: "var(--a-warn-soft)", color: "var(--a-warn-ink)" }}
                    >
                      {t("badge_regressed")}
                    </span>
                  )}
                  <CheckRow
                    check={check}
                    // El botón pide la reescritura de ESA línea. Un requisito que
                    // la vacante exige no lo tiene: `owner: "user"`, y ninguna
                    // reescritura de una línea que no habla de eso lo cierra.
                    onSolve={(id) => {
                      const f = todos.find((x) => x.id === id)
                      if (f) a.requestRewrite(f.nodeId)
                    }}
                    /**
                     * El arreglo determinista: agregar el término a Habilidades.
                     * No llama al modelo y no gasta cuota, así que no comparte
                     * el botón con la reescritura — la fila los distingue.
                     */
                    onFix={(id) => {
                      const f = todos.find((x) => x.id === id)
                      if (f) a.addSkill(f.nodeId, f.detail)
                    }}
                    busy={a.busyNode !== null}
                  />
                  {/* «No me interesa» es del motor v3: cierra el hallazgo sin
                      escribir nada y sin gastar una consulta. Sin él, lo único
                      que saca una tarjeta de la pantalla es pagar por ella. */}
                  {check.owner === "tailor" && (
                    <button
                      type="button"
                      onClick={() => {
                        const f = todos.find((x) => x.id === check.id)
                        if (f) a.dismiss(f.nodeId)
                      }}
                      className={`${PRESSABLE} self-end rounded-md px-2 py-1 text-[11px] font-medium`}
                      style={{ color: "var(--a-muted-2)" }}
                    >
                      {t("dismiss")}
                    </button>
                  )}
                </div>
              )}
            >
              {/* La tabla de términos vive bajo la sección que la produce, con
                  las cuentas MEDIDAS sobre el aviso y el CV. */}
              {términos.some((x) => x.section === sección.id) && (
                <TermTable terms={términos.filter((x) => x.section === sección.id)} />
              )}
            </ReportSectionCard>
          ))}

          {rechazo}

          <TriageBoard
            decisions={a.triage}
            onDrop={a.dropBullet}
            onUndo={a.undoDrop}
            onRewrite={a.requestRewrite}
            busyNode={a.busyNode}
            t={t}
          />
        </>
      )}

      {a.pending && (
        <SuggestionSheet
          suggestion={a.pending}
          onCancel={() => a.setPending(null)}
          onAccept={(text) => a.accept(a.pending!, text)}
          t={t}
        />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * LA PANTALLA DE ENTRADA DEL ATS — el diseño que el producto ya tenía.
 *
 * Recuperado TAL CUAL del panel que se borró: mismo chip con degradado cyan,
 * mismo título, misma insignia del plan, misma caja con borde cyan claro y
 * fondo translúcido, mismo botón redondeado con su sombra cyan. Lo único que
 * cambia es de dónde vienen los datos: el motor v3 en vez del viejo.
 *
 * No se reinterpreta nada. La copia sale de las mismas claves i18n que ya
 * existían, así que lo que se lee es exactamente lo que se leía.
 */
function JobBox(props: {
  value: string
  onChange: (v: string) => void
  onRun: () => void
  loading: boolean
  title: string
  proBadge: string
  description: string
  placeholder: string
  hint: string
  cta: string
}) {
  const short = props.value.trim().length < 20
  return (
    <div className="flex flex-col gap-3 pb-1">
      <div className="mb-1 flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-dash-cyan to-[#0077B6] shadow-lg shadow-dash-cyan/30">
          <Target className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1">
          <span className="text-sm font-bold text-slate-800">{props.title}</span>
        </div>
        <span className="rounded-full bg-gradient-to-r from-dash-cyan to-[#00A8CC] px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-white shadow-sm">
          {props.proBadge}
        </span>
      </div>

      <p className="mb-3 text-[11px] leading-relaxed text-slate-500">{props.description}</p>

      <div className="relative">
        {/* La etiqueta no se dibuja pero existe: un placeholder desaparece al
            escribir y dejaría el único campo de la pantalla sin nombre. */}
        <label htmlFor="ats3-jd" className="sr-only">
          {props.title}
        </label>
        <textarea
          id="ats3-jd"
          value={props.value}
          onChange={(e) => props.onChange(e.target.value)}
          placeholder={props.placeholder}
          className="min-h-[110px] w-full resize-none rounded-2xl border border-cyan-100 bg-white/80 px-4 py-3 text-xs text-slate-700 shadow-sm backdrop-blur-sm transition-all placeholder:text-slate-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-cyan-300"
        />
      </div>

      {props.value.trim().length > 0 && (
        <p className="flex items-start gap-1.5 text-[10px] leading-relaxed text-slate-400">
          <Lightbulb className="mt-0.5 h-3 w-3 shrink-0 text-amber-400" />
          {props.hint}
        </p>
      )}

      <button
        type="button"
        onClick={props.onRun}
        disabled={props.loading || short}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-dash-cyan to-[#00A8CC] py-2.5 text-xs font-bold text-white shadow-lg shadow-dash-cyan/30 transition-all duration-200 hover:scale-[1.01] hover:shadow-dash-cyan/50 active:scale-[0.99] disabled:cursor-not-allowed disabled:scale-100 disabled:opacity-50"
        // La etiqueta cambia sola mientras espera: sin esto, para un lector de
        // pantalla el botón se queda mudo quince segundos.
        aria-live="polite"
      >
        {props.loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Target className="h-3.5 w-3.5" />}
        {props.cta}
      </button>
    </div>
  )
}

const VERDICT_STYLE: Record<string, string> = {
  KEEP: "bg-emerald-500/10 text-emerald-500",
  REWRITE: "bg-[var(--primary)]/10 text-[var(--primary)]",
  REPLACE: "bg-violet-500/10 text-violet-500",
  DEMOTE: "bg-amber-500/10 text-amber-500",
  DROP: "bg-red-500/10 text-red-500",
}

function TriageBoard({
  decisions,
  onDrop,
  onUndo,
  onRewrite,
  busyNode,
  t,
}: {
  decisions: TriageDecision[]
  onDrop: (nodeId: string) => { roleIndex: number; bulletIndex: number; text: string } | null
  onUndo: (roleIndex: number, bulletIndex: number, text: string) => void
  onRewrite: (nodeId: string) => void
  busyNode: string | null
  t: (k: string, v?: Record<string, string | number>) => string
}) {
  /** Lo último que se sacó, para poder devolverlo. Un borrado sin vuelta atrás no se ofrece. */
  const [ultimo, setUltimo] = useState<{ roleIndex: number; bulletIndex: number; text: string } | null>(null)
  /** DROP borra contenido: se muestra la línea exacta antes de tocarla. */
  const [confirmando, setConfirmando] = useState<TriageDecision | null>(null)

  // Con la lista vacía el tablero se va, PERO no si hay algo que deshacer: al
  // sacar la última línea, el aviso de "deshacer" desaparecía junto con ella —
  // justo en el momento en que el usuario lo necesita.
  if (decisions.length === 0 && !ultimo) return null
  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm">
      {decisions.length > 0 && (
        <>
          <h3 className="mb-1 text-sm font-semibold">{t("triage_title")}</h3>
          <p className="mb-1 text-xs text-[var(--muted-foreground)]">{t("triage_caption")}</p>
          {/* DOS COSAS CIERTAS QUE JUNTAS SE LEEN COMO UNA MENTIRA si no se
              explican: el panel pide sacar una línea y el número no se mueve.
              Es correcto —cortar lo irrelevante no te hace más apto— pero desde
              afuera parece trabajo que no cuenta. Se dice. */}
          <p className="mb-3 text-[11px] text-[var(--muted-foreground)]">{t("triage_space_note")}</p>
        </>
      )}

      {ultimo && (
        <div className="mb-3 flex items-center gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-xs">
          <span className="flex-1 text-amber-600">{t("dropped")}</span>
          <button
            type="button"
            onClick={() => {
              onUndo(ultimo.roleIndex, ultimo.bulletIndex, ultimo.text)
              setUltimo(null)
            }}
            className={`rounded-md border border-[var(--border)] bg-[var(--card)] px-2 py-1 font-semibold ${PRESSABLE}`}
          >
            {t("undo")}
          </button>
        </div>
      )}

      <ul className="flex flex-col gap-2">
        {decisions.map((d) => (
          <li key={d.bulletId} className="flex items-start gap-2 text-xs">
            <span className={`rounded-md px-2 py-0.5 font-semibold ${VERDICT_STYLE[d.verdict] ?? ""}`}>
              {t(`verdict_${d.verdict}`)}
            </span>
            <span className="flex-1">
              <span className="block text-[var(--muted-foreground)]">{d.reason}</span>

              {/* En REPLACE el motor NUNCA afirma que la persona hizo algo:
                  pregunta, y la respuesta es del usuario. */}
              {d.needsUserConfirm && (
                <span className="mt-1 block">
                  <em className="block not-italic text-[var(--foreground)]">{d.needsUserConfirm}</em>
                  <button
                    type="button"
                    disabled={busyNode !== null}
                    onClick={() => onRewrite(d.bulletId)}
                    className={`mt-1 rounded-md bg-[var(--primary)] px-2 py-1 font-semibold text-[var(--primary-foreground)] ${PRESSABLE}`}
                  >
                    {t("yes_i_did")}
                  </button>
                </span>
              )}

              {/* Un veredicto sin botón es un reproche. DEMOTE entra por la misma
                  puerta que REWRITE: comprimir una línea ES reescribirla más corta,
                  y abrir una acción propia sería un segundo camino para lo mismo. */}
              {(d.verdict === "REWRITE" || d.verdict === "DEMOTE") && !d.needsUserConfirm && (
                <button
                  type="button"
                  disabled={busyNode !== null}
                  onClick={() => onRewrite(d.bulletId)}
                  className={`mt-1 rounded-md bg-[var(--primary)] px-2 py-1 font-semibold text-[var(--primary-foreground)] ${PRESSABLE}`}
                >
                  {busyNode === d.bulletId ? t("writing") : t("fix_it")}
                </button>
              )}

              {d.verdict === "DROP" &&
                (confirmando?.bulletId === d.bulletId ? (
                  <span className="mt-1 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const quitada = onDrop(d.bulletId)
                        if (quitada) setUltimo(quitada)
                        setConfirmando(null)
                      }}
                      className={`rounded-md bg-red-500 px-2 py-1 font-semibold text-white ${PRESSABLE}`}
                    >
                      {t("confirm_drop")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmando(null)}
                      className={`rounded-md border border-[var(--border)] px-2 py-1 ${PRESSABLE}`}
                    >
                      {t("cancel")}
                    </button>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmando(d)}
                    className={`mt-1 rounded-md border border-[var(--border)] px-2 py-1 font-medium ${PRESSABLE}`}
                  >
                    {t("drop_it")}
                  </button>
                ))}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}

/**
 * La hoja de confirmación: acá el candidato pone las cifras.
 *
 * El botón está APAGADO mientras quede un hueco obligatorio sin completar — y no
 * por un `if` del que llama, sino por el estado de esta pantalla. Y lo que se
 * escribe es lo que quedó en la caja, nunca la propuesta cruda: aplicar el texto
 * del modelo después de que el usuario lo editó es escribir algo que nadie
 * aceptó.
 */
function SuggestionSheet({
  suggestion,
  onCancel,
  onAccept,
  t,
}: {
  suggestion: AnchoredSuggestion
  onCancel: () => void
  onAccept: (finalText: string) => void
  t: (k: string, v?: Record<string, string | number>) => string
}) {
  const [values, setValues] = useState<Record<string, string>>({})
  const [useVariant, setUseVariant] = useState(false)

  const requiredMissing = suggestion.placeholders.some(
    (p) => p.required && !(values[p.token] ?? "").trim(),
  )

  const finalText = useMemo(() => {
    if (useVariant && suggestion.variantWithoutMetric) return suggestion.variantWithoutMetric
    let out = suggestion.text
    for (const p of suggestion.placeholders) {
      const v = (values[p.token] ?? "").trim()
      if (v) out = out.split(p.token).join(v)
    }
    return out
  }, [suggestion, useVariant, values])

  const blocked = !useVariant && requiredMissing

  return (
    <div className="rounded-2xl border-2 border-[var(--primary)]/40 bg-[var(--card)] p-4 shadow-lg">
      <h3 className="mb-3 text-sm font-semibold">{t("confirm_title")}</h3>

      <div className="mb-3 rounded-xl bg-[var(--background)] p-3">
        <p className="mb-1 text-[11px] uppercase tracking-wide text-[var(--muted-foreground)]">{t("before")}</p>
        <p className="mb-3 text-sm text-[var(--muted-foreground)] line-through decoration-1">{suggestion.originalText}</p>
        <p className="mb-1 text-[11px] uppercase tracking-wide text-[var(--muted-foreground)]">{t("after")}</p>
        <p className="text-sm leading-relaxed">{finalText}</p>
      </div>

      {!useVariant &&
        suggestion.placeholders.map((p: Placeholder) => (
          <div key={p.token} className="mb-3">
            <label className="mb-1 block text-xs font-medium" htmlFor={`slot-${p.token}`}>
              {p.label} {p.required && <span className="text-red-500">*</span>}
            </label>
            <input
              id={`slot-${p.token}`}
              value={values[p.token] ?? ""}
              onChange={(e) => setValues((v) => ({ ...v, [p.token]: e.target.value }))}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
              placeholder={p.token}
            />
            <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">{p.hint}</p>
            <p className="text-[11px] text-[var(--muted-foreground)]">{t("evidence")}: {p.evidenceNeeded}</p>
          </div>
        ))}

      {suggestion.variantWithoutMetric && suggestion.placeholders.length > 0 && (
        <label className="mb-3 flex items-center gap-2 text-xs">
          <input type="checkbox" checked={useVariant} onChange={(e) => setUseVariant(e.target.checked)} />
          {/* Si no tiene el dato, la salida es una versión sin cifra — nunca un
              número que puso el modelo. */}
          {t("no_data")}
        </label>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          disabled={blocked}
          onClick={() => onAccept(finalText)}
          className={`flex-1 rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-[var(--primary-foreground)] ${PRESSABLE}`}
        >
          {blocked ? t("fill_required") : t("apply")}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className={`rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-medium ${PRESSABLE}`}
        >
          {t("cancel")}
        </button>
      </div>
    </div>
  )
}

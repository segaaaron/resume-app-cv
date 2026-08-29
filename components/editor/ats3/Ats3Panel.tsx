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
import { useResumeStore } from "@/stores/resumeStore"
import { useAts3 } from "./useAts3"
import type { Finding, Placeholder, AnchoredSuggestion, TriageDecision } from "@/lib/ats3/contracts"

/** <55 rojo · 55-79 ámbar · ≥80 verde. Un solo dueño del color. */
function band(total: number): { key: "low" | "mid" | "high"; ring: string; text: string } {
  if (total >= 80) return { key: "high", ring: "#10b981", text: "text-emerald-500" }
  if (total >= 55) return { key: "mid", ring: "#f59e0b", text: "text-amber-500" }
  return { key: "low", ring: "#ef4444", text: "text-red-500" }
}

/** Un lenguaje de pulsación, no quince decisiones sueltas. */
const PRESSABLE =
  "transition-[filter,transform] duration-150 hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:hover:brightness-100 disabled:active:scale-100"

export default function Ats3Panel() {
  const t = useTranslations("editor.ats3")
  // El CV y su idioma salen del store, no de props: quien monta el panel no
  // tiene por qué saber de qué depende el motor, y un dato que viaja por dos
  // caminos termina discrepando en uno.
  const resumeId = useResumeStore((s: { resumeId: string | null }) => s.resumeId)
  const language = useResumeStore((s: { config?: { language?: string } }) => s.config?.language)
  const a = useAts3(resumeId ?? "", language === "en" ? "en" : "es")

  return (
    <div className="flex flex-col gap-5">
      <JobBox
        value={a.jd}
        onChange={a.setJd}
        onRun={a.analyze}
        loading={a.loading}
        label={t("posting_label")}
        placeholder={t("posting_placeholder")}
        cta={a.loading ? t("analyzing") : t("analyze")}
      />

      {a.error && (
        <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {t("failed")} · {a.error}
        </p>
      )}

      {a.score && (
        <>
          <ScoreHeader total={a.score.total} pillars={a.score.pillars} labels={{
            parse: t("pillar_parse"), relevance: t("pillar_relevance"), impact: t("pillar_impact"),
            caption: t("score_caption"),
          }} />

          {a.calls === 0 && (
            // Servir del caché no es un detalle técnico: es la promesa de que
            // volver a analizar no cuesta nada y no devuelve otra cosa.
            <p className="text-xs text-[var(--muted-foreground)]">{t("served_from_cache")}</p>
          )}

          <FindingList
            findings={a.findings}
            regressed={a.regressed}
            suppressed={a.suppressed}
            busyNode={a.busyNode}
            rejected={a.rejected}
            onFix={a.requestRewrite}
            onDismiss={a.dismiss}
            t={t}
          />

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

function JobBox(props: {
  value: string
  onChange: (v: string) => void
  onRun: () => void
  loading: boolean
  label: string
  placeholder: string
  cta: string
}) {
  const short = props.value.trim().length < 20
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-gradient-to-b from-[var(--card)] to-[var(--background)] p-4 shadow-sm">
      <label htmlFor="ats3-jd" className="mb-2 block text-sm font-semibold">
        {props.label}
      </label>
      <textarea
        id="ats3-jd"
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        placeholder={props.placeholder}
        rows={5}
        className="w-full resize-y rounded-xl border border-[var(--border)] bg-[var(--background)] p-3 text-sm outline-none focus:border-[var(--primary)]"
      />
      <button
        type="button"
        onClick={props.onRun}
        disabled={props.loading || short}
        className={`mt-3 w-full rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-[var(--primary-foreground)] shadow ${PRESSABLE}`}
      >
        {props.cta}
      </button>
    </div>
  )
}

function ScoreHeader({
  total,
  pillars,
  labels,
}: {
  total: number
  pillars: Record<"parse" | "relevance" | "impact", { points: number; max: number; ratio: number }>
  labels: { parse: string; relevance: string; impact: string; caption: string }
}) {
  const b = band(total)
  const shown = Math.round(total)
  const r = 42
  const circumference = 2 * Math.PI * r
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
      <div className="flex items-center gap-5">
        <svg width="104" height="104" viewBox="0 0 104 104" role="img" aria-label={`${shown} / 100`}>
          <circle cx="52" cy="52" r={r} fill="none" stroke="var(--border)" strokeWidth="9" />
          <circle
            cx="52" cy="52" r={r} fill="none" stroke={b.ring} strokeWidth="9" strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - Math.min(1, Math.max(0, total / 100)))}
            transform="rotate(-90 52 52)"
            style={{ filter: `drop-shadow(0 0 6px ${b.ring}55)`, transition: "stroke-dashoffset .5s ease" }}
          />
          <text x="52" y="50" textAnchor="middle" className={`fill-current ${b.text}`} style={{ fontSize: 26, fontWeight: 700 }}>
            {shown}
          </text>
          <text x="52" y="68" textAnchor="middle" fill="var(--muted-foreground)" style={{ fontSize: 11 }}>
            / 100
          </text>
        </svg>
        <div className="flex-1">
          {/* "Preparación para ESTA vacante", nunca "tu score ATS": ningún ATS
              le pone una nota a un CV, y prometerlo es prometer lo que no hay. */}
          <p className="mb-3 text-sm text-[var(--muted-foreground)]">{labels.caption}</p>
          <div className="flex flex-col gap-2">
            {(["parse", "relevance", "impact"] as const).map((k) => (
              <div key={k} className="flex items-center gap-2 text-xs">
                <span className="w-28 shrink-0 text-[var(--muted-foreground)]">{labels[k]}</span>
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--border)]">
                  <span
                    className="block h-full rounded-full bg-[var(--primary)]"
                    style={{ width: `${Math.round(pillars[k].ratio * 100)}%` }}
                  />
                </span>
                <span className="w-16 shrink-0 text-right tabular-nums">
                  {pillars[k].points.toFixed(1)} / {pillars[k].max.toFixed(0)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function FindingList({
  findings,
  regressed,
  suppressed,
  busyNode,
  rejected,
  onFix,
  onDismiss,
  t,
}: {
  findings: Finding[]
  regressed: Finding[]
  suppressed: number
  busyNode: string | null
  rejected: { nodeId: string; reason: string; detail: string } | null
  onFix: (nodeId: string) => void
  onDismiss: (nodeId: string) => void
  t: (k: string, v?: Record<string, string | number>) => string
}) {
  const all = useMemo(() => [...regressed, ...findings], [findings, regressed])
  const regressedIds = useMemo(() => new Set(regressed.map((f) => f.id)), [regressed])

  if (all.length === 0) {
    return <p className="rounded-xl border border-[var(--border)] px-4 py-3 text-sm">{t("nothing_open")}</p>
  }

  return (
    <section className="flex flex-col gap-3">
      <header className="flex items-baseline justify-between">
        <h3 className="text-sm font-semibold">{t("findings_title", { n: all.length })}</h3>
        {suppressed > 0 && (
          // Decirlo es lo que impide que arreglar algo se sienta como que el
          // panel siempre pide más: lo resuelto se cuenta, no desaparece.
          <span className="text-xs text-[var(--muted-foreground)]">{t("already_solved", { n: suppressed })}</span>
        )}
      </header>

      {all.map((f) => (
        <article key={f.id} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm">
          <div className="mb-2 flex items-center gap-2">
            {regressedIds.has(f.id) && (
              <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-500">
                {t("badge_regressed")}
              </span>
            )}
            <span className="rounded-full bg-[var(--primary)]/10 px-2 py-0.5 text-[11px] font-semibold text-[var(--primary)]">
              +{f.gain.toFixed(1)} {t("points")}
            </span>
            {f.merged.map((m) => (
              <span key={m} className="text-[11px] text-[var(--muted-foreground)]">
                {t(`type_${m}`)}
              </span>
            ))}
          </div>

          <p className="mb-1 text-sm leading-relaxed">{f.nodeText || t("empty_line")}</p>
          <p className="mb-3 text-xs text-[var(--muted-foreground)]">{f.detail}</p>

          {rejected?.nodeId === f.nodeId && (
            /* "Ya está bien" NO es un fallo: el modelo leyó la línea y dice que
               no hay nada que mejorar. Pintarlo como rechazo enseña a desconfiar
               de una respuesta honesta. */
            <p
              className={`mb-2 rounded-lg px-3 py-2 text-xs ${
                rejected.reason === "already_good"
                  ? "bg-emerald-500/10 text-emerald-600"
                  : "bg-amber-500/10 text-amber-500"
              }`}
            >
              {rejected.reason === "already_good"
                ? t("already_good")
                : `${t("rewrite_rejected")}${rejected.detail ? ` · ${rejected.detail}` : ""}`}
            </p>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onFix(f.nodeId)}
              disabled={busyNode !== null}
              className={`rounded-lg bg-[var(--primary)] px-3 py-1.5 text-xs font-semibold text-[var(--primary-foreground)] ${PRESSABLE}`}
            >
              {busyNode === f.nodeId ? t("writing") : t("fix_it")}
            </button>
            <button
              type="button"
              onClick={() => onDismiss(f.nodeId)}
              className={`rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium ${PRESSABLE}`}
            >
              {t("dismiss")}
            </button>
          </div>
        </article>
      ))}
    </section>
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
  onDrop: (nodeId: string) => { roleIndex: number; text: string } | null
  onUndo: (roleIndex: number, text: string) => void
  onRewrite: (nodeId: string) => void
  busyNode: string | null
  t: (k: string, v?: Record<string, string | number>) => string
}) {
  /** Lo último que se sacó, para poder devolverlo. Un borrado sin vuelta atrás no se ofrece. */
  const [ultimo, setUltimo] = useState<{ roleIndex: number; text: string } | null>(null)
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
          <p className="mb-3 text-xs text-[var(--muted-foreground)]">{t("triage_caption")}</p>
        </>
      )}

      {ultimo && (
        <div className="mb-3 flex items-center gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-xs">
          <span className="flex-1 text-amber-600">{t("dropped")}</span>
          <button
            type="button"
            onClick={() => {
              onUndo(ultimo.roleIndex, ultimo.text)
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

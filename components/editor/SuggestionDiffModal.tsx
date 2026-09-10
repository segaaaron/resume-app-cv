"use client"

import type { ReactNode } from "react"
import { useTranslations } from "next-intl"
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"
import { ArrowDown, Plus, Minus } from "lucide-react"
import { Z_MODAL_FOLLOW_UP } from "@/lib/ui/z-layers"

export type SuggestionField =
  | "summary"
  | "personalDetails.jobTitle"
  | "skills"
  | "workExperience.description"
  | "workExperience.jobTitle"
  | "languages"
  | "certifications"


/**
 * EL DIFF POR LÍNEA, ACÁ ADENTRO Y NO EN UN MÓDULO PROPIO (CEO, 2026-09-09).
 *
 * Al recuperar esta ventana volvió con él como archivo aparte en
 * `lib/services/ai/shared/`, que es una pieza que el CEO no pidió: lo que se
 * recupera es LA PANTALLA. No lo usa nadie más que esta ventana, así que vive
 * donde se usa y el conteo de módulos no sube por una recuperación.
 *
 * QUÉ RESUELVE. La ventana mostraba el campo entero antes y el campo entero
 * después. En un resumen da igual; en un puesto de siete viñetas son dos muros
 * de texto casi idéntico con la línea cambiada en el medio, y el "después"
 * queda debajo del pliegue: se confirma sin haber visto qué cambia. Reportado
 * textual: «es muy difícil ver cuál es la mejora o qué viñeta estás cambiando».
 *
 * LCS clásico: las líneas que están en las dos, en orden, son contexto; el
 * resto son bajas y altas. Puro y sin dependencias.
 */
type DiffOp = "same" | "added" | "removed"
interface DiffLine {
  op: DiffOp
  text: string
}

/** Partir en líneas comparables, sin las vacías: no dicen nada acá. */
function toLines(value: string): string[] {
  return value.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
}

function diffLines(before: string, after: string): DiffLine[] {
  const a = toLines(before)
  const b = toLines(after)

  // Tabla LCS sobre igualdad de línea. Un campo del CV tiene decenas de líneas
  // como mucho, así que la tabla cuadrática es irrelevante en la práctica.
  const lcs: number[][] = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0))
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      lcs[i][j] = a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1])
    }
  }

  const out: DiffLine[] = []
  let i = 0
  let j = 0
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      out.push({ op: "same", text: a[i] })
      i++
      j++
    } else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
      out.push({ op: "removed", text: a[i] })
      i++
    } else {
      out.push({ op: "added", text: b[j] })
      j++
    }
  }
  while (i < a.length) out.push({ op: "removed", text: a[i++] })
  while (j < b.length) out.push({ op: "added", text: b[j++] })

  return out
}

export interface Suggestion {
  field: SuggestionField
  type: "replace" | "append"
  preview: string
  reason: string
  /* Acá vivían `needsFigureConfirm` y `targetId`: ninguno de los dos llamadores
     los pasa y nada los leía desde que el sistema de huecos `___` se fue. */
}

interface SuggestionDiffModalProps {
  open: boolean
  onClose: () => void
  /**
   * Confirmar devuelve el texto que se va a escribir.
   *
   * Antes no devolvía nada y el llamador aplicaba `suggestion.preview`. Con la
   * cifra editable eso escribiría el número del modelo en vez del que el
   * candidato escribió — el dato equivocado, en su CV.
   */
  onConfirm: (text?: string) => void
  suggestion: Suggestion | undefined
  currentValue: string
  /**
   * DÓNDE cae este cambio: el puesto y el número de línea.
   *
   * ── LO PEDIDO (CEO, 2026-08-27) ──────────────────────────────────────────
   *
   *   «Es más verídico si muestras al usuario qué estás aplicando y dónde.»
   *
   * El diálogo mostraba QUÉ cambia y nunca DÓNDE. Con cuarenta viñetas repartidas
   * en cinco puestos, un antes/después sin dirección obliga a confiar: el usuario
   * no puede verificar que se va a escribir en la línea que él cree. La ubicación
   * es opcional porque hay campos que no la necesitan —el resumen es uno solo—,
   * y ausente el diálogo se ve exactamente como se veía.
   */
  /**
   * DÓNDE CAE EL CAMBIO. El número de línea es OPCIONAL a propósito: una viñeta
   * NUEVA no reemplaza ninguna, así que numerarla es señalar una línea que el
   * cambio no toca. Se pasaba la del ancla del pedido y la ventana decía «línea
   * 3» sobre una línea que iba a quedar intacta.
   */
  where?: { jobTitle: string; line?: number }
  /**
   * The resulting text, computed by the caller with `previewSuggestion` — i.e.
   * by running the ACTUAL write and reading it back. Whenever the caller applies
   * through applySuggestion it must pass this, so the preview can never drift
   * from what gets written. Omitted only where the diff is already a single
   * line replacing a single line (an inline bullet rewrite), and the local
   * fallback below is exact by construction.
   */
  afterValue?: string
  /**
   * Other ways to say the same thing, when the model offered them.
   *
   * A single rewrite leaves the user a yes/no, and "no" used to mean asking the
   * model again — the loop this whole panel kept producing. Picking one here
   * swaps what the diff shows, so the decision ends inside this dialog instead of
   * turning into another call.
   */
  options?: Array<{ text: string; label: string; why: string; active: boolean; onPick: () => void }>
  /**
   * ── EL HUECO DE LA CIFRA LO PONE QUIEN LLAMA (2026-09-09) ──────────────────
   *
   * Este modal nació con el sistema de huecos del motor viejo: buscaba las
   * cifras que la reescritura había inventado y las tapaba con `___`. El motor
   * v3 usa el que el CEO fijó — el modelo devuelve `[x usuarios]` con su
   * etiqueta, su pista y su evidencia, y el candidato escribe el número.
   *
   * Son dos mecanismos para lo mismo y no se pueden mezclar. En vez de elegir
   * uno y romper el otro, el modal deja de decidirlo: recibe los campos ya
   * armados y si están completos. Lo que este archivo sigue siendo dueño de
   * mostrar —el diff por línea, DÓNDE cae y los dos botones— no cambió.
   */
  slotsUI?: ReactNode
  /** El texto final con los huecos ya completados por quien llama. */
  afterOverride?: string
  /** Falta completar algo: el botón de confirmar se apaga. */
  blocked?: boolean
}

const FIELD_KEYS: Record<SuggestionField, string> = {
  "summary": "field_summary",
  "personalDetails.jobTitle": "field_job_title",
  "skills": "field_skills",
  "workExperience.description": "field_work_description",
  "workExperience.jobTitle": "field_work_job_title",
  "languages": "field_languages",
  "certifications": "field_certifications",
}

export default function SuggestionDiffModal({
  open,
  onClose,
  onConfirm,
  suggestion,
  currentValue,
  where,
  afterValue: afterFromCaller,
  options,
  slotsUI,
  afterOverride,
  blocked,
}: SuggestionDiffModalProps) {
  const t = useTranslations("editor.cv_review")
  /**
   * Lo que el candidato escribió en el hueco de la cifra.
   *
   * ARRIBA DEL `return` CONDICIONAL a propósito: un hook detrás de un `return`
   * cambia el orden de hooks entre renders y React tira el árbol. Casi lo dejo
   * ahí abajo, junto a lo que lo usa.
   */
  /* Acá vivía el estado de lo tipeado en el hueco `___`. Su único escritor era
     el textarea de esa rama, que se fue con el sistema de huecos viejo: v3
     dibuja sus campos en `slotsUI` y el texto final llega por `afterOverride`. */

  /**
   * El «después», calculado ANTES del `return` condicional.
   *
   * No es orden estético: abajo hay un `useEffect` que depende de este valor, y
   * un hook detrás de un `return` cambia el orden de hooks entre renders. React
   * tira el árbol entero. Es el segundo hook que casi dejo del lado equivocado.
   *
   * Mirrors applySuggestion exactly: a bullet list appends on a NEW LINE
   * (serializeBullets), every other field appends with a space. A preview that
   * joins differently from the write is a lie shown right before the user
   * confirms it.
   */
  const appendSeparator = suggestion?.field === "workExperience.description" ? "\n" : " "
  const afterValue = afterFromCaller ?? (suggestion?.type === "append"
    ? [currentValue, suggestion.preview].filter(Boolean).join(appendSeparator)
    : suggestion?.preview ?? "")

  /**
   * ── ACÁ VIVÍA EL SISTEMA DE HUECOS `___` (QA, 2026-09-09) ──────────────────
   *
   * La ventana volvió del borrado con su forma vieja de pedir la cifra:
   * `withFigureSlots` marcaba el hueco y `slotsFilled` comprobaba que se
   * llenara. Eso vive en `lib/ats/`, el motor VIEJO, y la orden del CEO al
   * recuperar esta pantalla fue clara: se recupera la UI, no sus módulos.
   *
   * No se pierde nada: v3 lo hace mejor y ya estaba cableado. Los huecos son
   * TIPADOS —traen etiqueta, pista y si son obligatorios— y quien llama los
   * dibuja en `slotsUI` y decide con `blocked` si el botón se apaga. Ningún
   * llamador pasaba `needsFigureConfirm`: era una rama muerta que arrastraba
   * el motor viejo al camino nuevo.
   */
  /**
   * LO ESCRITO PERTENECE AL TEXTO SOBRE EL QUE SE ESCRIBIÓ.
   *
   * ── EL DEFECTO (pase de QA, 2026-08-25) ───────────────────────────────────
   *
   * La misma pantalla muestra la reescritura recomendada y sus alternativas, y
   * cambiar de ángulo NO desmonta el componente. Sin esto, alguien escribía el
   * número en la recomendada, elegía otra alternativa… y lo que se aplicaba
   * seguía siendo la PRIMERA con su número: elegía B y se le escribía A. Peor
   * todavía porque al elegir una alternativa la pregunta de la cifra se retira,
   * así que ni el hueco quedaba a la vista para notarlo.
   *
   * DERIVADO, NO UN EFECTO QUE RESETEA. La primera versión era un `useEffect`
   * que ponía el estado en nulo cuando cambiaba la propuesta, y eslint la
   * rechazó con razón: un `setState` dentro de un efecto dispara un render en
   * cascada. Guardar SOBRE QUÉ texto se escribió convierte la regla en una
   * comparación —si la propuesta ya no es aquélla, lo tipeado no le pertenece— y
   * desaparece el estado que había que limpiar.
   */
  const shownAfter = afterOverride ?? afterValue
  const bloqueado = blocked ?? false

  // Defensive guard: never render the diff modal without a concrete suggestion.
  // Normal flow already prevents this (panel only opens modal when suggestion
  // exists), but this keeps the component safe if invoked elsewhere. Va DESPUÉS
  // de los hooks: ninguno puede quedar detrás de un `return`.
  if (!suggestion) return null

  const diff = diffLines(currentValue, shownAfter)
  // One-liner fields keep the classic before/after; multi-line ones (bullet
  // lists) get the line diff, which is the only readable form at that size.
  const isMultiLine = diff.length > 2

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      {/* ENCIMA DE QUIEN LO ABRIÓ. Esta confirmación se lanza desde el modal del
          ejecutor (a pantalla completa), y sin la capa explícita caía detrás:
          el usuario agregaba una habilidad, la viñeta nueva se mostraba para que
          la confirmara, y la confirmación era invisible. */}
      <DialogContent layer={Z_MODAL_FOLLOW_UP} className="p-0 overflow-hidden rounded-2xl max-w-[560px] w-[calc(100vw-2rem)] sm:w-[95vw] border border-[#D9E1ED] shadow-[0_40px_100px_rgba(0,212,255,0.08)] gap-0">
        {/* Head */}
        <div className="relative px-4 sm:px-7 pt-5 sm:pt-[26px] pb-4 sm:pb-5 border-b border-[#E8EDF6] bg-gradient-to-b from-[#F5F7FB] to-white">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] h-px bg-gradient-to-r from-transparent via-[#00D4FF] to-transparent opacity-60" />
          <div className="flex items-start gap-3 mb-1">
            <div className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl text-[#00D4FF] bg-gradient-to-br from-[rgba(0,212,255,0.12)] to-[rgba(0,168,204,0.04)] border border-[rgba(0,212,255,0.25)] shrink-0 mt-0.5">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M2 4h12M2 8h8M2 12h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                <path d="M12 10l2 2-2 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14 12H9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="min-w-0">
              <div
                className="text-[14px] sm:text-[16px] font-bold text-[#1a2e4a] tracking-[-0.02em] leading-tight"
                style={{ fontFamily: "var(--dash-serif,'Playfair Display',Georgia,serif)" }}
              >
                {t("diff_title")} — {t(FIELD_KEYS[suggestion.field])}
              </div>
              {where && (
                <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10.5px] leading-none">
                  <span className="inline-flex items-center gap-1 rounded-md border border-[rgba(0,212,255,0.28)] bg-[rgba(0,212,255,0.07)] px-1.5 py-1 font-semibold text-[#1a2e4a]">
                    <svg width="9" height="9" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                      <rect x="1.5" y="3" width="9" height="7.5" rx="1.4" stroke="currentColor" strokeWidth="1.3" />
                      <path d="M4.2 3V2.1c0-.4.3-.7.7-.7h2.2c.4 0 .7.3.7.7V3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                    </svg>
                    <span className="max-w-[190px] truncate">{where.jobTitle}</span>
                  </span>
                  {typeof where.line === "number" && (
                    <span className="rounded-md bg-[#EEF2F8] px-1.5 py-1 font-semibold text-[#5A6B80] tabular-nums">
                      {t("diff_where_line", { n: where.line })}
                    </span>
                  )}
                </div>
              )}
              <div className="text-[11px] sm:text-[11.5px] text-[#6B7A8C] mt-[2px] leading-snug">{suggestion.reason}</div>
            </div>
          </div>
        </div>

        {/* Other angles on the same work, when the model offered them. Above the
            diff on purpose: choose the version first, then read what it changes.
            Every option cleared the same anti-invention guards as the main one. */}
        {options && options.length > 0 && (
          <div className="border-b border-slate-100 bg-slate-50/60 px-4 sm:px-7 py-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{t("options_title")}</p>
            <div className="mt-2 flex flex-col gap-1.5">
              {options.map((o) => (
                <button
                  key={o.text}
                  type="button"
                  onClick={o.onPick}
                  aria-pressed={o.active}
                  className={`rounded-xl border px-3 py-2 text-left transition-all ${
                    o.active
                      ? "border-[#00D4FF] bg-cyan-50/70 ring-1 ring-[#00D4FF]"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <span className="text-[9.5px] font-black uppercase tracking-wider text-[#0077B6]">{o.label}</span>
                  <span className="mt-0.5 block text-[11.5px] leading-snug text-slate-700">{o.text}</span>
                  {o.why && <span className="mt-0.5 block text-[10px] leading-snug text-slate-400">{o.why}</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Diff content — only what changes, not the whole field again.
            A work-experience description is seven bullets long; printing it
            twice buried the one line that moved below the fold and the user
            confirmed blind. Untouched lines are dimmed context. */}
        <div className="px-4 sm:px-7 py-4 sm:py-5 bg-white overflow-y-auto max-h-[55vh] sm:max-h-[60vh]">
          {isMultiLine ? (
            <>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8] mb-2">
                {t("diff_changes")}
              </p>
              <ul className="flex flex-col gap-1.5">
                {diff.map((line, i) => {
                  if (line.op === "same") {
                    return (
                      <li key={`s-${i}`} className="flex items-start gap-2 rounded-lg px-2.5 py-1.5 text-[11.5px] leading-relaxed text-[#94A3B8]">
                        <span className="w-3 shrink-0 text-center">·</span>
                        <span className="flex-1 min-w-0 line-clamp-1">{line.text}</span>
                      </li>
                    )
                  }
                  const added = line.op === "added"
                  return (
                    <li
                      key={`${line.op}-${i}`}
                      className={`flex items-start gap-2 rounded-lg border px-2.5 py-2 text-[12px] leading-relaxed ${
                        added
                          ? "border-emerald-200 bg-emerald-50/70 text-[#1a2e4a]"
                          : "border-rose-200 bg-rose-50/60 text-[#7f1d1d] line-through decoration-rose-300"
                      }`}
                    >
                      <span className={`shrink-0 mt-0.5 ${added ? "text-emerald-600" : "text-rose-500"}`}>
                        {added ? <Plus className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                      </span>
                      <span className="flex-1 min-w-0 whitespace-pre-wrap break-words font-medium">{line.text}</span>
                    </li>
                  )
                })}
              </ul>
            </>
          ) : (
            <div className="space-y-3">
              {/* Single-line fields (a job title, a summary) read better as
                  before → after than as a line diff. */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8] mb-1.5">{t("diff_before")}</p>
                <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 sm:px-3.5 py-3 text-[12px] sm:text-[12.5px] text-[#6B7A8C] leading-relaxed min-h-[48px] whitespace-pre-wrap break-words">
                  {currentValue || <span className="italic opacity-60">{t("diff_empty")}</span>}
                </div>
              </div>

              <div className="flex justify-center">
                <div className="flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-50 border border-emerald-200">
                  <ArrowDown className="h-3.5 w-3.5 text-emerald-600" />
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 mb-1.5">{t("diff_after")}</p>
                <div className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50/80 to-teal-50/40 px-3 sm:px-3.5 py-3 text-[12px] sm:text-[12.5px] text-[#1a2e4a] leading-relaxed min-h-[48px] whitespace-pre-wrap break-words">
                  {shownAfter}
                </div>
              </div>
            </div>
          )}

          {/* Los huecos tipados, armados por quien llama. Ver `slotsUI`. */}
          {slotsUI}
        </div>

        {/* Actions */}
        <div className="flex gap-2 sm:gap-[10px] px-4 sm:px-6 pt-3 pb-5 sm:pb-[22px] border-t border-[#E8EDF6] bg-white">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 flex justify-center items-center px-3 sm:px-4 py-3 sm:py-[11px] text-[13px] font-medium rounded-xl border border-[#E2E8F0] bg-white text-[#6B7A8C] cursor-pointer transition-all duration-150 hover:border-[#CBD5E1] hover:text-[#1a2e4a] min-h-[44px]"
          >
            {t("diff_cancel")}
          </button>
          <button
            type="button"
            onClick={() => onConfirm(afterOverride ?? shownAfter)}
            disabled={bloqueado}
            className="flex-1 flex justify-center items-center px-3 sm:px-4 py-3 sm:py-[11px] text-[13px] font-semibold text-white rounded-xl border-none cursor-pointer bg-gradient-to-br from-emerald-500 to-teal-600 shadow-[0_2px_8px_rgba(16,185,129,0.3)] transition-all duration-150 hover:shadow-[0_4px_14px_rgba(16,185,129,0.4)] hover:-translate-y-px min-h-[44px] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
          >
            {t("diff_confirm")}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

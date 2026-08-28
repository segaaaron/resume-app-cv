"use client"

import { useState } from "react"
import { PRESSABLE } from "../ats-panel/panel-helpers"
import { useTranslations } from "next-intl"
import { AlertCircle, AlertTriangle, Check, ChevronDown, Sparkles, Trash2, Wrench } from "lucide-react"
import { isActionable, type ReportCheck } from "@/lib/ats/report"

/**
 * Un hallazgo, con su salida.
 *
 * TRES COSAS QUE ESTA FILA DICE SIEMPRE, y que el panel anterior callaba:
 *
 *   · CUÁNTO MUEVE. Un `0p` explícito es la respuesta al usuario que arregló diez
 *     cosas, vio la nota quieta y concluyó que el panel mentía. No mentía: callaba
 *     que esos arreglos los mira la persona, no el filtro.
 *   · QUÉ LO DISPARÓ. La evidencia nombrada — los puestos, las líneas. «Tus fechas
 *     mezclan formatos» mandaba al usuario a buscar el problema puesto por puesto.
 *   · QUIÉN LO RESUELVE. Botón cuando la aplicación puede hacerlo; y cuando sólo
 *     lo sabe él, se lo dice en vez de ofrecerle un botón que adivine.
 */

const STATE_ICON = {
  pass: Check,
  warn: AlertTriangle,
  crit: AlertCircle,
} as const

const STATE_COLOR = {
  pass: "var(--a-ok)",
  warn: "var(--a-warn)",
  crit: "var(--a-bad)",
} as const

const STATE_BG = {
  pass: "var(--a-ok-soft)",
  warn: "var(--a-warn-soft)",
  crit: "var(--a-bad-soft)",
} as const

/**
 * Las cuatro clases que produce `dateFormatClass`, dichas como las lee una
 * persona. Un mapa explícito y no una clave armada al vuelo: si el detector gana
 * una clase nueva, el panel la muestra cruda en vez de romper con una clave que
 * no existe — y la clase cruda sigue siendo legible.
 */
const DATE_FORMAT_KEY: Record<string, string> = {
  year: "date_format.year_only",
  "mm/yyyy": "date_format.mm_yyyy",
  "yyyy-mm": "date_format.yyyy_mm",
  "month yyyy": "date_format.month_yyyy",
}

interface Props {
  check: ReportCheck
  /** Abre el ejecutor sobre ESTE hallazgo. Ausente = el hallazgo no es de tailor. */
  onSolve?: (checkId: string) => void
  /**
   * Ejecuta el arreglo determinista: unificar fechas, agregar la habilidad,
   * reunir la línea partida. Sin modelo y sin cuota.
   *
   * Faltaba: `isActionable` decía que estos hallazgos tenían salida y la fila no
   * ofrecía ninguna, así que el usuario leía el problema y no podía hacer nada
   * con él — «un diagnóstico sin botón es una crítica sin puerta», que es la
   * regla que este panel existe para cumplir.
   */
  onFix?: (checkId: string) => void
  busy?: boolean
}

export default function CheckRow({ check, onSolve, onFix, busy }: Props) {
  const t = useTranslations("editor.ats")
  const [open, setOpen] = useState(false)
  /**
   * El nombre de la sección viene en inglés del detector de encabezados. Pasarlo
   * crudo dejaba «tu sección de contact» en un panel en español.
   */
  let params = check.params
  if (params?.section) params = { ...params, section: t(`section_name.${params.section}`) }
  /**
   * «mm/yyyy, year» es jerga del detector, y «year» ni siquiera estaba en
   * español. Viajan unidas por NUL —un separador que no puede aparecer dentro de
   * una clase— para que acá se digan como las lee una persona.
   */
  if (typeof params?.formats === "string") {
    params = {
      ...params,
      formats: params.formats
        .split("\u0000")
        .map((f) => (f in DATE_FORMAT_KEY ? t(DATE_FORMAT_KEY[f]) : f))
        .join(", "),
    }
  }
  const Icon = STATE_ICON[check.state]
  const color = STATE_COLOR[check.state]
  // `open` de arriba es si la fila está desplegada; esto es si el hallazgo sigue
  // sin resolver. Dos preguntas distintas que compartían nombre.
  const unresolved = check.state !== "pass"
  // Nada que aplicar sobre un informativo: existe para que él decida con el dato.
  const canSolve = !check.informational && check.owner === "tailor" && !!onSolve && unresolved
  const canFix = !check.informational && check.owner === "auto" && !!onFix && !!check.action && unresolved
  /** Cortar una línea de sobra: determinista como los demás `auto`, pero destructivo. */
  const isCut = check.id.startsWith("tips.cut")

  return (
    <div
      className="rounded-xl border transition-colors"
      style={{ borderColor: "var(--a-border)", background: check.state === "pass" ? "var(--a-surface-2)" : "var(--a-surface)" }}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className={`${PRESSABLE} flex w-full items-start gap-2.5 px-3 py-2.5 text-left`}
      >
        <span
          className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
          style={{ background: STATE_BG[check.state], color }}
        >
          <Icon className="h-3 w-3" />
        </span>

        {/* EL TÍTULO MANDA EL ANCHO.
            La insignia iba en la misma línea y con un hallazgo del reclutador
            —que es una frase entera— dejaba el texto a una palabra por renglón.
            Visto en el navegador; mismo defecto que la tabla de términos ya
            había tenido con su chip. */}
        <span className="min-w-0 flex-1">
          <span className="block text-[12.5px] font-semibold leading-snug" style={{ color: "var(--a-ink-2)" }}>
            {t(check.titleKey, params)}
          </span>
          {/* CUÁNTO MUEVE — y cuando no mueve nada, POR QUÉ igual importa.
              «CRÍTICO · no mueve el número» son dos frases ciertas que juntas se
              leen como una mentira: reportado con captura, con la nota en 100.
              Y no era un caso raro — seis de los siete hallazgos críticos del
              panel valen 0 puntos, porque lo que hacen es sacarte de la lista
              por otra vía: sin email nadie te llama, y el puntaje no lo mide.
              Decir eso convierte la contradicción en el dato que faltaba. */}
          <span
            className="mt-1 inline-block rounded-full px-1.5 py-0.5 text-[9.5px] font-bold tabular-nums"
            style={
              check.weight > 0
                ? { background: "var(--a-accent-soft)", color: "var(--a-accent-ink)" }
                : check.state === "crit"
                  ? { background: "var(--a-bad-soft)", color: "var(--a-bad-ink)" }
                  : { background: "var(--a-surface-3)", color: "var(--a-muted-2)" }
            }
          >
            {check.weight > 0
              ? t("check_points", { points: check.weight })
              : check.state === "crit"
                ? t("check_blocks_anyway")
                : t("check_no_score")}
          </span>
        </span>

        <ChevronDown
          className={`mt-0.5 h-3.5 w-3.5 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          style={{ color: "var(--a-muted-2)" }}
        />
      </button>

      {open && (
        <div className="px-3 pb-3 pt-0">
          {check.detailKey && (
            <p className="text-[11.5px] leading-relaxed" style={{ color: "var(--a-muted)" }}>
              {t(check.detailKey, params)}
            </p>
          )}

          {/* Nombrado. Un aviso que no dice dónde deja al usuario a buscarlo. */}
          {check.evidence && check.evidence.length > 0 && (
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {check.evidence.slice(0, 8).map((e, i) => (
                <li
                  key={`${check.id}-ev-${i}`}
                  /* ENVUELVE, NO CORTA. Con `truncate` la ficha era una línea sin
                     retorno: en el riel de ~320px «Marketing Digital / Community
                     Manager · 2023 – 2024» se cortaba en «· 202…» — y el año es
                     JUSTO el dato del que habla el hallazgo de fechas. El
                     `title` no alcanza: en un panel nadie descubre un tooltip, y
                     en táctil no existe. Ahora la ficha crece a dos renglones y
                     dice el nombre entero; las cortas siguen siendo pastillas. */
                  className="max-w-full rounded-md px-2 py-1 text-[10.5px] font-medium leading-snug [overflow-wrap:anywhere]"
                  style={{ background: "var(--a-surface-3)", color: "var(--a-ink-2)" }}
                  title={e}
                >
                  {e}
                </li>
              ))}
            </ul>
          )}

          {/* Sólo el candidato sabe el mes que falta o la cifra real. Decírselo es
              la salida; ofrecerle un botón que lo adivine, no. */}
          {/* Un informativo no promete que el chequeo se cierre: no se cierra. */}
          {check.owner === "user" && !check.informational && (
            <p
              className="mt-2 rounded-lg px-2.5 py-1.5 text-[11px] leading-snug"
              style={{ background: "var(--a-warn-soft)", color: "var(--a-ink-2)" }}
            >
              {t("check_only_you")}
            </p>
          )}
        </div>
      )}

      {canFix && (
        <button
          type="button"
          onClick={() => onFix?.(check.id)}
          disabled={busy}
          className={`${PRESSABLE} flex w-full items-center gap-1.5 border-t px-3 py-2 text-[11.5px] font-semibold`}
          style={{ borderColor: "var(--a-border)", color: "var(--a-accent-ink)", background: "var(--a-accent-soft)" }}
        >
          {/* EL BOTÓN DICE LO QUE HACE. «Arreglar» sobre una propuesta de corte
              prometía una reparación y abría un borrado: la misma pregunta mal
              hecha que ya se pagó en la tarjeta de fusión. */}
          {isCut ? <Trash2 className="h-3 w-3 shrink-0" /> : <Wrench className="h-3 w-3 shrink-0" />}
          {isCut ? t("fix_remove") : t("check_fix_now")}
        </button>
      )}

      {canSolve && (
        <button
          type="button"
          onClick={() => onSolve?.(check.id)}
          disabled={busy}
          className={`${PRESSABLE} flex w-full items-center gap-1.5 border-t px-3 py-2 text-[11.5px] font-semibold`}
          style={{ borderColor: "var(--a-border)", color: "var(--a-ai-ink)", background: "var(--a-ai-soft)" }}
        >
          <Sparkles className="h-3 w-3 shrink-0" />
          {t("solve_with_tailor")}
        </button>
      )}

      {/* Un diagnóstico sin salida es una crítica sin puerta. No debería existir,
          y si aparece hay que verlo en desarrollo antes que el usuario. */}
      {!isActionable(check) && check.state !== "pass" && (
        <p className="px-3 pb-2 text-[10px] italic" style={{ color: "var(--a-muted-2)" }}>
          {t("check_no_exit")}
        </p>
      )}
    </div>
  )
}

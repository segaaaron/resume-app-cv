"use client"

import { useEffect, useRef, useState } from "react"
import { useTranslations } from "next-intl"
import { READY_SCORE } from "@/lib/ats/report"

/**
 * El número, y lo que significa.
 *
 * DOS COSAS QUE ESTE COMPONENTE NO HACE, y son la razón de que exista:
 *
 * 1. NO INVENTA UN VEREDICTO. El panel anterior imprimía «Excelente» —una función
 *    pura de `score >= 80`— justo encima de dos arreglos críticos, y a dos dedos
 *    de un «Riesgo medio» que venía de otra llamada. Reportado con captura, y con
 *    razón: la etiqueta no miraba los hallazgos. Acá el veredicto recibe
 *    `criticalCount` y no puede decir «listo» con un crítico abierto.
 *
 * 2. NO LLAMA AL NÚMERO «puntaje del CV». Lo rotula por lo que mide:
 *    coincidencia con ESTA vacante. Un 100 grande y sin apellido se lee como
 *    «mi CV está excelente», que no es lo que el número dice.
 */

const RADIUS = 54
const CIRCUMFERENCE = 2 * Math.PI * RADIUS
const COUNT_UP_MS = 520

type Tone = "ok" | "warn" | "bad"

function toneOf(score: number, criticalCount: number): Tone {
  if (criticalCount > 0) return score >= READY_SCORE ? "warn" : "bad"
  if (score >= READY_SCORE) return "ok"
  return score >= 55 ? "warn" : "bad"
}

const TONE_VAR: Record<Tone, string> = {
  ok: "var(--a-ok)",
  warn: "var(--a-warn)",
  bad: "var(--a-bad)",
}

/** Cuenta hasta el valor nuevo. Adorno con red — ver dentro. */
function useCountUp(target: number): number {
  const [shown, setShown] = useState(target)
  const fromRef = useRef(target)
  const raf = useRef<number | undefined>(undefined)

  useEffect(() => {
    const from = fromRef.current
    fromRef.current = target
    if (from === target) return

    // Sin cuadros —pestaña oculta, captura, impresión— el número salta a su valor
    // final. Se hace en un timeout y no en el cuerpo del efecto: un setState
    // síncrono acá encadena un render de más en cada análisis.
    const canAnimate =
      typeof window !== "undefined" &&
      typeof window.requestAnimationFrame === "function" &&
      !(typeof document !== "undefined" && document.hidden)
    if (!canAnimate) {
      const jump = setTimeout(() => setShown(target), 0)
      return () => clearTimeout(jump)
    }

    const t0 = performance.now()
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / COUNT_UP_MS)
      setShown(Math.round(from + (target - from) * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf.current = requestAnimationFrame(step)
    }
    raf.current = requestAnimationFrame(step)
    // Red: si los cuadros se cortan a mitad de camino, el número no se queda en un
    // valor intermedio que nadie puede reconciliar con el informe.
    const backstop = setTimeout(() => setShown(target), COUNT_UP_MS + 120)
    return () => {
      if (raf.current !== undefined) cancelAnimationFrame(raf.current)
      clearTimeout(backstop)
    }
  }, [target])

  return shown
}

interface Props {
  score: number
  /** Críticos ABIERTOS. Con uno, el veredicto no puede decir que está listo. */
  criticalCount: number
  /**
   * De esos críticos, cuántos puede cerrar el ejecutor.
   *
   * EL DEFECTO QUE CIERRA (reportado por el CEO, 2026-08-21, con captura): el
   * título decía «2 arreglos críticos antes de mandarlo» y el botón de abajo
   * ofrecía «resolver 1 pendiente». Su pregunta fue exacta: ¿cuál dice la verdad?
   * Las dos — y por eso era peor. Uno era una reescritura; el otro, un requisito
   * de la vacante que el CV no cumple, y ninguna reescritura cambia eso. Llamar
   * «arreglo» a un requisito manda al candidato a buscar un botón que no puede
   * existir. Ahora la cifra se parte y se dice cuál es cuál.
   */
  criticalSolvable: number
  /** Puntos que quedan sobre la mesa, ya sumados por el informe. */
  recoverable: number
}

export default function ScoreDial({ score, criticalCount, criticalSolvable, recoverable }: Props) {
  const t = useTranslations("editor.ats")
  const tone = toneOf(score, criticalCount)
  const shown = useCountUp(score)
  const color = TONE_VAR[tone]

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          <svg viewBox="0 0 130 130" width="118" height="118" aria-hidden="true">
            <circle cx="65" cy="65" r={RADIUS} fill="none" stroke="var(--a-track)" strokeWidth="9" />
            <circle
              className="ats-dial-arc"
              cx="65" cy="65" r={RADIUS} fill="none"
              stroke={color} strokeWidth="9" strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={CIRCUMFERENCE * (1 - Math.max(0, Math.min(100, score)) / 100)}
              transform="rotate(-90 65 65)"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className="text-[34px] font-bold leading-none tabular-nums [font-family:var(--dash-serif)]"
              style={{ color: "var(--a-ink)" }}
            >
              {shown}
            </span>
            {/* Rotulado por lo que mide, no como nota del CV. */}
            <span className="mt-1 max-w-[86px] text-center text-[8.5px] font-bold uppercase leading-tight tracking-[0.08em]"
              style={{ color: "var(--a-muted-2)" }}>
              {t("axis_match")}
            </span>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-bold leading-tight" style={{ color }}>
            {criticalCount > 0
              ? t("verdict_blocked", { count: criticalCount })
              : score >= READY_SCORE
                ? t("verdict_ready")
                : t("verdict_below")}
          </p>
          <p className="mt-1 text-[11px] leading-snug" style={{ color: "var(--a-muted)" }}>
            {criticalCount === 0
              ? t("verdict_scope_hint")
              : criticalSolvable === 0
                ? t("verdict_blocked_yours", { count: criticalCount })
                : criticalSolvable === criticalCount
                  ? t("verdict_blocked_hint")
                  : t("verdict_blocked_split", { fix: criticalSolvable, yours: criticalCount - criticalSolvable })}
          </p>

          {/* La barra con el umbral marcado: dónde está y adónde llega si cierra
              lo que falta. Sin esto, «te faltan 18 puntos» no tiene referencia. */}
          <div className="mt-2.5">
            <div className="relative h-[6px] w-full overflow-hidden rounded-full" style={{ background: "var(--a-track)" }}>
              <span className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-500"
                style={{ width: `${Math.max(0, Math.min(100, score))}%`, background: color }} />
              <i className="absolute inset-y-0 w-px" style={{ left: `${READY_SCORE}%`, background: "var(--a-border-2)" }} />
            </div>
            <div className="mt-1 flex justify-between text-[9px] font-semibold uppercase tracking-[0.06em]"
              style={{ color: "var(--a-muted-2)" }}>
              <span>{t("threshold_label", { score: READY_SCORE })}</span>
              {recoverable > 0 && <span>{t("recoverable_label", { points: recoverable })}</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

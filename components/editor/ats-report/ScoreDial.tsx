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

/**
 * EL COLOR DICE EL PUNTAJE. Nada más, y por eso se puede creer.
 *
 * ── LA REGLA, DEL CEO (2026-08-22) ─────────────────────────────────────────
 *
 *   «Hay reglas de colores: cuando está en menos de lo requerido está rojo,
 *    luego amarillo, si ya está estable es verde.»
 *
 * ── QUÉ HACÍA ANTES, Y POR QUÉ ESTABA MAL ─────────────────────────────────
 *
 * El tono miraba TAMBIÉN la cuenta de hallazgos críticos, y ahí adentro va
 * `hard.requirements`: los requisitos duros de la vacante, que el propio panel
 * declara sin salida —«ninguna reescritura lo cambia: es un requisito que
 * cumplís o no»— y para los que publica un techo aparte.
 *
 * Al candidato al que le falta un título eso le dejaba el anillo NARANJA PARA
 * SIEMPRE: podía llegar a 88, cerrar todo lo demás, y el color no se movía
 * nunca. Su pregunta fue «¿el anillo sólo maneja un color?». Para él, sí.
 *
 * Un intento intermedio lo ató a los críticos QUE TIENEN BOTÓN. Mejor, y aun así
 * equivocado: seguía siendo un color que responde a dos cosas a la vez, y por lo
 * tanto uno que no se puede leer sin saber cuál de las dos lo movió.
 *
 * Ahora el anillo contesta UNA pregunta —¿cuánto coincidís con esta vacante?— y
 * la contesta con el umbral, que es el mismo que dibuja la barra de abajo. Lo
 * crítico tiene su propia tarjeta, en rojo, con su propio texto. Cada cosa dicha
 * una vez, en su lugar: la regla de este panel desde el principio.
 */
function toneOf(score: number): Tone {
  if (score >= READY_SCORE) return "ok"
  return score >= WARN_SCORE ? "warn" : "bad"
}

/**
 * Debajo de esto el CV no compite: no es «podría mejorar», es que el filtro lo
 * deja afuera. Entre esto y el umbral, amarillo — hay con qué trabajar.
 */
const WARN_SCORE = 55

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
  const tone = toneOf(score)
  const shown = useCountUp(score)
  const color = TONE_VAR[tone]

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-4">
        <div className="flex shrink-0 flex-col items-center">
          <div className="relative">
          {/* 104 y no 118. En el riel quedan ~288px útiles: con el dial en 118 más
              el gap, al texto le sobraban ~154 y el veredicto —«1 arreglo crítico
              antes de mandarlo», quince palabras largas en español— se apilaba en
              tres renglones apretados contra el borde. Catorce píxeles menos en un
              número que ya se lee de sobra son catorce más para la frase que
              explica por qué. */}
          {/**
           * ── EL RÓTULO NO VIVE MÁS COMO TEXTO SUELTO (reportado con captura) ──
           *
           *   «"Match with this job" no se ve bien y se solapa con el anillo.»
           *
           * «Match with this job» son cuatro palabras: dentro del anillo no caben
           * (la cuerda útil son ~70px) y debajo se apilaban en dos renglones
           * apretados. Y era REDUNDANTE: la frase de la derecha —«mide cuánto
           * coincide tu CV con esta vacante»— ya nombra el número. Así que el
           * anillo se queda con lo suyo (el número, gauge con unidad /100) y el
           * rótulo pasa a `aria-label`: sigue nombrado para lectores de pantalla,
           * sin ocupar espacio ni pelearse con el arco. Una cosa dicha una vez.
           */}
          <svg
            viewBox="0 0 130 130" width="104" height="104"
            role="img" aria-label={`${t("axis_match")}: ${score} / 100`}
          >
            <defs>
              <linearGradient id={`ats-dial-${tone}`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity="0.5" />
                <stop offset="100%" stopColor={color} stopOpacity="1" />
              </linearGradient>
            </defs>
            <circle cx="65" cy="65" r={RADIUS} fill="none" stroke="var(--a-track)" strokeWidth="8" />
            <circle
              className="ats-dial-arc"
              cx="65" cy="65" r={RADIUS} fill="none"
              stroke={`url(#ats-dial-${tone})`} strokeWidth="8" strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={CIRCUMFERENCE * (1 - Math.max(0, Math.min(100, score)) / 100)}
              transform="rotate(-90 65 65)"
              style={{ filter: `drop-shadow(0 1px 4px color-mix(in srgb, ${color} 42%, transparent))` }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className="text-[31px] font-bold leading-none tabular-nums [font-family:var(--dash-serif)]"
              style={{ color: "var(--a-ink)" }}
            >
              {shown}
            </span>
            {/* La unidad hace del número un gauge y no un dato suelto: «99 / 100»
                se lee sin ayuda. Muda para lectores (el aria-label ya lo dice). */}
            <span
              className="mt-0.5 text-[9px] font-semibold leading-none tabular-nums tracking-[0.12em]"
              style={{ color: "var(--a-muted-2)" }}
              aria-hidden="true"
            >
              / 100
            </span>
          </div>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-bold leading-tight [text-wrap:balance] [overflow-wrap:anywhere]" style={{ color }}>
            {criticalCount > 0
              ? t("verdict_blocked", { count: criticalCount })
              : score >= READY_SCORE
                ? t("verdict_ready")
                : t("verdict_below")}
          </p>
          <p className="mt-1 text-[11px] leading-snug [overflow-wrap:anywhere]" style={{ color: "var(--a-muted)" }}>
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
            <div className="mt-1 flex justify-between gap-2 text-[9px] font-semibold uppercase tracking-[0.06em]"
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

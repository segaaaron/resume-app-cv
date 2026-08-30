"use client"

// components/editor/ats3/report-ui.tsx
//
// EL INFORME EN PANTALLA: el dial, la sección plegable, la fila de hallazgo y la
// tabla de términos.
//
// ── POR QUÉ LOS CUATRO EN UN ARCHIVO ────────────────────────────────────────
// Son las cuatro piezas de UNA pantalla y no se usan en ninguna otra. Repartidas
// en cuatro archivos con un quinto de helpers, el panel del ATS pasaba a ocho
// módulos para dibujar un informe — y el conteo de módulos de este proyecto ya
// se disparó una vez por esa vía. Acá el criterio es el que el CEO fijó: una
// pieza nueva sólo si otra se va.
//
// NADA DE ACÁ DECIDE. Los porcentajes, los puntos y el agrupamiento salen de
// `view-model.ts`, que los deriva de la medición del motor v3.

import { useEffect, useRef, useState } from "react"
import { useTranslations } from "next-intl"
// El lenguaje de pulsación vive con el resto del vocabulario visual: definirlo
// acá otra vez era la misma frase en dos archivos.
import { Btn, Chip, Note, PRESSABLE, toneOf, type Tone } from "./ui"
import { AlertCircle, AlertTriangle, Briefcase, Check, ChevronDown, FileText, Search, Sparkles, Tag,  User } from "lucide-react"
import { READY_SCORE, scoreBand } from "@/lib/ats3/score"
import type { PanelCheck, PanelSection, PanelSectionId, PanelTerm } from "./view-model"


// ─────────────────────────────────────────────────────────────────────────────
// SCOREDIAL
// ─────────────────────────────────────────────────────────────────────────────
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

/* El tipo del significado vive en `ui.tsx` y se importa. Declararlo otra vez acá
   —"ok" | "warn" | "bad"— daba DOS tipos con el mismo nombre en la misma
   carpeta: el que este archivo usaba y el que pintaba los colores. */

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
/**
 * El dueño de la regla es `scoreBand`; acá sólo se le pregunta.
 *
 * Se llama `bandOf` y no `toneOf` porque `toneOf` ya nombra otra cosa —los
 * tokens de un significado, en `ui.tsx`—: dos funciones con el mismo nombre en
 * la misma carpeta es como se cruza la información sin que nadie lo note.
 */
const bandOf = scoreBand

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

interface DialProps {
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
  /**
   * QUÉ es lo crítico, no cuántos hay.
   *
   * ── EL DEFECTO (reportado con captura, 2026-08-28) ────────────────────────
   *
   *   «Aquí me dice algo crítico pero no sé cuál es lo crítico, dónde lo veo.»
   *
   * La cabecera decía «1 arreglo crítico» y «ninguna reescritura lo cambia: es
   * un requisito que se cumple o no» — las dos frases ciertas, y ninguna dice
   * CUÁL requisito. El texto estaba a mano: `hard.requirements` viaja con el
   * requisito incumplido en su `evidence` desde que se emite. Se contaba y no
   * se mostraba.
   *
   * Un número sin su objeto no es información: es una alarma que el usuario
   * aprende a ignorar porque no puede actuar sobre ella.
   */
  criticalDetail?: readonly string[]
  /** Puntos que quedan sobre la mesa, ya sumados por el informe. */
  recoverable: number
}

export function ScoreDial({ score, criticalCount, criticalSolvable, recoverable, criticalDetail = [] }: DialProps) {
  const t = useTranslations("editor.ats")
  const tone = bandOf(score)
  const shown = useCountUp(score)
  const color = toneOf(tone).solid

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
              : bandOf(score) === "ok"
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

          {/* Y CUÁL es. Se envuelve, nunca se corta: un requisito a medias no se
              puede juzgar, y truncarlo devuelve al usuario al mismo lugar —
              sabe que algo falla y no sabe qué. */}
          {criticalDetail.length > 0 && (
            <ul className="mt-1.5 flex flex-col gap-1">
              {criticalDetail.map((req) => (
                <li
                  key={req}
                  className="flex gap-1.5 text-[11px] font-semibold leading-snug [overflow-wrap:anywhere]"
                  style={{ color: "var(--a-bad)" }}
                >
                  <span aria-hidden="true">·</span>
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          )}

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

// ─────────────────────────────────────────────────────────────────────────────
// REPORTSECTIONCARD
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Una sección del informe.
 *
 * LO QUE ESTA TARJETA RESUELVE: el panel anterior mostraba un 100 grande y, más
 * abajo, arreglos críticos, sin que nada explicara cómo las dos cosas podían ser
 * ciertas. La respuesta es que sólo algunas secciones mueven el número — y ahora
 * cada una lo declara en su encabezado, al lado de su cobertura o en lugar de ella.
 *
 * Una sección sin categoría de puntaje dice «no mueve el número» y no muestra
 * porcentaje. Inventarle uno para que la fila quede pareja sería volver al defecto.
 */

const SECTION_ICON: Record<PanelSectionId, typeof Search> = {
  search: Search,
  hard: Tag,
  soft: User,
  other: Sparkles,
  format: FileText,
  tips: Briefcase,
}

interface SectionProps {
  section: PanelSection
  /** Abierta de entrada. Las que puntúan lo están; las de consejos, no. */
  defaultOpen?: boolean
  renderCheck: (check: PanelCheck) => React.ReactNode
  /** Qué chequeo ya se aplicó. Lo sabe el panel; la sección sólo ordena con él. */
  isApplied?: (checkId: string) => boolean
  /** Lo que va debajo de los chequeos: la tabla de términos, el panel de viñetas. */
  children?: React.ReactNode
}

export function ReportSectionCard({ section, defaultOpen = false, renderCheck, isApplied, children }: SectionProps) {
  /**
   * LO APLICADO BAJA, NO SE MEZCLA (reportado con captura, 2026-08-28).
   *
   *   «Cuando aplico un improve bullet o lo borro, ¿cómo lo veo como aplicado?
   *    Sería mejor que las cosas que se aplican vayan a aplicados.»
   *
   * La tarjeta aplicada ya se pinta en gris y con su tilde, pero seguía en el
   * mismo renglón donde estaba: entre las pendientes. Con doce tarjetas abiertas
   * eso obliga a recorrer la lista entera para saber qué queda por hacer, y el
   * trabajo terminado compite por la atención con el que falta.
   *
   * No se ocultan —ver que algo se aplicó es la mitad de la confianza— y no se
   * mueven de sección: bajan al final de la suya, con el orden relativo intacto.
   * `sort` de Array es estable, así que dos aplicadas conservan su orden.
   */
  const ordenadas = isApplied
    ? [...section.checks].sort((a, b) => Number(isApplied(a.id)) - Number(isApplied(b.id)))
    : section.checks
  const t = useTranslations("editor.ats")
  const [open, setOpen] = useState(defaultOpen)
  const Icon = SECTION_ICON[section.id]

  const openCount = section.checks.filter((c) => c.state !== "pass").length
  const total = section.checks.length
  /**
   * DOS NÚMEROS CIERTOS QUE JUNTOS SE LEEN COMO UNA MENTIRA.
   *
   * ── EL DEFECTO (reportado con captura, 2026-08-28) ────────────────────────
   *
   *   «Esta al 100 pero aún muestra cosas por hacer.»
   *
   * Y los dos números son correctos: el porcentaje mide COBERTURA DE PUNTAJE y
   * la insignia cuenta HALLAZGOS. Una sección puede tener el puntaje entero y
   * seguir teniendo avisos que no pesan — cada tarjeta ya lo dice, una por una,
   * con su «no mueve el puntaje». Lo que faltaba era decirlo ARRIBA, donde
   * están los dos números juntos.
   *
   * Es la regla que este panel ya aplicó en la cabecera: dos cifras que cuentan
   * cosas distintas, o se explican, o una sobra.
   */
  const openWeightless = openCount > 0 && section.checks.every((c) => c.state === "pass" || !c.weight)
  const scored = section.scored
  const pct = section.coveragePct
  /** Rojo, amarillo o verde — decidido por el único dueño de la regla. */
  const banda = scored && pct !== null ? scoreBand(pct) : null

  return (
    <div
      className="overflow-hidden rounded-xl border transition-colors"
      style={{ borderColor: "var(--a-border)", background: "var(--a-surface)" }}
    >
      {/*
        DOS LÍNEAS, Y EL TÍTULO MANDA EN LA PRIMERA.
        ── EL DEFECTO (reportado con captura, 2026-08-21) ──────────────────────
        Todo vivía en UNA fila flex con cinco hijos: icono, título, porcentaje,
        chip de conteo y chevron. En un riel de ~320px sólo hay ~292 útiles, así
        que el título —el único elástico— se comía el sobrante de los otros
        cuatro. Con chip y porcentaje juntos le quedaban ~120px y se partía a
        mitad de frase: «Que te / encuentren», «Habilidades / duras». Las filas
        sin chip entraban en una línea, y esa diferencia era lo que se veía feo:
        la misma tarjeta con dos alturas y dos ritmos según qué datos trajera.
        Ahora la primera línea lleva SÓLO lo que identifica la sección —icono,
        nombre, cobertura— y todo lo que la mide baja a la segunda. El título
        pasa de ~120px a ~188px: entra siempre, y las seis tarjetas miden igual.
      */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full flex-col gap-2 px-3.5 py-3 text-left transition-colors hover:brightness-[0.985] focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2"
        style={{ outlineColor: "var(--a-accent-ink)" }}
      >
        <span className="flex w-full items-center gap-2.5">
          {/*
            EL SEMÁFORO SE VE, Y NO SÓLO POR EL COLOR.
            La regla del CEO —<55 rojo · 55-79 amarillo · ≥80 verde— vivía sólo en
            una barra de 1px al pie: con el rojo y el verde a esa altura, las seis
            tarjetas se leían iguales de un vistazo. El punto la pone a la altura
            del título, y como el color por sí solo no puede portar significado
            (un daltónico ve seis puntos grises), el estado viaja además en el
            `aria-label` y en la palabra que acompaña al número.
          */}
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
            style={
              banda
                ? { background: `var(--a-${banda}-soft)`, color: `var(--a-${banda}-ink)` }
                : { background: "var(--a-surface-3)", color: "var(--a-ink-2)" }
            }
          >
            <Icon className="h-3.5 w-3.5" />
          </span>

          <span className="min-w-0 flex-1">
            <span className="block text-[13px] font-bold leading-snug" style={{ color: "var(--a-ink)" }}>
              {t(`section_${section.id}`)}
            </span>
            {/* La excepción se dice; la regla no. «Mueve el puntaje» repetido en
                las seis tarjetas era ruido que ocupaba el lugar de la señal. */}
            {!scored && (
              <span className="block text-[10px] leading-tight" style={{ color: "var(--a-muted-2)" }}>
                {t("section_no_score")}
              </span>
            )}
          </span>

          {scored && pct !== null && (
            <span className="flex shrink-0 items-baseline gap-1">
              <span
                className="text-[17px] font-black leading-none tabular-nums"
                style={{ color: `var(--a-${banda}-ink)` }}
              >
                {pct}
              </span>
              <small className="text-[9px] font-semibold" style={{ color: "var(--a-muted-2)" }}>%</small>
            </span>
          )}

          <ChevronDown
            className={`h-4 w-4 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            style={{ color: "var(--a-muted-2)" }}
          />
        </span>

        {/*
          LA BARRA OCUPA EL ANCHO, y el chip se apoya en su derecha. Antes competía
          con el rótulo repetido y quedaba de ~90px: a esa medida un 25% y un 60%
          se ven casi igual, que es lo contrario de lo que una barra sirve.
        */}
        {(scored && pct !== null) || total > 0 ? (
          <span className="flex w-full items-center gap-2 pl-[38px]">
            {scored && pct !== null && (
              <span
                className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full"
                style={{ background: "var(--a-track)" }}
                role="img"
                aria-label={`${pct}% — ${t(`section_band_${banda}`)}`}
              >
                <span
                  className="block h-full rounded-full transition-[width] duration-500"
                  style={{ width: `${pct}%`, background: `var(--a-${banda})` }}
                />
              </span>
            )}

            {total > 0 && (
              <Chip
                size="xs"
                tone={openCount > 0 ? "warn" : "ok"}
                className={`shrink-0 ${scored && pct !== null ? "" : "ml-auto"}`}
              >
                {openCount > 0
                  ? openWeightless
                    ? t("section_open_no_score", { count: openCount })
                    : t("section_open", { count: openCount })
                  : t("section_clean", { count: total })}
              </Chip>
            )}
          </span>
        ) : null}
      </button>

      {open && (
        <div className="flex flex-col gap-2 px-3.5 pb-3.5 pt-3">
          <p className="text-[11.5px] leading-relaxed" style={{ color: "var(--a-muted)" }}>
            {t(`section_${section.id}_blurb`)}
          </p>
          {ordenadas.map((c) => (
            <div key={c.id}>{renderCheck(c)}</div>
          ))}
          {children}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// CHECKROW
// ─────────────────────────────────────────────────────────────────────────────

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

/**
 * QUÉ SIGNIFICA CADA ESTADO — y nada más que eso.
 *
 * Acá vivían dos mapas de COLOR, uno para la tinta y otro para el fondo, que
 * repetían lo que `ui.tsx` ya sabe. Con la información cruzada, cambiar el rojo
 * del panel obligaba a acordarse de cinco lugares y el que se olvidara quedaba
 * contradiciendo a los otros cuatro: es exactamente cómo murió el motor viejo.
 * Este archivo declara su dominio —un chequeo que pasa, que avisa o que rompe—
 * y el color lo pone quien tiene esa competencia.
 */
const STATE_TONE = {
  pass: "ok",
  warn: "warn",
  crit: "bad",
} as const satisfies Record<PanelCheck["state"], Tone>

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

interface RowProps {
  check: PanelCheck
  /** Abre el ejecutor sobre ESTE hallazgo. Ausente = el hallazgo no es de tailor. */
  /**
   * Ejecuta el arreglo determinista: unificar fechas, agregar la habilidad,
   * reunir la línea partida. Sin modelo y sin cuota.
   *
   * Faltaba: `isActionable` decía que estos hallazgos tenían salida y la fila no
   * ofrecía ninguna, así que el usuario leía el problema y no podía hacer nada
   * con él — «un diagnóstico sin botón es una crítica sin puerta», que es la
   * regla que este panel existe para cumplir.
   */
}

export function CheckRow({ check }: RowProps) {
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
  const tokens = toneOf(STATE_TONE[check.state])
  const color = tokens.solid
  // `open` de arriba es si la fila está desplegada; esto es si el hallazgo sigue
  // sin resolver. Dos preguntas distintas que compartían nombre.

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
          style={{ background: tokens.soft, color }}
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
          <Chip
            size="xs"
            className="mt-1"
            tone={check.weight > 0 ? "accent" : check.state === "crit" ? "bad" : "neutral"}
          >
            {check.weight > 0
              ? t("check_points", { points: check.weight })
              : check.state === "crit"
                ? t("check_blocks_anyway")
                : t("check_no_score")}
          </Chip>
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
                <li key={`${check.id}-ev-${i}`} className="max-w-full">
                  {/* ENVUELVE, NO CORTA — lo hace la ficha del vocabulario. Con
                      `truncate` esto era una línea sin retorno: en el riel de
                      ~320px «Marketing Digital / Community Manager · 2023 –
                      2024» se cortaba en «· 202…», y el año es JUSTO el dato del
                      que habla el hallazgo de fechas. */}
                  <Note size="xs">{e}</Note>
                </li>
              ))}
            </ul>
          )}

        </div>
      )}

      {/* SIN BOTONES, Y AHORA POR CONSTRUCCIÓN.
          Acá vivían «arreglar» y «resolver con Tailor», que se dibujaban sólo si
          alguien pasaba la función que los resuelve. Desde que el informe
          diagnostica y Tailor arregla, nadie la pasa: eran dos botones que no
          podían aparecer, con su copia y sus colores mantenidos por las dudas.
          Quitarlos convierte la regla en estructura — esta fila no tiene de
          dónde sacar un botón, no importa quién la use. */}

    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// TERMTABLE
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Los términos, con su cuenta a los dos lados.
 *
 * POR QUÉ EL CONTEO Y NO UNA LISTA. «Te falta esta habilidad» hay que creerlo;
 * «la vacante lo pide 3 veces y tu CV lo dice 0» se verifica leyendo. Creer es
 * exactamente lo que el CEO dejó de hacer con este panel, y un número que él puede
 * comprobar por su cuenta es lo que lo devuelve.
 *
 * Y la tercera columna, que es la que un reclutador mira de verdad: un término
 * que sólo vive en la lista de habilidades es una AFIRMACIÓN; el mismo término
 * dentro de una viñeta con fecha es una PRUEBA. Los dos suman igual para el
 * filtro, y no valen lo mismo para la persona.
 *
 * ── EL REDISEÑO, Y QUÉ DEFECTO CIERRA CADA PIEZA ───────────────────────────
 *
 * Reportado con captura en un riel de ~320px: la tabla partía «Generación de
 * leads calificados» a mitad de palabra, repetía el chip «sólo en la lista» diez
 * veces seguidas y mostraba «— / 1» sin decir qué era cada número.
 *
 *   · SE FUE LA CABECERA DE TABLA. «TÉRMINO · VACANTE/CV» era una fila gris de
 *     formulario que gastaba ancho en explicar dos columnas que ya no existen.
 *     En su lugar, los términos se AGRUPAN por estado, y el encabezado del grupo
 *     dice el estado una vez en vez de un chip por fila.
 *   · EL TÉRMINO SE LLEVA EL RENGLÓN ENTERO. Compartía la línea con el conteo y
 *     dos botones: en 296px útiles le quedaban unos 130 y se cortaba solo. Ahora
 *     el conteo y la acción bajan a una segunda línea.
 *   · EL COLOR YA NO ES EL ÚNICO INDICADOR (WCAG). El punto de color se quedó,
 *     pero el estado lo dice el encabezado del grupo con palabras.
 *   · «— / 1» PASÓ A SER UNA FRASE. Dos números pegados por una barra obligan a
 *     recordar cuál lado es cuál; «lo pide 3 · lo decís 0» se lee sin leyenda.
 */

/** Los tres estados, en el orden en que conviene trabajarlos. */
type Group = "missing" | "listed" | "proven"

/** Qué significa cada grupo. El color, otra vez, lo pone el vocabulario. */
const GROUP_TONE: Record<Group, Tone> = {
  missing: "bad",
  listed: "warn",
  proven: "ok",
}

const GROUP_ORDER: readonly Group[] = ["missing", "listed", "proven"]

interface TableProps {
  terms: PanelTerm[]
  /**
   * LLEVA a Tailor con ese término, no lo resuelve acá.
   *
   * Es la diferencia entre las dos pantallas dicha en una firma: esto recibe un
   * término y no una función que escriba, así que esta tabla no tiene forma de
   * tocar el CV aunque alguien quisiera.
   */
  onSolve?: (term: string) => void
}

export function TermTable({ terms, onSolve }: TableProps) {
  const t = useTranslations("editor.ats")
  if (terms.length === 0) return null

  const groupOf = (x: PanelTerm, added: boolean): Group => {
    // Demostrado lo dice la auditoría, no la cuenta: un CV puede probar el
    // requisito sin escribirlo con esas mismas palabras.
    if (x.proven) return "proven"
    if (x.cv === 0 && !added) return "missing"
    return "listed"
  }

  // Lo que falta primero: es lo accionable. Después lo afirmado sin respaldo, que
  // es trabajo real aunque el filtro ya lo cuente. Lo probado, al final.
  const groups = new Map<Group, PanelTerm[]>()
  for (const row of terms) {
    /* Sin «recién agregado»: eso era estado de la tabla cuando ella misma
       agregaba términos. Ahora agrega Tailor, el CV cambia y la cuenta se vuelve
       a medir sobre el documento — una cuenta medida no necesita que nadie le
       avise. */
    const g = groupOf(row, false)
    const bucket = groups.get(g)
    if (bucket) bucket.push(row)
    else groups.set(g, [row])
  }
  for (const bucket of groups.values()) bucket.sort((a, b) => b.jd - a.jd)

  return (
    <div className="flex flex-col gap-3.5">
      {GROUP_ORDER.filter((g) => (groups.get(g)?.length ?? 0) > 0).map((g) => {
        const rows = groups.get(g) ?? []
        return (
          <section key={g}>
            {/* El estado, dicho UNA vez. Antes era un chip por fila: diez chips
                amarillos idénticos apilados que no distinguían nada entre sí. */}
            <h4 className="mb-1.5 flex items-center gap-1.5 px-0.5">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: toneOf(GROUP_TONE[g]).solid }} />
              <span
                className="text-[9.5px] font-bold uppercase tracking-[0.07em]"
                style={{ color: "var(--a-muted)" }}
              >
                {t(`term_group_${g}`)}
              </span>
              <span
                className="rounded-full px-1.5 py-0.5 text-[9.5px] font-bold tabular-nums"
                style={{ background: "var(--a-surface-3)", color: "var(--a-muted-2)" }}
              >
                {rows.length}
              </span>
            </h4>

            <ul
              className="overflow-hidden rounded-xl border"
              style={{ borderColor: "var(--a-border)", background: "var(--a-surface)" }}
            >
              {rows.map((row, i) => {
                const present = row.cv > 0
                const shown = row.cv
                return (
                  <li
                    key={row.term}
                    className="px-3 py-2.5"
                    style={i > 0 ? { borderTop: "1px solid var(--a-border)" } : undefined}
                  >
                    {/* RENGLÓN PROPIO. Compartir la línea con el conteo y los
                        botones era lo que lo partía a mitad de palabra. */}
                    <p
                      className="text-[12.5px] font-semibold leading-snug [overflow-wrap:anywhere]"
                      style={{ color: "var(--a-ink-2)" }}
                    >
                      {row.term}
                    </p>

                    <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1.5">
                      {/* Los dos números, dichos. Un «3 / 0» obliga a recordar
                          cuál lado es cuál; una frase corta no.
                          El guion del lado de la vacante NO es un cero: el
                          extractor normalizó el término y puede no aparecer con
                          esas palabras exactas en el aviso. Decir «0» ahí sería
                          justamente la clase de dato que esta tabla promete que
                          se puede auditar leyendo. */}
                      {/* SE ENVUELVE, NO SE CORTA (reportado con captura, 2026-08-28).
                          Con `truncate` sobre un `flex-1`, «asked 1× · you say it
                          0×» llegaba a pantalla como «asked1× you say it…»: los dos
                          números que explican la fila, cortados justo antes del
                          dato. Una frase de tres palabras no se abrevia — se deja
                          bajar de línea, que es lo que el contenedor ya permite. */}
                      <span
                        className="min-w-0 flex-1 text-[10.5px] leading-snug tabular-nums [overflow-wrap:anywhere]"
                        style={{ color: "var(--a-muted)" }}
                        title={row.jd > 0 ? t("term_counts_hint") : t("term_jd_uncounted")}
                      >
                        {row.jd > 0 ? t("term_meta_jd", { jd: row.jd }) : t("term_meta_jd_unknown")}
                        <span className="mx-1" style={{ color: "var(--a-border-2)" }}>·</span>
                        <span style={{ color: present ? "var(--a-ok)" : "var(--a-bad)", fontWeight: 700 }}>
                          {t("term_meta_cv", { cv: shown })}
                        </span>
                      </span>

                      <span className="flex shrink-0 items-center gap-1">
                        {/*
                          LOS BOTONES DICEN QUÉ HACEN.
                          ── EL DEFECTO (reportado, 2026-08-22) ──────────────
                          Eran dos cuadrados de 32px con un icono cada uno, uno
                          al lado del otro, sin una sola palabra: «¿qué mierdas
                          es eso, para qué es ese +?». Y era una pregunta
                          razonable — el nombre vivía en el `title`, que en un
                          panel nadie descubre y en táctil no existe.
                          Peor: hacen cosas DISTINTAS y ninguna se deducía del
                          icono. Agregar escribe el término en la lista de
                          Habilidades, gratis y al instante. Demostrar abre el
                          ejecutor para escribirlo DENTRO de una viñeta, que es
                          lo que lo vuelve prueba y no afirmación. Confundirlos
                          es hacer el trabajo equivocado.
                        */}
                        {/* LA PUERTA DE LA FILA, y no un botón que escriba.
                            El informe sigue sin tocar el CV: esto LLEVA a Tailor
                            y aterriza en la tarjeta de ese término. Antes acá
                            había dos botones que escribían; los saqué creyendo
                            que eran código muerto y eran la puerta que había que
                            cablear — el CEO lo reportó con captura: «te salían
                            botones de mejorar y te llevaba al tailor». */}
                        {/* LA PUERTA SÓLO SE ABRE DONDE HAY ALGO DETRÁS.
                            La condición miraba la CUENTA del texto («tu CV no lo
                            dice»), y quien decide si Tailor tiene trabajo para
                            ese término es la AUDITORÍA («no lo demuestra»). Son
                            dos opiniones sobre lo mismo y pueden discrepar: un
                            término escrito de otra forma cuenta 0 y sin embargo
                            está demostrado — el botón habría llevado a una
                            tarjeta que no existe. Se pregunta por lo demostrado,
                            que es lo que produce la tarjeta. */}
                        {onSolve && !row.proven && (
                          <span className="shrink-0">
                            <Btn
                              variant="outline"
                              tone="ai"
                              onClick={() => onSolve(row.term)}
                              className="!min-h-[32px] !text-[10px]"
                              ariaLabel={`${t("solve_with_tailor")} — ${row.term}`}
                            >
                              <Sparkles className="h-3 w-3 shrink-0" />
                              {t("solve_with_tailor")}
                            </Btn>
                          </span>
                        )}
                      </span>
                    </div>
                  </li>
                )
              })}
            </ul>
          </section>
        )
      })}

      <p className="px-0.5 text-[10.5px] leading-snug" style={{ color: "var(--a-muted)" }}>
        {t("term_evidence_note")}
      </p>
    </div>
  )
}

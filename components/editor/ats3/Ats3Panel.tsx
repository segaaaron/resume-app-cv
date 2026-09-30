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

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useTranslations } from "next-intl"
import { Check, Lightbulb, Loader2, Minus, Sparkles, Target } from "lucide-react"
import { useResumeStore } from "@/stores/resumeStore"
import { useAts3 } from "./useAts3"
import { statesQuantity } from "@/lib/ats3/score"
import { normalize } from "@/lib/ats3/contracts"
import type { AuditFacts } from "@/lib/ats3/score"
import type { ResumeSections } from "@/types/resume"
// LA PANTALLA DE SIEMPRE. El motor cambió debajo; el informe que el usuario
// aprendió a leer —dial, secciones, filas de chequeo, tabla de términos— no.
import { ScoreDial, ReportSectionCard, CheckRow, TermTable } from "./report-ui"
import { Btn, Card, Chip, Note } from "./ui"
import TailorPanel, { pendingCount, type DoneEntry } from "./TailorPanel"
import { sectionsOf, termsOfSpec, headlineOf, errorKeyOf } from "./view-model"


export default function Ats3Panel() {
  const t = useTranslations("editor.ats3")
  /** Los errores de la IA ya tienen su copia (cuota diaria, límite por hora). */
  /** La copia de la pantalla de entrada, que el producto ya tenía escrita. */
  const tv = useTranslations("editor.ats")
  // El CV y su idioma salen del store, no de props: quien monta el panel no
  // tiene por qué saber de qué depende el motor, y un dato que viaja por dos
  // caminos termina discrepando en uno.
  const resumeId = useResumeStore((s: { resumeId: string | null }) => s.resumeId)
  const language = useResumeStore((s: { config?: { language?: string } }) => s.config?.language)
  const a = useAts3(resumeId ?? "", language === "en" ? "en" : "es")

  /** Los hallazgos, dichos en la forma que la pantalla ya sabía pintar. */
  const todos = useMemo(() => [...a.regressed, ...a.findings], [a.findings, a.regressed])
  /** Los términos con una tarjeta pendiente en Tailor: la tabla abre la puerta sólo donde hay algo detrás. */
  const conTarjeta = useMemo(() => new Set(todos.flatMap((f) => (f.subject ? [normalize(f.subject)] : []))), [todos])
  /**
   * EL NOMBRE HUMANO DE UN TOKEN DEL MOTOR.
   *
   * `t.has` es lo que hace que un token sin clave caiga al token en vez de
   * pintar el error de next-intl: el motor puede agregar un chequeo mañana y la
   * pantalla no se rompe por eso. El acento se saca de la CLAVE, no del token —
   * el motor emite «método» y una clave i18n con acento es una invitación a que
   * la próxima no coincida por un carácter que no se ve.
   */
  const glosa = useCallback(
    (token: string, params?: Record<string, string>) => {
      const clave = `gloss_${token.normalize("NFD").replace(/\p{Diacritic}/gu, "")}`
      return t.has(clave) ? t(clave, params) : (params?.dato ?? token)
    },
    [t],
  )
  const secciones = useMemo(() => sectionsOf(a.score, todos, a.textOf, glosa), [a.score, todos, a.textOf, glosa])
  const regresados = useMemo(() => new Set(a.regressed.map((f) => f.id)), [a.regressed])
  /** Las cuatro cifras de la cabecera salen juntas: no pueden discrepar. */
  const cabecera = useMemo(() => headlineOf(a.score, secciones), [a.score, secciones])
  const términos = useMemo(
    () => termsOfSpec(a.spec, a.audit, a.jd, a.tree),
    [a.spec, a.jd, a.tree, a.audit],
  )

  /**
   * EL TRABAJO QUE TAILOR PUEDE CERRAR, contado por quien lo va a hacer.
   *
   * El botón dice el mismo número que la lista de Tailor va a mostrar. Dos
   * cifras que cuentan cosas distintas, una al lado de la otra, se leen como una
   * mentira aunque las dos sean ciertas — este panel ya lo pagó dos veces.
   */
  const paraTailor = useMemo(
    () => pendingCount(secciones),
    [secciones],
  )
  const [tailorAbierto, setTailorAbierto] = useState(false)
  /**
   * CUÁNTO VALE LA CIFRA EN EL ANÁLISIS, dicho por el propio puntaje.
   *
   * `effectiveWeight` es el peso REAL del componente una vez repartido lo que no
   * se pudo medir: es el techo que ese componente puede dar hoy, no el nominal.
   */
  const medidaDeLaCifra = useMemo(() => {
    const c = a.score?.components.find((x) => x.key === "metric")
    return c ? { points: c.points, max: c.effectiveWeight } : null
  }, [a.score])

  /** El término con el que se entró, para aterrizar en SU tarjeta y no arriba de todo. */
  const [foco, setFoco] = useState<string | null>(null)
  /** Lo resuelto en esta sesión: sobrevive a cerrar y volver a abrir Tailor. */
  /**
   * «HECHAS» SOBREVIVE A RECARGAR LA PÁGINA.
   *
   * Vivía sólo en este `useState`: un F5 y el registro de todo lo resuelto
   * desaparecía —reportado por el CEO— junto con la única prueba de que su
   * trabajo había pasado. Ahora se SIEMBRA con lo que el motor ya guardaba y se
   * le suma lo de esta sesión, emparejado por id: una entrada, un dueño, y la
   * de esta sesión gana porque trae el antes/después recién medido.
   *
   * Lo guardado con la forma vieja no traía título; esas filas se muestran con
   * lo que tienen en vez de desaparecer.
   */
  const [hechas, setHechas] = useState<DoneEntry[]>([])
  /** Lo que el CV dice HOY, donde el motor escribe: el resumen y los puestos. */
  const cvVivo = useResumeStore((s: { sectionData: ResumeSections }) =>
    [s.sectionData.summary ?? "", ...(s.sectionData.workExperience ?? []).map((r) => r.description ?? "")].join("\n"),
  )
  const registro = useMemo(() => {
    const porId = new Map<string, DoneEntry>()
    for (const r of a.resolved) {
      if (!r.title) continue
      porId.set(r.findingId, {
        id: r.findingId,
        title: r.title,
        weight: 0,
        kind: r.kind ?? (r.resolvedBy === "DISMISSED" ? "dismissed" : "applied"),
        before: r.before,
        after: r.after,
      })
    }
    for (const h of hechas) porId.set(h.id, h)
    // «Hechas» se deriva del CV vivo, no sólo de lo que se anotó: «Ahora dice X»
    // sobre un CV que no dice X es falso, y pasa al recargar sin haber guardado
    // (medido el 2026-09-28: una pestaña limpia abría con «Hechas 5»). Lo mismo
    // «Sacada del CV» sobre un texto que el CV tiene.
    //
    // Y un arreglo que otro arreglo posterior volvió a mejorar sigue hecho: su
    // texto ya no está tal cual, pero el siguiente partió de él (su «antes» es
    // este «después»). Medido el 2026-09-28: escribir «facturación electrónica»
    // sobre la línea nueva de SIN sacaba de «Hechas» la tarjeta de SIN, con SIN
    // todavía escrito en el CV.
    const todas = [...porId.values()]
    const vivos = new Set(todas.filter((h) => h.kind === "applied" && h.after && cvVivo.includes(h.after)))
    for (let cambio = true; cambio; ) {
      cambio = false
      for (const h of todas) {
        if (h.kind !== "applied" || !h.after || vivos.has(h)) continue
        if ([...vivos].some((v) => v.before === h.after)) {
          vivos.add(h)
          cambio = true
        }
      }
    }
    return todas.filter((h) =>
      h.kind === "applied" && h.after ? vivos.has(h) : !(h.kind === "dropped" && h.before && cvVivo.includes(h.before)),
    )
  }, [a.resolved, hechas, cvVivo])

  /**
   * Un error del análisis se lleva la vista, porque es lo único que la pantalla
   * puede contestar a un clic que no salió. `scrollIntoView` no existe en el DOM
   * de los tests, así que se llama con guarda.
   */
  const errorRef = useRef<HTMLParagraphElement>(null)
  useEffect(() => {
    if (a.error) errorRef.current?.scrollIntoView?.({ behavior: "smooth", block: "center" })
  }, [a.error])

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
        <Note ref={errorRef} tone="bad" role="alert">
          {t("failed")}. {t(errorKeyOf(a.error))}
        </Note>
      )}

      {/* LA ESPERA DEL ANÁLISIS TIENE LA FORMA DE LO QUE VIENE.
          Tarda de 15 a 60 segundos y el panel quedaba vacío con el botón
          diciendo «Analizando…». Se dibuja el esqueleto del informe —el dial y
          las secciones— en el lugar donde va a aparecer, sin tapar el CV. */}
      {a.loading && !a.score && (
        <div role="status" aria-live="polite" aria-label={t("analyzing")} className="flex flex-col gap-3">
          <p className="text-[11.5px] font-medium" style={{ color: "var(--a-muted)" }}>{t("analyzing_hint")}</p>
          <div aria-hidden className="flex items-center gap-4 motion-safe:animate-pulse">
            <span className="h-[88px] w-[88px] shrink-0 rounded-full" style={{ border: "8px solid var(--a-border)" }} />
            <span className="flex flex-1 flex-col gap-2">
              <span className="h-3.5 w-3/4 rounded-full" style={{ background: "var(--a-border)" }} />
              <span className="h-2.5 w-full rounded-full" style={{ background: "var(--a-border)" }} />
              <span className="h-2.5 w-2/3 rounded-full" style={{ background: "var(--a-border)" }} />
            </span>
          </div>
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              aria-hidden
              className="flex h-[58px] items-center gap-3 rounded-2xl px-4 motion-safe:animate-pulse"
              style={{ background: "var(--a-surface)", border: "1px solid var(--a-border)" }}
            >
              <span className="h-7 w-7 shrink-0 rounded-lg" style={{ background: "var(--a-border)" }} />
              <span className="h-3 w-1/3 rounded-full" style={{ background: "var(--a-border)" }} />
              <span className="ml-auto h-3 w-10 rounded-full" style={{ background: "var(--a-border)" }} />
            </span>
          ))}
        </div>
      )}

      {a.score && (
        <>
          {/* EL DIAL, con lo que se puede recuperar y qué es lo crítico —no
              sólo cuántos hay: un número sin su objeto es una alarma que el
              usuario aprende a ignorar. */}
          <ScoreDial
            score={cabecera.score}
            criticalCount={cabecera.criticalCount}
            criticalDetail={cabecera.detail}
            recoverable={cabecera.recoverable}
          />

          {a.calls === 0 && a.cvSinCambios && (
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
                    <Chip tone="warn" size="xs" className="self-start">
                      {t("badge_regressed")}
                    </Chip>
                  )}
                  {/* SIN MANOS, Y NO POR OMISIÓN.
                      `CheckRow` dibuja su botón sólo si le dan la función que lo
                      resuelve. El informe no se la da a propósito: acá se dice
                      QUÉ falta y cuánto pesa, y lo que escribe en el CV vive
                      entero en Tailor. Es la regla del CEO hecha estructura —
                      este archivo no importa una sola función que toque el CV,
                      así que el botón no puede volver por descuido. */}
                  <CheckRow check={check} />
                </div>
              )}
            >
              {/* La tabla de términos vive bajo la sección que la produce, con
                  las cuentas MEDIDAS sobre el aviso y el CV. */}
              {términos.some((x) => x.section === sección.id) && (
                <TermTable
                  terms={términos.filter((x) => x.section === sección.id)}
                  conTarjeta={conTarjeta}
                  /* La fila LLEVA a Tailor con su término: el informe abre la
                     puerta, y quien escribe sigue siendo el de siempre. */
                  onSolve={(term) => {
                    setFoco(term)
                    setTailorAbierto(true)
                  }}
                />
              )}
            </ReportSectionCard>
          ))}

          {a.audit && (
            <Anatomy
              audit={a.audit}
              metric={medidaDeLaCifra}
              textOf={a.textOf}
              lines={a.tree.roles.reduce((n, r) => n + r.bullets.length, 0)}
              t={t}
            />
          )}

          {/* LA ÚNICA SALIDA DEL INFORME.
              Doce puntos de contacto se fueron a Tailor y queda uno: el que
              lleva el trabajo a quien lo hace, con la cuenta derivada de lo que
              Tailor va a mostrar y no armada a mano acá. */}
          {paraTailor > 0 && (
            <Btn tone="ai" onClick={() => setTailorAbierto(true)} className="min-h-[48px] w-full !text-[13.5px]">
              <Sparkles className="h-4 w-4" />
              {t("open_tailor", { count: paraTailor })}
            </Btn>
          )}
        </>
      )}

      {tailorAbierto && (
        <TailorPanel
          a={a}
          sections={secciones}
          findings={todos}
          regressed={regresados}
          focusTerm={foco}
          done={registro}
          onDone={(e) => setHechas((h) => (h.some((x) => x.id === e.id) ? h : [...h, e]))}
          onClose={() => {
            setTailorAbierto(false)
            setFoco(null)
          }}
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
          {/* Con el token del panel: era el último color escrito a mano del informe. */}
          <Lightbulb className="mt-0.5 h-3 w-3 shrink-0" style={{ color: "var(--a-warn)" }} />
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

// ─────────────────────────────────────────────────────────────────────────────
// LA ANATOMÍA — tus viñetas y tu resumen, medidos
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POR QUÉ AGREGADO Y NO SÓLO POR TARJETA.
 *
 * La tarjeta de un arreglo contesta «¿esta línea mejoró?». Esta vista contesta
 * la otra pregunta, que es la que decide si el CV se manda: «¿cuántas de mis
 * líneas dicen algo medible?». Sin ella el usuario arregla tres viñetas, no sabe
 * si eso mueve la aguja y vuelve a preguntarle al panel lo mismo.
 *
 * VA EN EL INFORME Y NO EN TAILOR, y es la regla del CEO: acá se MIDE. Cada
 * línea con defecto ya tiene su tarjeta del otro lado, así que poner un botón
 * acá sería el segundo camino para lo mismo.
 *
 * NO MIDE POR SU CUENTA: los tres ejes son los que devolvió la auditoría y la
 * cifra es la que cuenta el puntaje. Una cuarta opinión sobre si una línea tiene
 * número es exactamente lo que este motor vino a terminar.
 */
function Anatomy({
  audit,
  metric,
  textOf,
  lines,
  t,
}: {
  audit: AuditFacts
  /** Cuántas líneas tiene el CV, revisadas o no: si quedaron sin decisión, se dice. */
  lines: number
  /** Cuánto vale la cifra en el análisis, del componente que la puntúa. */
  metric: { points: number; max: number } | null
  /** Qué dice esa línea hoy. */
  textOf: (nodeId: string) => string
  t: (k: string, v?: Record<string, string | number>) => string
}) {
  /**
   * LO QUE EL ATS DECIDIÓ DE CADA VIÑETA, contra este puesto (CEO, 2026-09-29):
   * cuáles ya sirven, cuáles hay que mejorar y cuáles sobran, con su motivo. Sólo
   * las líneas que el CV tiene hoy.
   */
  const reales = audit.bullets.filter((b) => textOf(b.id).length > 0)
  const total = reales.length
  if (total === 0) return null
  const cuenta = (d: "keep" | "improve" | "remove") => reales.filter((b) => b.decision === d).length
  const piden = reales.filter((b) => b.needsFigure)
  const conCifra = piden.filter((b) => statesQuantity(textOf(b.id))).length
  const filas: [string, number][] = [
    ["bq_keep", cuenta("keep")],
    ["bq_improve", cuenta("improve")],
    ["bq_remove", cuenta("remove")],
  ]
  const TONO = { keep: "ok", improve: "warn", remove: "neutral" } as const
  /**
   * X-Y-Z DE CADA VIÑETA (CEO, 2026-09-30), con las MISMAS marcas que abren las
   * tarjetas de Tailor, para que la lista y las tarjetas no se contradigan:
   * «sólo tarea» = le falta el logro; «falta la cifra» = el logro no dice cuánto;
   * «completa» = trae su cifra y nada le falta.
   */
  const xyz = (b: AuditFacts["bullets"][number]): "task" | "figure" | "complete" | null => {
    if (b.decision === "remove") return null
    if (b.needsOutcome) return "task"
    if (b.needsFigure && !statesQuantity(textOf(b.id))) return "figure"
    return statesQuantity(textOf(b.id)) ? "complete" : null
  }
  const TONO_XYZ = { task: "warn", figure: "warn", complete: "ok" } as const
  const completas = reales.filter((b) => xyz(b) === "complete").length
  const resumen: [string, boolean][] = [
    ["bq_sum_identity", audit.summary.identity],
    ["bq_sum_proof", audit.summary.proof],
    ["bq_sum_fit", audit.summary.fit],
    ["bq_sum_extra", audit.summary.extra],
  ]

  return (
    <Card radius="2xl" className="p-4">
      <h3 className="text-sm font-semibold" style={{ color: "var(--a-ink)" }}>{t("bq_title")}</h3>
      <p className="mt-0.5 text-xs" style={{ color: "var(--a-muted)" }}>{t("bq_caption")}</p>
      {total < lines && (
        <Note tone="warn" className="mt-2">
          {t("bq_partial", { n: total, total: lines })}
        </Note>
      )}

      <ul className="mt-3 flex flex-col gap-2">
        {filas.map(([clave, n]) => (
          <li key={clave} className="flex items-center gap-3 text-[12px]">
            <span className="w-[9ch] shrink-0 text-right font-bold tabular-nums" style={{ color: "var(--a-ink)" }}>
              {n}/{total}
            </span>
            <span className="min-w-0 flex-1" style={{ color: "var(--a-ink-2)" }}>{t(clave)}</span>
            <span className="h-1.5 w-24 shrink-0 overflow-hidden rounded-full" style={{ background: "var(--a-track)" }}>
              <span className="block h-full rounded-full" style={{ width: `${Math.round((n / total) * 100)}%`, background: "var(--a-accent)" }} />
            </span>
          </li>
        ))}
      </ul>

      {piden.length > 0 && (
        <Note className="mt-3">
          {metric && metric.max > 0 && (
            <b style={{ color: "var(--a-ink-2)" }}>
              {t("bq_metric_worth", { points: metric.points.toFixed(1), max: metric.max.toFixed(1) })}{" "}
            </b>
          )}
          {t("bq_figures", { n: conCifra, total: piden.length })}
        </Note>
      )}

      <h3 className="mt-4 text-sm font-semibold" style={{ color: "var(--a-ink)" }}>{t("bq_lines_title")}</h3>
      <p className="mt-0.5 text-xs" style={{ color: "var(--a-muted)" }}>{t("bq_xyz_count", { n: completas, total })}</p>
      <ul className="mt-2 flex max-h-[280px] flex-col overflow-y-auto rounded-xl border" style={{ borderColor: "var(--a-border)" }}>
        {reales.map((b) => (
          <li key={b.id} className="flex items-start gap-2 border-b px-3 py-2 last:border-b-0" style={{ borderColor: "var(--a-border)" }}>
            <span className="mt-0.5 flex shrink-0 flex-col items-start gap-1">
              <Chip size="xs" tone={TONO[b.decision]}>
                {t(`bq_decision_${b.decision}`)}
              </Chip>
              {xyz(b) && (
                <Chip size="xs" tone={TONO_XYZ[xyz(b)!]}>
                  {t(`bq_xyz_${xyz(b)}`)}
                </Chip>
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[11px] leading-snug" style={{ color: "var(--a-ink-2)" }}>{textOf(b.id)}</span>
              {b.reason && (
                <span className="mt-0.5 block text-[10px] leading-snug" style={{ color: "var(--a-muted)" }}>{b.reason}</span>
              )}
            </span>
          </li>
        ))}
      </ul>

      <h3 className="mt-4 text-sm font-semibold" style={{ color: "var(--a-ink)" }}>{t("bq_summary_title")}</h3>
      <p className="mt-0.5 text-xs" style={{ color: "var(--a-muted)" }}>{t("bq_summary_caption")}</p>
      <ul className="mt-2 flex flex-wrap gap-1.5">
        {resumen.map(([clave, ok]) => (
          <li key={clave}>
            <Chip tone={ok ? "ok" : "neutral"} className="flex items-center gap-1.5">
              {ok ? <Check className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
              {t(clave)}
            </Chip>
          </li>
        ))}
      </ul>
    </Card>
  )
}

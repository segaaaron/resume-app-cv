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

import { useEffect, useMemo, useRef, useState } from "react"
import { useTranslations } from "next-intl"
import { Check, Lightbulb, Loader2, Minus, Sparkles, Target } from "lucide-react"
import { useResumeStore } from "@/stores/resumeStore"
import { useAts3 } from "./useAts3"
import { readBullets } from "@/lib/ats3/engine"
import { statesQuantity } from "@/lib/ats3/score"
import type { AuditFacts } from "@/lib/ats3/score"
import type { ResumeSections } from "@/types/resume"
// LA PANTALLA DE SIEMPRE. El motor cambió debajo; el informe que el usuario
// aprendió a leer —dial, secciones, filas de chequeo, tabla de términos— no.
import { ScoreDial, ReportSectionCard, CheckRow, TermTable, PRESSABLE } from "./report-ui"
import TailorPanel, { workOf, verdictsToDo, type DoneEntry } from "./TailorPanel"
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
   * EL TRABAJO QUE TAILOR PUEDE CERRAR, contado por quien lo va a hacer.
   *
   * El botón dice el mismo número que la lista de Tailor va a mostrar. Dos
   * cifras que cuentan cosas distintas, una al lado de la otra, se leen como una
   * mentira aunque las dos sean ciertas — este panel ya lo pagó dos veces.
   */
  const paraTailor = useMemo(
    () => workOf(secciones).length + verdictsToDo(a.triage).length,
    [secciones, a.triage],
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

  /** Las líneas del CV vivo: la cifra se cuenta con la misma función del puntaje. */
  const líneas = useMemo(
    () =>
      (sectionData.workExperience ?? []).flatMap((r) => readBullets(r.description ?? "")),
    [sectionData.workExperience],
  )
  /** Lo resuelto en esta sesión: sobrevive a cerrar y volver a abrir Tailor. */
  const [hechas, setHechas] = useState<DoneEntry[]>([])

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
        <p
          ref={errorRef}
          role="alert"
          className="rounded-xl border px-4 py-3 text-sm"
          /* Con los tokens del panel, como todo lo demás: el rojo de Tailwind
             escrito a mano era la única pieza del informe con paleta propia. */
          style={{ borderColor: "var(--a-bad)", background: "var(--a-bad-soft)", color: "var(--a-bad-ink)" }}
        >
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
                <TermTable terms={términos.filter((x) => x.section === sección.id)} />
              )}
            </ReportSectionCard>
          ))}

          {a.audit && (
            <Anatomy
              audit={a.audit}
              quantified={líneas.filter(statesQuantity).length}
              total={líneas.length}
              metric={medidaDeLaCifra}
              existe={(id) => a.textOf(id).length > 0}
              t={t}
            />
          )}

          {/* LA ÚNICA SALIDA DEL INFORME.
              Doce puntos de contacto se fueron a Tailor y queda uno: el que
              lleva el trabajo a quien lo hace, con la cuenta derivada de lo que
              Tailor va a mostrar y no armada a mano acá. */}
          {paraTailor > 0 && (
            <button
              type="button"
              onClick={() => setTailorAbierto(true)}
              className={`${PRESSABLE} flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl px-4 text-[13.5px] font-bold text-white`}
              style={{ background: "var(--a-ai)" }}
            >
              <Sparkles className="h-4 w-4" />
              {t("open_tailor", { count: paraTailor })}
            </button>
          )}
        </>
      )}

      {tailorAbierto && (
        <TailorPanel
          a={a}
          sections={secciones}
          findings={todos}
          regressed={regresados}
          done={hechas}
          onDone={(e) => setHechas((h) => (h.some((x) => x.id === e.id) ? h : [...h, e]))}
          onClose={() => setTailorAbierto(false)}
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
  quantified,
  total,
  metric,
  existe,
  t,
}: {
  audit: AuditFacts
  /** Las que declaran una cantidad, contadas por el puntaje. */
  quantified: number
  total: number
  /**
   * LA VARA DE LA CIFRA ES EL PUNTAJE, y por eso viene de él.
   *
   * El panel viejo pintaba un objetivo de 60-70% de líneas con número. Ese
   * umbral vivía en la configuración del motor viejo y estaba marcado ahí mismo
   * como elegido, no medido — y el motor v3 no lo tiene. Escribirlo acá sería
   * una vara inventada que además el número no comparte: el panel diría «te
   * falta» contra algo que el puntaje no mide.
   *
   * Lo que SÍ es cierto y no necesita umbral: cuánto vale la cifra en el
   * análisis. Sale del componente que ya la puntúa, así que la pantalla y el
   * número no pueden discrepar.
   */
  metric: { points: number; max: number } | null
  /** ¿Esta línea sigue en el CV? La misma pregunta que se hace el puntaje. */
  existe: (nodeId: string) => boolean
  t: (k: string, v?: Record<string, string | number>) => string
}) {
  if (total === 0) return null
  /**
   * SÓLO LAS LÍNEAS QUE EL CV TIENE DE VERDAD.
   *
   * El juicio por viñeta lo devuelve un modelo, y un modelo puede contestar por
   * una línea que no existe: un id mal copiado, una que el usuario ya borró.
   * Contándolas contra el total de líneas reales, el panel puede mostrar «9 de
   * 8» — un número imposible que además contradice al puntaje, que ya las
   * descarta por su cuenta. Se descartan con la misma vara: si la línea no está
   * en el CV vivo, no se cuenta.
   */
  const reales = audit.bullets.filter((b) => existe(b.id))
  const verb = reales.filter((b) => b.hasActionVerb).length
  const result = reales.filter((b) => b.hasResult).length
  const method = reales.filter((b) => b.hasMethod).length
  const complete = reales.filter((b) => b.hasActionVerb && b.hasResult && b.hasMethod).length
  /**
   * SIN BANDA, Y NO ES UN OLVIDO.
   *
   * El panel viejo pintaba un objetivo de 60–70% de líneas con cifra. Ese número
   * vivía en la configuración del motor VIEJO y estaba marcado ahí mismo como
   * `basis: "chosen"` — elegido, no medido. Traerlo escrito a mano en esta
   * pantalla sería un umbral inventado que además nadie puntúa: el motor v3 no
   * tiene banda, así que el panel diría «te falta» sobre una vara que el número
   * no comparte.
   *
   * Se dice lo que SÍ es cierto y no necesita umbral: llenar todas las líneas de
   * números se lee fabricado. Cuántas exactamente es una decisión del CEO y una
   * medición, no una constante que yo elija acá.
   */

  const filas: [string, number][] = [
    ["bq_verb", verb],
    ["bq_result", result],
    ["bq_method", method],
    ["bq_metric", quantified],
  ]
  const resumen: [string, boolean][] = [
    ["bq_sum_identity", audit.summary.identity],
    ["bq_sum_proof", audit.summary.proof],
    ["bq_sum_fit", audit.summary.fit],
    ["bq_sum_extra", audit.summary.extra],
  ]

  return (
    <section
      className="rounded-2xl border p-4"
      style={{ borderColor: "var(--a-border)", background: "var(--a-surface)" }}
    >
      <h3 className="text-sm font-semibold" style={{ color: "var(--a-ink)" }}>{t("bq_title")}</h3>
      <p className="mt-0.5 text-xs" style={{ color: "var(--a-muted)" }}>{t("bq_caption")}</p>

      <ul className="mt-3 flex flex-col gap-2">
        {filas.map(([clave, n]) => (
          <li key={clave} className="flex items-center gap-3 text-[12px]">
            <span className="w-[9ch] shrink-0 text-right font-bold tabular-nums" style={{ color: "var(--a-ink)" }}>
              {n}/{total}
            </span>
            <span className="min-w-0 flex-1" style={{ color: "var(--a-ink-2)" }}>{t(clave)}</span>
            {/* La barra dice lo mismo que el número: quien lee de un vistazo no
                tiene que hacer la división. */}
            <span className="h-1.5 w-24 shrink-0 overflow-hidden rounded-full" style={{ background: "var(--a-track)" }}>
              <span
                className="block h-full rounded-full"
                style={{ width: `${Math.round((n / total) * 100)}%`, background: "var(--a-accent)" }}
              />
            </span>
          </li>
        ))}
      </ul>

      <p
        className="mt-3 rounded-lg px-2.5 py-2 text-[11px] leading-snug"
        style={{ background: "var(--a-surface-2)", color: "var(--a-muted)" }}
      >
        {/* Un componente que no se pudo medir reparte su peso y queda en cero:
            decir «vale 0,0 de 0,0 puntos» es ruido con forma de dato. */}
        {metric && metric.max > 0 && (
          <b style={{ color: "var(--a-ink-2)" }}>
            {t("bq_metric_worth", { points: metric.points.toFixed(1), max: metric.max.toFixed(1) })}{" "}
          </b>
        )}
        {t("bq_band")}
      </p>
      <p className="mt-1.5 text-[11px]" style={{ color: "var(--a-muted-2)" }}>
        {t("bq_complete", { n: complete, total })}
      </p>

      <h3 className="mt-4 text-sm font-semibold" style={{ color: "var(--a-ink)" }}>{t("bq_summary_title")}</h3>
      <p className="mt-0.5 text-xs" style={{ color: "var(--a-muted)" }}>{t("bq_summary_caption")}</p>
      <ul className="mt-2 flex flex-wrap gap-1.5">
        {resumen.map(([clave, ok]) => (
          <li
            key={clave}
            /* El estado se distingue por ICONO además de color: un panel que
               sólo cambia el tono deja afuera a quien no distingue los dos. */
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium"
            style={
              ok
                ? { background: "var(--a-ok-soft)", color: "var(--a-ok-ink)" }
                : { background: "var(--a-surface-3)", color: "var(--a-muted-2)" }
            }
          >
            {ok ? <Check className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
            {t(clave)}
          </li>
        ))}
      </ul>
    </section>
  )
}

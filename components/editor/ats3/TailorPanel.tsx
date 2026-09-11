"use client"

// components/editor/ats3/TailorPanel.tsx
//
// TAILOR — EL QUE ARREGLA. El informe dice qué falta; acá se resuelve.
//
// ── LA REGLA DEL CEO, DICHA CUATRO VECES Y HECHA ESTRUCTURA ─────────────────
// «El ATS muestra lo que falta, tailor lo soluciona. Sin nada que se contradiga
// ni se repita.»
//
// El ejecutor viejo llevaba esa regla escrita en su propio encabezado y se borró
// el 2026-08-29 con el motor viejo. Sin una superficie donde poner las
// soluciones, todas cayeron dentro del informe: los botones en las tarjetas, el
// tablero de veredictos, la hoja de confirmación. No fue una decisión de diseño,
// fue el hueco que dejó el borrado — y el CEO lo reportó mirando la pantalla.
//
// ── DE DÓNDE SACA EL TRABAJO ────────────────────────────────────────────────
// Del informe que ya se pagó, y de ningún otro lado: no vuelve a leer la
// vacante, no vuelve a puntuar, no diagnostica por su cuenta. Si un hallazgo no
// está en el informe, acá no hay dónde ponerlo. Por eso abre ENCIMA del editor
// desde el botón del informe en vez de ser una pestaña suelta: una pestaña se
// puede abrir sin haber analizado nada, y una pantalla vacía con un botón grande
// es una invitación a gastar una segunda consulta para llenarla.
//
// ── QUÉ SE TRAJO DEL EJECUTOR VIEJO ─────────────────────────────────────────
// SÓLO LA PANTALLA, por orden del CEO: la ventana con su altura fija, la fila de
// filtros, la cabecera con el puntaje y su ganancia, y el lenguaje de pulsación.
// Ni un módulo, ni un test, ni una función de `lib/ats/`. Lo que decide sigue
// siendo `lib/ats3` a través de `useAts3`.

import { useEffect, useMemo, useRef, useState } from "react"
import { useTranslations } from "next-intl"
import { createPortal } from "react-dom"
import SuggestionDiffModal from "@/components/editor/SuggestionDiffModal"
import { Check, Loader2, Minus, Sparkles, X } from "lucide-react"
import { Z_MODAL } from "@/lib/ui/z-layers"
import { skillPlan } from "@/lib/ats3/engine"
import { SKILLS_MAX } from "@/lib/ats3/ledger"
import { figureSlots } from "@/lib/ats3/guards"
import type { AnchoredSuggestion, Finding, Placeholder, TriageDecision } from "@/lib/ats3/contracts"
import { Btn, Card, Chip, Diff, Label, Note, PRESSABLE } from "./ui"
import type { PanelCheck, PanelSection, PanelSectionId } from "./view-model"
import type { Tone } from "./ui"
import type { useAts3 } from "./useAts3"

type Ats3 = ReturnType<typeof useAts3>
type Filter = "all" | "open" | "done" | PanelSectionId

/**
 * UN ARREGLO RESUELTO, CON LO QUE CAMBIÓ.
 *
 * No alcanza con el id: el motor retira el hallazgo apenas se aplica, así que
 * si la tarjeta resuelta dependiera del informe no habría nada que pintar. Se
 * guarda lo que hace falta para mostrarla entera —qué era, cuánto pesaba, qué
 * decía antes y qué quedó escrito—, que es lo que convierte «Hechas 3» en una
 * lista que se puede leer en vez de un número.
 */
export interface DoneEntry {
  id: string
  title: string
  weight: number
  /**
   * QUÉ SE HIZO. El registro guardaba sólo dos de las cuatro formas de cerrar.
   *
   * ── EL DEFECTO QUE ESTO CIERRA (CEO, 2026-09-09, con captura) ──────────────
   * «Si soluciono 30, en Hechas se ven 2 o 3.» Era cierto: sólo anotaba lo que
   * se escribía. Sacar una línea del CV y descartar una tarjeta —dos decisiones
   * que el usuario TOMÓ, una de ellas destructiva— no dejaban rastro en ningún
   * lado, así que el trabajo hecho desaparecía de la pantalla sin explicación.
   *
   * Descartar no es arreglar, y por eso no se pinta con el tilde de aplicado:
   * se pinta como lo que fue. El registro es de lo que HICISTE, no sólo de lo
   * que se escribió.
   */
  kind: "applied" | "dropped" | "dismissed"
  before?: string
  after?: string
}

/**
 * EL TRABAJO QUE TAILOR PUEDE CERRAR.
 *
 * Un informativo existe para que el candidato sepa algo, y lo que sólo puede
 * arreglar él —un mes que falta, un dato que nadie más tiene— no es trabajo de
 * acá. Ofrecerles un botón sería el reproche con forma de producto.
 */
export function workOf(sections: readonly PanelSection[]): PanelCheck[] {
  return sections
    .flatMap((s) => s.checks)
    .sort((a, b) => b.weight - a.weight)
}

/**
 * LOS VEREDICTOS QUE ESTE TABLERO OFRECE. `KEEP` y `REWRITE` no son suyos.
 *
 * `KEEP` —«esta línea se gana su lugar»— es una respuesta, no una tarea: no
 * tiene botón porque no hay nada que hacer. Contarlo sería prometer siete
 * arreglos y abrir una pantalla con cuatro.
 *
 * ── Y `REWRITE` TAMPOCO, QUE ERA UNA PISADA (CEO, 2026-09-09) ───────────────
 * Un veredicto REWRITE deja la línea abierta, así que esa viñeta TIENE su
 * tarjeta. El tablero mostraba además su propia fila con otro botón: dos
 * botones para la misma acción sobre la misma línea, y la misma línea contada
 * DOS VECES en «48 cosas para arreglar». Peor, el del tablero era el peor de
 * los dos: pide la reescritura sin el `focus` de la tarjeta, así que el modelo
 * la recibía sin saber qué se le había prometido al usuario.
 *
 * El reparto queda limpio y sin solaparse:
 *   el tablero  → qué pasa con la LÍNEA   (sacarla, comprimirla, reemplazarla)
 *   las tarjetas → qué pasa con su CONTENIDO (reescribirla)
 */

/**
 * CUÁNTO QUEDA POR ARREGLAR. Un número, un dueño.
 *
 * La misma suma estaba escrita en dos pantallas —el botón del informe y la
 * cabecera de esta ventana—. Iguales hoy; el día que una cambie, el informe
 * promete siete y la ventana abre con cuatro, que es el defecto que este panel
 * ya pagó tres veces. Se pregunta acá, que es donde vive lo que se cuenta.
 */
export function pendingCount(sections: readonly PanelSection[], triage: readonly TriageDecision[]): number {
  return workOf(sections).length + verdictsToDo(triage).length
}

export function verdictsToDo(decisions: readonly TriageDecision[]): TriageDecision[] {
  return decisions.filter((d) => d.verdict !== "KEEP" && d.verdict !== "REWRITE")
}

export default function TailorPanel({
  a,
  sections,
  findings,
  regressed,
  focusTerm,
  done,
  onDone,
  onClose,
}: {
  a: Ats3
  sections: readonly PanelSection[]
  /** Los hallazgos del motor: la tarjeta sólo tiene su id, el acto necesita el nodo. */
  findings: readonly Finding[]
  regressed: ReadonlySet<string>
  /**
   * EL TÉRMINO CON EL QUE SE ENTRÓ desde el informe.
   *
   * Sin esto, apretar «Resolver con Tailor» en la fila de «Xcode» abría la
   * ventana arriba de todo y el usuario tenía que buscar entre veinticuatro
   * tarjetas la que acababa de pedir. El ejecutor viejo ya lo hacía y se perdió
   * con él.
   */
  focusTerm?: string | null
  /**
   * LO RESUELTO EN ESTA SESIÓN, y vive FUERA de esta ventana.
   *
   * Estaba acá adentro, así que cerrar y volver a abrir dejaba «Hechas 0»
   * después de haber arreglado tres cosas — y esas tres ya no están en el
   * informe, porque el motor las retira al aplicarlas. El usuario leía que su
   * trabajo se había perdido, que es el defecto que este panel existe para no
   * tener.
   */
  done: DoneEntry[]
  onDone: (entry: DoneEntry) => void
  onClose: () => void
}) {
  const [filter, setFilter] = useState<Filter>("all")
  const t = useTranslations("editor.ats3")
  /** La copia de la tarjeta es la que el producto ya tenía escrita, y vive en
   *  su propio espacio: traerla copiada sería la misma frase en dos lugares. */
  const ta = useTranslations("editor.ats")

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onEsc)
    return () => window.removeEventListener("keydown", onEsc)
  }, [onClose])

  const trabajo = useMemo(() => workOf(sections), [sections])
  /**
   * LAS HABILIDADES QUE ESTE CV LLEVA PARA ESTA VACANTE.
   *
   * Se calcula acá y no se pide al servidor: `skillPlan` es determinista y no
   * llama al modelo, así que preguntarlo costaría una vuelta para obtener lo
   * mismo. Se muestra sólo si CAMBIA algo — un plan idéntico a tu lista no es
   * trabajo, es ruido con forma de tarjeta.
   */
  const plan = useMemo(
    () => (a.spec && a.audit ? skillPlan(a.declaredSkills, a.spec, a.audit, a.weights) : null),
    [a.spec, a.audit, a.declaredSkills, a.weights],
  )
  const planAbierto = plan && (plan.add.length > 0 || plan.drop.length > 0)
  /** Lo mismo que cuenta el botón del informe: una cifra, un dueño. */
  const pendientes = useMemo(() => pendingCount(sections, a.triage), [sections, a.triage])
  /**
   * «HECHAS» ES LO QUE SE RESOLVIÓ EN ESTA SESIÓN, y se cuenta acá.
   *
   * El motor retira el hallazgo apenas se aplica —esa es la defensa contra el
   * bucle—, así que si la pestaña dependiera del informe no habría nada que
   * mostrar y el usuario leería que su trabajo se perdió. Es el defecto que el
   * ejecutor viejo ya había pagado: un número que cuenta lo que la función SABE
   * en vez de lo que la pantalla MUESTRA.
   */
  /**
   * SE MARCA CUANDO EL TRABAJO ATERRIZA, NO CUANDO SE APRIETA EL BOTÓN.
   *
   * Marcar al hacer clic contaba como hecha una reescritura que los guards
   * podían rechazar dos segundos después: la pestaña «Hechas» habría mostrado
   * un arreglo que nunca se escribió en el CV. Agregar a Habilidades y
   * descartar sí son inmediatos y ciertos; la reescritura se marca al aceptarla.
   */
  /**
   * ARMA LA ENTRADA UNA VEZ Y LA MANDA A LOS DOS LECTORES.
   *
   * La misma forma va a la lista de esta sesión y al registro que se guarda: con
   * dos construcciones distintas, lo que ves antes de recargar y lo que ves
   * después terminan diciendo cosas distintas sobre el mismo acto.
   */
  const entradaDe = (check: PanelCheck, kind: DoneEntry["kind"], cambio?: { before?: string; after?: string }): DoneEntry => ({
    id: check.id,
    title: ta(check.titleKey, check.params),
    weight: check.weight,
    kind,
    ...cambio,
  })
  const marcar = (check: PanelCheck, kind: DoneEntry["kind"], cambio?: { before?: string; after?: string }) => {
    onDone(entradaDe(check, kind, cambio))
  }

  /** Al aceptar, el hallazgo se conoce por su línea: es lo único que trae la propuesta. */
  const marcarPorNodo = (nodeId: string, cambio: { before: string; after: string }) => {
    const c = checkDe(nodeId)
    if (c) marcar(c, "applied", cambio)
  }

  const checkDe = (nodeId: string) => {
    const f = findings.find((x) => x.nodeId === nodeId)
    return f && trabajo.find((x) => x.id === f.id)
  }

  /** La misma entrada, para el registro que se guarda. */
  const registroDe = (nodeId: string, kind: DoneEntry["kind"], cambio?: { before?: string; after?: string }) => {
    const c = checkDe(nodeId)
    return c ? entradaDe(c, kind, cambio) : undefined
  }


  const nodoDe = (checkId: string) => findings.find((f) => f.id === checkId)




  /**
   * LAS SECCIONES QUE HAY, NO UNA LISTA ESCRITA A MANO.
   *
   * Se derivan del trabajo que llegó: una sección sin tarjetas no ofrece un
   * filtro que abriría vacío, y una sección nueva del motor aparece sola sin
   * que nadie se acuerde de agregarla acá.
   */
  const secciones = useMemo(
    () => [...new Set(trabajo.map((c) => c.section))],
    [trabajo],
  )
  const filtros: [Filter, string][] = [
    ["all", t("filter_all", { count: pendientes + done.length })],
    ["open", t("filter_open", { count: pendientes })],
    ["done", t("filter_done", { count: done.length })],
    ...secciones.map((id): [Filter, string] => [id, ta(`section_${id}`)]),
  ]

  /**
   * LA RESPUESTA SE LLEVA LA VISTA, Y ACÁ HACÍA FALTA OTRA VEZ.
   *
   * La hoja de confirmación se dibuja ARRIBA de la lista, y quien aprieta el
   * botón de la sexta tarjeta está scrolleado abajo: la respuesta aparece fuera
   * de cuadro y la ventana no se mueve sola. Es el mismo defecto que el CEO
   * reportó con captura esta mañana —«apretás uno, carga y no te dice qué
   * hizo»—, reintroducido al mudar la hoja del informe a esta pantalla: el
   * arreglo vivía en el archivo que dejó de mostrarla.
   *
   * `block: "center"` y no `"start"`: la hoja trae cajas para escribir la cifra,
   * y pegada al borde superior esconde el botón de aplicar detrás del teclado en
   * un teléfono. Con guarda porque `scrollIntoView` no existe en el DOM de los
   * tests, y un panel que se cae al aparecer una confirmación sería peor que el
   * defecto que esto cierra.
   */
  /** Lleva la vista hasta la tarjeta del término con el que se entró. */
  useEffect(() => {
    if (!focusTerm) return
    document
      .querySelector(`[data-term="${CSS.escape(focusTerm)}"]`)
      ?.scrollIntoView?.({ behavior: "smooth", block: "center" })
  }, [focusTerm, filter])

  const respuestaRef = useRef<HTMLDivElement>(null)
  const hayRespuesta = Boolean(a.pending) || Boolean(a.rejected)
  useEffect(() => {
    if (hayRespuesta) respuestaRef.current?.scrollIntoView?.({ behavior: "smooth", block: "center" })
  }, [hayRespuesta])

  /** Las resueltas que ESTA vista pinta. Una sola pregunta, un solo lugar. */
  const visiblesResueltas = filter === "all" || filter === "done" ? done : []
  const mostradas =
    filter === "done" ? [] : filter === "all" || filter === "open" ? trabajo : trabajo.filter((c) => c.section === filter)
  /**
   * LO DETERMINISTA QUE ESTA VISTA MUESTRA — no todo lo que existe.
   *
   * Se ejecuta solo, sin consulta ni dato del usuario. Contado sobre `trabajo`,
   * el botón «Aplicar las 3» salía también en «Hechas», donde no hay ni una de
   * esas tarjetas: un botón que promete actuar sobre algo que no está en
   * pantalla. Se cuenta lo que se ve, que es la única cuenta que el usuario
   * puede comprobar.
   */
  /* Los veredictos hablan del espacio de la página, no de una sección del
     informe: se muestran en las vistas generales y no bajo un filtro de
     sección, donde prometerían pertenecer a algo que no les corresponde. */
  /**
   * KEEP no entra: «esta línea se gana su lugar» es un diagnóstico, no una
   * tarea, y en la superficie que arregla es ruido — el motivo exacto por el
   * que el CEO preguntó para qué servía el tablero. Además hace que la lista y
   * el número de la cabecera cuenten lo mismo, fila por fila.
   */
  const veredictos = filter === "all" || filter === "open" ? verdictsToDo(a.triage) : []

  // Sólo existe tras un clic, así que no hay pasada de servidor que proteger —
  // el guard mantiene el componente seguro si alguien lo monta desde un árbol
  // renderizado en el servidor.
  if (typeof document === "undefined") return null

  return createPortal(
    <div
      className="ats-panel fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex: Z_MODAL, background: "rgba(20,20,15,.55)" }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={t("tailor_title")}
    >
      <section
        /*
          ALTURA FIJA, NO «HASTA» (defecto que el ejecutor viejo ya pagó): con
          `max-h` a secas la caja se encoge al contenido, así que pasar de
          «Todas» a «Hechas» hacía saltar la ventana de casi toda la pantalla a
          una franja y el usuario perdía el punto donde estaba mirando. Los
          filtros cambian QUÉ se ve, no cuánto mide la ventana. El tope en
          píxeles evita el defecto opuesto: en una pantalla muy alta, 88vh con
          dos tarjetas es una caja casi vacía.
        */
        className="relative flex h-[88vh] max-h-[760px] w-full max-w-[840px] flex-col overflow-hidden rounded-2xl"
        style={{ background: "var(--a-bg)", boxShadow: "var(--a-sh-lg)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* LA CARGA CUBRE TAILOR, NO LA PANTALLA (CEO, 2026-09-09).
            Estaba montada sobre todo el navegador —`fixed inset-0`— y tapaba el
            editor entero por una reescritura que ocurre dentro de esta ventana.
            `absolute` dentro de la sección la deja donde pasa el trabajo: se ve
            qué se está escribiendo y el resto del CV sigue a la vista. Se come
            el clic para que no se dispare una segunda consulta. */}
        {a.busyNode !== null && (
          <div
            className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-2xl"
            /* SEMITRANSPARENTE, pedido del CEO: se sigue viendo la tarjeta que
               se está reescribiendo detrás. El desenfoque hace legible el texto
               de encima sin tapar lo de abajo. */
            style={{
              background: "color-mix(in srgb, var(--a-bg) 55%, transparent)",
              backdropFilter: "blur(3px)",
              WebkitBackdropFilter: "blur(3px)",
            }}
            onClick={(e) => e.stopPropagation()}
            role="status"
            aria-live="polite"
          >
            <Loader2 className="h-7 w-7 animate-spin" style={{ color: "var(--a-ai)" }} />
            <span className="text-[13px] font-semibold" style={{ color: "var(--a-ink)" }}>
              {t("writing")}
            </span>
          </div>
        )}

        <header
          className="flex items-start gap-3 border-b px-5 py-4"
          style={{ borderColor: "var(--a-border)", background: "var(--a-surface)" }}
        >
          <div className="min-w-0 flex-1">
            <span
              className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em]"
              style={{ color: "var(--a-ai)" }}
            >
              <Sparkles className="h-3 w-3" /> {t("tailor_title")}
            </span>
            <h2 className="mt-1 text-[17px] font-bold leading-tight" style={{ color: "var(--a-ink)" }}>
              {pendientes > 0 ? t("tailor_pending", { count: pendientes }) : t("tailor_all_done")}
            </h2>
            <p className="mt-1 text-[11.5px] leading-relaxed" style={{ color: "var(--a-muted)" }}>
              {t("tailor_sub")}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <span className="block text-[22px] font-bold leading-none tabular-nums" style={{ color: "var(--a-ink)" }}>
              {a.score ? Math.round(a.score.total) : "—"}
            </span>
            {/* UN SOLO «CUÁNTO PODÉS RECUPERAR», Y VIVE EN EL DIAL.
                Acá había un segundo total sumando sólo las tarjetas de esta
                lista, sin el techo de 100 y con un decimal más: dos cifras que
                contestan la misma pregunta y no pueden coincidir. La ganancia
                de cada arreglo ya viaja en su propia fila, y la medida sobre el
                texto final la da la hoja de confirmación. */}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("close")}
            className={`${PRESSABLE} flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border`}
            style={{ borderColor: "var(--a-border)", color: "var(--a-muted)" }}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </header>

        <div
          className="flex flex-wrap items-center gap-1.5 border-b px-5 py-2.5"
          style={{ borderColor: "var(--a-border)", background: "var(--a-surface-2)" }}
        >
          {filtros.map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setFilter(id)}
              className={`${PRESSABLE} rounded-full px-2.5 py-1 text-[11px] font-semibold`}
              style={
                filter === id
                  ? { background: "var(--a-ink)", color: "var(--a-bg)" }
                  : { background: "var(--a-surface-3)", color: "var(--a-muted)" }
              }
            >
              {label}
            </button>
          ))}

          {/* ── ACÁ VIVÍA «APLICAR LAS N» (2026-09-09) ────────────────────────
              Aplicaba en lote lo único que se ejecutaba solo: agregar términos
              a Habilidades. Ese acto ya no existe suelto — la lista entera la
              decide `skillPlan` y se acepta de una vez en su propia tarjeta, con
              lo que entra y lo que sale a la vista. Un botón que aplica «todo lo
              que puede» sobre un conjunto vacío es un botón que no puede
              aparecer. */}
        </div>

        {/* `flex-1 min-h-0` es lo que hace que el scroll ocurra ACÁ ADENTRO. Sin
            `min-h-0` un hijo flex no baja de su altura de contenido, así que el
            `overflow-y-auto` no engancha nunca: en vez de scrollear, la lista
            empuja la caja. */}
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-5 py-4">
          {a.error && (
            <Note tone="bad" role="alert">
              {t("failed")} · {a.error}
            </Note>
          )}

          {/* «Ya está bien» NO es un fallo: el modelo leyó la línea y dice que no
              hay nada que mejorar. Pintarlo como rechazo enseña a desconfiar de
              una respuesta honesta. */}
          <div ref={respuestaRef} className="flex flex-col gap-3 empty:hidden">
          {a.rejected && (
            <Note tone={a.rejected.reason === "already_good" ? "ok" : "warn"}>
              {/* EL MOTIVO SE DICE, NO SE PEGA EL TOKEN AL LADO.
                  Acá salía «La propuesta no pasó los controles y no se aplicó ·
                  Realicé»: el motivo era el nombre del guard —que el usuario no
                  tiene por qué conocer— y el detalle, un verbo suelto sin
                  frase. Reportado con captura: «¿qué controles? ¿qué mierdas es
                  eso?». Cada motivo tiene su renglón en el diccionario y nombra
                  el dato adentro de la oración; el texto viejo queda de red
                  para un motivo que todavía no tenga el suyo. */}
              {a.rejected.reason === "already_good"
                ? t("already_good")
                : t.has(`reject_${a.rejected.reason}`)
                  ? t(`reject_${a.rejected.reason}`, { detail: a.rejected.detail })
                  : t("rewrite_rejected")}
            </Note>
          )}

          {/* LAS HABILIDADES QUE ENTRAN A TU PLANTILLA, ANTES DE ESCRIBIRLAS.
              Una lista de cien términos no la lee nadie y el filtro cuenta cada
              uno UNA vez, así que el resto sólo ocupa. Se enseña qué entra y qué
              sale —con el nombre exacto— y se escribe cuando lo aceptás. */}
          {planAbierto && plan && (
            <Card tone="accent" filled>
              <div className="px-4 py-3">
                <h3 className="text-[13px] font-semibold" style={{ color: "var(--a-ink)" }}>
                  {t("skills_plan_title", { max: SKILLS_MAX })}
                </h3>
                <p className="mt-1 text-[11.5px] leading-relaxed" style={{ color: "var(--a-muted)" }}>
                  {t("skills_plan_sub", { total: a.declaredSkills.length, max: SKILLS_MAX })}
                </p>
                {plan.add.length > 0 && (
                  <>
                    <Label tone="ok">{t("skills_plan_in", { count: plan.add.length })}</Label>
                    <ul className="mb-2 mt-1 flex flex-wrap gap-1.5">
                      {plan.add.map((s) => <li key={s}><Chip tone="ok">{s}</Chip></li>)}
                    </ul>
                  </>
                )}
                {plan.drop.length > 0 && (
                  <>
                    <Label>{t("skills_plan_out", { count: plan.drop.length })}</Label>
                    <ul className="mb-2 mt-1 flex flex-wrap gap-1.5">
                      {plan.drop.map((s) => <li key={s}><Chip>{s}</Chip></li>)}
                    </ul>
                  </>
                )}
                <div className="mt-2 flex gap-2">
                  <Btn onClick={() => a.applySkills(plan.final)}>{t("apply")}</Btn>
                </div>
              </div>
            </Card>
          )}

          {a.pending && (
            <SuggestionSheet
              /* Una propuesta nueva abre una hoja nueva: sin esto los campos
                 precargados de la anterior quedaban pegados. */
              key={`${a.pending.bulletId}:${a.pending.basedOnHash}:${a.pending.text}`}
              suggestion={a.pending}
              onCancel={() => a.setPending(null)}
              onAccept={(text) => {
                const cambio = { before: a.pending!.originalText, after: text }
                marcarPorNodo(a.pending!.bulletId, cambio)
                a.accept(a.pending!, text, registroDe(a.pending!.bulletId, "applied", cambio))
              }}
              donde={a.dondeCae(a.pending.bulletId)}
              esNueva={Boolean(a.pending.addToRole)}
              t={t}
            />
          )}
          </div>

          {/* NUMERADAS Y POR LO QUE MÁS SUMA. Acá el número no es decoración:
              la lista es una secuencia de trabajo y el orden lo decide la
              ganancia que el motor midió, no el orden en que llegaron. */}
          {mostradas.map((check, i) => (
            <FixCard
              key={check.id}
              check={check}
              order={i + 1}
              regressed={regressed.has(check.id)}
              /* DOS PREGUNTAS DISTINTAS, y estaban contestadas con una sola.
                 `busy` es «hay una reescritura en vuelo» —y por eso se apagan
                 TODOS los botones, para no disparar dos consultas a la vez—.
                 `writing` es «la que está escribiendo es ÉSTA». Con una sola
                 respuesta, apretabas un botón y las veinticuatro tarjetas
                 decían «Escribiendo…»: reportado con captura. */
              busy={a.busyNode !== null}
              writing={a.busyNode === nodoDe(check.id)?.nodeId}
              onSolve={() => {
                // No se marca acá: pedir una reescritura no es haberla
                // aplicado, y los guards pueden rechazarla.
                // Con QUÉ tarjeta se pidió: una línea puede tener dos, y al
                // aplicar sólo se cierra la que se resolvió.
                const f = nodoDe(check.id)
                // Lo que ESTA tarjeta dice, dicho también al modelo — la MISMA
                // frase que el usuario leyó, no el token crudo del motor.
                if (f) a.requestRewrite(f.nodeId, check.id, check.focus)
              }}
              onDismiss={() => {
                // NO entra en «Hechas»: descartar no es arreglar. La lista de
                // resueltas existe para releer lo que se escribió en el CV, y
                // una tarjeta que el usuario rechazó no escribió nada — pintarla
                // con el tilde de «Aplicado» sería decirle que hizo algo que no
                // hizo.
                const f = nodoDe(check.id)
                if (!f) return
                marcar(check, "dismissed")
                a.dismiss(f.nodeId, check.id, entradaDe(check, "dismissed"))
              }}
              t={t}
              ta={ta}
            />
          ))}

          {/* SE MONTA SIEMPRE, y el tablero decide si se muestra.
              Envolverlo en «hay veredictos» mata el aviso de «Deshacer» en el
              momento exacto en que hace falta: al sacar la última línea, la
              lista queda vacía y con ella se iba la única forma de revertir un
              borrado. El componente ya se retira solo cuando no queda nada que
              decir NI nada que deshacer. */}
          <TriageBoard
              decisions={veredictos}
              onDrop={(nodeId) => {
                const texto = a.textOf(nodeId)
                const entrada: DoneEntry = { id: `drop:${nodeId}`, title: texto, weight: 0, kind: "dropped", before: texto }
                const quitada = a.dropBullet(nodeId, entrada)
                if (quitada) onDone(entrada)
                return quitada
              }}
              onUndo={a.undoDrop}
              onRewrite={(nodeId, mergeWith) => a.requestRewrite(nodeId, undefined, undefined, mergeWith)}
              onAdd={(roleId, tema) => {
                // El ancla del pedido es una viñeta de ESE puesto: el motor la
                // usa para saber de qué puesto habla, no para reemplazarla.
                const ancla = a.textOf(roleId) ? roleId : (a.anclaDe(roleId) ?? roleId)
                a.requestRewrite(ancla, undefined, tema, undefined, roleId)
              }}
              roles={a.roles}
              roleOf={a.roleOf}
              textOf={a.textOf}
              busyNode={a.busyNode}
              t={t}
            />

          {/* LO RESUELTO NO DESAPARECE: queda con su tilde y con lo que cambió.
              Una tarjeta que se esfuma al resolverla le saca al usuario la
              confirmación de que su clic hizo algo — y con ella el único lugar
              donde puede releer lo que se escribió en su CV. */}
          {visiblesResueltas.map((h) => <DoneCard key={h.id} entry={h} t={t} ta={ta} />)}

          {/* UN FILTRO QUE NO MUESTRA NADA TIENE QUE DECIRLO.
              La condición miraba `done` en vez de mirar lo que ESTA vista pinta:
              parado en «Habilidades duras» con todo resuelto y algo en «Hechas»,
              no salía ni una tarjeta ni el mensaje — un hueco mudo, y el usuario
              leyendo que su trabajo se perdió. Se pregunta por lo que se
              renderiza, que es la única pregunta que corresponde acá. */}
          {mostradas.length === 0 && veredictos.length === 0 && visiblesResueltas.length === 0 && (
            <p className="py-10 text-center text-[13px]" style={{ color: "var(--a-muted)" }}>
              {filter === "done" ? t("tailor_none_done") : t("tailor_all_done")}
            </p>
          )}
        </div>
      </section>

      {/* LA PANTALLA DE CARGA ES LA DE LA APP, NO UNA NUEVA.
          `BrandLoadingScreen` ya la pintan el boundary de ruta, el aviso de
          navegación y la espera del login: dibujar otra acá sería la cuarta
          versión de la misma imagen, y el día que la marca cambie se actualizan
          tres. Va un peldaño por encima del modal —`Z_MODAL_FOLLOW_UP`, la
          misma regla de siempre: lo que nace dentro de un modal va encima de
          él— y se come el clic, así que el fondo no cierra la ventana mientras
          se escribe. El apagado de los botones sigue debajo por lo que siempre
          estuvo: una sola reescritura en vuelo. */}
    </div>,
    document.body,
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// EL TABLERO DE VEREDICTOS — qué merece el espacio de la página
// ─────────────────────────────────────────────────────────────────────────────

function TriageBoard({
  decisions,
  onDrop,
  onUndo,
  onRewrite,
  onAdd,
  roles,
  roleOf,
  textOf,
  busyNode,
  t,
}: {
  decisions: TriageDecision[]
  onDrop: (nodeId: string) => { roleIndex: number; bulletIndex: number; text: string } | null
  onUndo: (roleIndex: number, bulletIndex: number, text: string) => void
  onRewrite: (nodeId: string, mergeWith?: string) => void
  /** Escribe una línea NUEVA en ESE puesto, con el tema que el usuario confirmó. */
  onAdd: (roleId: string, tema: string) => void
  /** Los puestos del CV, para elegir dónde va. */
  roles: { id: string; label: string }[]
  /** El puesto que el motor recomienda para esa viñeta. */
  roleOf: (nodeId: string) => string
  /** De qué línea habla cada veredicto. Sin esto el tablero es un acertijo. */
  textOf: (nodeId: string) => string
  busyNode: string | null
  t: (k: string, v?: Record<string, string | number>) => string
}) {
  /** Lo último que se sacó, para poder devolverlo. Un borrado sin vuelta atrás no se ofrece. */
  const [ultimo, setUltimo] = useState<{ roleIndex: number; bulletIndex: number; text: string } | null>(null)
  /** DROP borra contenido: se muestra la línea exacta antes de tocarla. */
  const [confirmando, setConfirmando] = useState<TriageDecision | null>(null)
  /** El puesto elegido para la línea nueva. `null` = el que el motor recomienda. */
  const [destino, setDestino] = useState<string | null>(null)

  // Con la lista vacía el tablero se va, PERO no si hay algo que deshacer: al
  // sacar la última línea, el aviso de "deshacer" desaparecía junto con ella —
  // justo en el momento en que el usuario lo necesita.
  if (decisions.length === 0 && !ultimo) return null
  return (
    <section className="rounded-2xl border p-4" style={{ borderColor: "var(--a-border)", background: "var(--a-surface)" }}>
      {decisions.length > 0 && (
        <>
          <h3 className="mb-1 text-sm font-semibold" style={{ color: "var(--a-ink)" }}>{t("triage_title")}</h3>
          <p className="mb-1 text-xs" style={{ color: "var(--a-muted)" }}>{t("triage_caption")}</p>
          {/* DOS COSAS CIERTAS QUE JUNTAS SE LEEN COMO UNA MENTIRA si no se
              explican: el panel pide sacar una línea y el número no se mueve.
              Es correcto —cortar lo irrelevante no te hace más apto— pero desde
              afuera parece trabajo que no cuenta. Se dice. */}
          <p className="mb-3 text-[11px]" style={{ color: "var(--a-muted-2)" }}>{t("triage_space_note")}</p>
        </>
      )}

      {ultimo && (
        <div className="mb-3 flex items-center gap-2">
          <Note tone="warn" className="flex-1">{t("dropped")}</Note>
          <Btn
            variant="outline"
            onClick={() => {
              onUndo(ultimo.roleIndex, ultimo.bulletIndex, ultimo.text)
              setUltimo(null)
            }}
          >
            {t("undo")}
          </Btn>
        </div>
      )}

      <ul className="flex flex-col gap-2">
        {decisions.map((d) => (
          <li key={d.bulletId} className="flex items-start gap-2 text-xs">
            <Chip tone={VERDICT_TONE[d.verdict] ?? "neutral"}>{t(`verdict_${d.verdict}`)}</Chip>
            <span className="min-w-0 flex-1">
              {/* DE QUÉ LÍNEA HABLA. El veredicto y el motivo se entienden sólo
                  con su sujeto delante: "Sacar · duplica la viñeta de arriba"
                  sobre un CV de veinte líneas no le dice a nadie cuál sacar. */}
              {/* Al confirmar el borrado, la misma línea se pinta como lo que va
                  a desaparecer. Repetirla tachada debajo sería el mismo texto
                  largo dos veces en la misma fila. */}
              {textOf(d.bulletId) && (
                <Note
                  tone={confirmando?.bulletId === d.bulletId ? "bad" : "neutral"}
                  strike={confirmando?.bulletId === d.bulletId}
                  className="mb-1"
                >
                  {textOf(d.bulletId)}
                </Note>
              )}
              <span className="block" style={{ color: "var(--a-muted)" }}>{d.reason}</span>

              {/* En REPLACE y en ADD el motor NUNCA afirma que la persona hizo
                  algo: pregunta, y la respuesta es del usuario.

                  En ADD la línea no existe todavía, así que lo único que hay es
                  lo que él confirma: el tema viaja como `focus` y es contra eso
                  que los guards juzgan la redacción. El modelo escribe lo que la
                  persona ya dijo que hizo; no lo inventa. */}
              {d.needsUserConfirm && (
                <span className="mt-1 block">
                  <em className="block not-italic" style={{ color: "var(--a-ink)" }}>{d.needsUserConfirm}</em>
                  {/* DÓNDE VA, Y LA RECOMENDACIÓN VIENE MARCADA.
                      El motor eligió el puesto que mejor encaja y queda
                      seleccionado; el usuario puede moverlo. Con un solo puesto
                      no se pregunta: no hay nada que elegir. */}
                  {d.verdict === "ADD" && roles.length > 1 && (
                    <label className="mt-1 block text-[11.5px]" style={{ color: "var(--a-muted)" }}>
                      {t("add_where")}
                      <select
                        value={destino ?? roleOf(d.bulletId)}
                        onChange={(e) => setDestino(e.target.value)}
                        className="mt-1 block w-full rounded-lg px-2.5 py-2 text-[12px]"
                        style={{ background: "var(--a-surface-2)", border: "1px solid var(--a-border)", color: "var(--a-ink)" }}
                      >
                        {roles.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                  <Btn
                    disabled={busyNode !== null}
                    onClick={() =>
                      d.verdict === "ADD"
                        ? onAdd(destino ?? roleOf(d.bulletId), d.proposedTopic ?? d.needsUserConfirm ?? "")
                        : onRewrite(d.bulletId)
                    }
                    className="mt-1"
                  >
                    {t("yes_i_did")}
                  </Btn>
                </span>
              )}

              {/* Un veredicto sin botón es un reproche. DEMOTE entra por la misma
                  puerta que REWRITE: comprimir una línea ES reescribirla más corta,
                  y abrir una acción propia sería un segundo camino para lo mismo. */}
              {(d.verdict === "REWRITE" || d.verdict === "DEMOTE") && !d.needsUserConfirm && (
                <Btn disabled={busyNode !== null} onClick={() => onRewrite(d.bulletId)} className="mt-1">
                  {busyNode === d.bulletId ? t("writing") : t("fix_it")}
                </Btn>
              )}

              {/* ── UNA FUSIÓN SE PROPONE, NUNCA SE IMPONE (CEO, 2026-09-09) ──
                  «Preguntá al usuario si quiere hacerlo, no se obliga a nadie a
                  nada; y si también hace falta eliminar, dale esa opción.»

                  Las DOS líneas a la vista antes de tocar nada: fusionar BORRA
                  una, y acá no se acepta un borrado que no se vio. Y las dos
                  salidas se ofrecen JUNTAS, no encadenadas — fusionar para
                  después pedir que saques algo es lo que el CEO no quiere. */}
              {d.verdict === "MERGE" && d.mergeWith && (
                <>
                  {/* La OTRA línea, y sólo si existe. Sin la guarda, un id que
                      no resuelve —el usuario la editó o la sacó entre el
                      análisis y el clic— pinta una caja gris vacía debajo del
                      motivo: el mismo defecto que la fila principal ya cerraba
                      dos renglones más arriba. Visto en pantalla, no en un test. */}
                  {textOf(d.mergeWith) && (
                    <Note tone="neutral" className="mt-1">{textOf(d.mergeWith)}</Note>
                  )}
                  <span className="mt-1 flex flex-wrap items-center gap-2">
                    <Btn
                      tone="ai"
                      disabled={busyNode !== null}
                      onClick={() => onRewrite(d.bulletId, d.mergeWith ?? undefined)}
                    >
                      <Sparkles className="h-3 w-3" />
                      {busyNode === d.bulletId ? t("writing") : t("merge_it")}
                    </Btn>
                    {/* La otra salida, ofrecida a la par: si una de las dos no
                        aporta, sacarla es mejor que juntarlas. */}
                    <Btn variant="outline" onClick={() => setConfirmando(d)}>
                      {t("drop_it")}
                    </Btn>
                  </span>
                </>
              )}

              {(d.verdict === "DROP" || d.verdict === "MERGE") &&
                (confirmando?.bulletId === d.bulletId ? (
                  <span className="mt-1 flex flex-wrap items-center gap-2">
                    <Btn
                      tone="bad"
                      onClick={() => {
                        const quitada = onDrop(d.bulletId)
                        if (quitada) setUltimo(quitada)
                        setConfirmando(null)
                      }}
                    >
                      {t("confirm_drop")}
                    </Btn>
                    <Btn variant="outline" onClick={() => setConfirmando(null)}>
                      {t("cancel")}
                    </Btn>
                  </span>
                ) : (
                  d.verdict === "DROP" && (
                    <Btn variant="outline" onClick={() => setConfirmando(d)} className="mt-1">
                      {t("drop_it")}
                    </Btn>
                  )
                ))}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}

/**
 * QUÉ SIGNIFICA CADA VEREDICTO, dicho en el vocabulario del panel.
 *
 * Antes era un mapa de colores escrito acá; ahora es el SIGNIFICADO y el color
 * lo pone `ui.tsx`. Un veredicto nuevo es una línea, y el día que el tono de
 * «avisa» cambie, cambia para todo el panel a la vez.
 */
const VERDICT_TONE: Record<string, Tone> = {
  KEEP: "ok",
  REWRITE: "ai",
  REPLACE: "ai",
  DEMOTE: "warn",
  DROP: "bad",
  MERGE: "warn",
  ADD: "accent",
}

// ─────────────────────────────────────────────────────────────────────────────
// LA HOJA DE CONFIRMACIÓN — acá el candidato pone las cifras
// ─────────────────────────────────────────────────────────────────────────────

/**
 * El botón está APAGADO mientras quede un hueco obligatorio sin completar — y no
 * por un `if` del llamador, sino por el estado de esta pantalla. Y lo que se
 * escribe es lo que quedó en la caja, nunca la propuesta cruda: aplicar el texto
 * del modelo después de que el usuario lo editó es escribir algo que nadie
 * aceptó.
 */
function SuggestionSheet({
  suggestion,
  onCancel,
  onAccept,
  donde,
  esNueva,
  t,
}: {
  suggestion: AnchoredSuggestion
  onCancel: () => void
  onAccept: (finalText: string) => void
  /** El puesto y la línea donde cae. `null` en el resumen, que es uno solo. */
  donde: { puesto: string; linea: number } | null
  /** Una línea NUEVA no reemplaza a nadie: se dice, para no leerlo como un cambio. */
  esNueva: boolean
  t: (k: string, v?: Record<string, string | number>) => string
}) {
  /**
   * LA CIFRA QUE EL CANDIDATO YA DIO LLEGA ESCRITA EN SU CAMPO (CEO, 2026-09-11).
   *
   * Si la propuesta cambió «30%» por «[x%]», el campo abre con «30%»: se ve, se
   * puede cambiar, y no se le pide dos veces un dato que ya está en su CV.
   */
  const [values, setValues] = useState<Record<string, string>>(() => figureSlots(suggestion.originalText, suggestion))
  const [useVariant, setUseVariant] = useState(false)

  /**
   * NINGÚN HUECO SIN LLENAR ENTRA AL CV — ni los que el modelo marcó opcionales.
   *
   * Esto miraba sólo `p.required`, así que un hueco opcional vacío se aplicaba
   * TAL CUAL: `finalText` sólo reemplaza el token cuando hay valor, y el
   * currículum salía con "[x%]" impreso. El campo `required` es un juicio del
   * modelo sobre cuál cifra importa más; no es permiso para escribir un
   * corchete en el CV de alguien.
   *
   * La salida para quien no tiene el dato ya existe y es explícita: la casilla
   * «no tengo ese dato», que escribe la versión sin cifra. Una decisión suya,
   * no un descuido.
   */
  const requiredMissing = suggestion.placeholders.some((p) => !(values[p.token] ?? "").trim())

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

  /**
   * EL BENEFICIO, Y MEDIDO SOBRE LO QUE SE VA A ESCRIBIR.
   *
   * La hoja enseñaba dos párrafos y pedía un acto de fe. El motor ya sabe la
   * respuesta —escribe sobre una copia, vuelve a puntuar y resta— y es el mismo
   * número que el dial va a moverse al aplicar.
   *
   * Se mide TAMBIÉN con el hueco sin llenar, a propósito: esperar a que el
   * candidato escriba la cifra para recién entonces enseñarle lo que gana es
   * pedirle que invierta primero y contarle después. Con el hueco vacío el motor
   * no ve ninguna cantidad declarada, así que el número queda CORTO y sube al
   * completarlo: se subestima, nunca se promete de más.
   */


  /**
   * ── EL MODAL VOLVIÓ, Y ES UNO SOLO PARA MEJORAR Y PARA CREAR ───────────────
   *
   * «Antes cuando le presionabas en algún bullet te decía por cuál lo iba a
   * reemplazar; ese lo quiero como estaba» · «ese componente deberías crearlo
   * como componente y usarlo cuando mejores o crees bullets» (CEO, 2026-09-09).
   *
   * `SuggestionDiffModal` se borró el 2026-08-29 como colateral del borrado del
   * motor viejo —tres archivos de UI en el mismo commit— y el CEO nunca pidió
   * que se fuera. Vuelve del historial con su diff por línea, su DÓNDE cae y su
   * copia intacta; lo único que cambió es que los huecos de la cifra los pone
   * quien llama, porque el mecanismo de hueco de v3 es el que el CEO fijó hoy.
   *
   * Un solo componente para los dos caminos: la reescritura y la línea nueva
   * pasan por acá, así que ninguna forma de escribir en el CV puede quedarse sin
   * mostrarle al usuario qué y dónde.
   */
  return (
    <SuggestionDiffModal
      open
      onClose={onCancel}
      onConfirm={() => onAccept(finalText)}
      suggestion={{
        field: suggestion.bulletId === "summary" ? "summary" : "workExperience.description",
        type: esNueva ? "append" : "replace",
        preview: suggestion.text,
        reason: "",
      }}
      currentValue={esNueva ? "" : suggestion.originalText}
      afterOverride={finalText}
      blocked={blocked}
      /* Una viñeta NUEVA no lleva número de línea: `donde` es el ancla del
         pedido, no el lugar donde va a quedar, y numerarla señalaba una línea
         que el cambio no toca. */
      where={donde ? { jobTitle: donde.puesto, line: esNueva ? undefined : donde.linea } : undefined}
      /* SÓLO LOS HUECOS. El modal ya dibuja el título, el antes/después y los
         botones: pasarle la hoja entera pintaba el mismo diff dos veces, una
         encima de la otra. Visto en pantalla. */
      slotsUI={
        /* SÓLO LOS HUECOS, y con el lenguaje visual de ESTE modal.
           Acá había además una línea de ganancia que arrastré desde la hoja de
           v3 al mudarla adentro: el modal original nunca la tuvo —verificado,
           cero menciones a puntos en sus 378 líneas— y quedaba suelta entre el
           diff y los campos. El número ya vive en la tarjeta del panel. */
        <div className="mt-4 border-t border-[#E8EDF6] pt-4">
          {/* SE PARECE A OTRA LÍNEA: antes era un rechazo; ahora llega y se avisa
              acá, pegado al antes/después, con la línea parecida nombrada. */}
          {suggestion.similarTo && (
            <Note tone="warn" className="mb-4">
              {t("similar_to", { line: suggestion.similarTo })}
            </Note>
          )}
          {/* El mismo rótulo micro que «ACTUAL» y «SUGERIDO»: los campos son
              parte de este diálogo, no un bloque pegado de otra pantalla. */}
          {!useVariant && suggestion.placeholders.length > 0 && (
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[#94A3B8]">
              {t("fill_label")}
            </p>
          )}

          {!useVariant &&
            suggestion.placeholders.map((p: Placeholder) => (
              <div key={p.token} className="mb-3">
                <label
                  className="mb-1.5 block text-[12px] font-semibold text-[#1a2e4a]"
                  htmlFor={`slot-${p.token}`}
                >
                  {p.label} {p.required && <span className="text-[#DC2626]">*</span>}
                </label>
                <input
                  id={`slot-${p.token}`}
                  value={values[p.token] ?? ""}
                  onChange={(e) => setValues((v) => ({ ...v, [p.token]: e.target.value }))}
                  className="w-full rounded-xl border border-emerald-300 bg-white px-3 sm:px-3.5 py-2.5 text-[12.5px] text-[#1a2e4a] outline-none focus:border-emerald-500"
                  placeholder={p.token}
                  inputMode="numeric"
                />
                <p className="mt-1.5 text-[10.5px] leading-snug text-[#6B7A8C]">{p.hint}</p>
                {p.evidenceNeeded && (
                  <p className="text-[10.5px] leading-snug text-[#94A3B8]">{p.evidenceNeeded}</p>
                )}
              </div>
            ))}

          {suggestion.variantWithoutMetric && suggestion.placeholders.length > 0 && (
            <label className="flex cursor-pointer items-start gap-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2.5 text-[11.5px] leading-snug text-[#1a2e4a]">
              {/* Si no tiene el dato, la salida es una versión sin cifra — nunca un
                  número que puso el modelo. Lo que esa versión escribe se ve en
                  el antes/después antes de confirmar. */}
              <input
                type="checkbox"
                checked={useVariant}
                onChange={(e) => setUseVariant(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-emerald-600"
              />
              {t("no_data")}
            </label>
          )}
        </div>
      }
    />
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// LA TARJETA DE ARREGLO — la del ejecutor viejo, con los datos del motor v3
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POR QUÉ LA TARJETA Y NO LA FILA DEL INFORME.
 *
 * En el informe una fila plegada alcanza: ahí se lee QUÉ falta. Acá se decide, y
 * decidir necesita las tres cosas juntas y a la vista — qué está mal, por qué
 * importa y qué línea toca—. Con la fila plegada el usuario apretaba un botón
 * sin haber leído nada, que es pedirle un acto de fe.
 *
 * La copia sale de `editor.ats`, que es la que el producto ya tenía escrita para
 * esta tarjeta: no se reinterpreta nada.
 */
function FixCard({
  check,
  order,
  regressed,
  busy,
  writing,
  onSolve,
  onDismiss,
  t,
  ta,
}: {
  check: PanelCheck
  order: number
  regressed: boolean
  /** Hay una reescritura en vuelo: ningún botón acepta otra. */
  busy: boolean
  /** Y ES ÉSTA la que está escribiendo. */
  writing: boolean
  onSolve: () => void
  onDismiss: () => void
  t: (k: string, v?: Record<string, string | number>) => string
  ta: (k: string, v?: Record<string, string | number>) => string
}) {
  /* Toda tarjeta se cierra reescribiendo su línea: es el único remedio que el
     motor emite desde que la lista de habilidades tiene su propio dueño. */
  return (
    <Card>
      <div className="flex items-start gap-2.5 px-3.5 pt-3">
        <Chip size="xs" className="mt-0.5 shrink-0">
          {String(order).padStart(2, "0")}
        </Chip>
        <div className="min-w-0 flex-1">
          {/* EL TÍTULO SALE DE `editor.ats`, no de `ats3`.
              `titleKey` es `type_<tipo>` y esa copia vive con el resto del
              informe: pedírsela al espacio de nombres de esta pantalla habría
              pintado el nombre crudo de la clave —«type_no_metric»— en la
              tarjeta. No lo caza ningún test porque el doble de next-intl
              resuelve contra un solo diccionario plano. */}
          {/* GRAVEDAD Y SECCIÓN, ARRIBA DEL TÍTULO.
              Las dos se perdieron al rehacerse esta pantalla y el CEO lo
              reportó: una lista donde todas las tarjetas se ven igual obliga a
              leerlas todas para saber cuál urge. La gravedad sale de
              `check.state`, que el motor ya emite; la sección, del mismo id con
              el que se filtra arriba. */}
          <span className="mb-1.5 flex flex-wrap items-center gap-1.5">
            <Chip size="xs" tone={check.state === "crit" ? "bad" : "warn"}>
              {ta(check.state === "crit" ? "sev_critical" : "sev_warning")}
            </Chip>
            <span
              className="text-[9.5px] font-semibold uppercase tracking-[0.06em]"
              style={{ color: "var(--a-muted-2)" }}
            >
              {ta(`section_${check.section}`)}
            </span>
          </span>
          <h4 className="text-[13px] font-bold leading-snug" style={{ color: "var(--a-ink)" }}>
            {ta(check.titleKey, check.params)}
          </h4>
          <span className="mt-1 flex flex-wrap items-center gap-1.5">
            <Chip size="xs" tone={check.weight > 0 ? "accent" : "neutral"}>
              {check.weight > 0 ? ta("check_points", { points: check.weight }) : ta("check_no_score")}
            </Chip>
            {/* VOLVIÓ A APARECER. Un hallazgo que reaparece sobre una línea que
                el usuario ya tocó no es lo mismo que uno nuevo, y callarlo es lo
                que hace sentir el panel un bucle. */}
            {regressed && (
              <Chip size="xs" tone="warn">
                {t("badge_regressed")}
              </Chip>
            )}
          </span>
        </div>
      </div>

      {/* «POR QUÉ IMPORTA» — el motivo en su propio renglón. Sin él, el botón
          pide confianza; con él, el usuario decide leyendo. La explicación es
          del TIPO de hallazgo, y la escribe el mismo diccionario que ya tenía
          el resto de la copia del informe. */}
      {check.detailKey && (
        <p className="mx-3.5 mt-2.5 text-[11.5px] leading-relaxed" style={{ color: "var(--a-muted)" }}>
          <b style={{ color: "var(--a-ink-2)" }}>{ta("why_matters")}</b> {ta(check.detailKey, check.params)}
        </p>
      )}

      {/* TU LÍNEA, DICHA COMO TUYA.
          Antes se pintaba en una caja idéntica a la de los motivos, así que el
          usuario veía tres rectángulos grises —su viñeta, un motivo y un verbo
          suelto— sin saber cuál era su texto. Reportado con captura: «no se ve
          qué bullet se quiere cambiar». */}
      {check.line && (
        <div className="mx-3.5 mt-2.5">
          <Label>{t("card_your_line")}</Label>
          <Note className="mt-1">{check.line}</Note>
        </div>
      )}

      {/* Y LO QUE LE FALTA, bajo su propio rótulo. */}
      {check.evidence && check.evidence.length > 0 && (
        <div className="mx-3.5 mt-2.5">
          <Label>{t("card_whats_missing")}</Label>
          <ul className="mt-1 flex flex-col gap-1.5">
            {check.evidence.slice(0, 4).map((e, i) => (
              /* Marcada con su término: es lo que el informe usa para aterrizar
                 en esta tarjeta cuando se entra desde la fila de ese término. */
              <li key={`${check.id}-ev-${i}`} data-term={e}>
                <Note>{e}</Note>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 px-3.5 pb-3 pt-3">
        <Btn tone="ai" disabled={busy} onClick={onSolve}>
          <Sparkles className="h-3 w-3" />
          {writing ? t("writing") : t("fix_it")}
        </Btn>
        <Btn variant="quiet" onClick={onDismiss} className="ml-auto">
          {t("dismiss")}
        </Btn>
      </div>
    </Card>
  )
}

/**
 * LO YA RESUELTO, CON LO QUE CAMBIÓ.
 *
 * Una tarjeta que se esfuma al resolverla le saca al usuario la confirmación de
 * que su clic hizo algo, y con ella el único lugar donde puede releer lo que se
 * escribió en su CV.
 */
function DoneCard({
  entry,
  t,
  ta,
}: {
  entry: DoneEntry
  t: (k: string, v?: Record<string, string | number>) => string
  ta: (k: string, v?: Record<string, string | number>) => string
}) {
  const escritura = entry.kind === "applied"
  return (
    /* El tono dice qué pasó: lo que se escribió en el CV va en verde; sacar una
       línea y descartar una tarjeta son decisiones tuyas, no arreglos, y
       pintarlas con el tilde de «Aplicado» sería decirte que hiciste algo que no
       hiciste. */
    <Card tone={escritura ? "ok" : "neutral"} filled>
      <div className="flex items-start gap-2 px-3.5 py-3">
        {escritura ? (
          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: "var(--a-ok-ink)" }} />
        ) : (
          <Minus className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: "var(--a-muted)" }} />
        )}
        <div className="min-w-0 flex-1">
          <h4 className="text-[12.5px] font-bold leading-snug" style={{ color: escritura ? "var(--a-ok-ink)" : "var(--a-ink-2)" }}>
            {entry.title}
          </h4>
          <Label tone={escritura ? "ok" : "neutral"}>
            {entry.kind === "applied" ? ta("fix_applied") : t(`done_${entry.kind}`)}
          </Label>

          {/* EL MISMO ANTES/DESPUÉS QUE LA CONFIRMACIÓN.
              Es la misma pieza a propósito: si las dos pantallas lo dibujaran
              por su cuenta, una podría enseñar algo distinto de lo que quedó
              escrito en el CV. */}
          {/* Una línea que se SACÓ no tiene «después»: mostrar un antes/después
              con la mitad vacía se lee como que algo se escribió. Se muestra lo
              que había, que es lo único que hay para enseñar. */}
          {entry.after ? (
            <div className="mt-2">
              <Diff
                beforeLabel={ta("diff_current")}
                before={entry.before ?? ""}
                afterLabel={ta("diff_rewrite")}
                after={entry.after}
                tone={escritura ? "ok" : "neutral"}
              />
            </div>
          ) : (
            entry.before && (
              <Note tone="neutral" strike className="mt-2">
                {entry.before}
              </Note>
            )
          )}
        </div>
      </div>
    </Card>
  )
}

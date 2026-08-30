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
import { Check, Plus, Sparkles, X } from "lucide-react"
import { Z_MODAL } from "@/lib/ui/z-layers"
import { normalize } from "@/lib/ats3/contracts"
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
 * LOS VEREDICTOS QUE SON TRABAJO. `KEEP` no lo es.
 *
 * «Dejar — esta línea se gana su lugar» es una respuesta y no una tarea: no
 * tiene botón porque no hay nada que hacer. Contarlo en el botón del informe
 * sería prometer siete arreglos y abrir una pantalla con cuatro — el defecto
 * que este panel ya pagó tres veces: un número que cuenta lo que la función
 * SABE en vez de lo que la pantalla OFRECE.
 */
/**
 * ¿ESTA TARJETA LA CIERRA UN ACTO DETERMINISTA?
 *
 * La respuesta la daban DOS lugares con la misma expresión escrita a mano: el
 * botón de la tarjeta y el masivo. Iguales hoy, y el día que una cambie el
 * usuario ve un botón que el lote no toca — o al revés. Se pregunta una vez.
 */
export function esDeterminista(check: PanelCheck): boolean {
  return check.owner === "auto"
}

export function verdictsToDo(decisions: readonly TriageDecision[]): TriageDecision[] {
  return decisions.filter((d) => d.verdict !== "KEEP")
}

export default function TailorPanel({
  a,
  sections,
  findings,
  regressed,
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
  /** Lo mismo que cuenta el botón del informe: una cifra, un dueño. */
  const pendientes = useMemo(() => trabajo.length + verdictsToDo(a.triage).length, [trabajo, a.triage])
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
  const marcar = (check: PanelCheck, cambio?: { before?: string; after?: string }) => {
    onDone({ id: check.id, title: ta(check.titleKey, check.params), weight: check.weight, ...cambio })
  }

  /** Al aceptar, el hallazgo se conoce por su línea: es lo único que trae la propuesta. */
  const marcarPorNodo = (nodeId: string, cambio: { before: string; after: string }) => {
    const f = findings.find((x) => x.nodeId === nodeId)
    const c = f && trabajo.find((x) => x.id === f.id)
    if (c) marcar(c, cambio)
  }

  const nodoDe = (checkId: string) => findings.find((f) => f.id === checkId)



  /**
   * EL ACTO DETERMINISTA, EN UN SOLO LUGAR.
   *
   * Lo usan el botón de la tarjeta y el masivo. Escrito dos veces, uno de los
   * dos se olvida de anotar lo resuelto el día que cambie — que es como este
   * panel terminó con seis nombres para la misma regla.
   */
  const aplicarSolo = (check: PanelCheck) => {
    const f = nodoDe(check.id)
    if (!f) return
    // Se marca DESPUÉS y sólo si escribió: dar por resuelto lo que no se escribió
    // deja la tarjeta en pendientes y en hechas al mismo tiempo.
    if (a.addSkill(f.nodeId, f.detail)) marcar(check, { after: f.detail })
  }

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
  const enLote = mostradas.filter(esDeterminista)
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
        className="flex h-[88vh] max-h-[760px] w-full max-w-[840px] flex-col overflow-hidden rounded-2xl"
        style={{ background: "var(--a-bg)", boxShadow: "var(--a-sh-lg)" }}
        onClick={(e) => e.stopPropagation()}
      >
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

          {/* «APLICAR TODO» APLICA TODO LO QUE PUEDE APLICAR, Y LO DICE.
              Entra sólo lo que se ejecuta SOLO —agregar un término a
              Habilidades, que no llama al modelo ni gasta cuota—. Una
              reescritura necesita una consulta nueva y tu confirmación, así que
              en lote sería un clic disparando N llamadas que mueren todas en la
              misma pantalla; sacar una línea destruye contenido y no se hace sin
              verla. El criterio no se enumera, se DERIVA: es quién puede
              cerrarlo. Y si queda trabajo afuera se dice cuánto — dos números
              distintos uno al lado del otro, sin explicación, se leen como que
              el botón falla. */}
          {enLote.length > 0 && (
            <span className="ml-auto flex items-center gap-2">
              {pendientes > enLote.length && (
                <span className="text-[10.5px] leading-tight" style={{ color: "var(--a-muted-2)" }}>
                  {t("apply_all_rest", { count: pendientes - enLote.length })}
                </span>
              )}
              <button
                type="button"
                onClick={() => enLote.forEach(aplicarSolo)}
                className={`${PRESSABLE} flex min-h-[32px] items-center gap-1.5 rounded-lg px-3 text-[11.5px] font-bold text-white`}
                style={{ background: "var(--a-accent-ink)" }}
              >
                <Plus className="h-3 w-3" />
                {t("apply_all", { count: enLote.length })}
              </button>
            </span>
          )}
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
              {a.rejected.reason === "already_good"
                ? t("already_good")
                : `${t("rewrite_rejected")}${a.rejected.detail ? ` · ${a.rejected.detail}` : ""}`}
            </Note>
          )}

          {a.pending && (
            <SuggestionSheet
              suggestion={a.pending}
              onCancel={() => a.setPending(null)}
              onAccept={(text) => {
                marcarPorNodo(a.pending!.bulletId, { before: a.pending!.originalText, after: text })
                a.accept(a.pending!, text)
              }}
              gainOf={a.previewGain}
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
              busy={a.busyNode !== null}
              onSolve={() => {
                // No se marca acá: pedir una reescritura no es haberla
                // aplicado, y los guards pueden rechazarla.
                const f = nodoDe(check.id)
                if (f) a.requestRewrite(f.nodeId)
              }}
              onFix={() => aplicarSolo(check)}
              onDismiss={() => {
                // NO entra en «Hechas»: descartar no es arreglar. La lista de
                // resueltas existe para releer lo que se escribió en el CV, y
                // una tarjeta que el usuario rechazó no escribió nada — pintarla
                // con el tilde de «Aplicado» sería decirle que hizo algo que no
                // hizo.
                const f = nodoDe(check.id)
                if (f) a.dismiss(f.nodeId)
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
              onDrop={a.dropBullet}
              onUndo={a.undoDrop}
              onRewrite={a.requestRewrite}
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
  textOf,
  busyNode,
  t,
}: {
  decisions: TriageDecision[]
  onDrop: (nodeId: string) => { roleIndex: number; bulletIndex: number; text: string } | null
  onUndo: (roleIndex: number, bulletIndex: number, text: string) => void
  onRewrite: (nodeId: string) => void
  /** De qué línea habla cada veredicto. Sin esto el tablero es un acertijo. */
  textOf: (nodeId: string) => string
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

              {/* En REPLACE el motor NUNCA afirma que la persona hizo algo:
                  pregunta, y la respuesta es del usuario. */}
              {d.needsUserConfirm && (
                <span className="mt-1 block">
                  <em className="block not-italic" style={{ color: "var(--a-ink)" }}>{d.needsUserConfirm}</em>
                  <Btn disabled={busyNode !== null} onClick={() => onRewrite(d.bulletId)} className="mt-1">
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

              {d.verdict === "DROP" &&
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
                  <Btn variant="outline" onClick={() => setConfirmando(d)} className="mt-1">
                    {t("drop_it")}
                  </Btn>
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
  gainOf,
  t,
}: {
  suggestion: AnchoredSuggestion
  onCancel: () => void
  onAccept: (finalText: string) => void
  /** Los puntos que esto gana, MEDIDOS sobre una copia del CV. */
  gainOf: (s: AnchoredSuggestion, finalText: string) => number | null
  t: (k: string, v?: Record<string, string | number>) => string
}) {
  const [values, setValues] = useState<Record<string, string>>({})
  const [useVariant, setUseVariant] = useState(false)

  const requiredMissing = suggestion.placeholders.some((p) => p.required && !(values[p.token] ?? "").trim())

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
  const gain = useMemo(() => gainOf(suggestion, finalText), [finalText, gainOf, suggestion])

  /**
   * Los términos que la vacante pide y esta línea PASA A DECIR.
   *
   * Se comprueban contra el texto final en vez de creerle a la lista que
   * devuelve el modelo: prometer un término que la línea no dice es el defecto
   * que este panel ya pagó dos veces.
   */
  const lands = useMemo(() => {
    const dicho = normalize(finalText)
    return suggestion.keywordsUsed.filter((k) => k.trim() && dicho.includes(normalize(k))).slice(0, 6)
  }, [finalText, suggestion.keywordsUsed])

  return (
    <Card radius="2xl" className="overflow-hidden shadow-lg">
      {/* CABECERA: qué se te pide decidir, y qué ganás con decir que sí. */}
      <div
        className="flex items-start justify-between gap-3 px-4 py-3"
        style={{ background: "var(--a-surface-2)", borderBottom: "1px solid var(--a-border)" }}
      >
        <h3 className="text-[13px] font-semibold leading-snug" style={{ color: "var(--a-ink)" }}>
          {t("confirm_title")}
        </h3>
        {/* Un cero no se disfraza: hay reescrituras que arreglan cómo se lee y no
            mueven el número, y decirlo es lo que hace creíble al resto. */}
        {gain !== null && (
          <Chip tone={gain > 0 ? "ok" : "neutral"} className="shrink-0">
            {gain > 0 ? t("gain_points", { points: gain.toFixed(1) }) : t("gain_none")}
          </Chip>
        )}
      </div>

      <div className="px-4 py-3">
        {/* EL CAMBIO, con la misma pieza que usa la tarjeta de lo resuelto. */}
        <Diff beforeLabel={t("before")} before={suggestion.originalText} afterLabel={t("after")} after={finalText} />

        {/* DE DÓNDE SALEN LOS PUNTOS: los términos del aviso que esta línea pasa
            a decir. Un número sin su motivo se aprende a ignorar. */}
        {lands.length > 0 && (
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {lands.map((k) => (
              <li key={k}>
                <Chip>{k}</Chip>
              </li>
            ))}
          </ul>
        )}

        {!useVariant &&
          suggestion.placeholders.map((p: Placeholder) => (
            <div key={p.token} className="mt-3">
              <label
                className="mb-1 block text-[11.5px] font-semibold"
                htmlFor={`slot-${p.token}`}
                style={{ color: "var(--a-ink-2)" }}
              >
                {p.label} {p.required && <span style={{ color: "var(--a-bad)" }}>*</span>}
              </label>
              <input
                id={`slot-${p.token}`}
                value={values[p.token] ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [p.token]: e.target.value }))}
                className="w-full rounded-lg px-3 py-2.5 text-[13px] outline-none transition-colors focus:border-[var(--a-accent)]"
                style={{ background: "var(--a-surface-2)", border: "1px solid var(--a-border)", color: "var(--a-ink)" }}
                placeholder={p.token}
                inputMode="numeric"
              />
              <p className="mt-1 text-[11px] leading-snug" style={{ color: "var(--a-muted)" }}>{p.hint}</p>
              <p className="text-[11px] leading-snug" style={{ color: "var(--a-muted-2)" }}>
                {t("evidence")}: {p.evidenceNeeded}
              </p>
            </div>
          ))}

        {suggestion.variantWithoutMetric && suggestion.placeholders.length > 0 && (
          <label
            className="mt-3 flex cursor-pointer items-start gap-2 rounded-lg px-2.5 py-2 text-[11.5px] leading-snug"
            style={{ background: "var(--a-surface-2)", color: "var(--a-ink-2)" }}
          >
            {/* Si no tiene el dato, la salida es una versión sin cifra — nunca un
                número que puso el modelo. Y esa versión NO puede llevarse la
                cifra que el original ya traía: eso lo hace cumplir el guard. */}
            <input
              type="checkbox"
              checked={useVariant}
              onChange={(e) => setUseVariant(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--a-accent)]"
            />
            {t("no_data")}
          </label>
        )}
      </div>

      <div
        className="flex gap-2 px-4 py-3"
        style={{ background: "var(--a-surface-2)", borderTop: "1px solid var(--a-border)" }}
      >
        {/* El de aplicar es el ÚNICO principal de esta pantalla, y queda apagado
            mientras falte la cifra: no por un `if` del que llama, sino por el
            estado de acá. */}
        <Btn disabled={blocked} onClick={() => onAccept(finalText)} className="min-h-[44px] flex-1 !text-[13px]">
          {blocked ? t("fill_required") : t("apply")}
        </Btn>
        <Btn variant="outline" onClick={onCancel} className="min-h-[44px] !text-[13px]">
          {t("cancel")}
        </Btn>
      </div>
    </Card>
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
  onSolve,
  onFix,
  onDismiss,
  t,
  ta,
}: {
  check: PanelCheck
  order: number
  regressed: boolean
  busy: boolean
  onSolve: () => void
  onFix: () => void
  onDismiss: () => void
  t: (k: string, v?: Record<string, string | number>) => string
  ta: (k: string, v?: Record<string, string | number>) => string
}) {
  const puedeAgregar = esDeterminista(check)
  const puedeReescribir = !puedeAgregar
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

      {/* QUÉ LO DISPARÓ, NOMBRADO. Un aviso que no dice dónde deja al usuario
          buscándolo. Envuelve y no corta: el dato suele estar al final. */}
      {check.evidence && check.evidence.length > 0 && (
        <ul className="mx-3.5 mt-2.5 flex flex-col gap-1.5">
          {check.evidence.slice(0, 4).map((e, i) => (
            <li key={`${check.id}-ev-${i}`}>
              <Note>{e}</Note>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-2 px-3.5 pb-3 pt-3">
        {puedeReescribir && (
          <Btn tone="ai" disabled={busy} onClick={onSolve}>
            <Sparkles className="h-3 w-3" />
            {busy ? t("writing") : t("fix_it")}
          </Btn>
        )}
        {/* El arreglo determinista: no llama al modelo y no gasta cuota, así que
            no comparte el botón con la reescritura. */}
        {puedeAgregar && (
          <Btn variant="outline" onClick={onFix}>
            <Plus className="h-3 w-3" />
            {ta("term_add")}
          </Btn>
        )}
        {puedeReescribir && (
          <Btn variant="quiet" onClick={onDismiss} className="ml-auto">
            {t("dismiss")}
          </Btn>
        )}
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
  void t
  return (
    <Card tone="ok" filled>
      <div className="flex items-start gap-2 px-3.5 py-3">
        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: "var(--a-ok-ink)" }} />
        <div className="min-w-0 flex-1">
          <h4 className="text-[12.5px] font-bold leading-snug" style={{ color: "var(--a-ok-ink)" }}>
            {entry.title}
          </h4>
          <Label tone="ok">{ta("fix_applied")}</Label>

          {/* EL MISMO ANTES/DESPUÉS QUE LA CONFIRMACIÓN.
              Es la misma pieza a propósito: si las dos pantallas lo dibujaran
              por su cuenta, una podría enseñar algo distinto de lo que quedó
              escrito en el CV. */}
          {entry.after && (
            <div className="mt-2">
              <Diff
                beforeLabel={ta("diff_current")}
                before={entry.before ?? ""}
                afterLabel={ta("diff_rewrite")}
                after={entry.after}
                tone="ok"
              />
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

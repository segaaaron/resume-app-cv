"use client"

// components/editor/ats3/useAts3.ts
//
// EL PUENTE ENTRE EL MOTOR Y LA PANTALLA.
//
// Lee los actos a medida que llegan y los pinta apenas llegan: el puntaje está
// listo en milisegundos y el triage tarda segundos, así que esperar a tenerlo
// todo sería regalar pantalla quieta.
//
// ── LO QUE ESTE ARCHIVO NO HACE, A PROPÓSITO ────────────────────────────────
// No decide nada. No puntúa, no juzga una reescritura, no calcula una ganancia.
// Todo eso vive en `lib/ats3/` y se prueba ejecutándolo. Acá sólo hay estado de
// pantalla: qué llegó, qué se está esperando y qué falló.

import { useCallback, useMemo, useRef, useState } from "react"
import { apiFetch } from "@/lib/apiFetch"
import { useResumeStore } from "@/stores/resumeStore"
import { useAtsPostingStore } from "@/stores/atsPostingStore"
import { appendBullet, applySuggestion, buildTree, removeNode, writeBack, writeInto, readBullets, type RawResume } from "@/lib/ats3/engine"
import { openLedger } from "@/lib/ats3/ledger"
import { findNode } from "@/lib/ats3/guards"
import { nodeHash, normalize } from "@/lib/ats3/contracts"
import type { AnchoredSuggestion, Finding, JobSpec, Resolution, TriageDecision } from "@/lib/ats3/contracts"
import { scoreResume, type AuditFacts, type ParseChecks, type Score } from "@/lib/ats3/score"

export type FailureReason = string

/**
 * LO QUE «HECHAS» NECESITA PARA DIBUJAR UNA FILA, y viaja hasta el registro.
 *
 * Lo arma la pantalla —es la única que tiene la copia traducida— y se guarda con
 * la resolución. Así el registro tiene UN dueño y dos lectores: el motor, que lo
 * usa para no volver a señalar lo cerrado, y la lista, que lo vuelve a dibujar
 * después de recargar.
 */
export interface DoneRecord {
  title: string
  kind: "applied" | "dropped" | "dismissed"
  before?: string
  after?: string
}

export interface Ats3State {
  score: Score | null
  spec: JobSpec | null
  findings: Finding[]
  regressed: Finding[]
  suppressed: number
  /** Lo que el usuario ya cerró en corridas anteriores. Sobrevive a recargar. */
  resolved: Resolution[]
  triage: TriageDecision[]
  /** Términos de la vacante que el CV ya demuestra. Guían el presupuesto. */
  covered: string[]
  /** Llamadas que la última corrida gastó de verdad. Cero = todo del caché. */
  calls: number | null
  /**
   * LOS DOS INSUMOS CON LOS QUE SE MIDIÓ, para poder volver a medir.
   *
   * El puntaje se recalcula al aplicar con la MISMA función del motor. Guardar
   * la auditoría y las verificaciones es lo que lo hace posible sin gastar una
   * llamada; sin ellos, arreglar diez cosas dejaba el dial clavado.
   */
  audit: AuditFacts | null
  checks: ParseChecks
  /** El peso de cada requisito, medido sobre el aviso. Sin él, todos valen 1. */
  weights: Record<string, number>
}

const EMPTY: Ats3State = {
  score: null,
  spec: null,
  findings: [],
  regressed: [],
  suppressed: 0,
  resolved: [],
  triage: [],
  covered: [],
  calls: null,
  audit: null,
  checks: {},
  weights: {},
}

import type { ResumeSections, WorkExperienceItem } from "@/types/resume"

/**
 * Una línea resuelta desaparece de TODO lo que habla de ella.
 *
 * Vive fuera del hook y no repetida en cada acción: cuando esto se hacía a mano,
 * cada camino se acordaba de una lista distinta.
 */
function olvidar(st: Ats3State, quien: { nodeId: string } | { findingId: string }): Ats3State {
  /**
   * DOS COSAS DISTINTAS QUE ANTES SE PEDÍAN IGUAL.
   *
   * `nodeId` es «esta línea ya no está» —la sacaste del CV—, y entonces se va
   * TODO lo que hablaba de ella. `findingId` es «cerré este hallazgo», y ahí
   * sólo se va ése.
   *
   * Mientras una línea tenía una sola tarjeta daba lo mismo. Desde que un
   * requisito que falta abre la suya, una viñeta puede tener DOS —lo que le
   * falta a la línea y los términos que tiene que aterrizar—, y borrar por
   * línea hacía desaparecer la segunda al resolver la primera: trabajo que el
   * usuario no hizo, esfumado sin que nadie se lo dijera. La que queda se sigue
   * leyendo bien porque su evidencia sale del CV vivo, no de la foto vieja.
   */
  const fuera = (f: { id: string; nodeId: string }) =>
    "nodeId" in quien ? f.nodeId === quien.nodeId : f.id === quien.findingId
  return {
    ...st,
    findings: st.findings.filter((f) => !fuera(f)),
    regressed: st.regressed.filter((f) => !fuera(f)),
    // El veredicto habla de la LÍNEA entera: se retira cuando se retira ella, o
    // cuando el hallazgo que se cerró era el de esa misma línea.
    triage: st.triage.filter((d) =>
      "nodeId" in quien
        ? d.bulletId !== quien.nodeId
        : d.bulletId !== st.findings.find((f) => f.id === quien.findingId)?.nodeId,
    ),
  }
}

export function useAts3(resumeId: string, language: "es" | "en") {
  const sectionData = useResumeStore((s: { sectionData: ResumeSections }) => s.sectionData)
  const updateSectionData = useResumeStore(
    (s: { updateSectionData: <K extends keyof ResumeSections>(k: K, v: ResumeSections[K]) => void }) => s.updateSectionData,
  )

  /** Se lee fuera del render: escribir la vacante no puede re-renderizar nada. */
  const setPosting = useAtsPostingStore((s) => s.setPosting)

  const [jd, setJd] = useState("")
  const [state, setState] = useState<Ats3State>(EMPTY)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  /** La línea que se está reescribiendo ahora. Un botón sin estado se lee como roto. */
  const [busyNode, setBusyNode] = useState<string | null>(null)
  const [rejected, setRejected] = useState<{ nodeId: string; reason: FailureReason; detail: string } | null>(null)
  const [pending, setPending] = useState<AnchoredSuggestion | null>(null)
  /** Cuál de las tarjetas de esa línea pidió la reescritura. Ver `olvidar`. */
  const [pendingFinding, setPendingFinding] = useState<string | null>(null)
  const inFlight = useRef<AbortController | null>(null)

  const payloadResume = useCallback(
    (): RawResume => ({
      summary: sectionData.summary ?? "",
      workExperience: (sectionData.workExperience ?? []).map((r) => ({
        jobTitle: r.jobTitle ?? "",
        employer: r.employer ?? "",
        startDate: r.startDate ?? "",
        endDate: r.endDate ?? "",
        description: r.description ?? "",
      })),
      skills: (sectionData.skills ?? []).map((s) => ({ name: s.name ?? "" })),
    }),
    [sectionData],
  )

  /**
   * Corre el análisis y pinta cada acto al llegar.
   *
   * Una corrida nueva cancela la anterior: dos análisis pisándose escriben el
   * mismo estado en desorden, y lo que queda en pantalla es el que terminó
   * último, no el que el usuario pidió último.
   */
  const analyze = useCallback(async () => {
    if (jd.trim().length < 20) return
    inFlight.current?.abort()
    const ctrl = new AbortController()
    inFlight.current = ctrl

    setLoading(true)
    setError(null)
    setState(EMPTY)
    try {
      const res = await apiFetch("/api/ai/ats3", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: ctrl.signal,
        body: JSON.stringify({
          resumeId,
          jobDescription: jd,
          language,
          resume: payloadResume(),
          checks: {},
        }),
      })
      // UN FALLO DEL SERVIDOR NO ES UN ACTO. Sin esto, un 500 se leía como
      // NDJSON, ningún `act` coincidía y la pantalla quedaba igual que antes de
      // apretar: el usuario veía un aviso genérico arriba y ninguna razón.
      if (!res.ok) {
        const detail = await res.json().catch(() => null)
        throw new Error(typeof detail?.error === "string" ? detail.error : `http_${res.status}`)
      }
      const body = res.body
      if (!body) throw new Error("empty_response")

      const reader = body.getReader()
      const dec = new TextDecoder()
      let buffer = ""
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += dec.decode(value, { stream: true })
        // Una línea entera es un acto. Lo que quede a medias espera al próximo
        // trozo: parsear un JSON cortado tira toda la corrida.
        //
        // Se corta buscando el salto en vez de partir la cadena entera porque en
        // este archivo también se leen descripciones de puestos, y esas SÓLO se
        // leen con su lector oficial. Un archivo que hace las dos cosas es donde
        // el próximo se confunde.
        for (;;) {
          const cut = buffer.indexOf("\n")
          if (cut === -1) break
          const line = buffer.slice(0, cut)
          buffer = buffer.slice(cut + 1)
          if (line.trim()) apply(JSON.parse(line))
        }
      }
      if (buffer.trim()) apply(JSON.parse(buffer))
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return
      setError(e instanceof Error ? e.message : "error")
    } finally {
      setLoading(false)
    }

    function apply(act: Record<string, unknown>) {
      switch (act.act) {
        case "score":
          setState((s) => ({
            ...s,
            score: act.score as Score,
            audit: act.audit as AuditFacts,
            checks: act.checks as ParseChecks,
            // La pantalla mide con los MISMOS pesos que el motor: si no, el
            // número cambiaría según quién lo calculó.
            weights: (act.weights as Record<string, number>) ?? {},
          }))
          break
        case "job": {
          const spec = act.spec as JobSpec
          setState((s) => ({ ...s, spec }))
          /**
           * LA VACANTE QUEDA DISPONIBLE PARA TODO EL EDITOR.
           *
           * ── EL CABLE QUE ESTABA CORTADO (hallado el 2026-08-29) ───────────
           * `atsPostingStore` existe por una orden del CEO —«el ATS manda: todo
           * lo que tenga el ATS debe consultar al ATS»— y su único escritor era
           * el panel viejo, borrado ayer. Quedó con lector y sin escritor: el
           * asistente de IA, que escribe viñetas y el resumen EN EL MISMO CV,
           * volvió a hacerlo sin saber contra qué puesto se postula la persona.
           * No rompía nada; degradaba en silencio, que es peor.
           *
           * Viaja el término COMO LO ESCRIBE LA VACANTE: es la forma que el
           * filtro reconoce, y la misma que este motor usa para el índice.
           */
          setPosting({
            terms: [...spec.mustHave, ...spec.niceToHave].map((r) => r.raw || r.skill).filter(Boolean),
            jobTitle: spec.roleTitleCanonical || spec.roleTitleRaw,
            // El alcance: un CV distinto NO hereda la vacante del anterior.
            resumeId,
          })
          break
        }
        case "covered":
          setState((s) => ({ ...s, covered: act.terms as string[] }))
          break
        case "findings":
          setState((s) => ({
            ...s,
            findings: act.findings as Finding[],
            regressed: act.regressed as Finding[],
            suppressed: act.suppressed as number,
            resolved: (act.resolved as Resolution[]) ?? [],
          }))
          break
        case "triage":
          setState((s) => ({
            ...s,
            triage: act.decisions as TriageDecision[],
          }))
          break
        case "done":
          setState((s) => ({ ...s, calls: (act.telemetry as { calls: number }).calls }))
          break
        case "error":
          setError(String(act.error))
          break
      }
    }
  }, [jd, language, payloadResume, resumeId, setPosting])

  /**
   * Pide la reescritura de UNA línea.
   *
   * No escribe nada: deja la propuesta esperando confirmación. El texto entra al
   * CV cuando el usuario lo acepta, y con los huecos ya completados por él.
   */
  const requestRewrite = useCallback(
    /**
     * `focus` es LO QUE LA TARJETA PROMETIÓ, y viaja con el pedido.
     *
     * La pantalla y el modelo tenían dos ideas distintas de qué hay que arreglar
     * en esta línea: la tarjeta decía «le falta el método y hay que demostrar
     * Trabajo en equipo» y al modelo se le mandaba el CV, la vacante y nada más.
     * Se dice una vez, en un solo lugar, y los dos leen lo mismo.
     */
    async (nodeId: string, findingId?: string, focus?: string, mergeWith?: string, addToRole?: string) => {
      if (!state.spec) return
      setBusyNode(nodeId)
      setPendingFinding(findingId ?? null)
      setRejected(null)
      try {
        const res = await apiFetch("/api/ai/ats3", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "rewrite",
            resumeId,
            nodeId,
            jobDescription: jd,
            language,
            resume: payloadResume(),
            spec: state.spec,
            /**
             * Lo que la vacante pide y el CV YA demuestra.
             *
             * Iba vacío, y con eso el ledger marcaba TODOS los términos como
             * prioritarios: el modelo no tenía forma de saber dónde conviene
             * gastar el presupuesto de palabras clave, que es justo la decisión
             * que mueve el puntaje.
             */
            covered: state.covered,
            focus,
            mergeWith,
            addToRole,
          }),
        })
        // Mismo motivo que en el análisis: un 500 devuelve `{error}` y sin este
        // corte se pintaba como un rechazo del motor con el motivo en blanco.
        if (!res.ok) {
          const detail = await res.json().catch(() => null)
          throw new Error(typeof detail?.error === "string" ? detail.error : `http_${res.status}`)
        }
        const data = (await res.json()) as
          | { ok: true; suggestion: AnchoredSuggestion; served: boolean }
          | { ok: false; reason: string; detail: string }
        if (data.ok) setPending(data.suggestion)
        else setRejected({ nodeId, reason: data.reason, detail: data.detail })
      } catch (e) {
        setError(e instanceof Error ? e.message : "error")
      } finally {
        setBusyNode(null)
      }
    },
    // `state.covered` va en la lista: la petición lo MANDA, y sin él la función
    // se queda con la foto del primer render. A medida que el usuario resuelve
    // cosas esa lista cambia, y el ledger la usa para decidir dónde conviene
    // gastar el presupuesto de términos — con la vieja, el modelo prioriza lo
    // que ya está cubierto.
    [jd, language, payloadResume, resumeId, state.covered, state.spec],
  )

  /**
   * REGISTRA QUE UN HALLAZGO QUEDÓ RESUELTO.
   *
   * Sin esto, la memoria del motor leía siempre un registro vacío y volvía a
   * señalar lo que el usuario ya había arreglado en cuanto reanalizaba — el
   * bucle que este producto ya pagó una vez, con la defensa escrita, probada y
   * desconectada.
   *
   * No gasta cuota ni llama al modelo. Va sin `await` a propósito: el CV ya
   * está escrito y el usuario no tiene que esperar a que la base confirme nada.
   * Si falla, se pierde una anotación, nunca el arreglo.
   */
  const registrarResuelto = useCallback(
    /**
     * SE ANOTA EL HALLAZGO QUE SE CERRÓ, NO LA LÍNEA ENTERA.
     *
     * `olvidar` ya distinguía las dos cosas en la pantalla —cerrar un hallazgo
     * retira ése, sacar la línea retira todo lo que hablaba de ella— y esto se
     * quedó anotando por nodo. Las dos respuestas discrepaban, y la que
     * sobrevivía al análisis siguiente era la equivocada: con dos tarjetas sobre
     * la misma viñeta, cerrar una escribía la resolución de las DOS y la otra no
     * volvía. Descartada a mano, no volvía NUNCA.
     *
     * Sin `findingId` se anota la línea entera, que es lo correcto en el único
     * caso donde eso es cierto: `dropBullet`, donde la viñeta deja de existir.
     */
    (
      nodeId: string,
      texto: string,
      resolvedBy: "AI_SUGGESTION" | "DISMISSED",
      findingId?: string,
      /** Con qué nombre se cerró y qué quedó escrito: es lo que «Hechas» dibuja. */
      registro?: DoneRecord,
    ) => {
      const deLaLinea = [...state.findings, ...state.regressed].filter((f) => f.nodeId === nodeId)
      const hallazgos = findingId ? deLaLinea.filter((f) => f.id === findingId) : deLaLinea
      if (hallazgos.length === 0 || jd.trim().length < 20) return
      // Envuelto: una anotación que falla —o una petición que ni sale— NO puede
      // tumbar el aplicado. El CV ya está escrito; esto es memoria, no el acto.
      void (async () => {
        try {
          await apiFetch("/api/ai/ats3", {
            method: "POST",
            silent: true,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "resolve",
              resumeId,
              jobDescription: jd,
              entries: hallazgos.map((f) => ({
                findingId: f.id,
                nodeId: f.nodeId,
                // El hash de lo que QUEDÓ escrito: es lo que después distingue
                // una re-detección falsa (el texto sigue igual) de una regresión
                // real (el usuario lo tocó y lo volvió a romper).
                nodeHashAtResolution: nodeHash(texto),
                resolvedBy,
                ...registro,
              })),
            }),
          })
        } catch {
          /* se pierde una anotación, nunca el arreglo */
        }
      })()
    },
    [jd, resumeId, state.findings, state.regressed],
  )

  /**
   * Escribe la propuesta en el CV.
   *
   * `finalText` es lo que quedó en la caja después de que el usuario completara
   * los huecos — NUNCA la propuesta cruda del modelo. Aplicar `preview` cuando
   * el usuario ya lo editó es escribir algo que nadie aceptó.
   */
  const accept = useCallback(
    (s: AnchoredSuggestion, finalText: string, registro?: DoneRecord) => {
      const raw = payloadResume()
      const tree = buildTree(raw)

      /**
       * Si la línea ya no está, NO se escribe y NO se dice que se aplicó.
       *
       * Este proyecto ya pagó exactamente este defecto: un botón que marcaba
       * "hecho" justo cuando no hacía nada. Pasa cuando el usuario edita el CV
       * entre pedir la propuesta y aceptarla, o si el id no corresponde a este
       * documento. Silencio es la peor respuesta posible: el usuario cree que su
       * CV cambió y descarga un PDF que no cambió.
       */
      // Una línea NUEVA no tiene nodo que buscar: lo que tiene que existir es el
      // puesto donde se escribe. Si el usuario lo borró entre pedir y aceptar,
      // no hay dónde ponerla y se dice, en vez de escribir en el puesto de al lado.
      const destinoValido = s.addToRole
        ? tree.roles.some((r) => r.id === s.addToRole)
        : Boolean(findNode(tree, s.bulletId))
      if (!destinoValido) {
        setError("stale_node")
        return
      }

      /**
       * SE APLICA MIDIENDO, y con la función del motor.
       *
       * `applySuggestion` escribe sobre una COPIA, vuelve a puntuar y resta: el
       * número que sube el dial es el que el puntaje da de verdad, no una
       * promesa. Antes la pantalla escribía a ciegas y el dial quedaba clavado
       * hasta reanalizar —una llamada más—, así que el usuario arreglaba cinco
       * cosas y no veía moverse nada.
       *
       * Lo que el código NO puede probar sin volver a preguntar —si la línea
       * ahora tiene resultado y método, si el requisito quedó cubierto— NO se
       * suma acá: eso sería creerle al modelo sobre su propio trabajo. Se
       * confirma al reanalizar.
       */
      const medido =
        state.spec && state.audit
          ? applySuggestion(tree, { ...s, text: finalText }, state.spec, state.audit, state.checks,
              openLedger(tree, state.spec, new Set(state.covered)), state.weights)
          : null
      if (medido && !medido.ok) {
        setError(medido.reason && !medido.reason.ok ? medido.reason.reason : "stale_node")
        return
      }

      // Sin los insumos de la medición se escribe igual: el CV del usuario nunca
      // depende de que hayamos podido recalcular su puntaje.
      /**
       * EN UNA FUSIÓN, LA LÍNEA ABSORBIDA SE VA EN EL MISMO ACTO.
       *
       * `applySuggestion` ya lo hace sobre su copia; este camino de respaldo
       * —el que corre cuando no se pudo recalcular el puntaje— tenía que
       * hacerlo también, o el CV quedaba con la fusionada Y la original: el
       * mismo trabajo contado dos veces, que es lo que la fusión venía a
       * arreglar. Dos caminos de escritura que no hacen lo mismo es como este
       * panel ya se contradijo antes.
       */
      const escrito = s.addToRole
        ? appendBullet(tree, s.addToRole, finalText)
        : writeInto(tree, s.bulletId, finalText)
      const aMano = s.mergedFrom ? removeNode(escrito, s.mergedFrom) : escrito
      const written = writeBack(medido ? medido.tree : aMano, raw)
      if (s.bulletId === "summary") updateSectionData("summary", written.summary ?? "")
      else {
        // Sólo los puestos: escribir el CV entero pisaría lo que el usuario
        // tenga a medio tipear en cualquier otra sección.
        const roles: WorkExperienceItem[] = (sectionData.workExperience ?? []).map((role, i) => ({
          ...role,
          description: written.workExperience?.[i]?.description ?? role.description,
        }))
        updateSectionData("workExperience", roles)
      }
      setPending(null)
      registrarResuelto(s.bulletId, finalText, "AI_SUGGESTION", pendingFinding ?? undefined, registro)
      /**
       * EL DIAL SE MUEVE ACÁ, con la medición del motor sobre el CV nuevo.
       *
       * Se recalcula el Score COMPLETO y no sólo el total: el dial, los pilares
       * y el porcentaje de cada sección salen todos de este objeto, y subir el
       * total dejando lo demás quieto sería el panel contradiciéndose consigo
       * mismo en la misma pantalla.
       */
      if (medido && state.spec && state.audit) {
        const nuevo = scoreResume(medido.tree, state.spec, state.audit, state.checks, state.weights)
        setState((st) => ({ ...st, score: nuevo }))
      }
      // La línea se retira de las TRES listas que hablan de ella.
      //
      // Sacarla sólo de `findings` dejaba en pantalla el hallazgo REGRESADO
      // sobre la misma línea —el panel pinta las dos listas juntas— y el
      // veredicto del triage ofreciendo reescribir lo que se acaba de
      // reescribir. Las dos cosas se leen igual: «lo arreglé y me lo vuelve a
      // pedir», que es el bucle que este motor existe para no tener.
      /**
       * SE RETIRA TODO LO QUE HABLABA DE ESA LÍNEA, no sólo el que cerraste.
       *
       * ── EL DEFECTO QUE ESTO CIERRA (CEO, 2026-09-09, con captura) ───────────
       * Esto retiraba SÓLO el hallazgo aplicado. Los demás de la misma viñeta
       * quedaban en pantalla — y estaban medidos contra un texto QUE YA NO
       * EXISTE. Peor: la tarjeta muestra el texto vivo, así que el usuario veía
       * la línea recién construida con un cartel debajo diciéndole que le falta
       * algo, calculado sobre la versión anterior. «De un bullet ya construido
       * no puedes pedir mejorar», textual.
       *
       * La distinción que SÍ hay que conservar —y por la que `olvidar` tiene dos
       * formas— es otra: agregar a Habilidades NO cambia la línea, así que ahí
       * se retira sólo su hallazgo. Acá el texto cambió, y con él caduca todo lo
       * que se dijo sobre él. Lo que siga faltando vuelve en el próximo
       * análisis, medido sobre lo que ahora hay escrito.
       */
      setState((st) => {
        const sinLaLinea = olvidar(st, { nodeId: s.bulletId })
        // La absorbida ya no existe: se va TODO lo que hablaba de ella, incluido
        // su veredicto. Si no, el tablero sigue ofreciendo fusionar una línea
        // que el usuario acaba de fusionar.
        return s.mergedFrom ? olvidar(sinLaLinea, { nodeId: s.mergedFrom }) : sinLaLinea
      })
    },
    [payloadResume, pendingFinding, registrarResuelto, sectionData.workExperience, state.audit, state.checks, state.covered, state.spec, state.weights, updateSectionData],
  )

  /**
   * Saca una línea del CV.
   *
   * Es la acción del veredicto DROP y NO gasta un token: quitar una viñeta es
   * determinista. Devuelve el texto que sacó para poder deshacerlo — es la
   * primera acción de este producto que DESTRUYE contenido, y un borrado que no
   * se puede revertir no se ofrece.
   */
  const dropBullet = useCallback(
    (nodeId: string, registro?: DoneRecord): { roleIndex: number; bulletIndex: number; text: string } | null => {
      const raw = payloadResume()
      const tree = buildTree(raw)
      const roleIndex = tree.roles.findIndex((r) => r.bullets.some((b) => b.id === nodeId))
      if (roleIndex === -1) {
        setError("stale_node")
        return null
      }
      const bulletIndex = tree.roles[roleIndex].bullets.findIndex((b) => b.id === nodeId)
      const quitada = tree.roles[roleIndex].bullets[bulletIndex]
      const roles: WorkExperienceItem[] = (sectionData.workExperience ?? []).map((role, i) =>
        i !== roleIndex
          ? role
          : {
              ...role,
              description: tree.roles[roleIndex].bullets
                .filter((b) => b.id !== nodeId)
                .map((b) => `• ${b.text}`)
                .join("\n"),
            },
      )
      updateSectionData("workExperience", roles)
      /**
       * SACAR UNA LÍNEA TAMBIÉN SE ANOTA, y por un motivo que cambió.
       *
       * Mientras el registro servía sólo para que el motor no repitiera un
       * hallazgo, anotar un borrado no tenía a quién contestarle: la línea ya no
       * está en el árbol del análisis siguiente. Desde que ese mismo registro es
       * el que dibuja «Hechas» —para que sobreviva a recargar—, es su casa: sin
       * esto, el usuario recarga y no tiene dónde ver qué sacó de su CV.
       *
       * Va sin `findingId`: la viñeta dejó de existir, así que se cierra TODO lo
       * que hablaba de ella. Es el único caso donde eso es cierto.
       */
      registrarResuelto(nodeId, quitada.text, "DISMISSED", undefined, registro)
      setState((st) => olvidar(st, { nodeId }))
      return { roleIndex, bulletIndex, text: quitada.text }
    },
    [payloadResume, registrarResuelto, sectionData.workExperience, updateSectionData],
  )

  /**
   * Vuelve a poner la línea que se sacó, EN SU LUGAR.
   *
   * Pegarla al final era medio deshacer: el CV quedaba distinto del que el
   * usuario tenía antes de apretar, con la línea al pie de un puesto que la
   * traía tercera. Un "deshacer" que no devuelve el estado anterior no es un
   * deshacer, y en un documento el orden es contenido.
   */
  const undoDrop = useCallback(
    (roleIndex: number, bulletIndex: number, text: string) => {
      const roles: WorkExperienceItem[] = (sectionData.workExperience ?? []).map((role, i) => {
        if (i !== roleIndex) return role
        const lineas = readBullets(role.description ?? "")
        lineas.splice(Math.min(Math.max(bulletIndex, 0), lineas.length), 0, text)
        return { ...role, description: lineas.map((t) => `• ${t}`).join("\n") }
      })
      updateSectionData("workExperience", roles)
    },
    [sectionData.workExperience, updateSectionData],
  )


  /**
   * ESCRIBE LA LISTA DE HABILIDADES QUE EL USUARIO ACEPTÓ.
   *
   * Conserva el objeto de las que ya tenía —su id y su nivel son datos suyos, no
   * del motor— y sólo crea las que entran. Se llama DESPUÉS de que el usuario
   * vio qué sale y qué entra: acá no se decide nada.
   */
  const applySkills = useCallback(
    (final: readonly string[]) => {
      const actuales = useResumeStore.getState().sectionData.skills ?? []
      const porNombre = new Map(actuales.map((s) => [normalize(s.name ?? ""), s]))
      updateSectionData(
        "skills",
        final.map(
          (nombre) =>
            porNombre.get(normalize(nombre)) ?? { id: `sk_${nodeHash(nombre)}`, name: nombre, level: "intermediate" },
        ) as ResumeSections["skills"],
      )
    },
    [updateSectionData],
  )

  /**
   * CUÁNTO GANA ESTA REESCRITURA, MEDIDO — no prometido.
   *
   * La hoja de confirmación mostraba el antes y el después y nada más: el
   * usuario tenía que decidir a ojo si le convenía. El motor ya sabe la
   * respuesta —`applySuggestion` escribe sobre una COPIA, vuelve a puntuar y
   * resta— y es exactamente el número que el dial va a moverse al aplicar, así
   * que la pantalla no puede prometer puntos que el puntaje no vaya a dar.
   *
   * Se mide sobre el texto FINAL, con los huecos ya completados: el aporte
   * cambia cuando el candidato escribe su cifra, y enseñarle la ganancia de un
   * texto que no es el que se va a escribir es la misma mentira de siempre.
   *
   * `null` cuando no se pudo medir (sin auditoría todavía, o la línea cambió):
   * un cero se leería como "no sirve de nada", que es la conclusión opuesta.
   */
  const previewGain = useCallback(
    (s: AnchoredSuggestion, finalText: string): number | null => {
      if (!state.spec || !state.audit) return null
      const tree = buildTree(payloadResume())
      const r = applySuggestion(
        tree,
        { ...s, text: finalText },
        state.spec,
        state.audit,
        state.checks,
        openLedger(tree, state.spec, new Set(state.covered)),
        state.weights,
      )
      return r.ok ? r.delta : null
    },
    [payloadResume, state.audit, state.checks, state.covered, state.spec, state.weights],
  )

  /**
   * EL TEXTO VIVO DE UNA LÍNEA, POR SU ID.
   *
   * El triage viaja con `bulletId` y nada más —así lo devuelve el modelo— y la
   * pantalla no tenía forma de decir DE QUÉ LÍNEA habla cada veredicto: mostraba
   * "Sacar · duplica la viñeta de arriba" sobre un CV de veinte líneas. Un
   * veredicto sin su sujeto no es una recomendación, es un acertijo, y el
   * borrado pedía confirmación sin enseñar lo que iba a borrar.
   *
   * Se resuelve contra el CV VIVO y no contra una copia que el motor mandó
   * cuando analizó: entre el análisis y el clic el usuario puede haber editado,
   * y enseñar el texto viejo antes de un borrado es peor que no enseñar nada.
   *
   * Es un mapa y no una búsqueda por fila: armar el árbol una vez por render en
   * vez de una vez por veredicto.
   */
  const textOf = useMemo(() => {
    const tree = buildTree(payloadResume())
    const m = new Map<string, string>([[tree.summary.id, tree.summary.text]])
    for (const r of tree.roles) for (const b of r.bullets) m.set(b.id, b.text)
    return (nodeId: string): string => m.get(nodeId) ?? ""
  }, [payloadResume])

  const dismiss = useCallback(
    (nodeId: string, findingId?: string, registro?: DoneRecord) => {
      // Descartar también es resolver: el usuario dijo que no le interesa, y
      // volver a mostrárselo en la próxima corrida es no haberlo escuchado.
      const nodo = findNode(buildTree(payloadResume()), nodeId)
      registrarResuelto(nodeId, nodo?.text ?? "", "DISMISSED", findingId, registro)
      setState((st) => olvidar(st, findingId ? { findingId } : { nodeId }))
    },
    [payloadResume, registrarResuelto],
  )

  return {
    jd,
    setJd,
    ...state,
    loading,
    error,
    busyNode,
    rejected,
    pending,
    setPending,
    analyze,
    requestRewrite,
    dropBullet,
    undoDrop,
    applySkills,
    /**
     * LOS PUESTOS DEL CV, para que el usuario elija dónde va una línea nueva.
     *
     * El motor RECOMIENDA uno —el del veredicto— y la pantalla lo deja marcado,
     * pero la decisión es suya: «preguntar al usuario dónde sería un mejor
     * match, pero siempre recomendando uno en específico» (CEO, 2026-09-09).
     */
    roles: buildTree(payloadResume()).roles.map((r) => ({
      id: r.id,
      label: [r.title, r.company].filter(Boolean).join(" — "),
    })),
    /** Una viñeta cualquiera de ese puesto: el ancla del pedido de agregar. */
    anclaDe: (roleId: string) =>
      buildTree(payloadResume()).roles.find((r) => r.id === roleId)?.bullets[0]?.id ?? null,
    /** A qué puesto pertenece una viñeta: el que el motor recomienda. */
    roleOf: (nodeId: string) =>
      buildTree(payloadResume()).roles.find((r) => r.bullets.some((b) => b.id === nodeId))?.id ?? "",
    /** Las habilidades que el CV declara HOY. La lista viva, no la del análisis. */
    declaredSkills: (sectionData.skills ?? []).map((s) => s.name ?? "").filter(Boolean),
    weights: state.weights,
    accept,
    dismiss,
    textOf,
    previewGain,
  }
}

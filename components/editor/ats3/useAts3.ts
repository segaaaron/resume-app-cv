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

import { useCallback, useRef, useState } from "react"
import { apiFetch } from "@/lib/apiFetch"
import { useResumeStore } from "@/stores/resumeStore"
import { useAtsPostingStore } from "@/stores/atsPostingStore"
import { applySuggestion, buildTree, writeBack, writeInto, readBullets, type RawResume } from "@/lib/ats3/engine"
import { openLedger } from "@/lib/ats3/ledger"
import { findNode } from "@/lib/ats3/guards"
import { nodeHash, normalize } from "@/lib/ats3/contracts"
import type { AnchoredSuggestion, Finding, JobSpec, TriageDecision } from "@/lib/ats3/contracts"
import { scoreResume, type AuditFacts, type ParseChecks, type Score } from "@/lib/ats3/score"

export type FailureReason = string

export interface Ats3State {
  score: Score | null
  spec: JobSpec | null
  findings: Finding[]
  regressed: Finding[]
  suppressed: number
  triage: TriageDecision[]
  budget: Record<string, number>
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
}

const EMPTY: Ats3State = {
  score: null,
  spec: null,
  findings: [],
  regressed: [],
  suppressed: 0,
  triage: [],
  budget: {},
  covered: [],
  calls: null,
  audit: null,
  checks: {},
}

import type { ResumeSections, WorkExperienceItem } from "@/types/resume"

/**
 * Una línea resuelta desaparece de TODO lo que habla de ella.
 *
 * Vive fuera del hook y no repetida en cada acción: cuando esto se hacía a mano,
 * cada camino se acordaba de una lista distinta.
 */
function olvidar(st: Ats3State, nodeId: string): Ats3State {
  return {
    ...st,
    findings: st.findings.filter((f) => f.nodeId !== nodeId),
    regressed: st.regressed.filter((f) => f.nodeId !== nodeId),
    triage: st.triage.filter((d) => d.bulletId !== nodeId),
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
          }))
          break
        case "triage":
          setState((s) => ({
            ...s,
            triage: act.decisions as TriageDecision[],
            budget: act.budget as Record<string, number>,
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
    async (nodeId: string) => {
      if (!state.spec) return
      setBusyNode(nodeId)
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
    [jd, language, payloadResume, resumeId, state.spec],
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
    (nodeId: string, texto: string, resolvedBy: "AI_SUGGESTION" | "DISMISSED") => {
      const hallazgos = [...state.findings, ...state.regressed].filter((f) => f.nodeId === nodeId)
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
    (s: AnchoredSuggestion, finalText: string) => {
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
      if (!findNode(tree, s.bulletId)) {
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
              openLedger(tree, state.spec, new Set(state.covered)))
          : null
      if (medido && !medido.ok) {
        setError(medido.reason && !medido.reason.ok ? medido.reason.reason : "stale_node")
        return
      }

      // Sin los insumos de la medición se escribe igual: el CV del usuario nunca
      // depende de que hayamos podido recalcular su puntaje.
      const written = writeBack(medido ? medido.tree : writeInto(tree, s.bulletId, finalText), raw)
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
      registrarResuelto(s.bulletId, finalText, "AI_SUGGESTION")
      /**
       * EL DIAL SE MUEVE ACÁ, con la medición del motor sobre el CV nuevo.
       *
       * Se recalcula el Score COMPLETO y no sólo el total: el dial, los pilares
       * y el porcentaje de cada sección salen todos de este objeto, y subir el
       * total dejando lo demás quieto sería el panel contradiciéndose consigo
       * mismo en la misma pantalla.
       */
      if (medido && state.spec && state.audit) {
        const nuevo = scoreResume(medido.tree, state.spec, state.audit, state.checks)
        setState((st) => ({ ...st, score: nuevo }))
      }
      // La línea se retira de las TRES listas que hablan de ella.
      //
      // Sacarla sólo de `findings` dejaba en pantalla el hallazgo REGRESADO
      // sobre la misma línea —el panel pinta las dos listas juntas— y el
      // veredicto del triage ofreciendo reescribir lo que se acaba de
      // reescribir. Las dos cosas se leen igual: «lo arreglé y me lo vuelve a
      // pedir», que es el bucle que este motor existe para no tener.
      setState((st) => olvidar(st, s.bulletId))
    },
    [payloadResume, registrarResuelto, sectionData.workExperience, state.audit, state.checks, state.covered, state.spec, updateSectionData],
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
    (nodeId: string): { roleIndex: number; bulletIndex: number; text: string } | null => {
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
      setState((st) => olvidar(st, nodeId))
      return { roleIndex, bulletIndex, text: quitada.text }
    },
    [payloadResume, sectionData.workExperience, updateSectionData],
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
   * AGREGA UN TÉRMINO A HABILIDADES. Determinista: ni una llamada al modelo.
   *
   * Es el remedio de `skill_not_listed`: el CV ya demuestra ese término en una
   * viñeta y no figura en la lista, que es lo que el filtro lee literalmente y
   * de lo primero que mira. Reescribir la viñeta —lo único que la pantalla sabía
   * ofrecer— no arreglaba nada de eso.
   *
   * No pisa la lista: agrega al final, y no duplica si ya está escrito con otras
   * mayúsculas o acentos.
   */
  const addSkill = useCallback(
    (nodeId: string, term: string) => {
      const limpio = term.trim()
      if (!limpio) return
      const actuales = sectionData.skills ?? []
      if (actuales.some((s) => normalize(s.name ?? "") === normalize(limpio))) return
      updateSectionData("skills", [...actuales, { id: `sk_${nodeHash(limpio)}`, name: limpio, level: "advanced" }] as ResumeSections["skills"])
      registrarResuelto(nodeId, limpio, "AI_SUGGESTION")
      setState((st) => olvidar(st, nodeId))
    },
    [registrarResuelto, sectionData.skills, updateSectionData],
  )

  const dismiss = useCallback(
    (nodeId: string) => {
      // Descartar también es resolver: el usuario dijo que no le interesa, y
      // volver a mostrárselo en la próxima corrida es no haberlo escuchado.
      const nodo = findNode(buildTree(payloadResume()), nodeId)
      registrarResuelto(nodeId, nodo?.text ?? "", "DISMISSED")
      setState((st) => olvidar(st, nodeId))
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
    addSkill,
    accept,
    dismiss,
  }
}

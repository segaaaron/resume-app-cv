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
import { writeInto, buildTree, writeBack, type RawResume } from "@/lib/ats3/engine"
import { findNode } from "@/lib/ats3/guards"
import type { AnchoredSuggestion, Finding, JobSpec, TriageDecision } from "@/lib/ats3/contracts"
import type { Score } from "@/lib/ats3/score"

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
}

import type { ResumeSections, WorkExperienceItem } from "@/types/resume"

export function useAts3(resumeId: string, language: "es" | "en") {
  const sectionData = useResumeStore((s: { sectionData: ResumeSections }) => s.sectionData)
  const updateSectionData = useResumeStore(
    (s: { updateSectionData: <K extends keyof ResumeSections>(k: K, v: ResumeSections[K]) => void }) => s.updateSectionData,
  )

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
          setState((s) => ({ ...s, score: act.score as Score }))
          break
        case "job":
          setState((s) => ({ ...s, spec: act.spec as JobSpec }))
          break
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
  }, [jd, language, payloadResume, resumeId])

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

      const written = writeBack(writeInto(tree, s.bulletId, finalText), raw)
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
      // El hallazgo se retira de la lista en el acto: dejarlo ahí después de
      // aplicarlo es lo que se lee como "lo arreglé y me lo vuelve a pedir".
      setState((st) => ({ ...st, findings: st.findings.filter((f) => f.nodeId !== s.bulletId) }))
    },
    [payloadResume, sectionData.workExperience, updateSectionData],
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
    (nodeId: string): { roleIndex: number; text: string } | null => {
      const raw = payloadResume()
      const tree = buildTree(raw)
      const roleIndex = tree.roles.findIndex((r) => r.bullets.some((b) => b.id === nodeId))
      if (roleIndex === -1) {
        setError("stale_node")
        return null
      }
      const quitada = tree.roles[roleIndex].bullets.find((b) => b.id === nodeId)!
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
      setState((st) => ({
        ...st,
        findings: st.findings.filter((f) => f.nodeId !== nodeId),
        triage: st.triage.filter((d) => d.bulletId !== nodeId),
      }))
      return { roleIndex, text: quitada.text }
    },
    [payloadResume, sectionData.workExperience, updateSectionData],
  )

  /** Vuelve a poner la línea que se sacó. Sin esto, DROP no se puede ofrecer. */
  const undoDrop = useCallback(
    (roleIndex: number, text: string) => {
      const roles: WorkExperienceItem[] = (sectionData.workExperience ?? []).map((role, i) =>
        i !== roleIndex ? role : { ...role, description: `${role.description ?? ""}\n• ${text}`.trim() },
      )
      updateSectionData("workExperience", roles)
    },
    [sectionData.workExperience, updateSectionData],
  )

  const dismiss = useCallback((nodeId: string) => {
    setState((st) => ({ ...st, findings: st.findings.filter((f) => f.nodeId !== nodeId) }))
  }, [])

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
    accept,
    dismiss,
  }
}

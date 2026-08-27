"use client"

import { useState, useRef, useMemo, useEffect, useCallback } from "react"
import { useTranslations } from "next-intl"
import { apiFetch } from "@/lib/apiFetch"
import { spliceSummary } from "@/lib/ats/summary-splice"
import { resolveBulletIndex } from "@/lib/ats/bullet-locate"
import { postingTermsLost } from "@/lib/ats/keyword-safety"
import { reportUxFailure } from "@/lib/client-error-reporter"
import { roleBudget } from "@/lib/ats/role-budget"
import { weakestBullet } from "@/lib/ats/bullet-impact"
import { weightOf as postingWeightOf } from "@/lib/ats/posting-priority"
import { parseBullets, formatBullet, serializeBullets, serializeBulletsReporting, stripDecorativeOpener } from "@/lib/services/ai/shared/bullets"
import SummaryVersionModal, { type SummaryVersion } from "@/components/resume/sections/SummaryVersionModal"
import { useResumeStore } from "@/stores/resumeStore"
import { textSignature, matchesApplied } from "@/lib/ats/action-plan"
import { buildPanelReport } from "@/lib/ats/panel-report"
import { planSkillAdd } from "@/lib/ats/skill-add"
import { planRoleReorder } from "@/lib/ats/role-order"
import { tailorResolutions } from "@/lib/ats/tailor-resolutions"
import { allChecks } from "@/lib/ats/report"
import { appliedIdsFrom, fingerprintOfCheck } from "@/lib/ats/applied-checks"
import ReportRail from "./ats-report/ReportRail"
import { applyAllPlan, solvableChecks, tailorWorkload } from "@/lib/ats/report"
import TailorModal, { type TailorFilter } from "./ats-report/TailorModal"
import { postingTermsForPrompt } from "@/lib/ats/rewrite-keeps-match"
import { hasCliche } from "@/lib/services/ai/shared/cliches"
import { assessDescription } from "@/lib/services/ai/shared/bullet-quality"
import { appliedSignatures, forgetOneApplied, rememberApplied } from "@/lib/ats/applied-memory"
import { useShallow } from "zustand/react/shallow"
// Same normalization the matcher used to decide "demonstrated", so an accented
// Spanish skill matches the stored verdict instead of silently missing it.
import { computeCredibility } from "@/lib/ats/credibility"
import { Target, Loader2, CheckCircle2, AlertCircle, Lightbulb, Check, MessageSquare, TrendingUp, Clock, Sparkles, MessageSquareQuote } from "lucide-react"
import { useTailorCV } from "./hooks/useTailorCV"
import AtsSafeDownload from "./AtsSafeDownload"
import { getTemplateAtsSafety } from "@/lib/ats/template-ats-safety"
import { toast } from "sonner"
import { nanoid } from "nanoid"
import SuggestionDiffModal, { type Suggestion } from "./SuggestionDiffModal"
import JobPickerModal from "./JobPickerModal"
import type { ResumeSections, WorkExperienceItem } from "@/types/resume"
import { useATSScore, isQuestion } from "./hooks/useATSScore"
import { applySuggestion, previewSuggestion } from "@/lib/services/ai/shared/apply-suggestion"
import { analyzeWriting } from "@/lib/ats/writing-checks"
import { applySpellingFix } from "@/lib/ats/apply-spelling"
import { markContentOptimized } from "./hooks/useOptimizedGuard"
import { ATSErrorBlock } from "./ats-panel/presentational"
import { normalizeDates } from "@/lib/ats/normalize-dates"
import { useCooldownLabel } from "./hooks/useAICooldown"
import { useCvLanguage } from "./hooks/useCvLanguage"
import { AI_INPUT_LIMITS, ImproveBulletResponseSchema } from "@/lib/services/ai/shared/ai-types"

/** One colour per number, so the badge and the figure it refers to read as a pair. */
/**
 * Los pendientes de tailor, en orden.
 *
 * Se aplican de a uno y por el MISMO camino que un clic suelto: un aplicador
 * masivo con su propia escritura sería una segunda forma de escribir en el CV,
 * con su propia manera de perder datos.
 */

/**
 * El motivo, leído del id del hallazgo.
 *
 * El informe ya nombra la causa en la clave (`tips.near_dup.*`, `tips.dilutes.*`).
 * Derivarlo evita un campo más que mantener en sincronía, y si el id cambia sin
 * que esto cambie, el peor caso es una guía genérica — nunca una equivocada.
 */
function reasonOf(checkId: string): "no_metric" | "duplicate" | "dilutes" | "cliche" | "orphan" | "passive" | "critical" | "tailored" {
  if (checkId.startsWith("tips.near_dup")) return "duplicate"
  if (checkId.startsWith("tips.dilutes")) return "dilutes"
  if (checkId.startsWith("tips.merge")) return "duplicate"
  if (checkId.startsWith("format.orphan")) return "orphan"
  if (checkId.startsWith("tips.passive")) return "passive"
  if (checkId.startsWith("tips.recruiter")) return "critical"
  if (checkId.startsWith("tips.credibility.empty_lines")) return "cliche"
  return "no_metric"
}

export default function ATSScorePanel() {
  const t = useTranslations("editor.ats")
  /**
   * Which job the panel is doing right now.
   *
   * Opens on the application view: three actions that move the match with THIS
   * posting, and a stop rule. The full report is one click away and unchanged —
   * nothing was removed, it stopped competing for attention with the two things
   * that decide whether this application is worth sending.
   */
  /** What the one-press repair actually did, said afterwards instead of a toast. */

  /** Shared AI error copy — quota messages already live there, in both locales. */
  const tAi = useTranslations("editor.ai")
  // The figure hint rewrites the candidate's own sentence, so it has to agree
  // with the language the interface is speaking.
  const { sectionData, updateSectionData } = useResumeStore(
    useShallow((s) => ({
      sectionData: s.sectionData,
      updateSectionData: s.updateSectionData,
    }))
  )
  const {
    input, setInput,
    loading,
    verdictPending: verdictPendingFromRequest,
    atsResult, reviewResult,
    offTopic,
    hasResult,
    upToDate,
    analyze,
    rescore,
    creditSoftSkill,
    cooldownUntil,
  } = useATSScore()
  const [addedKeywords, setAddedKeywords] = useState<Set<string>>(new Set())

  /**
   * True once the user has applied any fix from this report.
   *
   * The findings below are a snapshot of the CV at analysis time, so the moment
   * one is applied the rest may describe text that no longer exists — that is
   * how a already-corrected typo kept being reported as a critical fix. The
   * score keeps updating live (runRescore is deterministic and free); the
   * recruiter findings need a new analysis, so we say so instead of pretending
   * they are current.
   */

  /**
   * Lo que el usuario ya aceptó en ESTE CV, entre corridas.
   *
   * Las marcas de la sesión se borran al re-analizar, y el problema aparece justo
   * DESPUÉS: el CV cambió, el modelo opina de cero y vuelve a proponer una
   * variante del párrafo que él mismo escribió. Esta memoria dura más que el
   * análisis porque vive en el navegador y se compara por FIRMA del texto.
   */
  /** Cómo parsea la plantilla elegida: decide si hace falta ofrecer la copia plana. */
  const templateSafety = getTemplateAtsSafety(useResumeStore((st) => st.config?.templateId))
  /** Para el aviso informativo de la foto: qué es normal depende del país. */
  const photoUrl = useResumeStore((st) => st.config?.photoUrl)

  const [appliedSigs, setAppliedSigs] = useState<string[]>([])
  // Por selector y no por `getState()`: así es reactivo si el editor cambia de
  // CV, y no depende de una API estática del store.
  const memoryResumeId = useResumeStore((st) => st.resumeId) ?? ""
  useEffect(() => {
    if (memoryResumeId) setAppliedSigs(appliedSignatures(memoryResumeId))
  }, [memoryResumeId])

  /** ¿Esto ya se lo ofrecimos y lo aceptó? Entonces no se vuelve a mostrar. */
  const alreadyAccepted = useCallback(
    (text?: string | null) => !!text && matchesApplied(text, appliedSigs),
    [appliedSigs],
  )

  /**
   * Recuerda el TEXTO aceptado, para que el análisis siguiente no proponga una
   * variante de lo que el usuario ya escribió.
   *
   * ── LO QUE ESTA FUNCIÓN DEJÓ DE HACER (barrido de cierre, 2026-08-25) ─────
   *
   * Recibía además una `key` y la metía en un `appliedItems` cuyo valor se
   * descartaba (`const [, setAppliedItems]`) — el mismo patrón del `setMergingKey`
   * que este proyecto ya había corregido una vez: estado que se escribe y nadie
   * lee. Al sacarlo, la mitad de las llamadas pasaban a no hacer NADA y seguían
   * escritas como si cerraran algo. Se borraron; las que quedan traen texto, que
   * es lo único que esta memoria guarda.
   *
   * Quién retira la tarjeta es otra cosa y tiene su propio dueño:
   * `markCheckApplied`.
   */
  function markFixApplied(appliedText: string) {
    // La firma, no el texto: alcanza para reconocerlo y no guarda frases del CV.
    const sig = appliedText ? textSignature(appliedText) : ""
    if (sig && memoryResumeId) {
      rememberApplied(memoryResumeId, sig)
      setAppliedSigs((prev) => (prev.includes(sig) ? prev : [sig, ...prev]))
    }
  }

  /**
   * UN CAMBIO APLICADO, CON SU VUELTA ATRÁS. El único lugar que lo ofrece.
   *
   * ── EL DEFECTO (reportado por el CEO, 2026-08-25) ─────────────────────────
   *
   * La tarjeta tenía un botón «Deshacer» que hacía UNA cosa: sacar el hallazgo de
   * la lista de aplicados. El texto quedaba escrito en el CV. Tres consecuencias,
   * y la tercera es la cara: la tarjeta volvía a «pendiente» —así que el usuario
   * gastaba otra llamada y otra cuota apretando de nuevo—, y sobre todo alguien
   * podía descargar el PDF creyendo que había revertido algo que seguía puesto.
   *
   * ── CÓMO DEBE FUNCIONAR: EL PRODUCTO YA LO TUVO ───────────────────────────
   *
   * No es una invención de este turno. El editor de viñetas lo hacía en `c27f31d`:
   * capturaba el texto ANTES de escribir y ofrecía «Deshacer» en el aviso, con
   * diez segundos para apretarlo. Murió cuando se rehízo esa pantalla —las
   * viñetas pasaron a cajas— y sus dos claves de idioma quedaron huérfanas en el
   * archivo. Se reusan acá, así que el patrón vuelve a tener un dueño.
   *
   * ── POR QUÉ EN EL AVISO Y NO EN LA TARJETA ────────────────────────────────
   *
   * Porque una foto vieja es peor que ninguna. Si el botón viviera en la tarjeta,
   * seguiría ahí después de que el usuario editara otras tres líneas a mano — y
   * restaurar entonces le borraría ese trabajo sin avisar. La ventana del aviso
   * es la única en la que la foto todavía describe el CV que él está mirando.
   *
   * Revertir NO deja rastro de aceptado: si la firma quedara en la memoria, el
   * texto original vuelve y el hallazgo que lo señalaba queda filtrado para
   * siempre. Ver `forgetOneApplied`.
   */
  function appliedWithUndo(
    message: string,
    before: ReadonlyArray<[Parameters<typeof updateSectionData>[0], unknown]>,
    opts: { checkId?: string; signature?: string; onUndo?: () => void } = {},
  ): void {
    /**
     * LA FOTO CADUCA CUANDO ALGUIEN MÁS ESCRIBE ENCIMA.
     *
     * ── EL DEFECTO (cazado por QA, 2026-08-25) ──────────────────────────────
     *
     * Diez segundos alcanzan para aplicar otro arreglo. Con dos avisos vivos,
     * apretar «Deshacer» en el PRIMERO restauraba una foto anterior al segundo:
     * el trabajo del segundo desaparecía en silencio. El precedente del que sale
     * este patrón tenía UN camino de escritura; acá hay diez.
     *
     * ── Y NO ALCANZA CON CONTAR LAS ESCRITURAS DEL PANEL ────────────────────
     *
     * Un contador propio sólo ve lo que este panel escribe. El editor está al
     * lado: durante esos diez segundos el usuario puede corregir una viñeta a
     * mano, y esa edición no pasa por acá — la vuelta atrás se la habría comido
     * sin decir nada. Así que no se cuenta: se GUARDA CÓMO QUEDÓ la sección y, al
     * apretar, se compara con cómo está. Si no es idéntica, alguien escribió
     * después —el panel, el formulario, quien sea— y la foto ya no describe este
     * CV: se dice y no se toca nada. Callar y restaurar de más es lo que había
     * que evitar.
     *
     * Se lee del store y no del render: `updateSectionData` acaba de correr y el
     * `sectionData` de este closure todavía es el de antes.
     */
    const despues = Object.fromEntries(
      before.map(([section]) => [
        section,
        JSON.stringify((useResumeStore.getState().sectionData as unknown as Record<string, unknown>)[section] ?? null),
      ]),
    )
    toast.success(message, {
      duration: 10_000,
      action: {
        label: tAi("undo"),
        onClick: () => {
          const ahora = useResumeStore.getState().sectionData as unknown as Record<string, unknown>
          const vigente = before.every(([section]) => JSON.stringify(ahora[section] ?? null) === despues[section])
          if (!vigente) { toast.info(tAi("undo_stale")); return }
          for (const [section, value] of before) updateSectionData(section, value as never)
          if (opts.signature && memoryResumeId) {
            const sig = textSignature(opts.signature)
            forgetOneApplied(memoryResumeId, sig)
            setAppliedSigs((prev) => prev.filter((s) => s !== sig))
          }
          if (opts.checkId) undoCheck(opts.checkId)
          opts.onUndo?.()
          toast.info(tAi("bullets_undone"))
          void runRescore()
        },
      },
    })
  }

  // Re-score deterministically after a fix. The hook owns the delta badge now,
  // so a plain edit that moves the score keeps it truthful too.
  /**
   * Re-puntúa y DICE cuánto se movió.
   *
   * El panel aplicaba un arreglo, el número cambiaba solo y el usuario no tenía
   * forma de atribuirlo a su clic. Peor con los que no mueven la nota: apretaba,
   * el número quedaba igual, y concluía que el botón no había hecho nada — el
   * mismo malentendido que el `0p` de cada chequeo vino a cerrar, dicho ahora en
   * el momento en que actúa.
   */
  async function runRescore(): Promise<number | null> {
    // Del INFORME, no del crudo. `report` se declara más abajo pero esta función
    // sólo corre en un clic, con el render ya cerrado.
    const before = report?.score ?? null
    const after = await rescore()
    if (before !== null && after !== null) {
      const delta = after - before
      if (delta !== 0) toast.success(t("score_moved", { delta: delta > 0 ? `+${delta}` : String(delta) }))
    }
    return after
  }
  /**
   * `appliedCheckId` — el hallazgo que esta confirmación cierra.
   *
   * Sin él, un arreglo aceptado en el modal de confirmación quedaba registrado en
   * la memoria de textos aceptados pero NO entre los hallazgos cerrados, que es lo
   * que el riel y el ejecutor leen para pintar «aplicado». La tarjeta seguía
   * ofreciendo trabajo ya hecho hasta el re-cálculo. Es la misma sincronía
   * que la fusión ya resolvía por su cuenta con este mismo nombre de campo.
   */
  const [modal, setModal] = useState<{ suggestion: Suggestion; currentValue: string; itemKey: string; appliedCheckId?: string } | null>(null)
  const { inCooldown, label: cooldownLabel } = useCooldownLabel(cooldownUntil)
  // Everything the AI writes here is applied INTO the CV → the CV's language.
  const cvLanguage = useCvLanguage()

  // Inline "improve this weak bullet" — reuses the honest improve-bullet engine
  // (stronger verb / tighter phrasing, NEVER invents a number) and applies the
  // rewrite to the exact bullet by index, then re-scores.
  const [bulletFix, setBulletFix] = useState<{
    targetId: string
    index: number
    current: string
    improved: string
    /** Why this reads better — a rewrite you cannot judge should not ask for a click. */
    why?: string
    /** The model's own pick, kept so choosing another angle is reversible. */
    recommended: string
    recommendedWhy?: string
    /** The same work argued from another angle, so disliking one ends in a choice, not another call. */
    options?: Array<{ text: string; angle: string; why: string }>
    /**
     * La reescritura PROPONE un tamaño que el CV todavía no dice, como rango.
     *
     * Antes ni llegaba: el guard descartaba la reescritura entera por traer un
     * número, contradiciendo la doctrina que le pide proponerlo. Ahora llega, y
     * el modal PREGUNTA en vez de aplicarlo como si fuera un hecho suyo.
     */
    /**
     * La blanda que esta línea deja demostrada, acreditada al confirmar.
     *
     * El camino que escribía derecho llamaba a `creditSoftSkill`; al mandar la
     * reescritura por la pantalla de confirmación ese crédito se habría perdido
     * en silencio y el porcentaje de blandas no se movería al aplicar — el mismo
     * defecto que se reportó con captura el 2026-08-22, entrando por otra puerta.
     */
    demonstrates?: string
    needsFigureConfirm?: boolean
    /**
     * A merge: the second line this replacement absorbs, deleted on confirm.
     *
     * Rides the SAME confirm path as every other bullet write rather than getting
     * its own — one owner of the serialization is what makes a duplicate
     * impossible to reintroduce, and a second writer would be a second chance to
     * get it wrong.
     */
    removeIndex?: number
    removeCurrent?: string
    /**
     * El hallazgo del informe que esto cierra.
     *
     * La memoria de TEXTOS aceptados es otra cosa: cerrar ahí no retira la
     * tarjeta del ejecutor, que lee los hallazgos cerrados. La fusión aceptada
     * dejaba su propia tarjeta en pantalla ofreciendo fusionar dos líneas que ya
     * eran una.
     */
    appliedCheckId?: string
  } | null>(null)
  const [improvingKey, setImprovingKey] = useState<string | null>(null)

  /**
   * Fuse two thin bullets of one role into one solid line.
   *
   * WHICH two was decided in code before the button was drawn — a model asked to
   * pick a pair always picks one. This only pays for the writing, and the result
   * still goes through the same confirm modal: a merge deletes a line the user
   * wrote, so it is never applied without them seeing exactly what replaces both.
   */
  /**
   * The critical fix the user is completing right now.
   *
   * The analyst writes the sentence and then says what is missing from it — the
   * scale, the figure, the outcome. Applying the text as-is leaves a bullet that
   * still does not say what changed, and the panel used to send the user off to
   * another tab to add it, which nobody does. The field is here, with the sentence
   * already written: we supply the wording, the candidate supplies the number.
   */
  // El modal muestra el estado de ocupado; acá sólo se registra cuál par está
  // en vuelo, para que `runMerge` no dispare dos veces sobre el mismo.
  /**
   * La fusión en vuelo. El valor se ESCRIBÍA Y SE TIRABA —`const [, setMergingKey]`—
   * así que ninguna tarjeta sabía que había una llamada corriendo: apretabas
   * «fusionarlas», el modelo tardaba sus segundos y el botón se quedaba mudo.
   * Reportado tal cual: «como que tarda en cargar, ¿no sería mejor agregar un
   * loading?». El loading ya existía; lo que faltaba era decirle cuándo.
   */
  const [mergingKey, setMergingKey] = useState<string | null>(null)

  /**
   * FUSIONAR DOS LÍNEAS.
   *
   * ── EL DEFECTO (reportado con captura, 2026-08-22) ────────────────────────
   *
   * «No me deja hacer merge, ¿a qué se debe eso?» — dos veces, en dos tarjetas.
   * Y era exacto: el modelo contestaba que no («las leí y cuentan trabajos
   * distintos»), la respuesta salía por un toast de dos segundos… y la tarjeta
   * seguía ahí, con su botón, ofreciendo lo mismo. Apretaba otra vez y recibía
   * la misma negativa. Desde afuera eso no se lee como una respuesta: se lee
   * como un botón roto.
   *
   * Dos huecos, y el segundo es peor:
   *
   *  1. `markFixApplied(key)` cerraba la clave VIEJA (`merge-…`), que es de otro
   *     conjunto de estado. El hallazgo del informe (`tips.merge.…`) no se
   *     enteraba, así que la tarjeta nunca se retiraba.
   *  2. `if (!res.ok) return` — silencio absoluto. Un 429 por cooldown o un 403
   *     de plan dejaban la pantalla igual que si nada hubiera pasado. Ningún
   *     endpoint de IA entrega un hueco: si no se puede, se dice.
   */
  async function runMerge(
    c: { targetId: string; indexes: [number, number]; texts: [string, string] },
    checkId?: string,
  ) {
    const key = `merge-${c.targetId}-${c.indexes[0]}-${c.indexes[1]}`
    setMergingKey(key)
    try {
      const res = await apiFetch("/api/ai/merge-bullets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetId: c.targetId,
          indexes: c.indexes,
          sectionData,
          language: cvLanguage,
          // Fusionar borra una línea. Sin los términos de la vacante, la fusión
          // podía comerse justo la palabra que traía la coincidencia — y las
          // duras pesan .45. Mismo contrato que usan tailor e improve-bullet.
          postingTerms: postingTermsForPrompt(report?.posting?.hardSkills, report?.posting?.softSkills),
        }),
      })
      if (!res.ok) {
        // El uso ya se gastó o el plan no alcanza; en las dos el usuario tiene
        // derecho a saber por qué no pasó nada. El silencio de antes se leía
        // como un botón roto, que es exactamente lo que se reportó.
        reportUxFailure("bullet_merge_failed", { status: res.status })
        toast.error(t("toast_change_error"))
        return
      }
      const data: { status: "ok"; text: string } | { status: "not_mergeable" } = await res.json()
      if (data.status !== "ok") {
        // An honest no. The two lines turned out to be about different work, and
        // forcing them together would have distorted one of them.
        toast.info(t("merge_not_mergeable"))
        // Y LA TARJETA SE RETIRA. Una negativa que deja el mismo botón en pantalla
        // invita a apretarlo otra vez para recibir la misma negativa.
        if (checkId) markCheckApplied(checkId)
        return
      }
      setBulletFix({
        targetId: c.targetId,
        index: c.indexes[0],
        current: c.texts[0],
        improved: data.text,
        recommended: data.text,
        why: t("merge_why"),
        removeIndex: c.indexes[1],
        removeCurrent: c.texts[1],
        // Se lleva al modal de confirmación para que ACEPTAR sea lo que retira el
        // par — no el simple hecho de pedirlo. Cancelar deja la oferta en pie.
        appliedCheckId: checkId,
      })
    } finally {
      setMergingKey(null)
    }
  }

  // Soft skills the job asks for that the CV doesn't demonstrate yet — hoisted up
  // from the Tailor run (§③) so ALL bullet work lives in the one list below (§②).

  const [weavingSoft, setWeavingSoft] = useState<string | null>(null)

  /**
   * The "where does this go?" step of weaving a soft skill.
   *
   * The analysis picks the role it finds most credible, but the candidate is the
   * one who knows where the behaviour actually happened — so the choice is always
   * theirs, with ours marked as the recommendation. `draft` is the bullet already
   * written for the recommended role: accepting that role costs no second call.
   */
  /**
   * `refresh` y `checkId` viajan en el ESTADO, no sólo en la llamada.
   *
   * ── EL DEFECTO (cazado por QA, 2026-08-25) ─────────────────────────────────
   *
   * El camino tiene dos postas: se pide la línea, y si el modelo no encuentra
   * puesto creíble, el usuario elige uno y se vuelve a pedir. `refresh` se
   * mandaba en la PRIMERA y se perdía en la segunda — así que al elegir el puesto
   * el endpoint volvía a cortar con «ya está demostrada» (el término está, en el
   * puesto viejo: por eso existe el hallazgo) y el usuario recibía la misma
   * mentira, ahora después de gastar dos llamadas. Y sin `checkId` el hallazgo
   * nunca se marcaba como aplicado, aunque la línea se escribiera.
   */
  const [softPick, setSoftPick] = useState<
    { skill: string; recommendedId: string | null; draft: string | null; soft: boolean; refresh?: boolean; checkId?: string }
  | null>(null)

  /**
   * POR QUÉ ESTA LÍNEA NECESITA TRABAJO, en el vocabulario que improve-bullet
   * entiende. Deriva del TEXTO con las mismas funciones que lo diagnosticaron.
   */
  function focusForLine(checkId: string, line: string): string[] {
    const out: string[] = []
    if (checkId.startsWith("tips.passive")) out.push("passive")
    if (hasCliche(line)) out.push("cliche")
    if (assessDescription(line).weakOpenerIndices.length > 0) out.push("weak_verb")
    // La cifra va última: es la más suave de las tres y no debe tapar un defecto
    // concreto cuando existe.
    if (out.length === 0 && !/\d/.test(line)) out.push("metric")
    return out.slice(0, 3)
  }

  /**
   * `checkId` — el hallazgo que esta mejora cierra.
   *
   * ── EL DEFECTO (reportado con captura, 2026-08-25) ────────────────────────
   *
   *   «Cuando realizo el improve bullet no lo marca como realizado.»
   *
   * El botón conocía el hallazgo —lo usaba para armar la clave del spinner— y no
   * lo guardaba en ningún lado, así que `confirmBulletFix` no tenía qué cerrar:
   * el usuario aceptaba la mejora, la línea se escribía en el CV, y la tarjeta
   * seguía ofreciendo el mismo trabajo.
   */
  async function improveMetricless(
    b: { text: string; targetId: string; jobTitle: string; index: number; reasons?: string[] },
    key: string,
    checkId?: string,
  ) {
    if (improvingKey) return
    setImprovingKey(key)
    try {
      // The panel already KNOWS what is wrong with this bullet (weak opener,
      // cliché, no metric) — sending that with the request is what stops the
      // model from answering "already fine" to a bullet we just labelled weak.
      const focus = (b.reasons ?? []).filter((r) => r !== "duplicate")
      const res = await apiFetch("/api/ai/improve-bullet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Y LOS TÉRMINOS DE LA VACANTE, DEL INFORME. «El ATS manda: todo lo que
        // tenga el ATS debe consultar al ATS» (CEO). Este endpoint reescribía una
        // viñeta del CV sin haber visto nunca la oferta: su prompt le pedía
        // «incorporá keywords del sector» y el modelo elegía cuáles mirando el
        // título. Salen del informe —no del crudo del servidor— por la misma
        // razón que todo lo demás: una sola puerta.
        body: JSON.stringify({
          text: b.text, jobTitle: b.jobTitle || undefined, language: cvLanguage, focus,
          postingTerms: postingTermsForPrompt(report?.posting?.hardSkills, report?.posting?.softSkills),
          // El CV vivo —el mismo que alimenta el ATS— para que el guard juzgue la
          // invención contra el CV COMPLETO y no marque como inventada una
          // herramienta que el candidato declaró en otra sección.
          sectionData,
        }),
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null
        const capped = body?.error === "daily_cap_reached" || res.status === 429
        // A cap is the product working as designed and the user is told why.
        // Anything else is a failure they cannot act on — record it.
        if (!capped) {
          reportUxFailure("improve_bullet_request_failed", {
            status: res.status,
            code: String(body?.error ?? "").slice(0, 40),
            focus: focus.join(",").slice(0, 40),
          })
        }
        toast.error(capped ? tAi("daily_cap_reached") : t("metricless_improve_error"))
        return
      }
      const data = await res.json().catch(() => null)
      const parsed = ImproveBulletResponseSchema.safeParse(data)
      if (!parsed.success) {
        // The endpoint answered 200 with a body the UI cannot read: a broken
        // contract between our own two halves, invisible until now.
        reportUxFailure("improve_bullet_bad_contract", { status: res.status })
        toast.error(t("metricless_improve_error")); return
      }
      const first = parsed.data.improvements[0]
      if (parsed.data.status === "already_optimized" || !first || first.text.trim() === b.text.trim()) {
        // Never claim "already well written" about a bullet this very panel
        // labelled weak — that contradiction is what made the button look broken.
        toast.info(focus.length > 0 ? t("metricless_no_rewrite") : t("metricless_already_good"))
        return
      }
      setBulletFix({
        targetId: b.targetId,
        index: b.index,
        appliedCheckId: checkId,
        current: b.text,
        improved: first.text,
        why: first.why,
        recommended: first.text,
        recommendedWhy: first.why,
        options: first.alternatives,
        ...(first.needsFigureConfirm ? { needsFigureConfirm: true } : {}),
      })
    } catch {
      toast.error(t("metricless_improve_error"))
    } finally {
      setImprovingKey(null)
    }
  }

  /**
   * Collapses every repeated bullet in the CV, in one action.
   *
   * serializeBullets already makes a duplicate impossible to CREATE; this clears
   * the ones a CV arrived with. Offering "Remove" once per duplicated line was
   * the same chore the report was complaining about — the user should press one
   * button and have the CV be clean.
   */
  /** @returns true when a repeated line was actually removed. */
  function removeDuplicateBullets(checkId?: string): boolean {
    const work = (sectionData.workExperience ?? []) as WorkExperienceItem[]
    let removed = 0
    const updated = work.map((j) => {
      const bullets = parseBullets(j.description ?? "")
      if (bullets.length === 0) return j
      const deduped = serializeBullets(bullets)
      const after = parseBullets(deduped)
      if (after.length === bullets.length) return j
      removed += bullets.length - after.length
      return { ...j, description: deduped }
    })
    if (removed === 0) { toast.info(t("dedupe_none")); return false }
    updateSectionData("workExperience", updated)
    appliedWithUndo(t("dedupe_done", { count: removed }), [["workExperience", work]], { checkId })
    void runRescore()
    return true
  }

  /**
   * One date format across the CV (MM/YYYY), in one action.
   *
   * Mixed formats confuse ATS tenure parsing — the check already said so and
   * then asked the user to retype every field by hand. Dates it cannot read with
   * certainty are left untouched; a wrong date is worse than a mixed one.
   */
  /** @returns true when at least one date was rewritten. */
  /**
   * How many dates the unify action could actually rewrite, right now.
   *
   * A bare year is left alone on purpose — writing "01/2015" over "2015" invents a
   * month, and inventing tenure is worse than a mixed format. But that is exactly
   * the case the finding complains about most, so on a CV whose dates are all bare
   * years the panel offered "Unify dates to MM/YYYY", the user pressed it, and
   * nothing happened. This product already ruled on that shape: a button that
   * cannot do anything is not drawn.
   */

  /**
   * Quita el glifo decorativo con el que abren algunas viñetas.
   *
   * Reusa el escritor de siempre y el conjunto de símbolos que declara
   * `bullets.ts` — el mismo con el que el chequeo las contó.
   */
  function stripDecorativeGlyphs(checkId?: string): boolean {
    const work = (sectionData.workExperience ?? []) as WorkExperienceItem[]
    let limpiadas = 0
    const updated = work.map((j) => {
      const bullets = parseBullets(j.description ?? "")
      if (bullets.length === 0) return j
      // El contador es POR PUESTO. Con uno global, el primer glifo encontrado
      // hacía que todos los puestos siguientes se re-serializaran aunque no
      // tuvieran ninguno — y `serializeBullets` colapsa líneas idénticas, así
      // que un arreglo de formato habría borrado viñetas repetidas sin decirlo.
      let enEstePuesto = 0
      const next = bullets.map((line) => {
        const limpio = stripDecorativeOpener(line)
        if (limpio !== line.trim() && limpio) enEstePuesto++
        // Una línea que era SÓLO el símbolo no se borra: dejarla vacía cambiaría
        // el conteo de viñetas por un arreglo de formato. Se deja como está.
        return limpio || line
      })
      if (enEstePuesto === 0) return j
      limpiadas += enEstePuesto
      return { ...j, description: serializeBullets(next) }
    })
    if (limpiadas === 0) { toast.info(t("glyphs_none")); return false }
    updateSectionData("workExperience", updated)
    appliedWithUndo(t("glyphs_done", { count: limpiadas }), [["workExperience", work]], { checkId })
    void runRescore()
    return true
  }

  function fixDates(checkId?: string): boolean {
    const work = (sectionData.workExperience ?? []) as WorkExperienceItem[]
    const edu = (sectionData.education ?? []) as { startDate?: string; endDate?: string }[]
    const w = normalizeDates(work)
    const e = normalizeDates(edu)
    if (w.changed + e.changed === 0) { toast.info(t("dates_none")); return false }
    // Las DOS secciones en la foto: una vuelta atrás que restaure sólo una
    // dejaría el CV a mitad de camino entre dos estados.
    const antesDeFechas: Array<[Parameters<typeof updateSectionData>[0], unknown]> = []
    if (w.changed > 0) { antesDeFechas.push(["workExperience", work]); updateSectionData("workExperience", w.rows) }
    if (e.changed > 0) { antesDeFechas.push(["education", edu]); updateSectionData("education", e.rows as never) }
    appliedWithUndo(t("dates_done", { count: w.changed + e.changed }), antesDeFechas, { checkId })
    void runRescore()
    return true
  }

  /** Rewrites the summary through the same improve-summary engine the editor uses. */
  /** The three positionings, held until one is chosen. Empty = picker closed. */
  const [summaryVersions, setSummaryVersions] = useState<SummaryVersion[]>([])

  /** The confirm step every summary rewrite goes through, whoever chose the text. */
  function openSummaryDiff(text: string, current: string) {
    setModal({
      suggestion: { field: "summary", type: "replace", preview: text, reason: t("summary_fix_reason") },
      currentValue: current,
      itemKey: "fix-summary",
    })
  }


  /**
   * Turns one recruiter finding into the button that repairs it.
   *
   * Every action was validated server-side against the real CV (a bullet index
   * that does not exist arrives as "manual"), so a rendered button always does
   * something. "manual" renders nothing — advice with no false promise.
   */

  /**
   * Replace ONE bullet, whoever wrote the replacement.
   *
   * Extracted from confirmBulletFix so the user's own inline edit lands through
   * the same stale-index guard and the same serializer. A second write path is
   * how a duplicate or an overwritten neighbour gets reintroduced.
   *
   * `aiWritten` marks the text as ours: only then does the Content tab's guard
   * need to know not to offer improving it again. The user's own wording is not
   * AI output and must not be treated as already-optimised.
   */
  function writeBullet(targetId: string, index: number, current: string, next: string, aiWritten: boolean, checkId?: string): boolean {
    const work = (sectionData.workExperience ?? []) as WorkExperienceItem[]
    const job = work.find((j) => j.id === targetId)
    const bullets = parseBullets(job?.description ?? "")
    /**
     * SIN SABER QUÉ LÍNEA ERA, NO SE ESCRIBE Y NO SE MARCA NADA.
     *
     * ── LO REPORTADO CON CAPTURA (CEO, 2026-08-27) ────────────────────────────
     *
     *   «Dice applied… al parecer no aplicó ni mierda, y me sale un toast que no
     *    es de color rojo así que no creo que sea un error, pero desaparece rápido.»
     *
     * Era literal, y la cadena entera está medida: cuando el modelo no devuelve
     * el `original`, el «antes» se leía POR ÍNDICE (`tailor-resolutions`), y un
     * índice corrido devuelve `""`. Con el texto vacío `resolveBulletIndex`
     * contesta -1 SIEMPRE —no puede identificar una línea sin texto—, y acá abajo
     * eso se trataba como «la línea ya no está»: toast informativo, hallazgo
     * marcado como aplicado, y el CV sin tocar.
     *
     * Son dos situaciones distintas y sólo una es inofensiva:
     *
     *   · `current` con texto y no aparece → la línea SE FUE. El defecto ya no
     *     existe, la fila es vieja y retirarla es correcto.
     *   · `current` vacío → NO SABEMOS qué línea era. Nada se fue: perdimos la
     *     identidad. Marcarlo como aplicado le miente al usuario y le esconde el
     *     hallazgo, que es lo peor de los dos mundos.
     */
    if (!current.trim()) {
      reportUxFailure("bullet_write_no_identity", { jobFound: !!job, index, bullets: bullets.length })
      toast.error(t("toast_change_error"))
      return false
    }
    const at = job ? resolveBulletIndex(bullets, index, current) : -1
    if (at < 0) {
      // The line is not in the CV any more — deleted, or rewritten in another
      // tab. There is nothing to write and nothing the user can do about a red
      // error, so this is not one: say what happened, drop the stale row, and
      // let the score catch up. Recorded all the same, with facts only — never
      // the line itself, which is their résumé.
      reportUxFailure("bullet_write_line_gone", { jobFound: !!job, index, bullets: bullets.length, currentLen: current.length })
      toast.info(t("bullet_line_gone"))
      // Y LA FILA SE RETIRA DE VERDAD. El comentario de arriba lo prometía desde
      // siempre y lo hacía escribiendo en un conjunto de estado cuyo valor se
      // descartaba, así que la tarjeta seguía ofreciendo reescribir una línea que
      // ya no existe. Se cierra por el mismo dueño que el resto: el hallazgo.
      if (checkId) markCheckApplied(checkId)
      void runRescore()
      return false
    }
    const written = serializeBulletsReporting(bullets.map((line, i) => (i === at ? next : line)))
    const nextDescription = written.text
    updateSectionData("workExperience", work.map((j) => (j.id === targetId ? { ...j, description: nextDescription } : j)))
    if (aiWritten) markContentOptimized(`opt_bullet_${targetId}`, nextDescription)
    // `next` es la línea que quedó escrita: su firma es lo que evita que la
    // próxima corrida vuelva a proponer una variante de ella.
    markFixApplied(next)
    appliedWithUndo(t("toast_change_applied"), [["workExperience", work]], { checkId, signature: next })
    if (written.removed > 0) toast.info(t("dedupe_done", { count: written.removed }))
    void runRescore()
    return true
  }

  /**
   * The bullet whose number the user is typing right now, and the text as edited.
   *
   * "Add your number — only you know it" used to be a dead end: the panel named
   * the gap and then sent the user to another tab to find the line among forty.
   * Nobody makes that trip. The figure gets typed where it is asked for.
   */
  /** Rows on screen at once — the rest are one click away. */

  /**
   * `escrito` — el texto tal como quedó en la pantalla de confirmación.
   *
   * Cuando la reescritura proponía una cifra, el modal la pinta como un hueco y
   * el candidato escribe el número. Aplicar `improved` en ese caso escribiría el
   * número del MODELO en su CV, que es exactamente lo que la doctrina prohíbe.
   */
  function confirmBulletFix(escrito?: string) {
    if (!bulletFix) return
    const { targetId, index } = bulletFix
    const improved = escrito?.trim() || bulletFix.improved
    try {
      const work = (sectionData.workExperience ?? []) as WorkExperienceItem[]
      const job = work.find((j) => j.id === targetId)
      const bullets = parseBullets(job?.description ?? "")
      // Stale-index guard: if the description was edited between scoring and
      // applying, the bullet at `index` may no longer be the one we improved.
      // Aborting is safer than overwriting the wrong line.
      const at = job ? resolveBulletIndex(bullets, index, bulletFix.current) : -1
      if (at < 0) {
        reportUxFailure("bullet_fix_line_gone", { jobFound: !!job, index, bullets: bullets.length, currentLen: bulletFix.current.length })
        toast.info(t("bullet_line_gone"))
          void runRescore()
        return
      }
      // A merge also deletes the second line. If that twin is no longer in the
      // CV, the merge does not fail — there is simply nothing left to delete, so
      // the rewrite lands on its own. Refusing the whole operation because the
      // easy half was already done would throw away the half that matters.
      // What we never do is delete a line we cannot identify: `rmAt` comes from
      // the same text match as everything else, and only a real hit deletes.
      let rmAt =
        bulletFix.removeIndex === undefined
          ? undefined
          : resolveBulletIndex(bullets, bulletFix.removeIndex, bulletFix.removeCurrent ?? "")
      if (rmAt !== undefined && (rmAt < 0 || rmAt === at)) {
        reportUxFailure("bullet_merge_twin_gone", { index, removeIndex: bulletFix.removeIndex ?? -1, bullets: bullets.length })
        rmAt = undefined
      }
      // Replace the one bullet; re-mark every bullet uniformly so the stored
      // description stays consistent (formatBullet strips then re-adds "• ").
      // Through the one owner of the convention, so this path cannot reintroduce
      // a duplicate the rest of the app has made impossible.
      const merged = bullets.map((line, i) => (i === at ? improved : line))
      const written = serializeBulletsReporting(
        rmAt !== undefined ? merged.filter((_, i) => i !== rmAt) : merged,
      )
      const nextDescription = written.text
      const updated = work.map((j) => (j.id === targetId ? { ...j, description: nextDescription } : j))
      updateSectionData("workExperience", updated)
      // Same key the Content tab's guard uses: this write IS AI output, so the
      // "improve" button over there must not come back offering to improve it.
      markContentOptimized(`opt_bullet_${targetId}`, nextDescription)
      // La blanda que esta línea deja demostrada. Ver el campo `demonstrates`.
      if (bulletFix.demonstrates) creditSoftSkill(bulletFix.demonstrates)
      if (bulletFix.appliedCheckId) markCheckApplied(bulletFix.appliedCheckId)
      appliedWithUndo(t("toast_change_applied"), [["workExperience", work]], {
        checkId: bulletFix.appliedCheckId,
        signature: nextDescription,
      })
      if (written.removed > 0) toast.info(t("dedupe_done", { count: written.removed }))
      void runRescore()
    } catch {
      toast.error(t("metricless_improve_error"))
    } finally {
      setBulletFix(null)
    }
  }

  // Soft-skill weave: ask the model to DEMONSTRATE the skill inside a real bullet
  // of the best-fit job (never names the word), then confirm via the same diff
  // modal before it lands — the user is the honesty gate. Appends a new bullet.

  /**
   * CUANDO NO HAY DÓNDE ESCRIBIRLA, NO SE TERMINA EN UN «NO».
   *
   * ── EL DEFECTO (reportado con captura, 2026-08-21) ───────────────────────
   *
   * El panel decía «Demostrá "Análisis de indicadores comerciales" en una
   * viñeta», él apretaba, y la respuesta era un aviso gris: «No encontré un
   * puesto donde encaje de forma natural.» Fin. Su pregunta fue «¿a qué se debe
   * esto?», y era la correcta: el panel le pidió algo, le cobró el uso y el
   * cooldown, y le contestó que no.
   *
   * La regla del proyecto es que NINGÚN endpoint de IA entrega un hueco: se
   * pregunta, se reintenta una vez, y se rellena con algo útil y verdadero. Acá
   * lo verdadero existe y es determinista: el término puede ir a Habilidades sin
   * gastar una llamada. No es lo mismo que demostrarlo en una viñeta —lo dice el
   * propio panel— pero es más que nada, y lo elige él.
   *
   * Sólo se llega acá cuando NO se puede preguntar por el puesto: o él ya eligió
   * uno y el modelo igual se negó, o el CV no tiene ningún puesto con id al que
   * escribir. En los demás casos se abre el selector, que es mejor respuesta.
   */
  function noFitDeadEnd(skill: string) {
    toast.info(t("soft_skill_no_fit"), {
      action: {
        label: t("term_add"),
        onClick: () => { addKeywordToSkills(skill) },
      },
    })
  }

  /**
   * PROPONER UNA LÍNEA NUEVA DENTRO DE UN PUESTO. Un solo dueño.
   *
   * ── EL DEFECTO (cazado al revisar el pase de QA, 2026-08-25) ──────────────
   *
   * El intercambio vivía dentro de `weaveSkill`, y el selector de puesto tiene un
   * ATAJO —si el usuario acepta el puesto recomendado, se reusa el borrador ya
   * escrito en vez de pagar una segunda llamada— que armaba su propio `setModal`
   * con `type: "append"`. Por ese camino, que es el MÁS frecuente, un puesto
   * lleno recibía la línea igual y el chequeo de estructura le pedía cortarla
   * después: el bucle que este cambio vino a cerrar, entrando por la otra puerta.
   *
   * UN PUESTO LLENO NO RECIBE UNA LÍNEA MÁS: RECIBE UN CAMBIO.
   *
   *   «Si ya tenemos como máximo 6 bullets no debería aconsejarme agregar un
   *    bullet donde ya tengo 6… si quiere ayudar ahí, sólo que me pida modificar
   *    o reemplazar por el más débil de todos.» (CEO, 2026-08-25)
   *
   * Sin lugar, la propuesta es un INTERCAMBIO: entra la línea nueva y sale la que
   * menos aporta A ESTA VACANTE —la misma vara con la que el informe decide qué
   * gemela borrar—, y el modal muestra el puesto entero antes y después. El
   * conteo no se mueve, así que ninguna tarjeta puede pedirle después que deshaga
   * lo que acaba de aceptar.
   *
   * Y SI NO SOBRA NADA, NO SE ESCRIBE. Cuando todas sus líneas le hablan al
   * puesto y están bien escritas, `weakestBullet` devuelve null y la respuesta
   * honesta es que ahí no entra: sacrificar trabajo bueno para hacerle lugar a
   * una habilidad es una pérdida, no una mejora.
   */
  function proposeBulletInto(
    job: WorkExperienceItem,
    text: string,
    opts: { skill: string; soft: boolean; checkId?: string },
  ): void {
    const { skill, soft, checkId } = opts
    // El consejo de blandas ya no viene de tailor —no era suyo—; la razón es la
    // misma para las dos: mostrar la habilidad DENTRO de una línea con fecha,
    // que es lo único que la convierte en prueba.
    const reason = t("prove_skill_reason", { skill })
    /**
     * La clave de la memoria de aplicados sigue al MODO, no al atajo.
     *
     * El atajo escribía `soft-${skill}` siempre. Con una habilidad DURA eso
     * guardaba la memoria bajo otra clave y, peor, `handleConfirmApply` acredita
     * una BLANDA cuando la clave arranca con `soft-`: una dura tejida por el
     * atajo sumaba cobertura de blandas. Preexistente, y ahora imposible: la
     * clave se arma en un solo lugar.
     */
    const itemKey = soft ? `soft-${skill}` : `prove-${skill}`
    const budget = roleBudget(job)
    const lines = parseBullets(job.description ?? "")
    if (budget.room <= 0) {
      const pesos = report?.posting?.hardWeights
      const victima = weakestBullet(
        lines.map((linea, index) => ({
          index,
          text: linea,
          keywords: report?.bullets.find((b) => b.targetId === job.id && b.index === index)?.keywords ?? [],
        })),
        (term) => postingWeightOf(term, pesos),
      )
      if (!victima) {
        toast.info(t("weave_role_full_strong", { jobTitle: job.jobTitle ?? "" }))
        return
      }
      setModal({
        suggestion: {
          field: "workExperience.description",
          type: "replace",
          preview: serializeBullets([...lines.filter((_, i) => i !== victima.index), text]),
          reason: `${reason} · ${t("weave_role_swap", { jobTitle: job.jobTitle ?? "", dropped: victima.text })}`,
          targetId: job.id,
        },
        currentValue: job.description ?? "",
        itemKey,
        // El hallazgo que esta confirmación cierra, cuando el tejido vino de uno.
        // Sin esto la tarjeta seguía ofreciendo trabajo ya hecho.
        appliedCheckId: checkId,
      })
      return
    }
    setModal({
      suggestion: {
        field: "workExperience.description",
        type: "append",
        preview: text,
        reason,
        targetId: job.id,
      },
      currentValue: job.description ?? "",
      itemKey,
      appliedCheckId: checkId,
    })
  }

  async function weaveSkill(skill: string, targetId?: string, soft = true, refresh = false, checkId?: string) {
    if (weavingSoft) return
    setWeavingSoft(skill)
    try {
      const res = await apiFetch("/api/ai/skill-bullet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skill, sectionData, language: cvLanguage, soft, targetId, ...(refresh ? { refresh: true } : {}) }),
      })
      if (!res.ok) {
        // "Try again" is the wrong advice when the answer is "not today". The
        // daily cap is a 429 with a code, and repeating the generic failure
        // message sent the user pressing every skill in the list — measured in
        // the error log: seven identical 429s in three seconds, each one
        // reported to them as if the write had simply glitched.
        const body = (await res.json().catch(() => null)) as { error?: string } | null
        const code = body?.error ?? ""
        toast.error(
          code === "daily_cap_reached" || code === "quota_exceeded" || res.status === 429
            ? tAi("daily_cap_reached")
            : t("soft_skill_error"),
        )
        return
      }
      const data = (await res.json().catch(() => null)) as
        | { status: "written"; targetId: string; jobTitle: string; text: string }
        | { status: "no_fit" }
        | { status: "already_demonstrated" }
        | null
      const work = (sectionData.workExperience ?? []) as WorkExperienceItem[]
      // No natural home — the model's call, not the last word. The candidate is
      // the only one who knows where this actually happened, so ask them instead
      // of ending on a toast with nothing to press.
      // The CV already proves this skill in a bullet. Say so and mark it done —
      // pressing again used to write a second bullet about the same thing.
      if (data?.status === "already_demonstrated") {
        toast.info(t("skill_already_demonstrated", { skill }))
        return
      }
      if (!data || data.status === "no_fit") {
        if (!targetId && work.some((j) => j.id)) setSoftPick({ skill, recommendedId: null, draft: null, soft, refresh, checkId })
        else noFitDeadEnd(skill)
        return
      }
      const job = work.find((j) => j.id === data.targetId)
      if (!job) {
        if (!targetId && work.some((j) => j.id)) setSoftPick({ skill, recommendedId: null, draft: null, soft, refresh, checkId })
        else noFitDeadEnd(skill)
        return
      }
      // First pass: show WHERE it would go and let the user move it. Only the
      // user's confirmed role reaches the CV.
      if (!targetId) {
        setSoftPick({ skill, recommendedId: data.targetId, draft: data.text, soft, refresh, checkId })
        return
      }
      proposeBulletInto(job, data.text, { skill, soft, checkId })
    } catch {
      toast.error(t("soft_skill_error"))
    } finally {
      setWeavingSoft(null)
    }
  }

  const jobInputRef = useRef<HTMLTextAreaElement>(null)
  const roleMode = false // role-title mode removed — job description is the only input
  const inputIsQuestion = !roleMode && isQuestion(input)

  // Path-to-target: jump to the card that fixes a lever. title/sections have no
  // single place to send the user, so they stay informative (no jump button).
  // Class appended to a scroll-target card while it's the freshly-jumped-to one.

  const summary = (sectionData.summary as string) ?? ""
  const workExp = (sectionData.workExperience as unknown[]) ?? []
  const skills = (sectionData.skills as unknown[]) ?? []
  /**
   * QUÉ ESTÁ PASANDO MIENTRAS ESPERA (F1).
   *
   * Hasta F1 la crítica del reclutador corría EN PARALELO con la medición, y el
   * análisis entero tardaba lo que tardaba el tramo más lento. Ahora corre
   * DESPUÉS —porque necesita el puntaje para anclar su veredicto— y la espera
   * pasó a ser la suma: entre 13 y 16 segundos medidos contra la API real.
   *
   * Un único «Analizando…» durante quince segundos se lee como que se colgó. Las
   * tres etapas de abajo son las del pipeline REAL y en su orden real —se lee la
   * vacante, se mide el CV contra ella, y recién entonces el modelo la juzga—,
   * así que esto no es una barra de progreso inventada: es decir en voz alta lo
   * que está ocurriendo. Los cortes salen de la medición, no de una estimación.
   */
  const [analysisStage, setAnalysisStage] = useState(0)
  useEffect(() => {
    if (!loading) { setAnalysisStage(0); return }
    const a = setTimeout(() => setAnalysisStage(1), 3000)
    return () => clearTimeout(a)
  }, [loading])
  /**
   * EL VEREDICTO ESTÁ EN CAMINO.
   *
   * El informe llega en dos actos, y quién va en cuál lo sabe la petición —no se
   * deduce mirando si un campo del crudo vino en null, que además es una puerta
   * que el informe cerró a propósito—. Por eso el hook lo dice y el panel sólo
   * lo pinta. Los dos primeros rótulos se estiman con el reloj; éste no: es un
   * hecho.
   */
  const verdictPending = loading && verdictPendingFromRequest
  const analyzingLabel = verdictPending
    ? t("analyzing_reviewing")
    : analysisStage === 0 ? t("analyzing_reading") : t("analyzing_measuring")

  const cvReady = summary.trim().length > 0 && workExp.length > 0 && skills.length > 0

  // Deterministic health verdict (no LLM, no JD) — recomputes live as the CV is
  // edited. This is the honest "is my CV good or bad?" answer, shown always.

  /**
   * The writing checks, recomputed from the CV as it stands RIGHT NOW.
   *
   * They used to arrive inside the analysis and stay frozen there. ats-rescore
   * refreshes the score on every edit but returns neither of these, so the list
   * kept describing the resume as it was at the first analysis: a bullet the user
   * had just fixed stayed on the list, still labelled "no metric", and re-running
   * the analysis was the only way to clear it — a model call to learn something
   * the browser could already see. That is what made the work feel endless and
   * what made fixing one line look like it spawned three more.
   *
   * Both functions are pure and take sectionData, exactly like computeResumeScore
   * above, so this costs nothing: no request, no tokens, no quota. Fix a line and
   * it leaves the list on the spot; the list shortens as the CV improves.
   */
  /**
   * `result.mergePairs` — the merge proposals the last analysis found, fed back
   * in. They come from an embedding call, which cannot run on a keystroke; the
   * checks themselves stay pure and deterministic, exactly as before. Absent
   * before the first analysis, and the merge finder falls back to its own
   * deterministic pass there.
   *
   * `result.repeatedPairs` — las líneas que dicen lo mismo con otras palabras,
   * del mismo embebido y por el mismo motivo. Sin esto la repetición desaparece
   * en cuanto el usuario toca una tecla y sólo vuelve tras otro análisis.
   */
  const liveWritingChecks = useMemo(
    () => analyzeWriting(
      sectionData as Record<string, unknown>,
      atsResult?.mergePairs ?? [],
      atsResult?.repeatedPairs ?? [],
    ),
    [sectionData, atsResult?.mergePairs, atsResult?.repeatedPairs],
  )

  /**
   * Lines the panel has decided to CUT, DEDUPE or REPAIR-AS-BROKEN.
   *
   * Computed once, here, because more than one card needs to know and every card
   * that answered this question for itself reached a different answer — which is
   * how one bullet ended up being told to be rewritten, deleted and adapted at the
   * same time. The full reconciliation (including the defect/tailor/metric slices)
   * happens where the bullet list is built; these three are the ones other cards
   * must respect to stay out of each other's way.
   */
  /**
   * One computation, two readers.
   *
   * The card and the ranked plan both need it, and each was calling it on every
   * render — twice per keystroke, and two call sites that could drift apart the
   * day someone passes a different input to one of them. The credibility number
   * the user reads and the one the plan ranks by have to be the same number by
   * construction, not by coincidence.
   */
  const credibility = useMemo(() => computeCredibility(liveWritingChecks), [liveWritingChecks])

  /**
   * EL INFORME. Un solo objeto, y es lo que el riel nuevo lee.
   *
   * Los ocho productores siguen calculando lo suyo —cada uno contesta una pregunta
   * distinta y algunos cuestan una llamada— pero dejan de llegar sueltos a la
   * pantalla para que cada tarjeta decida por su cuenta qué pintar. Se juntan acá,
   * una vez, con sección, dueño y salida.
   */
  const report = useMemo(
    () => (atsResult
      ? buildPanelReport({
          result: atsResult,
          writing: liveWritingChecks,
          sectionData: sectionData as Record<string, unknown>,
          jobDescription: input,
          credibility,
          // Lo que un parser REAL extrajo, cuando el usuario lo verificó. Es la
          // única fuente honesta para «¿parsea a dos columnas?» y «¿el contacto
          // sobrevivió?»: son preguntas sobre el archivo, no sobre los datos.
          isAlreadyAccepted: alreadyAccepted,
          // La foto vive en la config del CV, no en sus datos. Sólo informa.
          hasPhoto: !!photoUrl,
        })
      : null),
    [atsResult, liveWritingChecks, sectionData, input, credibility, alreadyAccepted, photoUrl],
  )

  /**
   * QUÉ HALLAZGO CERRÓ EL USUARIO, Y CONTRA QUÉ VERSIÓN DE ESE HALLAZGO.
   *
   * ── EL DEFECTO (barrido de cierre, 2026-08-25) ────────────────────────────
   *
   * Esto era un `Set<string>` de ids que sólo SUMABA: nueve lugares hacían `add`
   * y el único `delete` era la vuelta atrás. No había reset en ninguna parte, ni
   * al re-analizar.
   *
   * Y los ids son estables (`format.decorative_glyphs`, `search.title`,
   * `tips.metric.job-1.2`), así que un defecto que VUELVE —pegar otra vez una
   * viñeta con flecha, sacarle la cifra a una línea a mano— reaparecía en el
   * informe con el mismo id, la tarjeta lo pintaba en verde y no ofrecía botón.
   * Callejón sin salida hasta recargar el editor.
   *
   * ── LA REGLA ──────────────────────────────────────────────────────────────
   *
   * Un hallazgo no es su id: es su id MÁS lo que señala. Se guarda la huella del
   * hallazgo en el momento en que se aplicó, y cuenta como cerrado sólo mientras
   * el informe siga describiéndolo igual. Si vuelve señalando otra cosa —otra
   * línea, otro conteo, otro texto—, es un hallazgo nuevo y recupera su botón.
   */
  const [appliedFingerprints, setAppliedFingerprints] = useState<Map<string, string>>(new Map())

  /**
   * El ÚNICO escritor de «este hallazgo quedó cerrado».
   *
   * Guarda la huella junto al id. Un hallazgo que ya no está en el informe se
   * recuerda igual —no hay nada que pintar— y uno que vuelve distinto se
   * descarta solo al derivar el conjunto de abajo.
   */
  function markCheckApplied(checkId: string): void {
    const c = report ? allChecks(report).find((x) => x.id === checkId) : null
    setAppliedFingerprints((prev) => new Map(prev).set(checkId, c ? fingerprintOfCheck(c) : ""))
  }

  /**
   * Los hallazgos cerrados que SIGUEN describiendo lo mismo.
   *
   * Se deriva del informe vivo, que se rehace con cada tecla: si el hallazgo
   * volvió señalando otra cosa, deja de contar como cerrado y recupera su botón.
   * Uno que ya no existe se conserva marcado —no hay tarjeta que pintar— y no
   * ensucia ningún conteo, porque los conteos se arman sobre los chequeos del
   * informe.
   */
  const appliedCheckIds = useMemo(
    () => appliedIdsFrom(appliedFingerprints, report ? allChecks(report) : []),
    [appliedFingerprints, report],
  )

  /**
   * UN ANÁLISIS COMPLETO NO BORRA LAS MARCAS. Ese reset ERA el defecto.
   *
   * ── LO REPORTADO (CEO, 2026-08-27) ────────────────────────────────────────
   *
   *   «En el tailor, si voy solucionando, me dice que tengo 25 por arreglar,
   *    arreglo como 10, y cuando le doy a volver a analizar el ATS se vuelven a
   *    habilitar y me salen otras opciones.»
   *
   * Acá vivía `useEffect(() => setAppliedFingerprints(new Map()), [analysisRun])`:
   * cada corrida completa vaciaba la memoria entera, así que los diez arreglos
   * volvían con su botón como si nunca hubieran pasado.
   *
   * Y no era un descuido nuevo. `lib/ats/applied-memory.ts` documenta ESTE MISMO
   * defecto como su motivo de existir —«el panel ya recordaba lo aplicado, pero
   * sólo hasta la siguiente corrida (`setAppliedItems(new Set())` al re-analizar);
   * esa memoria tenía que durar más que el análisis»—. Se borró aquella línea y se
   * reescribió la misma con otro nombre.
   *
   * ── POR QUÉ EL ARGUMENTO QUE LO JUSTIFICABA NO SE SOSTIENE ────────────────
   *
   * Decía: «lo que escribe el reclutador se volvió a leer sobre el CV de ahora,
   * así que lo que siga listado sigue abierto». Pero el análisis se le pide al
   * modelo DE CERO —la clave de caché lleva el texto del CV, que acaba de
   * cambiar—, y entonces el modelo vuelve a opinar sobre el párrafo que él mismo
   * escribió. Que algo vuelva listado no prueba que siga abierto; es exactamente
   * el caso que `applied-memory` existe para no repetir.
   *
   * El caso que el reset quería cubrir —un defecto que VUELVE de verdad— ya está
   * cubierto y con mejor puntería por la huella: un hallazgo que reaparece
   * señalando otra línea, otro conteo u otro texto tiene otra huella y recupera su
   * botón solo. Lo que vuelve idéntico sigue cerrado, que es lo que el usuario ve.
   *
   * Queda UNA memoria de «esto ya lo hice», no dos.
   */

  const [tailorOpen, setTailorOpen] = useState(false)
  const [focusCheckId, setFocusCheckId] = useState<string | null>(null)
  /** Con qué filtro abre el ejecutor. El veredicto entra directo a «opcionales». */
  const [tailorFilter, setTailorFilter] = useState<TailorFilter>("all")
  /** El término que el riel mandó a resolver, para aterrizar en su tarjeta. */
  const [focusTerm, setFocusTerm] = useState<string | null>(null)




  // Fusion: one "Analyze" = one full report. After a manual analysis against a
  // real job description, signal Tailor to run itself (rewrites appear inline in
  // ③ without a second click). Not fired for role-only or question inputs, nor on
  // the live rescore — only on an explicit JD analyze.
  const [autoTailorSignal, setAutoTailorSignal] = useState(0)

  /**
   * Tailor-to-posting, folded into this report instead of living in its own
   * section. It auto-runs after a full analysis and its output is merged into
   * the ONE list of fixes below: the rewritten summary reuses the summary
   * action, the rewritten bullets join the bullets list, and the missing skills
   * join the missing-keyword card. No second header, no second "apply" flow.
   */
  /**
   * LO QUE TAILOR RECIBE: el trabajo que el informe le asignó, no la oferta.
   *
   * Antes le mandábamos hasta 6.000 caracteres de vacante y un array de keywords,
   * y él volvía a interpretarla por su cuenta — devolviendo su propio diagnóstico
   * de habilidades, blandas, resumen y métricas, que después había que desempatar
   * contra el del análisis. Ahora recibe qué línea y por qué.
   */
  const tailorWork = useMemo(
    () => (report ? tailorWorkload(report) : []).flatMap((c) => {
      const a = c.action
      if (a?.kind !== "rewrite_bullet" || !a.targetId || typeof a.index !== "number") return []
      return [{ checkId: c.id, targetId: a.targetId, index: a.index, reason: reasonOf(c.id) }]
    }),
    [report],
  )
  const wantsSummary = useMemo(
    () => (report ? tailorWorkload(report) : []).some((c) => c.action?.kind === "rewrite_summary"),
    [report],
  )

  const tailor = useTailorCV({
    // LA VACANTE SALE DEL INFORME, no del crudo del servidor. Una sola puerta:
    // lo que el panel pinta y lo que el ejecutor recibe vienen del mismo sitio.
    posting: report?.posting ?? null,
    workload: tailorWork,
    rewriteSummary: wantsSummary,
    autoRunSignal: autoTailorSignal,
  })
  /**
   * UNA SOLA BANDERA DE «HAY UNA LLAMADA CORRIENDO», para las tarjetas.
   *
   * Las tarjetas recibían `tailor.loading`, que sólo cubre al ejecutor. Fusionar
   * dos líneas y tejer un término son OTROS endpoints, con sus propios estados —
   * así que durante esas dos el botón no mostraba nada y la pantalla parecía
   * congelada. El spinner estaba escrito en `FixCard` desde siempre; nunca se le
   * dijo cuándo encenderlo.
   */
  /**
   * `improvingKey` FALTABA, y es el botón que más se aprieta.
   *
   * Reportado con captura (2026-08-22): «presiono el botón y no me da la
   * apariencia de que está cargando algo». Es el mismo defecto que ya se pagó
   * con la fusión —el spinner existía en `FixCard` desde siempre; nadie le decía
   * cuándo— y quedó vivo en el camino de improve-bullet, que tarda lo mismo.
   */
  const panelBusy = tailor.loading || !!mergingKey || !!weavingSoft || !!improvingKey

  /** Lo que el ejecutor escribió, atado al hallazgo que cierra. */
  const resolutions = useMemo(
    () => (report
      ? tailorResolutions(
          report,
          {
            rewrites: tailor.rewrites,
            tailoredSummary: tailor.tailoredSummary,
            summaryNeedsFigureConfirm: tailor.summaryNeedsFigureConfirm,
            currentSummary: (sectionData.summary as string) ?? "",
          },
          // parseBullets, NO un split crudo: la descripción se guarda con "• " y
          // el índice del informe es el de parseBullets. Con el glifo pegado,
          // toda comparación contra la línea viva fallaba y el guard de escritura
          // rechazaba el cambio con un "no se pudo aplicar".
          (targetId, index) => {
            const job = ((sectionData.workExperience ?? []) as WorkExperienceItem[]).find((j) => j.id === targetId)
            return parseBullets(job?.description ?? "")[index] ?? ""
          },
        )
      : []),
    [report, tailor.rewrites, tailor.tailoredSummary, tailor.summaryNeedsFigureConfirm, sectionData.summary, sectionData.workExperience],
  )

  /**
   * Aplica UN hallazgo, reusando los escritores que ya existen.
   *
   * NO reimplementa la escritura a propósito: `writeBullet` resuelve la línea por
   * TEXTO y no por índice —el índice es pista, el texto es identidad— y mapea
   * sobre el array completo, así que una línea que no toca sobrevive intacta. Un
   * escritor nuevo acá habría sido una segunda forma de escribir en el CV, con su
   * propia manera de perder datos.
   */
  /**
   * @param enLote  Viene de «Aplicar todo», donde el usuario ya aceptó el
   *   conjunto: ahí se escribe sin preguntar de a una. Un clic suelto SIEMPRE
   *   pasa por la pantalla de confirmación — ver `confirmarReescritura`.
   */
  function applyCheck(checkId: string, opts?: { enLote?: boolean }): void {
    /**
     * EL MODO VA EN UN OBJETO, NO EN UN BOOLEANO POSICIONAL.
     *
     * Cazado en el pase de QA (2026-08-27): esta función se pasa POR REFERENCIA
     * a la tarjeta (`onApply={applyCheck}`). Con un `enLote = false` posicional,
     * el día que alguien escriba `onClick={applyCheck}` React entrega el EVENTO
     * como segundo argumento — un objeto, siempre truthy— y la pantalla de
     * confirmación desaparecería sin que nada falle ni ningún test se ponga rojo.
     * Un `opts.enLote` sólo se activa si alguien lo escribe a propósito.
     */
    const enLote = opts?.enLote === true
    if (!report) return
    const check = allChecks(report).find((c) => c.id === checkId)
    const action = check?.action
    if (!check || !action) return

    // Fusionar no es reescribir: son DOS líneas que se vuelven una. Tiene su
    // propio camino desde antes y su propio guard —no se ofrece una fusión cuyo
    // texto pierda una palabra de las originales—, así que se rutea por id.
    if (checkId.startsWith("tips.merge.")) {
      const c = liveWritingChecks.mergeCandidates.find(
        (m) => `tips.merge.${m.targetId}.${m.indexes[0]}.${m.indexes[1]}` === checkId,
      )
      if (c) void runMerge(c, checkId)
      return
    }

    /**
     * El término que sólo vive en un puesto viejo se resuelve DEMOSTRÁNDOLO en
     * uno reciente — la misma maquinaria que teje los términos que faltan. No
     * hay un segundo escritor: es la función que ya existía, con su guard, su
     * confirmación y, si el puesto está lleno, su intercambio.
     */
    if (action.kind === "weave_term" && action.value) {
      // `refresh`: el término ESTÁ en el CV, en un puesto viejo — que es el
      // hallazgo. Sin la bandera el endpoint corta con «ya está demostrada»,
      // marca el hallazgo como resuelto y no escribe nada.
      void weaveSkill(action.value, undefined, false, true, checkId)
      return
    }

    // Mismo destino desde el otro botón: nada de esta familia se reescribe.
    if (checkId.startsWith("tips.cut.")) { removeCheckLine(checkId); return }

    const resolution = resolutions.find((r) => r.checkId === checkId)

    /**
     * Tailor no escribió esta línea: se le pide ahora.
     *
     * Tailor reescribe contra la vacante y no toca todo; una viñeta señalada por
     * otro motivo —sin cifra, verbo débil, duplicada— queda sin texto. Antes eso
     * lo resolvía un botón del bloque de críticos; sin este camino, el hallazgo
     * llegaría al modal con el botón apagado y sin forma de resolverse, que es
     * un diagnóstico sin salida.
     */
    if (!resolution && action.kind === "rewrite_bullet" && action.targetId && typeof action.index === "number") {
      const work = (sectionData.workExperience ?? []) as WorkExperienceItem[]
      const job = work.find((j) => j.id === action.targetId)
      const line = parseBullets(job?.description ?? "")[action.index] ?? ""
      if (!line) return
      /**
       * ── EL MENSAJE ABSURDO (reportado con captura, 2026-08-22) ────────────
       *
       *   «Me dice que ya está bien escrito, pero si ya está así ¿por qué
       *    comentarlo?»
       *
       * Y tenía toda la razón: esta llamada iba SIN foco. El panel sabe por qué
       * marcó la línea —está en pasiva, es de las más flojas, tiene un cliché— y
       * no se lo decía al modelo, que entonces juzgaba la línea AISLADA y
       * contestaba lo único honesto que podía: que está bien escrita.
       *
       * El foco sale de la línea con las MISMAS funciones que la marcaron, no de
       * una tabla paralela: si el diagnóstico y el pedido salen de dos sitios,
       * vuelven a decir cosas distintas.
       */
      void improveMetricless(
        {
          text: line,
          targetId: action.targetId,
          jobTitle: job?.jobTitle ?? "",
          index: action.index,
          reasons: focusForLine(checkId, line),
        },
        `check-${checkId}`,
        checkId,
      )
      return
    }

    /**
     * LAS DETERMINISTAS LAS APLICA SU DUEÑO, no una segunda copia acá.
     *
     * ── EL DEFECTO (cazado por QA, 2026-08-25) ───────────────────────────────
     *
     * Hay DOS despachadores: éste, para las tarjetas del ejecutor, y `fixCheck`,
     * para el botón del riel. La acción nueva `set_title` se conectó sólo al
     * segundo, mientras `FixCard` la declaraba aplicable — así que dentro del
     * ejecutor el botón salía HABILITADO y no hacía nada: caía en el `return` de
     * abajo por no tener reescritura. Y «Aplicar las N» la contaba.
     *
     * Se delega en vez de copiar la rama: dos copias de «cómo se escribe el
     * titular» es como los dos botones terminan haciendo cosas distintas.
     */
    if (action.kind === "set_title" || action.kind === "fix_dates" || action.kind === "remove_duplicates" || action.kind === "replace_text" || action.kind === "add_skill" || action.kind === "strip_glyphs") {
      fixCheck(checkId)
      return
    }

    if (!resolution) return

    const done = () => markCheckApplied(checkId)

    if (action.kind === "rewrite_bullet" && action.targetId && typeof action.index === "number") {
      /**
       * Una reescritura no puede PERDER un término que la vacante busca.
       *
       * El guard vivía en el botón del bloque viejo; se mudó acá, al punto de
       * escritura, que es el único lugar por donde pasa todo lo que toca el CV.
       * Sin él, una línea más linda podía costar la coincidencia que la traía.
       */
      /**
       * LOS TÉRMINOS DE LA VACANTE — no todo lo que el CV dice.
       *
       * ── EL DEFECTO (reportado con captura, 2026-08-25) ────────────────────
       *
       *   «Error: esa reescritura perdería términos que la vacante busca:
       *    Debugging.»
       *
       * Y la vacante NO buscaba Debugging. La lista se armaba con TODOS los
       * términos del informe con `cv > 0`, y ahí adentro vive la sección «otras
       * palabras clave»: habilidades que el candidato tiene y que esta oferta no
       * pide, publicadas para que vea que el análisis las ve. Se colaban al
       * guard, que bloqueaba reescrituras buenas con un mensaje que afirmaba algo
       * falso — el guard mintiendo y frenando a la vez.
       *
       * Y era además la mitad de una discrepancia: el servidor corre este mismo
       * chequeo con `posting.hardSkills + softSkills`, así que las dos puertas
       * juzgaban con listas distintas y el usuario veía pasar del servidor lo que
       * el cliente después rechazaba.
       */
      const claimed = (report?.terms ?? []).filter((x) => x.section !== "other" && x.cv > 0).map((x) => x.term)
      const lost = postingTermsLost(resolution.before ?? "", resolution.text, claimed)
      if (lost.length > 0) { toast.error(t("rewrite_loses_terms", { terms: lost.slice(0, 3).join(", ") })); return }
      /**
       * UNA CIFRA PROPUESTA NO SE APLICA SOLA. Ni por esta puerta.
       *
       * ── EL DEFECTO (barrido de cierre, 2026-08-25) ─────────────────────────
       *
       * La tarjeta pintaba el aviso «confirmá la cifra» y su botón escribía
       * igual, directo al CV, con el número que eligió el modelo. El aviso era un
       * cartel; el dato entraba sin que nadie lo confirmara.
       *
       * Cuando la reescritura trae una cifra que el CV no respalda, pasa por la
       * pantalla de confirmación, que la pinta como un hueco: el candidato
       * escribe el número y recién ahí se puede aplicar. El otro camino —el de
       * `improve-bullet`— ya lo hacía; éste no.
       */
      if (resolution.needsFigureConfirm) {
        setBulletFix({
          targetId: action.targetId,
          index: action.index,
          appliedCheckId: checkId,
          current: resolution.before ?? "",
          improved: resolution.text,
          why: resolution.metricHint || t("content_quality_hint"),
          recommended: resolution.text,
          needsFigureConfirm: true,
        })
        return
      }
      /**
       * QUÉ SE VA A ESCRIBIR Y DÓNDE, ANTES DE ESCRIBIRLO.
       *
       * ── LO REPORTADO (CEO, 2026-08-27) ───────────────────────────────────
       *
       *   «Antes para mejorar un bullet me decías cómo la IA lo iba a generar,
       *    ahora lo aplica de callado… es más verídico si muestras al usuario qué
       *    estás aplicando y dónde.»
       *
       * Y era cierto: esta puerta escribía derecho al CV, y la pantalla de
       * confirmación sólo se abría cuando la reescritura traía una cifra. Las dos
       * necesitan lo mismo —el texto es SU currículum— así que la confirmación
       * deja de ser un caso especial de la cifra y pasa a ser el camino.
       *
       * EN LOTE NO: «Aplicar todo» ya es la aceptación del conjunto, y abrir N
       * diálogos encadenados lo volvería inusable. Es la misma distinción que
       * `entraAlMasivo` ya hace — lo que necesita un dato del usuario se acepta
       * de a uno; esto necesita su visto bueno, no un dato.
       */
      if (!enLote) {
        setBulletFix({
          targetId: action.targetId,
          index: action.index,
          appliedCheckId: checkId,
          current: resolution.before ?? "",
          improved: resolution.text,
          why: resolution.metricHint || t("content_quality_hint"),
          recommended: resolution.text,
          demonstrates: resolution.demonstrates,
        })
        return
      }
      if (writeBullet(action.targetId, action.index, resolution.before ?? "", resolution.text, true, checkId)) {
        /**
         * LA BLANDA QUE ACABA DE QUEDAR DEMOSTRADA, ACREDITADA YA.
         *
         * ── EL DEFECTO (reportado con captura, 2026-08-22) ─────────────────
         *
         * «Si arreglo algo no sube mi soft skill.» La tarjeta muestra el chip
         * «demuestra: comunicación clara» —se lo pedimos POR NOMBRE al modelo—,
         * el usuario aplicaba, y el porcentaje de blandas no se movía: el
         * re-cálculo determinista arrastra `demonstratedSoftSkills` del último
         * análisis completo, porque juzgar una viñeta cuesta una llamada. El
         * crédito local existía desde antes (`creditSoftSkill`) y lo llamaba UN
         * solo camino, el de la tarjeta suelta del riel. Éste —el del ejecutor,
         * que es por donde pasa casi todo— nunca lo llamó.
         *
         * No hace falta un modelo para saber qué demuestra esa línea: pedimos
         * esa habilidad por su nombre y él aceptó la frase que la demuestra.
         */
        if (resolution.demonstrates) creditSoftSkill(resolution.demonstrates)
        done()
      }
      return
    }
    if (action.kind === "rewrite_summary") {
      // spliceSummary devuelve la frase reemplazada en su lugar cuando la
      // reescritura es de una sola oración: escribir el campo entero borraba el
      // resto del párrafo — medido, 56 palabras a 24.
      const current = (sectionData.summary as string) ?? ""
      /**
       * Y SI EL RESUMEN PROPONE UNA CIFRA, SE CONFIRMA COMO LA DE UNA VIÑETA.
       *
       * ── EL AGUJERO (barrido de cierre, 2026-08-25) ────────────────────────
       *
       * Las viñetas pasaban por la pantalla donde el candidato escribe el
       * número; el resumen se escribía directo. O sea: un dato inventado sobre
       * él, en la PRIMERA LÍNEA de su CV, que es la que todo el mundo lee, sin
       * que nadie se lo preguntara.
       *
       * Se manda el texto ya empalmado —lo que de verdad va a quedar— para que
       * el antes/después de la pantalla sea el del campo entero y no el de una
       * frase suelta.
       */
      if (resolution.needsFigureConfirm) {
        // `null` = no hay nada que escribir (el reemplazo vino vacío). Ese caso
        // ya lo cubre el camino de abajo, que no aplica un vacío sobre el
        // párrafo del candidato.
        const empalmado = spliceSummary(current, resolution.text)
        if (!empalmado) return
        setModal({
          suggestion: {
            field: "summary",
            type: "replace",
            preview: empalmado,
            reason: t("prove_summary_reason"),
            needsFigureConfirm: true,
          },
          currentValue: current,
          itemKey: "fix-summary",
          appliedCheckId: checkId,
        })
        return
      }
      /**
       * EL RESUMEN TAMBIÉN SE MUESTRA ANTES DE ESCRIBIRLO.
       *
       * ── LO PREGUNTADO (CEO, 2026-08-27) ──────────────────────────────────
       *
       *   «Al sugerir mejorar, hacer merge, borrar o cualquier cosa con bullets
       *    o summary, ¿le decimos al usuario cómo será su cambio?»
       *
       * Con las viñetas sí; con el resumen NO, salvo que la reescritura trajera
       * una cifra por confirmar. Y es el peor sitio para escribir callado: es la
       * PRIMERA línea del CV, la que todo el mundo lee, y se reemplaza entera.
       *
       * Se reusa `openSummaryDiff`, el mismo camino que ya usa el selector de
       * versiones. Un segundo camino de confirmación es como las dos pantallas
       * terminan mostrando cosas distintas.
       *
       * EN LOTE NO: «Aplicar todo» ya es la aceptación del conjunto, igual que
       * con las viñetas.
       */
      const empalmadoFinal = spliceSummary(current, resolution.text)
      if (!empalmadoFinal) return
      if (!enLote) {
        setModal({
          suggestion: { field: "summary", type: "replace", preview: empalmadoFinal, reason: t("summary_fix_reason") },
          currentValue: current,
          itemKey: "fix-summary",
          appliedCheckId: checkId,
        })
        return
      }
      updateSectionData("summary", empalmadoFinal as never)
      markFixApplied(resolution.text)
      appliedWithUndo(t("toast_change_applied"), [["summary", current]], { checkId, signature: resolution.text })
      void runRescore()
      done()
    }
  }

  /**
   * Los arreglos deterministas: sin modelo, sin cuota y sin esperar.
   *
   * Cada uno reusa el escritor que ya existía. Un despachador que escribiera por
   * su cuenta sería una segunda forma de tocar el CV, con su propia manera de
   * perder datos — el defecto que este proyecto ya pagó una vez.
   */
  function fixCheck(checkId: string): void {
    if (!report) return
    const action = allChecks(report).find((c) => c.id === checkId)?.action
    if (!action) return
    const done = () => markCheckApplied(checkId)

    // Reordenar no es unificar fechas: comparte el tipo de acción para tener
    // botón, pero ejecuta otra cosa. Se rutea por id, como la fusión.
    if (checkId === "format.chronology") { reorderRoles({ checkId }); done(); return }
    // Cortar es determinista, pero no silencioso: abre la confirmación que
    // muestra la línea entera. El `done()` lo hace ella al confirmar.
    if (checkId.startsWith("tips.cut.")) { removeCheckLine(checkId); return }
    /**
     * EL TITULAR, Y SÓLO EL TITULAR.
     *
     * Escribe el cargo que la vacante busca en `personalDetails.jobTitle`, que es
     * cómo la persona se presenta hoy. Los cargos de los PUESTOS no se tocan: son
     * historia laboral, y «nunca reclames un cargo que no tuviste» sigue entero.
     *
     * Pasa por la confirmación —no por una escritura silenciosa— porque cambia la
     * primera línea de su CV: ve el antes y el después y decide. Y reusa
     * `applySuggestion`, el mismo escritor de todo lo demás.
     */
    if (action.kind === "set_title" && action.value) {
      setModal({
        suggestion: {
          field: "personalDetails.jobTitle",
          type: "replace",
          preview: action.value,
          reason: t("set_title_reason", { title: action.value }),
        },
        currentValue: ((sectionData.personalDetails ?? {}) as { jobTitle?: string }).jobTitle ?? "",
        itemKey: `title-${action.value}`,
        appliedCheckId: checkId,
      })
      return
    }
    /**
     * LA FLECHITA DEL PRINCIPIO. Determinista, y por eso tiene botón.
     *
     * ── EL DEFECTO (barrido de los `owner: "user"`, 2026-08-25) ─────────────
     *
     * «{N} viñetas abren con símbolos raros: algunos ATS los descartan» cerraba
     * con «esto sólo lo sabés vos: escribilo en el editor». Era lo ÚNICO de esa
     * lista que no depende de un dato que el usuario tenga en la cabeza —el
     * correo, el teléfono, las fechas, un hueco de empleo—: quitar el glifo es
     * una operación de texto que el producto puede hacer solo.
     *
     * Toca el PRINCIPIO de la línea y nada más. Y con el mismo conjunto de
     * símbolos que usó el chequeo para contarlas.
     */
    if (action.kind === "strip_glyphs") { if (stripDecorativeGlyphs(checkId)) done(); return }
    if (action.kind === "fix_dates") { if (fixDates(checkId)) done(); return }
    if (action.kind === "remove_duplicates") { if (removeDuplicateBullets(checkId)) done(); return }
    if (action.kind === "add_skill" && action.value) { if (addKeywordToSkills(action.value, checkId)) done(); return }
    // La errata: una palabra, y la keyword vuelve a contar. Escribe por el MISMO
    // camino que la tarjeta de ortografía — dos escritores sobre el mismo dato es
    // como la pareja se desincroniza, y acá hay uno solo.
    if (action.kind === "replace_text" && action.value && action.replacement) {
      if (applyTypoFix(action.value, action.replacement, checkId)) done()
      return
    }
    if (action.kind === "rewrite_bullet" && action.targetId && typeof action.index === "number") {
      // Fragmento partido al importar: la cola vuelve a la línea de arriba. No es
      // una reescritura — es reunir lo que un salto de página cortó.
      const orphan = liveWritingChecks.orphanFragments.find(
        (f) => f.targetId === action.targetId && f.index === action.index,
      )
      if (orphan && writeBullet(orphan.targetId, orphan.index - 1, orphan.previousText, `${orphan.previousText} ${orphan.text}`, false, checkId)) done()
    }
  }

  /**
   * Devuelve el hallazgo a «pendiente». Su ÚNICO llamador es la vuelta atrás del
   * aviso, después de haber restaurado el texto: desmarcar sin restaurar es lo
   * que hacía el botón viejo de la tarjeta, y es exactamente lo que se cerró.
   */
  function undoCheck(checkId: string): void {
    setAppliedFingerprints((prev) => { const next = new Map(prev); next.delete(checkId); return next })
  }

  /**
   * Soft skills this posting asks for that no bullet demonstrates yet.
   *
   * Lives here rather than inside the skills card because it now feeds the
   * "bullets to improve" list: a soft skill is never a tag to add — it counts
   * only when a bullet shows the behaviour — so its action WRITES a bullet, and
   * that is the one thing in that list guaranteed to change the CV.
   *
   * Tailor's entries carry a written suggestion so they win a tie; the matcher's
   * plain list is there for when tailor is in cooldown.
   */
  async function handleSubmit() {
    setAddedKeywords(new Set())
    await analyze()
    if (!inputIsQuestion && input.trim().length >= 20) {
      setAutoTailorSignal((n) => n + 1)
    }
  }

  // Spelling FIX button — not just "you misspelled X", but one click that replaces
  // the wrong spelling with the right one everywhere in the CV (skills, summary,
  // work bullets), then re-scores. Deterministic word-boundary replace, case kept
  // from the correct term. This is a real solution, not a note.
  // Id of the scroll-target card a gap-plan lever just jumped to (flash highlight).

  function applyTypoFix(typed: string, correct: string, checkId?: string): boolean {
    // Same writer as the spelling card — this used to be a second, narrower copy
    // that only touched skills, summary and bullet descriptions, so the identical
    // typo in an education or project line survived a fix that claimed to be
    // applied everywhere. Two write paths over the same user data is how the
    // pair drifts; there is one now.
    const { patch, changed } = applySpellingFix(
      sectionData as unknown as Record<string, unknown>,
      typed,
      correct,
      { includeSkills: true },
    )
    if (!changed) { toast.info(t("typo_not_found")); return false }
    // La foto se toma sobre las MISMAS claves que el parche va a tocar: una
    // errata puede vivir en tres secciones y revertir sólo una las desalinea.
    const antesDeErrata: Array<[Parameters<typeof updateSectionData>[0], unknown]> =
      Object.keys(patch).map((key) => [
        key as Parameters<typeof updateSectionData>[0],
        (sectionData as unknown as Record<string, unknown>)[key],
      ])
    for (const [key, value] of Object.entries(patch)) {
      updateSectionData(key as Parameters<typeof updateSectionData>[0], value as never)
    }
    appliedWithUndo(t("typo_fixed", { correct }), antesDeErrata, { checkId })
    void runRescore()
    return true
  }

  // Remove a bullet that doesn't earn its place — a real solution, not a tweak.
  // Confirmed in a preview modal first (safety); the index is re-verified against
  // the live text so an edit between analyze and remove never deletes the wrong line.
  const [pendingRemove, setPendingRemove] = useState<{ targetId: string; index: number; text: string; checkId?: string } | null>(null)

  /**
   * CORTAR UNA LÍNEA, PEDIDO DESDE UNA TARJETA.
   *
   * ── EL DEFECTO (reportado con captura, 2026-08-22) ────────────────────────
   *
   * «Si tengo más viñetas de lo normal debería sugerirme borrar las más débiles.»
   * El flujo de borrado estaba ESCRITO Y MUERTO: `setPendingRemove` no se llamaba
   * desde ningún lado y `onRemove` nunca se le pasaba al ejecutor, así que el
   * botón «Borrar» de `FixCard` no podía renderizarse nunca y el diálogo de
   * confirmación no podía abrirse nunca. Código completo, inalcanzable.
   *
   * El texto sale de la EVIDENCIA del hallazgo y cae al CV vivo sólo si falta:
   * el índice es pista, el texto es identidad, y `confirmRemoveBullet` resuelve
   * por texto antes de escribir.
   */
  function removeCheckLine(checkId: string): void {
    if (!report) return
    const check = allChecks(report).find((c) => c.id === checkId)
    const a = check?.action
    if (!a?.targetId || typeof a.index !== "number") return
    const work = (sectionData.workExperience ?? []) as WorkExperienceItem[]
    const live = parseBullets(work.find((j) => j.id === a.targetId)?.description ?? "")[a.index] ?? ""
    const text = check?.evidence?.[0]?.trim() || live
    if (!text) return
    setPendingRemove({ targetId: a.targetId, index: a.index, text, checkId })
  }
  function confirmRemoveBullet() {
    if (!pendingRemove) return
    const { targetId, index, text } = pendingRemove
    try {
      const work = (sectionData.workExperience ?? []) as WorkExperienceItem[]
      const job = work.find((j) => j.id === targetId)
      const bullets = parseBullets(job?.description ?? "")
      const at = job ? resolveBulletIndex(bullets, index, text) : -1
      if (at < 0) {
        // Already gone is the outcome the user wanted. Not an error.
        reportUxFailure("bullet_remove_line_gone", { jobFound: !!job, index, bullets: bullets.length, textLen: text.length })
        toast.info(t("bullet_line_gone"))
          if (pendingRemove.checkId) markCheckApplied(pendingRemove.checkId)
        void runRescore()
        return
      }
      const next = bullets.filter((_, i) => i !== at).map(formatBullet).join("\n")
      updateSectionData("workExperience", work.map((j) => (j.id === targetId ? { ...j, description: next } : j)))
      // El hallazgo que pidió el corte queda cerrado. Sin esto la tarjeta sigue
      // ofreciendo cortar una línea que ya no existe.
      if (pendingRemove.checkId) markCheckApplied(pendingRemove.checkId)
      // Borrar es lo más caro de revertir a mano —la línea ya no está a la vista
      // para volver a escribirla—, así que es donde la vuelta atrás más vale.
      appliedWithUndo(t("bullet_removed"), [["workExperience", work]], { checkId: pendingRemove.checkId })
      void runRescore()
    } catch {
      toast.error(t("toast_change_error"))
    } finally {
      setPendingRemove(null)
    }
  }


  function handleConfirmApply(escrito?: string) {
    if (!modal) return
    const { suggestion, itemKey } = modal
    const { field, type, targetId } = suggestion
    // Lo que quedó en la pantalla: con la cifra que escribió el candidato, no la
    // que propuso el modelo. Ver `confirmBulletFix`.
    const preview = escrito?.trim() || suggestion.preview

    try {
      const result = applySuggestion(
        { field, type, preview, targetId },
        sectionData as unknown as ResumeSections,
      )

      if (result.status === "unplaceable") {
        reportUxFailure("suggestion_unplaceable", { field: String(field).slice(0, 40), type: String(type).slice(0, 40), hasTarget: !!targetId })
        toast.error(t("toast_change_error"))
        setModal(null)
        return
      }

      if (result.status === "manual") {
        toast.info(t(result.field === "languages" ? "toast_update_languages" : "toast_update_certifications"))
        setModal(null)
        return
      }

      // La foto, ANTES de escribir. Estaba unas líneas más abajo y funcionaba
      // sólo por cómo immer copia el estado: leer el valor previo después de
      // haberlo reemplazado depende de un detalle del store, no del código de acá.
      const antesDeAplicar = (sectionData as unknown as Record<string, unknown>)[result.section]
      updateSectionData(result.section, result.value)

      // El preview es el texto que acaba de entrar al CV: su firma es lo que
      // impide que el análisis siguiente proponga una variante de él.
      markFixApplied(preview)
      if (modal.appliedCheckId) markCheckApplied(modal.appliedCheckId)
      // The bullet we just wrote demonstrates the skill we asked it to
      // demonstrate. Credit it now; waiting for the next full analysis meant the
      // number ignored the work the panel had just talked the user into.
      if (itemKey.startsWith("soft-")) creditSoftSkill(itemKey.slice("soft-".length))
      appliedWithUndo(t("toast_change_applied"), [[result.section, antesDeAplicar]], {
        checkId: modal.appliedCheckId,
        signature: preview,
      })
      // The same write also collapses a line the CV stated twice; say it.
      if (result.section === "workExperience" && (result.duplicatesRemoved ?? 0) > 0) {
        toast.info(t("dedupe_done", { count: result.duplicatesRemoved ?? 0 }))
      }
      void runRescore()
    } catch {
      toast.error(t("toast_change_error"))
    } finally {
      setModal(null)
    }
  }

  /**
   * Writes ONE skill into the skills section, in the shape the section uses.
   *
   * The analyst can phrase a suggestion as a sentence ("Crash Reporting and/or
   * the specific analytics tools you have used"); pasting that verbatim puts a
   * paragraph in a chip row. A skill is 1-4 words, and its casing comes from the
   * shared catalog so "objective-c" lands as "Objective-C" like the rest.
   *
   * @returns true when the CV actually gained a skill.
   */
  /**
   * La DECISIÓN vive en `lib/ats/skill-add.ts` y se ejecuta en sus tests; acá
   * queda lo que es del componente: avisar, escribir y volver a puntuar. Estaba
   * todo junto adentro, y ahí lo único que se podía testear era leer que la
   * línea existiera — el defecto que este proyecto ya pagó con `applyAllPlan`.
   */
  function addKeywordToSkills(keyword: string, checkId?: string): boolean {
    const plan = planSkillAdd(keyword, sectionData as Record<string, unknown>, () => nanoid())
    if (plan.kind === "not_a_skill") {
      toast.info(t("keyword_not_a_skill"))
      return false
    }
    setAddedKeywords((prev) => new Set(prev).add(keyword))
    if (plan.kind === "already_there") {
      toast.info(t("keyword_already_added", { keyword: plan.name }))
      return false
    }
    const antesDeHabilidades = sectionData.skills
    updateSectionData("skills", plan.skills)
    appliedWithUndo(t("keyword_added", { keyword: plan.name }), [["skills", antesDeHabilidades]], {
      checkId,
      // Y el término deja de contar como agregado: si no, tras deshacer sigue
      // filtrado de «aplicar todo» y el usuario no puede volver a sumarlo.
      onUndo: () => setAddedKeywords((prev) => { const next = new Set(prev); next.delete(keyword); return next }),
    })
    void runRescore()
    return true
  }

  /**
   * Adds every missing keyword at once — through the SAME normalization the
   * one-by-one button uses. It used to write the raw strings straight into the
   * section, so "Add all" could land casing and near-duplicates that the single
   * add would have cleaned ("objective-c" beside "Objective-C").
   */

  /**
   * Reorder the work history, most recent first.
   *
   * Deterministic: the end date decides, an ongoing role outranks a finished one,
   * and a role with no readable date KEEPS ITS POSITION rather than being guessed
   * into place — inventing an order is the same class of harm as inventing a date.
   * Nothing is deleted and no text is touched; only the sequence changes.
   */


  /**
   * El PLAN vive en `lib/ats/role-order.ts` y se ejecuta en sus tests: mueve los
   * puestos del CV del usuario, y ahí adentro lo único testeable era leer que la
   * línea existiera. Acá queda avisar, escribir y volver a puntuar.
   */
  function reorderRoles(opts: { silent?: boolean; checkId?: string } = {}) {
    const work = (sectionData.workExperience ?? []) as WorkExperienceItem[]
    const next = planRoleReorder(work)
    if (!next) {
      if (!opts.silent && work.length >= 2) toast.info(t("cred_order_already"))
      return
    }
    updateSectionData("workExperience", next)
    // `silent` existe para un llamador que hoy NO existe —el único es
    // `reorderRoles()` sin argumentos—: se conserva porque es preexistente, y se
    // dice que está sin uso en vez de describir un caso imaginario.
    if (!opts.silent) { appliedWithUndo(t("cred_order_done"), [["workExperience", work]], { checkId: opts.checkId }); void runRescore() }
  }

  /** Drop one or more entries from Skills. Nothing else in the CV is touched. */


  return (
    <>
      <div className="flex flex-col gap-3 pb-4">
        {/* Section header */}
        <div className="flex items-center gap-2.5 mb-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-dash-cyan to-[#0077B6] shadow-lg shadow-dash-cyan/30">
            <Target className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1">
            <span className="text-sm font-bold text-slate-800">{t("title")}</span>
          </div>
          <span className="text-[9px] font-black tracking-widest uppercase bg-gradient-to-r from-dash-cyan to-[#00A8CC] text-white px-2.5 py-1 rounded-full shadow-sm">
            {t("pro_badge")}
          </span>
        </div>
        <p className="text-[11px] text-slate-500 leading-relaxed mb-3">{t("panel_description")}</p>

        {/* Incomplete CV warning */}
        {!cvReady && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3 flex flex-col gap-2 mb-1">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
              <span className="text-xs font-bold text-amber-800">{t("cv_incomplete_title")}</span>
            </div>
            <p className="text-[11px] text-amber-700 leading-relaxed">{t("cv_incomplete_desc")}</p>
            <div className="flex flex-col gap-1 mt-0.5">
              {[
                { label: t("cv_incomplete_summary"), done: summary.trim().length > 0 },
                { label: t("cv_incomplete_skills"), done: skills.length > 0 },
                { label: t("cv_incomplete_experience"), done: workExp.length > 0 },
              ].map(({ label, done }) => (
                <div key={label} className="flex items-center gap-1.5 text-[11px]">
                  {done
                    ? <Check className="h-3 w-3 text-emerald-500 shrink-0" />
                    : <span className="h-3 w-3 rounded-full border-2 border-amber-300 shrink-0 inline-block" />}
                  <span className={done ? "text-emerald-700 font-semibold" : "text-amber-700"}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CV health — the deterministic good/bad verdict, always visible once the
            CV has enough content. Answers "is my CV good?" without needing a job
            posting; the ATS match below then answers "good FOR THIS job?". */}


        {/* Job description is the ONLY input now. The role-title mode was removed:
            it inferred generic requirements and the real analysis needs the posting
            anyway, so it added a confusing half-answer. Paste the vacancy, period. */}

        {/* Textarea */}
        <div className="relative">
          <textarea
            ref={jobInputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={roleMode ? t("placeholder_role") : t("placeholder")}
            disabled={!cvReady}
            maxLength={roleMode ? 120 : AI_INPUT_LIMITS.jobDescription}
            className={`w-full resize-none rounded-2xl border border-cyan-100 bg-white/80 backdrop-blur-sm px-4 py-3 text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:border-transparent shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed ${roleMode ? "min-h-[52px]" : "min-h-[110px]"}`}
          />
          {!roleMode && input.trim().length > 0 && (
            <span className={`absolute bottom-2.5 right-3 text-[9px] px-2 py-0.5 rounded-full font-bold ${
              inputIsQuestion
                ? "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200"
                : "bg-cyan-100 text-cyan-700 ring-1 ring-cyan-200"
            }`}>
              {inputIsQuestion ? t("badge_consulta") : t("badge_ats")}
            </span>
          )}
        </div>

        {!inputIsQuestion && input.trim().length > 0 && (
          <p className="text-[10px] text-slate-400 flex items-start gap-1.5 leading-relaxed">
            <Lightbulb className="h-3 w-3 text-amber-400 shrink-0 mt-0.5" />
            {t("hint")}
          </p>
        )}

        {/* Analyze button — once a result is on screen and the job input is
            unchanged, it flips to an "up to date" state instead of a live button.
            The ATS score keeps refreshing on its own as the CV is edited (debounced
            rescore, deterministic/no-LLM), so re-running on the SAME posting adds
            nothing; the hint says so. Editing the posting reactivates "Re-analyze". */}
        {upToDate && !loading ? (
          <div className="flex flex-col gap-1.5">
            <div className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/30">
              <CheckCircle2 className="h-3.5 w-3.5" /> {t("analysis_up_to_date")}
            </div>
            {atsResult && (
              <p className="text-[10px] text-slate-400 text-center flex items-start justify-center gap-1 leading-relaxed px-2">
                <TrendingUp className="h-3 w-3 text-emerald-400 shrink-0 mt-0.5" /> {t("live_score_hint")}
              </p>
            )}
          </div>
        ) : (
          <button type="button" onClick={handleSubmit} disabled={loading || inCooldown || input.trim().length < (roleMode ? 3 : 15) || !cvReady}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-gradient-to-r from-dash-cyan to-[#00A8CC] text-white text-xs font-bold shadow-lg shadow-dash-cyan/30 hover:shadow-dash-cyan/50 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
            // La etiqueta cambia sola mientras espera: sin esto, para un lector de
            // pantalla el botón se queda mudo quince segundos.
            aria-live="polite">
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : inCooldown ? <Clock className="h-3.5 w-3.5" /> : inputIsQuestion && input.trim().length > 0 ? <MessageSquare className="h-3.5 w-3.5" /> : <Target className="h-3.5 w-3.5" />}
            {loading ? analyzingLabel : inCooldown ? t("wait", { seconds: cooldownLabel }) : inputIsQuestion && input.trim().length > 0 ? t("button_consultar") : hasResult ? t("re_analyze") : t("analyze")}
          </button>
        )}

        {offTopic && (
          <ATSErrorBlock title={t("off_topic_title")} description={t("off_topic_description")} />
        )}

        {/* ── EL INFORME ────────────────────────────────────────────────────
            Reemplaza al encabezado viejo del puntaje, que imprimía «Excelente»
            —una función pura de `score >= 80`— justo encima de los arreglos
            críticos, y a dos dedos de un «Riesgo medio» que venía de otra
            llamada. Reportado con captura. El riel recibe los críticos, así que
            no puede construirse esa contradicción. */}
        {report && (
          <div className="-mx-1 mb-3 overflow-hidden rounded-2xl">
            <ReportRail
              report={report}
              /**
               * EL FILTRO SE REINICIA AL ABRIR SOBRE UN HALLAZGO.
               *
               * ── EL DEFECTO (reportado con captura, 2026-08-22) ────────────
               *
               * «Al seleccionar el icono de IA me lleva a tailor pero está
               * vacío: no sé qué voy a mejorar.» `tailorFilter` es estado del
               * panel y quedaba pegado en lo último que alguien eligió —«tips»,
               * o la sección de un término—. Abrir sobre una viñeta con el
               * filtro puesto en otra sección mostraba la lista filtrada a cero:
               * el modal se abría en la nada, sobre un hallazgo que existía.
               *
               * Quien apunta a UN hallazgo pide ver ESE hallazgo. El filtro es
               * una vista, no una preferencia que sobreviva al próximo clic.
               */
              onSolve={(checkId) => { setTailorFilter("all"); setFocusCheckId(checkId ?? null); setTailorOpen(true) }}
              onFix={fixCheck}
              onAddTerm={(term) => { addKeywordToSkills(term) }}
              /**
               * DEMOSTRAR UN TÉRMINO SE RESUELVE EN TAILOR, NO EN EL RIEL.
               *
               * «Tailor es quien resuelve todo esto» (CEO, 2026-08-22). El riel
               * llamaba a `weaveSkill` por su cuenta: la misma acción existía en
               * dos sitios, con dos presentaciones y dos formas de fallar — y la
               * del riel era la peor, porque escribía en el CV sin mostrar antes
               * la tarjeta con la línea propuesta.
               *
               * Ahora abre el ejecutor en la sección del término y aterriza en
               * SU tarjeta, igual que `onSolve` hace con un hallazgo. Agregarlo a
               * Habilidades se queda acá: es determinista, no gasta llamada y no
               * hay nada que revisar antes.
               */
              onWeaveTerm={(term) => {
                const section = report.terms.find((x) => x.term === term)?.section
                setTailorFilter(section === "hard" || section === "soft" || section === "other" ? section : "open")
                setFocusTerm(term)
                setFocusCheckId(null)
                setTailorOpen(true)
              }}
              addedTerms={addedKeywords}
              busyTerm={weavingSoft}
              busy={panelBusy}
              /* El riel y el modal leen el MISMO estado de lo aplicado: sin esto
                 el modal marcaba «Aplicado» y el riel seguía ofreciendo resolver
                 lo mismo. */
              appliedIds={appliedCheckIds}
            />
          </div>
        )}

        {/* ATS Results */}
        {atsResult && (
          <div className="space-y-3 pt-1">

            {/* EL ENCABEZADO VIEJO DEL PUNTAJE SE FUE ARRIBA, AL RIEL.

                Imprimía «Excelente» —una función pura de `score >= 80`— justo
                encima de los arreglos críticos y a dos dedos de un «Riesgo
                medio» que venía de otra llamada: tres veredictos, ninguno
                mirando al otro. Reportado con captura, y con razón.

                El riel recibe los críticos, así que esa contradicción ya no se
                puede construir. La verificación contra el PDF real se queda
                acá: es nuestra evidencia más fuerte y cuesta renderizar el
                archivo, así que no pertenece al encabezado. */}
            <div className="flex flex-col items-center gap-1 py-2">
              {/* The real-PDF verification is our strongest evidence and it costs a
                  render of the actual file — it belongs to the résumé pass, not to
                  the third posting of the afternoon. Kept whole, one click away. */}
              {/* ── EL BLOQUE DE «VERIFICAR CONTRA TU PDF REAL» SE FUE ───────────
                  «¿Cuál es la necesidad de tener eso, en qué me ayuda?» (CEO,
                  2026-08-21). En nada, y esa era la respuesta honesta.

                  Mostraba dos números —el estimado sobre los datos y el medido
                  sobre el PDF— y le pedía al usuario que los interpretara. Cuando
                  no coincidían nombraba el síntoma («faltan encabezados de
                  sección») en vez de la causa, se contradecía dos líneas más
                  abajo diciendo «tu plantilla parsea limpio», y dejaba el
                  hallazgo de verdad —el texto que el parser saca— escondido tras
                  un desplegable.

                  Y LO DE FONDO: el usuario no tiene por qué descubrir que NUESTRA
                  plantilla le rompe el CV. Eso es trabajo nuestro. La diferencia
                  que este bloque medía en su CV salía de `letterSpacing` en las
                  plantillas de la familia ATS: el cargo se exportaba como
                  «I N G E N I E R O» y ningún filtro lo encuentra. Se arregla en
                  la plantilla y se vigila con un guard, no se le delega al
                  candidato en un botón. */}

              {/* LA COPIA EN TEXTO PLANO SE QUEDA, y sola.
                  Vivía dentro del bloque de verificación y se fue con él por
                  arrastre. No corresponde: esto NO es un número que el usuario
                  tenga que interpretar, es una DESCARGA —su CV en la forma más
                  portable— y sólo se le ofrece a quien la necesita de verdad, el
                  que eligió una plantilla de dos columnas. Con una que ya parsea
                  limpio no hay nada que ofrecer, así que no se pinta. */}
              {templateSafety === "caution" && (
                <div className="mt-2.5">
                  <AtsSafeDownload />
                </div>
              )}
            </div>

            {/* The recruiter pass failed. Said plainly, with a way out — the
                alternative is a report that is quietly missing a section the
                user has no way of knowing existed. */}
            {atsResult.analysisUnavailable && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-3.5 flex items-start gap-2.5">
                <AlertCircle className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-[11.5px] font-bold text-amber-900 leading-tight">{t("analysis_unavailable_title")}</p>
                  <p className="mt-0.5 text-[10.5px] text-amber-800/90 leading-relaxed">{t("analysis_unavailable_desc")}</p>
                </div>
              </div>
            )}

            {/* The recruiter's read and the arithmetic behind the number are the
                two things worth reading ONCE, carefully — not on every posting.
                Both kept in full, in the résumé pass. */}
            {(<>
            {/* ① Verdict — the recruiter's honest read: would this pass, and the
                biggest risk. The voice that ties the whole report together. */}
            {/* SIN LA INSIGNIA DE `passRisk`.
                Era un SEGUNDO veredicto, emitido por el modelo, pintado al lado
                del puntaje y sin que nadie los comparara: con la nota en 100 podía
                decir «riesgo alto». El mismo defecto del «CRÍTICO» reportado con
                captura, en otro sitio. El puntaje ya contesta si pasás el filtro,
                el dial ya dice si estás listo, y el párrafo de abajo da los
                matices — que es lo que este análisis sí aporta. */}
            {/* Sin esto, el informe del primer acto se lee como terminado y al
                usuario le aparece un párrafo de la nada diez segundos después. */}
            {verdictPending && (
              <div className="rounded-2xl border border-dash-cyan/25 bg-dash-cyan/[0.04] p-3.5 flex items-start gap-2.5" aria-live="polite">
                <Loader2 className="h-3.5 w-3.5 text-dash-cyan shrink-0 mt-0.5 animate-spin" />
                <p className="text-[11px] font-semibold text-[var(--a-ink-2)] leading-relaxed">
                  {t("analyzing_reviewing")}
                </p>
              </div>
            )}

            {report?.verdict && (
              /**
               * LA ÚNICA VOZ HUMANA DEL PANEL, y tiene que verse como tal.
               *
               * Dos rondas de captura para llegar acá. Primero era una caja
               * blanca con un icono de ESTETOSCOPIO —que decía «diagnóstico
               * médico», de otro mundo—. Después una caja blanca con una comilla
               * gris en la esquina, que es peor: un adorno pegado no es una
               * identidad, y entre diez tarjetas blancas seguía leyéndose en
               * diagonal.
               *
               * EL RECURSO ES LA SUPERFICIE, NO EL ADORNO. En un panel entero de
               * crema y blanco, lo único que distingue algo sin gritar es
               * cambiarle el fondo. Va sobre el navy de la marca, y con eso el
               * cian —que sobre blanco se queda en 2.41:1 y no sirve ni de
               * forma— pasa a 7.73:1: el acento por fin se usa donde funciona.
               *
               * Y la cita va en SERIF. El resto del panel es sans porque son
               * datos que se escanean; esto es prosa que se lee de corrido, y la
               * serif lo dice antes de que el usuario lea la primera palabra.
               */
              <figure
                className="relative m-0 overflow-hidden rounded-2xl"
                style={{
                  background: "linear-gradient(155deg, var(--a-quote-bg) 0%, var(--a-quote-bg-2) 100%)",
                  boxShadow: "var(--a-sh-md)",
                }}
              >
                {/* LA COMILLA VA AL CIERRE, Y ENTERA.
                    Arriba a la derecha con 150px se salía del contenedor y
                    `overflow-hidden` la partía: en pantalla se veían dos trazos
                    diagonales sueltos que parecían un glifo roto. Visto en el
                    navegador y comparado contra dos alternativas —apertura arriba
                    a la izquierda, y sin comilla—: ésta gana porque el cierre es
                    donde una cita termina de verdad, y ahí no le compite al texto.
                    Opacidad baja a propósito: es una firma, no un elemento que
                    haya que leer. */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute bottom-[38px] right-3 select-none font-serif text-[110px] leading-[0.7]"
                  style={{ color: "var(--a-quote-accent)", opacity: 0.1 }}
                >
                  &rdquo;
                </span>

                {/* Un hilo de luz arriba. Le da borde a la tarjeta sin dibujar
                    uno, que sobre un fondo oscuro siempre se ve sucio. */}
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 top-0 h-px"
                  style={{ background: "linear-gradient(90deg, transparent, var(--a-quote-accent), transparent)", opacity: 0.5 }}
                />

                <div className="relative p-4">
                  <figcaption className="mb-3 flex items-center gap-2">
                    <span
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                      style={{ background: "rgba(0,212,255,.14)", color: "var(--a-quote-accent)" }}
                    >
                      <MessageSquareQuote className="h-3.5 w-3.5" />
                    </span>
                    <span
                      className="text-[9.5px] font-bold uppercase tracking-[0.14em]"
                      style={{ color: "var(--a-quote-accent)" }}
                    >
                      {t("verdict_title")}
                    </span>
                  </figcaption>

                  <blockquote className="m-0">
                    <p
                      className="font-serif text-[13.5px] leading-[1.65]"
                      style={{ color: "var(--a-quote-ink)" }}
                    >
                      {report.verdict}
                    </p>
                  </blockquote>

                  {/* LO QUE FALTABA: decir que esto NO mueve el número, y una salida.
                      Era un párrafo que nombraba defectos («bullets mal escritos»,
                      «duplicación en el resumen») y no llevaba a ninguna parte: el
                      usuario leía el reproche y tenía que buscar solo dónde estaba.
                      Los puntos que nombra ya son chequeos de «lo que mira la
                      persona» —peso 0— así que el botón abre el ejecutor filtrado
                      justo ahí, como opcionales. */}
                  <div
                    className="mt-3.5 flex flex-wrap items-center gap-2 border-t pt-3"
                    style={{ borderColor: "rgba(246,243,236,.14)" }}
                  >
                    <span
                      className="text-[9px] font-bold uppercase tracking-[0.1em]"
                      style={{ color: "var(--a-quote-muted)" }}
                    >
                      {t("verdict_no_score")}
                    </span>
                    {!!report && solvableChecks(report).some((c) => c.section === "tips") && (
                      <button
                        type="button"
                        onClick={() => { setFocusCheckId(null); setTailorFilter("tips"); setTailorOpen(true) }}
                        className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[10.5px] font-bold transition-transform hover:scale-[1.04] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                        style={{
                          background: "var(--a-quote-accent)",
                          color: "var(--a-quote-bg)",
                          outlineColor: "var(--a-quote-accent)",
                        }}
                      >
                        <Sparkles className="h-3 w-3" /> {t("verdict_open_tips")}
                      </button>
                    )}
                  </div>
                </div>
              </figure>
            )}

            {/* Score breakdown — per-category coverage. Lives under ① as score
                detail (not a "fix"), computed server-side, applicable categories only. */}
            </>)}


            {/* The hard requirements this posting states and the CV does not meet.
                They weigh 0.20 — second only to hard skills — and until now they
                were computed, counted in the plan ("2 requirements missing") and
                never listed anywhere: the lever even scrolled to an id that does
                not exist. Nobody could act on a number.

                No Fix button, and that is the honest answer: a licence, a degree
                or three more years is not something we can write into a CV. What
                we can do is name it, so the candidate decides whether to apply.
                Requirements the work history already satisfies are dropped before
                this point, so what is left is genuinely missing.

                Shown in BOTH views on purpose — it decides whether this
                application is worth sending at all. */}
            {/* «Requisitos que faltan» se fue al riel, como el hallazgo
                `hard.requirements`: crítico, con sus puntos reales y con el techo
                de la nota adentro. Acá abajo estaba duplicando lo que el riel ya
                dice arriba, que es exactamente el cruce que este panel vino a
                terminar. */}



            {/* Everything below is the résumé pass: the full report, unchanged.
                It renders exactly as it always did — the only difference is that
                someone with ten postings to send today is not made to read it
                first. Nothing here was removed or weakened. */}
            {/* LO QUE QUEDA ACÁ ABAJO: SÓLO ESTADOS.
                El informe vive en el riel y los arreglos en el ejecutor. Los ocho
                bloques que estaban acá —críticos, refinamientos, camino al
                objetivo, erratas, credibilidad, viñetas, fusión y habilidades—
                se fueron a uno de esos dos. Lo único que sobrevive es lo que no
                es un hallazgo: que el ejecutor todavía está escribiendo, y que
                el informe quedó viejo tras aplicar algo. */}
            {tailor.loading && (
              <div className="flex items-center gap-2 rounded-xl border px-3 py-2"
                style={{ borderColor: "var(--a-border)", background: "var(--a-ai-soft)" }}>
                <Loader2 className="h-3 w-3 animate-spin shrink-0" style={{ color: "var(--a-ai)" }} />
                <p className="text-[10.5px] leading-snug" style={{ color: "var(--a-ink-2)" }}>{t("tailoring_in_progress")}</p>
              </div>
            )}

            {/* EL CARTEL «APLICASTE CAMBIOS EN TU CV» SE FUE.
                No era información: era el informe avisando que no se había
                actualizado, y pasándole el trabajo al usuario. Ya no hace falta.
                `buildPanelReport` corre sobre el CV VIVO en cada edición, los
                chequeos deterministas se recalculan solos, y desde
                `recruiter-verified.ts` un hallazgo del modelo que cita texto que
                tailor acaba de reescribir deja de encontrarse en el documento y
                desaparece por su cuenta. Contaba, además, los hallazgos CRUDOS
                —los de antes de verificar—, así que podía avisar por cosas que
                el panel ya no mostraba en ninguna parte. */}

          </div>
        )}

        {/* Review Results */}
        {reviewResult && (
          <div className="space-y-3 pt-1">
            {/* The deterministic resume score lives in the always-on "CV health"
                card at the top of the panel now — not repeated here, so a general
                review never shows a second, competing number. */}
            {reviewResult.answer && (
              <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/80 to-cyan-50/60 backdrop-blur-sm p-4">
                <p className="text-[10px] font-black tracking-widest uppercase text-blue-600 flex items-center gap-1.5 mb-2.5">
                  <MessageSquare className="h-3.5 w-3.5" /> {t("label_respuesta")}
                </p>
                <p className="text-xs text-slate-700 leading-relaxed">{reviewResult.answer}</p>
              </div>
            )}

            {!reviewResult.answer && reviewResult.summary && (
              <div className="rounded-2xl border border-slate-100 bg-white/60 backdrop-blur-sm p-4">
                <p className="text-xs text-slate-600 leading-relaxed">{reviewResult.summary}</p>
              </div>
            )}




          </div>
        )}
      </div>

      {/* Diff modal — rendered outside panel to avoid z-index issues */}
      {/* EL EJECUTOR. Resuelve lo que el informe listó, y nada más. */}
      {tailorOpen && report && (
        <TailorModal
          report={report}
          resolutions={resolutions}
          appliedIds={appliedCheckIds}
          onApply={applyCheck}
          onRemove={removeCheckLine}
          /* Lo que va en lugar de la línea cortada. Reusa el MISMO camino que
             teje un término dentro de una viñeta — no hay un segundo escritor:
             un segundo escritor es una segunda forma de perder datos. */
          onReplaceWithTerm={(term) => { void weaveSkill(term, undefined, false) }}
          /* Fusionar las dos gemelas. Reusa el MISMO camino que la tarjeta de
             fusión —con su guard de contenido y su reintento—: el par lo arma
             este panel con las dos líneas vivas, porque el informe manda los
             índices y el texto de una línea puede haber cambiado desde el
             análisis. Cruzando puestos no se ofrece, así que acá siempre es el
             mismo `targetId`. */
          onMergePair={(checkId) => {
            const c = allChecks(report).find((x) => x.id === checkId)
            const a = c?.action
            const otro = c?.params?.otherIndex
            if (!a?.targetId || typeof a.index !== "number" || typeof otro !== "number") return
            const lineas = parseBullets(
              ((sectionData.workExperience ?? []) as Array<{ id?: string; description?: string }>)
                .find((j) => j.id === a.targetId)?.description ?? "",
            )
            const primero = Math.min(a.index, otro)
            const segundo = Math.max(a.index, otro)
            const uno = lineas[primero]
            const dos = lineas[segundo]
            if (!uno || !dos) return
            void runMerge({ targetId: a.targetId, indexes: [primero, segundo], texts: [uno, dos] }, checkId)
          }}
          onApplyAll={() => {
            if (!report) return
            // La lista sale de `applyAllPlan`, que es una función pura y por eso
            // se puede probar de verdad. Antes era un bucle suelto acá adentro y
            // el único test posible era leer que la línea existía.
            // Lo que YA está escrito y no espera un dato suyo. Ver `entraAlMasivo`.
            const listas = new Set(resolutions.filter((r) => r.text.trim() && !r.needsFigureConfirm).map((r) => r.checkId))
            const plan = applyAllPlan(report, appliedCheckIds, addedKeywords, listas)
            for (const id of plan.checkIds) applyCheck(id, { enLote: true })
            // Los términos se AGREGAN, no se tejen: tejer son cinco llamadas al
            // modelo y cinco esperas. Para el filtro, el término dentro del CV ya
            // cuenta; escribirlo dentro de una viñeta sigue disponible tarjeta por
            // tarjeta, que es la versión que convence a quien entrevista.
            for (const term of plan.terms) addKeywordToSkills(term)
          }}
          onClose={() => { setTailorOpen(false); setFocusCheckId(null) }}
          focusCheckId={focusCheckId}
          initialFilter={tailorFilter}
          focusTerm={focusTerm}
          onWeaveTerm={(term) => { void weaveSkill(term, undefined, false) }}
          onAddTerm={(term) => { addKeywordToSkills(term) }}
          addedTerms={addedKeywords}
          busyTerm={weavingSoft}
          busy={panelBusy}
        />
      )}

      {modal && (
        <SuggestionDiffModal
          open={true}
          onClose={() => setModal(null)}
          onConfirm={handleConfirmApply}
          suggestion={modal.suggestion}
          currentValue={modal.currentValue}
          // La cifra propuesta que review marcó: el chip la manda a confirmar en
          // vez de aplicarla como un hecho.
          needsFigureConfirm={modal.suggestion.needsFigureConfirm}
          // Computed by running the real write — see previewSuggestion.
          afterValue={previewSuggestion(modal.suggestion, sectionData as unknown as ResumeSections)?.after}
        />
      )}

      {/* Inline weak-bullet rewrite (improve-bullet) → diff → apply by index */}
      {bulletFix && (
        <SuggestionDiffModal
          open={true}
          onClose={() => setBulletFix(null)}
          onConfirm={confirmBulletFix}
          suggestion={{
            field: "workExperience.description",
            type: "replace",
            preview: bulletFix.improved,
            // The model's own reason for the change, when it gave one. A rewrite
            // of your own resume that arrives bare can only be accepted on trust.
            reason: bulletFix.why?.trim() || t("content_quality_hint"),
          }}
          /**
           * EN UN MERGE, EL «ANTES» SON LAS DOS LÍNEAS.
           *
           * ── EL HUECO (auditoría del 2026-08-27) ─────────────────────────
           *
           * Fusionar escribe una línea Y BORRA LA OTRA. El diálogo mostraba
           * sólo la primera, así que el usuario aceptaba un borrado que nunca
           * vio: la segunda desaparecía de su CV sin haber aparecido en la
           * pantalla que le pedía confirmar.
           *
           * Con las dos arriba, el diff dice lo que de verdad pasa —dos líneas
           * se convierten en una— y el conteo del puesto cuadra con lo que se
           * ve. `removeCurrent` sólo existe en el merge; en cualquier otro
           * camino esto es exactamente lo que era.
           */
          currentValue={[bulletFix.current, bulletFix.removeCurrent].filter(Boolean).join("\n")}
          /**
           * DÓNDE cae el cambio. El número que se muestra es la posición VIVA de
           * la línea, resuelta por su texto: enseñar el índice del análisis
           * mandaría al usuario a mirar una línea distinta si ya aplicó algo.
           */
          where={(() => {
            const trabajo = ((sectionData.workExperience ?? []) as WorkExperienceItem[]).find((j) => j.id === bulletFix.targetId)
            if (!trabajo?.jobTitle?.trim()) return undefined
            const lineas = parseBullets(trabajo.description ?? "")
            const at = resolveBulletIndex(lineas, bulletFix.index, bulletFix.current)
            return at < 0 ? undefined : { jobTitle: trabajo.jobTitle.trim(), line: at + 1 }
          })()}
          /* Sólo sobre la recomendada: las alternativas se filtran contra la
             cifra propuesta, así que elegir una de ellas retira la pregunta. */
          needsFigureConfirm={bulletFix.needsFigureConfirm && bulletFix.improved === bulletFix.recommended}
          /* The same work from another angle. One rewrite leaves a yes/no, and
             "no" used to mean asking the model again — the loop. Picking swaps
             what the preview above shows, so the decision ends here. */
          options={
            bulletFix.options && bulletFix.options.length > 0
              ? [
                  // The model's own pick, first and reselectable: choosing another
                  // angle must not be a one-way door.
                  {
                    text: bulletFix.recommended,
                    label: t("bullet_angle_recommended"),
                    why: bulletFix.recommendedWhy ?? "",
                    active: bulletFix.improved === bulletFix.recommended,
                    onPick: () => setBulletFix({ ...bulletFix, improved: bulletFix.recommended, why: bulletFix.recommendedWhy }),
                  },
                  ...bulletFix.options.map((o) => ({
                    text: o.text,
                    label: t(`bullet_angle_${o.angle}` as "bullet_angle_technical"),
                    why: o.why,
                    active: o.text === bulletFix.improved,
                    onPick: () => setBulletFix({ ...bulletFix, improved: o.text, why: o.why }),
                  })),
                ]
              : undefined
          }
        />
      )}

      {/* Which role does this belong to? Always asked, with our pick marked. */}
      {softPick && (
        <JobPickerModal
          title={t("job_picker_title")}
          subtitle={softPick.recommendedId
            ? t("job_picker_subtitle_recommended", { skill: softPick.skill })
            : t("job_picker_subtitle", { skill: softPick.skill })}
          recommendedId={softPick.recommendedId ?? undefined}
          recommendedLabel={t("job_picker_recommended")}
          jobs={((sectionData.workExperience ?? []) as WorkExperienceItem[])
            .filter((j) => j.id)
            .map((j) => ({
              id: j.id as string,
              jobTitle: j.jobTitle ?? "",
              employer: j.employer ?? "",
              startDate: j.startDate ?? undefined,
              endDate: j.endDate ?? undefined,
            }))}
          onClose={() => setSoftPick(null)}
          onPick={(id) => {
            const picked = softPick
            setSoftPick(null)
            // Chose the recommended role → the bullet is already written; show the
            // diff straight away instead of paying for an identical second call.
            if (picked.recommendedId === id && picked.draft) {
              const job = ((sectionData.workExperience ?? []) as WorkExperienceItem[]).find((j) => j.id === id)
              if (job) {
                proposeBulletInto(job, picked.draft, {
                  skill: picked.skill,
                  soft: picked.soft,
                  checkId: picked.checkId,
                })
                return
              }
            }
            void weaveSkill(picked.skill, id, picked.soft, picked.refresh ?? false, picked.checkId)
          }}
        />
      )}

      {/* Remove-bullet confirm — preview the exact line before it's deleted. */}
      {pendingRemove && (
        <SuggestionDiffModal
          open={true}
          onClose={() => setPendingRemove(null)}
          onConfirm={confirmRemoveBullet}
          suggestion={{
            field: "workExperience.description",
            type: "replace",
            preview: t("bullet_remove_preview"),
            reason: t("bullet_remove_reason"),
          }}
          currentValue={pendingRemove.text}
          /* Qué línea y de qué puesto se está por borrar. Borrar es lo más caro
             de revertir a mano —la línea deja de estar a la vista—, así que es
             donde más vale decir exactamente dónde cae el cambio. */
          where={(() => {
            const trabajo = ((sectionData.workExperience ?? []) as WorkExperienceItem[]).find((j) => j.id === pendingRemove.targetId)
            if (!trabajo?.jobTitle?.trim()) return undefined
            const lineas = parseBullets(trabajo.description ?? "")
            const at = resolveBulletIndex(lineas, pendingRemove.index, pendingRemove.text)
            return at < 0 ? undefined : { jobTitle: trabajo.jobTitle.trim(), line: at + 1 }
          })()}
        />
      )}

      {/* Choose the positioning, then confirm the change like any other fix —
          the diff against the current summary is not skipped, it comes next. */}
      <SummaryVersionModal
        open={summaryVersions.length > 0}
        versions={summaryVersions}
        onClose={() => setSummaryVersions([])}
        onSelect={(text) => {
          setSummaryVersions([])
          openSummaryDiff(text, (sectionData.summary as string) ?? "")
        }}
      />
    </>
  )
}

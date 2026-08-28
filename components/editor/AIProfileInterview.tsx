"use client"

// The second half of the assistant: after the model has written whatever it
// could from the user's text, this asks for what is still missing.
//
// The questions are not a script somebody wrote — they come from
// `computeProfileGaps`, which reads the same booleans the resume score already
// computes. So the order the user is asked in and the order that actually
// improves their CV are the same list, and neither can drift from the other.
//
// Asking costs nothing: every answer except two goes straight into the CV as
// typed. Only "what did you do there" and the closing summary reach the model,
// because those are the two that need writing rather than recording.

import { useState, useMemo } from "react"
import { useTranslations, useLocale } from "next-intl"
import { useResumeStore } from "@/stores/resumeStore"
import { useAtsPostingStore } from "@/stores/atsPostingStore"
import { useShallow } from "zustand/react/shallow"
import { nanoid } from "nanoid"
import { toast } from "sonner"
import { Sparkles, Check, ArrowRight, Plus, CheckCircle2 } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { apiFetch } from "@/lib/apiFetch"
import { computeProfileGaps, type ProfileGap, type ProfileGapKind } from "@/lib/skills/profile-gaps"
import { parseBullets, serializeBullets } from "@/lib/services/ai/shared/bullets"
import { BULLETS_PER_ROLE_MAX } from "@/lib/ats/scoring-config"
import { AI_INPUT_LIMITS } from "@/lib/services/ai/shared/ai-types"
import { buildProfileWrites } from "@/lib/editor/apply-profile"
import MonthYearField from "./MonthYearField"
import SummaryVersionModal, { type SummaryVersion } from "@/components/resume/sections/SummaryVersionModal"
import { useAICall } from "@/hooks/useAICall"
import { useDeclinedGaps } from "./hooks/useDeclinedGaps"
import { useUpgradeModal } from "@/contexts/UpgradeModalContext"
import { handleApiError } from "@/lib/upgrade-modal-handler"
import { useRouter } from "next/navigation"
import { useCvLanguage } from "./hooks/useCvLanguage"
import type { WorkExperienceItem, EducationItem, PersonalDetails, CertificationItem, LanguageItem } from "@/types/resume"

/** One text field inside a question, on the project's own Input + Label. */
function Field({ id, label, value, onChange, placeholder }: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-[11px] text-muted-foreground">{label}</Label>
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 text-[12.5px]"
      />
    </div>
  )
}

/** Both ends of a job, plus "I still work here" — one block, stacked. */
function DateRange({ start, end, onStart, onEnd }: {
  start: string
  end: string
  onStart: (v: string) => void
  onEnd: (v: string) => void
}) {
  const t = useTranslations("editor.ai_profile_fill.interview")
  const isPresent = end === PRESENT
  return (
    <div className="flex flex-col gap-2.5">
      <div className="grid grid-cols-2 gap-2">
        <MonthYearField id="job-from" label={t("f_from")} value={start} onChange={onStart} />
        <MonthYearField id="job-to" label={t("f_to")} value={isPresent ? "" : end} onChange={onEnd} disabled={isPresent} />
      </div>
      <label className="flex cursor-pointer items-center gap-2 text-[11px] font-medium text-slate-600">
        <input
          type="checkbox"
          checked={isPresent}
          onChange={(e) => onEnd(e.target.checked ? PRESENT : "")}
          className="h-4 w-4 cursor-pointer accent-[#00A8CC] outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        {t("present")}
      </label>
    </div>
  )
}

function QuestionShell({ index, question, ai = false, children }: {
  index: number
  question: string
  ai?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2.5 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      <div className="flex items-start justify-between gap-2">
        <p className="flex gap-1.5 text-[12px] font-bold leading-snug tracking-tight text-[#1a2e4a]">
          <span className="tabular-nums text-slate-300">{index}.</span>
          <span>{question}</span>
        </p>
        {ai && (
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-gradient-to-r from-[#1a2e4a] to-[#0f4c75] px-2 py-[3px] text-[9px] font-extrabold uppercase tracking-wider text-white">
            <Sparkles className="h-2.5 w-2.5" aria-hidden /> IA
          </span>
        )}
      </div>
      {children}
    </div>
  )
}

/** Sentinels for "still here" — never written to the CV as a date. */
const PRESENT = "__present__"

/** Same ceiling the ATS panel and the skill writer already enforce. */
const MAX_BULLETS = BULLETS_PER_ROLE_MAX.value

/** What the endpoint accepts. Exceeding it is a 422 before any model runs. */
const PROMPT_MAX = AI_INPUT_LIMITS.prompt

/** Questions with no "skip": leaving these empty leaves a hole in the document. */
const UNSKIPPABLE = new Set<ProfileGapKind>(["jobBullets", "summary"])
const STUDYING = "__studying__"

/** The panel's one primary action style. Save used to render in the default
 *  variant, a pale lavender that reads as disabled next to a real button. */
export default function AIProfileInterview() {
  const t = useTranslations("editor.ai_profile_fill.interview")
  const tPanel = useTranslations("editor.ai_profile_fill")
  const ai = useTranslations("editor.ai")
  const locale = useLocale()
  const router = useRouter()
  const cvLanguage = useCvLanguage()
  /**
   * La vacante que el panel publicó, si el usuario ya analizó una PARA ESTE CV.
   *
   * `termsFor(resumeId)` es la única lectura pública a propósito: sin esa
   * comprobación, un CV nuevo heredaría la oferta del anterior y el asistente le
   * escribiría viñetas apuntando a un puesto que no es el suyo — peor que no
   * apuntar a ninguno.
   */
  const postingResumeId = useResumeStore((st) => st.resumeId) ?? null
  const postingTermsAll = useAtsPostingStore((st) => st.terms)
  const postingScopeId = useAtsPostingStore((st) => st.resumeId)
  const postingJobTitle = useAtsPostingStore((st) => st.jobTitle)
  const posting = useMemo(() => (
    postingResumeId && postingScopeId === postingResumeId
      ? { terms: postingTermsAll, title: postingJobTitle }
      : { terms: undefined as string[] | undefined, title: undefined as string | undefined }
  ), [postingResumeId, postingScopeId, postingTermsAll, postingJobTitle])
  const { open: openUpgradeModal } = useUpgradeModal()
  const { preCheck, onSuccess } = useAICall()
  const { sectionData, updateSectionData, save, resumeId } = useResumeStore(
    useShallow((s) => ({ sectionData: s.sectionData, updateSectionData: s.updateSectionData, save: s.save, resumeId: s.resumeId }))
  )
  // "No, that's all" is an answer, not a screen state: it has to outlive a
  // reload and a trip back to the CV list, or the assistant re-opens asking for
  // more experience the moment it is closed.
  const { decline, hasDeclined } = useDeclinedGaps(resumeId)

  // Draft answers, keyed by gap. Cleared as each one lands in the CV.
  const [draft, setDraft] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState<string | null>(null)
  // Credential examples for the role, and which of them the user actually holds.
  // The three summary positionings, held until the person picks one. The gap is
  // held with them because commit() needs it to clear the draft and save.
  const [summaryVersions, setSummaryVersions] = useState<SummaryVersion[]>([])
  const [summaryGap, setSummaryGap] = useState<ProfileGap | null>(null)
  const [summaryOpen, setSummaryOpen] = useState(false)
  const [certs, setCerts] = useState<string[] | null>(null)
  const [heldCerts, setHeldCerts] = useState<Set<string>>(new Set())
  // Snapshot on first render: the denominator has to stay put while the
  // numerator climbs, or the bar moves backwards as gaps close.
  const [totalAtStart, setTotalAtStart] = useState(0)
  // When the CV already knows the role, the field opens holding it: the user
  // presses Build instead of retyping what we could read.
  const [seeded, setSeeded] = useState(false)
  const [cursor, setCursor] = useState(0)
  // Set by answering "yes": renders the same "where did you work" card, which
  // creates the role on save. No empty placeholder entry is ever written.
  const [addingJob, setAddingJob] = useState(false)
  const [addingBullet, setAddingBullet] = useState<string | null>(null)

  // Memoised against the CV, not the draft: typing an answer re-renders this
  // component on every keystroke, and without this each one re-scored the whole
  // resume to produce a list that had not changed.
  const gaps = useMemo(
    () => computeProfileGaps(sectionData as Record<string, unknown>)
      // Per job on the bullets side: "no more lines here" must not silence the
      // question for a different role.
      .filter((g) => g.kind !== "moreExperience" || !hasDeclined("moreExperience"))
      .filter((g) => g.kind !== "moreBullets" || !hasDeclined(`moreBullets:${g.jobId ?? ""}`))
      // "I have none" is an ANSWER — the CV cannot tell "no certifications" from
      // "not filled in yet", so only the person can. Pressing it used to run the
      // apply path with an empty list, which wrote nothing, left the question
      // exactly where it was, and looked like a dead button.
      .filter((g) => g.kind !== "certifications" || !hasDeclined("certifications"))
      .filter((g) => g.kind !== "languages" || !hasDeclined("languages")),
    [sectionData, hasDeclined]
  )
  if (gaps.length > totalAtStart) setTotalAtStart(gaps.length)
  if (!seeded) {
    const known = ((sectionData.personalDetails ?? {}) as PersonalDetails).jobTitle?.trim()
    if (known) setDraft((d) => ({ "jobTitle:": known, ...d }))
    setSeeded(true)
  }
  // Nothing left to ask. The finished card is rendered HERE, next to the list
  // that decides it is finished — computing that in the panel as well is what
  // left the tab blank: the interview had stopped and the panel had not noticed.
  if (gaps.length === 0) {
    return (
      <div className="mt-4 flex flex-col gap-3 border-t border-slate-200/80 pt-4">
        <div className="rounded-2xl border-[1.5px] border-emerald-200/70 bg-gradient-to-br from-emerald-50 to-cyan-50/60 p-4">
          <div className="mb-2 flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10">
              <CheckCircle2 className="h-[18px] w-[18px] text-emerald-600" aria-hidden />
            </span>
            <span className="text-[13.5px] font-bold tracking-tight text-emerald-900">{tPanel("cv_complete_title")}</span>
          </div>
          <p className="mb-3 text-[11.5px] leading-relaxed text-emerald-800/90">{tPanel("cv_complete_desc")}</p>
          <div className="flex flex-col gap-1.5">
            {[tPanel("cv_complete_summary"), tPanel("cv_complete_skills"), tPanel("cv_complete_experience")].map((label) => (
              <div key={label} className="flex items-center gap-2 text-[11.5px] text-emerald-700">
                <Check className="h-3.5 w-3.5 shrink-0" aria-hidden />
                <span className="font-semibold">{label}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[10.5px] leading-relaxed text-slate-500">{tPanel("cv_complete_hint")}</p>
          {/* The handoff: the assistant built a draft, the editor is where a
              person makes it theirs. Saying so is the difference between "done"
              and "stuck". */}
          <Button variant="outline" className="mt-3 w-full border-emerald-300 text-emerald-800 hover:bg-emerald-50"
            onClick={() => window.dispatchEvent(new CustomEvent("editor-switch-tab", { detail: "content" }))}>
            {tPanel("cv_complete_cta")} <ArrowRight aria-hidden />
          </Button>
        </div>
      </div>
    )
  }

  const keyOf = (g: ProfileGap) => `${g.kind}:${g.jobId ?? ""}`
  const get = (g: ProfileGap, suffix = "") => draft[`${keyOf(g)}${suffix}`] ?? ""
  const set = (g: ProfileGap, suffix: string, v: string) =>
    setDraft((d) => ({ ...d, [`${keyOf(g)}${suffix}`]: v }))
  const clear = (g: ProfileGap) =>
    setDraft((d) => Object.fromEntries(Object.entries(d).filter(([k]) => !k.startsWith(keyOf(g)))))

  async function commit(g: ProfileGap, mutate: () => void) {
    mutate()
    clear(g)
    // The store drops a save while another is in flight. One answer at a time
    // that was fine; an interview produces answers in bursts, so the second and
    // third would sit unsaved until something else triggered a write. Retry
    // once when the in-flight one lands — save() always sends current state, so
    // the retry covers every answer given in the meantime.
    await save().catch(() => { /* the top bar already surfaces a failed save */ })
    if (useResumeStore.getState().isDirty) {
      await save().catch(() => { /* same — reported by the top bar */ })
    }
  }

  // ── Direct answers: typed in, stored as-is, no model, no cost ─────────────

  /**
   * The seed. Answering "what do you do" is the one question that pays for
   * itself: the role gives a title, a professional summary and the skills that
   * role normally carries, so a CV exists after one answer instead of after a
   * form. It will NOT invent an employer or a date — the next question asks for
   * those, because they are facts about a person's life.
   *
   * If the model is unreachable the title is still saved: a failed suggestion
   * must never cost the user the answer they typed.
   */
  /**
   * "soy desarrollador web" → "desarrollador web".
   *
   * The prompt already opens with "Soy {role}", so a user who writes the verb
   * themselves — most of them do — produced "Soy soy desarrollador web" in the
   * model's input. Cheap to strip, and it is the first thing the model reads.
   */
  function stripLeadIn(raw: string): string {
    return raw
      .replace(/^\s*(yo\s+)?soy\s+(un[ao]?\s+)?/i, "")
      .replace(/^\s*(i\s*(?:'m|am)\s+)(an?\s+)?/i, "")
      .replace(/^\s*(trabajo\s+(?:como|de)\s+)/i, "")
      .trim() || raw.trim()
  }

  async function answerJobTitle(g: ProfileGap) {
    const value = stripLeadIn(get(g))
    if (!value) return
    setBusy(keyOf(g))
    preCheck("fill-profile")
    try {
      const res = await apiFetch("/api/ai/fill-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // The role alone, and the mode that knows what to do with it. This used
        // to send "Soy {role}." into the extraction prompt, which answered {}
        // for 3 trades in 10 — measured, and secretaria, cajero de banco and
        // abogado laboralista were three of them.
        body: JSON.stringify({ prompt: value, mode: "seed", language: cvLanguage }),
      })
      if (res.status === 429 || res.status === 403) {
        await handleApiError(res, {
          openUpgradeModal, redirect: (p) => router.push(p), locale,
          fallbackToast: () => toast.error(t("error_generic")),
          dailyCapToast: () => toast.warning(ai("daily_cap_reached"), { duration: 8000 }),
        })
        return
      }
      const data = await res.json().catch(() => ({}))
      // 422 is the server saying the model came back empty. That is not a crash
      // and must not read like one — it is "say it differently".
      if (res.status === 422) { toast.info(t("seed_no_result")); return }
      if (!res.ok) { toast.error(t("error_generic")); return }

      // The same writes the free-text path performs: one answer, a whole CV.
      const { writes } = buildProfileWrites(data, sectionData as Record<string, unknown>)
      if (writes.length === 0) {
        // Nothing usable came back. Saying so beats writing half a résumé — and
        // the answer stays in the field, so retrying costs one click.
        toast.info(t("seed_no_result"))
        return
      }
      await onSuccess()

      commit(g, () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const w of writes) updateSectionData(w.key as any, w.value as any)
      })
      toast.success(t("seed_done"))

      // The role is written, the skills are in — and the summary is a choice,
      // not a verdict. The endpoint writes three readings of the same job
      // (executive, specialist, value proposition) and the first one is already
      // applied above, so the picker replaces it rather than filling a blank:
      // closing it keeps what is on screen, which is why nothing is lost by
      // ignoring it.
      const versions = ((data as { summaries?: string[] }).summaries ?? []).filter((v) => v.trim())
      if (versions.length > 1) {
        const byIndex: SummaryVersion["type"][] = ["executive", "specialist", "value_prop"]
        setSummaryGap(g)
        setSummaryOpen(true)
        setSummaryVersions(versions.map((text, i) => ({ type: byIndex[i] ?? "executive", text })))
      }
    } catch {
      toast.error(t("error_generic"))
    } finally {
      setBusy(null)
    }
  }

  function answerNewJob(g: ProfileGap) {
    const employer = get(g, ":employer").trim()
    const role = get(g, ":role").trim()
    if (!employer && !role) return
    const start = get(g, ":start").trim()
    const rawEnd = get(g, ":end").trim()
    const currentlyWorking = rawEnd === PRESENT
    commit(g, () => {
      const existing = (sectionData.workExperience ?? []) as WorkExperienceItem[]
      updateSectionData("workExperience", [...existing, {
        id: nanoid(), jobTitle: role, employer, city: "",
        startDate: start, endDate: currentlyWorking ? "" : rawEnd,
        currentlyWorking, description: "",
      }])
    })
    setAddingJob(false)
  }

  function answerDates(g: ProfileGap) {
    const start = get(g, ":start").trim()
    const rawEnd = get(g, ":end").trim()
    if (!start && !rawEnd) return
    const stillThere = rawEnd === PRESENT
    commit(g, () => {
      const jobs = (sectionData.workExperience ?? []) as WorkExperienceItem[]
      updateSectionData("workExperience", jobs.map((j) =>
        j.id === g.jobId
          ? {
              ...j,
              startDate: start || j.startDate,
              endDate: stillThere ? "" : (rawEnd || j.endDate),
              currentlyWorking: stillThere || j.currentlyWorking,
            }
          : j
      ))
    })
  }

  function answerEducation(g: ProfileGap) {
    const institution = get(g, ":institution").trim()
    const degree = get(g, ":degree").trim()
    const rawEnd = get(g, ":end").trim()
    const currentlyStudying = rawEnd === STUDYING
    const endDate = currentlyStudying ? "" : rawEnd
    if (!institution && !degree) return
    commit(g, () => {
      const existing = (sectionData.education ?? []) as EducationItem[]
      // Every field spelled out, and NO cast: `as EducationItem` silenced the
      // compiler over a missing `fieldOfStudy`, and the education form binds
      // that straight to an input — undefined makes React treat it as
      // uncontrolled, then throw a warning and lose the first keystroke the
      // moment the user edits it.
      const entry: EducationItem = {
        id: nanoid(), institution, degree, fieldOfStudy: "", city: "",
        startDate: "", endDate, currentlyStudying, description: "",
      }
      updateSectionData("education", [...existing, entry])
    })
  }

  /** CEFR, the scale the CV actually stores — not a free-text level. */
  const CEFR: LanguageItem["level"][] = ["a1", "a2", "b1", "b2", "c1", "c2", "native"]

  function answerLanguage(g: ProfileGap) {
    const name = get(g, ":name").trim()
    if (!name) return
    const raw = get(g, ":level").trim()
    const level = (CEFR as string[]).includes(raw) ? (raw as LanguageItem["level"]) : "b2"
    commit(g, () => {
      const existing = (sectionData.languages ?? []) as LanguageItem[]
      updateSectionData("languages", [...existing, { id: nanoid(), name, level }])
    })
  }

  // ── The two answers that need writing, not recording ──────────────────────

  /** "Cargo — Empresa", the label the prompt leads with and the box budgets for. */
  function jobLabel(g: ProfileGap): string {
    const job = ((sectionData.workExperience ?? []) as WorkExperienceItem[]).find((j) => j.id === g.jobId)
    return [job?.jobTitle, job?.employer].filter(Boolean).join(" — ")
  }

  /**
   * Adds lines to a role, keeping the ones already there.
   *
   * This step used to only ever run on an empty description, so replacing was
   * safe. It now also serves "one more line on a role that already has some",
   * where replacing would delete the user's own writing. Capped where the rest
   * of the product caps it.
   */
  function writeBullets(g: ProfileGap, lines: string[]) {
    const jobs = (sectionData.workExperience ?? []) as WorkExperienceItem[]
    const job = jobs.find((j) => j.id === g.jobId)
    const existing = parseBullets(job?.description ?? "")
    const seen = new Set(existing.map((b) => b.toLowerCase().trim()))
    const fresh = lines.filter((l) => l.trim() && !seen.has(l.toLowerCase().trim()))
    const merged = [...existing, ...fresh].slice(0, MAX_BULLETS)
    commit(g, () => {
      updateSectionData("workExperience", jobs.map((j) =>
        j.id === g.jobId ? { ...j, description: serializeBullets(merged) } : j
      ))
    })
    return merged.length - existing.length
  }

  /**
   * Plain speech in, bullets out — the only way this section gets written.
   *
   * The person describes the job in their own words and the model shapes it.
   * What it must never do is supply the content: a list of role-typical duties
   * is a set of claims about someone's life that they did not make.
   */
  async function answerBullets(g: ProfileGap) {
    const told = get(g).trim()
    if (told.length < 10) { toast.info(t("bullets_too_short")); return }
    setBusy(keyOf(g))
    preCheck("fill-profile")
    try {
      // The answer alone ("I reviewed client files") does not say WHICH job it
      // belongs to. With more than one role on the CV the model had to guess,
      // and a guess that missed came back as an update for a different id —
      // which this function then discarded as "no result". Naming the role is
      // what makes the answer land on the right one.
      const about = jobLabel(g)
      // Deliberately not a translated sentence: the UI language and the CV
      // language are independent here, and a Spanish answer wrapped in English
      // prose would hand the model two languages at once. A label and a colon
      // say which role this is about in any language.
      // Clamped, not trusted: the box's maxLength is a browser courtesy and the
      // endpoint answers 422 invalid_data — not a message anyone can act on —
      // the moment it is exceeded.
      const prompt = (about ? `${about}: ${told}` : told).slice(0, PROMPT_MAX)
      const res = await apiFetch("/api/ai/fill-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        /**
         * CON LA VACANTE, cuando el usuario ya analizó una.
         *
         * «El ATS manda: todo lo que tenga el ATS debe consultar al ATS.» Este
         * botón escribe viñetas que terminan en el mismo CV que el panel puntúa,
         * y hasta ahora escribía sin saber a qué puesto apunta: nombraba bien el
         * trabajo del oficio y no podía elegir la parte del oficio que ESTA
         * oferta busca. `termsFor` devuelve vacío si el análisis fue de otro CV.
         */
        body: JSON.stringify({
          prompt,
          mode: "bullets",
          language: cvLanguage,
          postingTerms: posting.terms,
          postingTitle: posting.title,
        }),
      })
      if (res.status === 429 || res.status === 403) {
        await handleApiError(res, {
          openUpgradeModal,
          redirect: (p) => router.push(p),
          locale,
          fallbackToast: () => toast.error(t("error_generic")),
          dailyCapToast: () => toast.warning(t("error_generic"), { duration: 6000 }),
        })
        return
      }
      const data = await res.json().catch(() => ({})) as { bullets?: string[] }
      if (!res.ok) { toast.error(t("error_generic")); return }
      // The bullets come back as lines, not as an update carrying an id: the
      // prompt is never shown the résumé, so it cannot know one. The role this
      // question is about is the one that gets them.
      const lines = (data.bullets ?? []).filter((b) => b.trim())
      if (lines.length === 0) { toast.info(t("bullets_no_result")); return }
      await onSuccess()
      const added = writeBullets(g, lines)
      setAddingBullet(null)
      /**
       * SI NO ENTRARON TODAS, SE DICE CUÁNTAS SE TIRARON.
       *
       * `writeBullets` recorta al techo del puesto, y el aviso era binario:
       * «agregadas» o «está lleno». Dictabas cinco actividades, entraban dos, y
       * el mensaje decía «agregadas» — las otras tres desaparecían sin que nadie
       * las nombrara. Es contenido que el usuario acaba de contar con sus
       * palabras, y un recorte que no se declara se lee como que el producto no
       * lo escuchó.
       */
      const descartadas = lines.length - added
      if (added === 0) toast.info(t("bullets_full"))
      else if (descartadas > 0) toast.success(t("bullets_added_partial", { added, dropped: descartadas, max: MAX_BULLETS }))
      else toast.success(t("bullets_added"))
    } catch {
      toast.error(t("error_generic"))
    } finally {
      setBusy(null)
    }
  }

  /**
   * "These are the credentials people in your role hold — tick the ones you
   * have." Nobody types a certification into a blank field they were never
   * prompted about, which is why the section sat empty on CVs where it is worth
   * the most.
   */
  async function loadCerts(g: ProfileGap) {
    const title = ((sectionData.personalDetails ?? {}) as PersonalDetails).jobTitle ?? ""
    setBusy(keyOf(g))
    preCheck("fill-profile")
    try {
      const res = await apiFetch("/api/ai/fill-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: title.trim(), mode: "certifications", language: cvLanguage }),
      })
      if (res.status === 429 || res.status === 403) {
        await handleApiError(res, {
          openUpgradeModal, redirect: (p) => router.push(p), locale,
          fallbackToast: () => toast.error(t("error_generic")),
          dailyCapToast: () => toast.warning(t("error_generic"), { duration: 6000 }),
        })
        return
      }
      const data = await res.json().catch(() => ({})) as { suggestedCertifications?: string[] }
      const options = (data.suggestedCertifications ?? []).filter((c) => c.trim())
      if (!res.ok || options.length === 0) { toast.info(t("certs_empty")); setCerts([]); return }
      await onSuccess()
      setCerts(options)
      setHeldCerts(new Set())
    } catch {
      toast.error(t("error_generic"))
    } finally {
      setBusy(null)
    }
  }

  /** "I have none" — recorded like any other answer, so the question is done. */
  function declineCerts(g: ProfileGap) {
    setCerts(null); setHeldCerts(new Set())
    decline("certifications")
    clear(g)
    setCursor(0)
  }

  function applyCerts(g: ProfileGap) {
    const chosen = (certs ?? []).filter((c) => heldCerts.has(c))
    commit(g, () => {
      const existing = (sectionData.certifications ?? []) as CertificationItem[]
      updateSectionData("certifications", [
        ...existing,
        ...chosen.map((name): CertificationItem => ({ id: nanoid(), name, issuer: "", date: "", url: "" })),
      ])
    })
    setCerts(null); setHeldCerts(new Set())
    if (chosen.length) toast.success(t("certs_added", { count: chosen.length }))
  }

  /**
   * Last on purpose. By the time this runs the roles, dates and studies are in,
   * so the summary is written from the real profile instead of from nothing —
   * which is how the assistant used to produce a paragraph that fit anyone.
   */
  async function answerSummary(g: ProfileGap) {
    // Closing the picker without choosing used to throw away three versions
    // that were already paid for — and a second press spent another call and
    // another slice of the daily cap to get the same three back. They are kept;
    // pressing again reopens them.
    if (summaryVersions.length > 0 && summaryGap && keyOf(summaryGap) === keyOf(g)) {
      setSummaryOpen(true)
      return
    }
    setBusy(keyOf(g))
    preCheck("generate-summary")
    try {
      const res = await apiFetch("/api/ai/generate-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // El resumen también apunta al puesto: la ruta ya aceptaba `postingTerms`
        // y este llamador nunca se los mandó.
        body: JSON.stringify({ sectionData, language: cvLanguage, postingTerms: posting.terms }),
      })
      if (res.status === 429 || res.status === 403) {
        await handleApiError(res, {
          openUpgradeModal,
          redirect: (p) => router.push(p),
          locale,
          fallbackToast: () => toast.error(t("error_generic")),
          dailyCapToast: () => toast.warning(t("error_generic"), { duration: 6000 }),
        })
        return
      }
      const data = await res.json().catch(() => ({})) as { versions?: string[]; types?: string[] }
      const list = data.versions ?? []
      if (!res.ok || list.length === 0) { toast.info(t("summary_no_result")); return }
      await onSuccess()
      // The endpoint writes THREE positionings and always did; this panel used
      // to keep versions[0] and discard the other two, which were already paid
      // for. Which one fits is the person's call, not position 0's — so the
      // same picker the Content tab uses opens here.
      //
      // The label comes from the server: its quality gate reorders the list, so
      // index no longer says which positioning a version was written as.
      const byIndex: SummaryVersion["type"][] = ["executive", "specialist", "value_prop"]
      setSummaryGap(g)
      setSummaryOpen(true)
      setSummaryVersions(list.map((text, i) => ({
        type: (data.types?.[i] as SummaryVersion["type"]) ?? byIndex[i] ?? "executive",
        text,
      })))
    } catch {
      toast.error(t("error_generic"))
    } finally {
      setBusy(null)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  function renderGap(g: ProfileGap, index: number) {
    const k = keyOf(g)
    const working = busy === k
    const subject = g.subject ?? ""
    // "…at Banco Mercantil" vs "…as a Telecommunications Engineer": the same
    // question with the wrong preposition reads like a machine wrote it.
    const asks = (base: string) => t(g.subjectIsRole ? `${base}_role` : base, { subject })

    switch (g.kind) {
      case "jobTitle":
        return (
          <QuestionShell key={k} index={index} question={t("q_job_title")} ai>
            <div className="flex flex-col gap-2">
              {/* A textarea, not an input: one word or the whole story, same
                  field. Two separate ways in — a title box and a "write it all"
                  box — asked for the same thing twice and made the user choose
                  between them before knowing what either did. */}
              {/* Visible again. Hiding it left the placeholder as the only hint,
                  which is the documented anti-pattern: it vanishes the moment
                  someone types, and screen readers treat it inconsistently. With
                  a real label the placeholder is free to do its actual job —
                  show what an answer looks like. */}
              <Label htmlFor={`gap-${k}`} className="text-[11px] text-muted-foreground">
                {t("f_job_title")}
              </Label>
              <Textarea
                id={`gap-${k}`}
                value={get(g)}
                onChange={(e) => set(g, "", e.target.value)}
                placeholder={t("ph_job_title")}
                maxLength={500}
                className="min-h-[64px] text-[12px]"
              />
              <Button className="w-full" isLoading={working} onClick={() => answerJobTitle(g)}
                disabled={get(g).trim().length < 3}>
                {!working && <Sparkles aria-hidden />} {working ? t("seed_loading") : t("seed_btn")}
              </Button>
              <p className="text-[10.5px] leading-snug text-slate-500">{t("seed_hint")}</p>
            </div>
          </QuestionShell>
        )

      case "moreBullets": {
        const jobs = (sectionData.workExperience ?? []) as WorkExperienceItem[]
        const count = parseBullets(jobs.find((j) => j.id === g.jobId)?.description ?? "").length

        if (addingBullet === g.jobId) {
          return renderGap({ ...g, kind: "jobBullets" }, index)
        }
        return (
          <QuestionShell key={k} index={index} question={asks("q_more_bullets")} ai>
            <div className="flex flex-col gap-2">
              <p className="text-[10.5px] leading-snug text-slate-500">
                {t("more_bullets_hint", { count, max: MAX_BULLETS })}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button className="flex-1"
                  onClick={() => setAddingBullet(g.jobId ?? null)}>
                  <Plus aria-hidden /> {t("more_bullets_yes")}
                </Button>
                <Button variant="outline" className="flex-1"
                  onClick={() => decline(`moreBullets:${g.jobId ?? ""}`)}>
                  {t("more_bullets_no")}
                </Button>
              </div>
            </div>
          </QuestionShell>
        )
      }

      case "moreExperience":
        if (addingJob) {
          return renderGap({ ...g, kind: "workExperience" }, index)
        }
        return (
          <QuestionShell key={k} index={index} question={t("q_more_experience")}>
            <div className="flex flex-col gap-2">
              <p className="text-[10.5px] leading-snug text-slate-500">{t("more_experience_hint")}</p>
              <div className="flex flex-wrap gap-2">
                <Button className="flex-1" onClick={() => setAddingJob(true)}>
                  <Plus aria-hidden /> {t("more_experience_yes")}
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => decline("moreExperience")}>
                  {t("more_experience_no")}
                </Button>
              </div>
            </div>
          </QuestionShell>
        )

      case "workExperience":
        // One job, one card. Splitting "where" from "when" made two questions
        // out of one answer the user has in their head at the same moment.
        return (
          <QuestionShell key={k} index={index} question={t("q_work")}>
            <div className="flex flex-col gap-2.5">
              <div className="flex flex-col gap-2.5">
                <Field id={`${k}-employer`} label={t("f_employer")} value={get(g, ":employer")} onChange={(v) => set(g, ":employer", v)} placeholder={t("ph_employer")} />
                <Field id={`${k}-role`} label={t("f_role")} value={get(g, ":role")} onChange={(v) => set(g, ":role", v)} placeholder={t("ph_role")} />
              </div>
              <DateRange
                start={get(g, ":start")} end={get(g, ":end")}
                onStart={(v) => set(g, ":start", v)} onEnd={(v) => set(g, ":end", v)}
              />
              <Button className="w-full" onClick={() => answerNewJob(g)}
                disabled={!get(g, ":employer").trim() && !get(g, ":role").trim()}>
                <Check aria-hidden /> {t("btn_save")}
              </Button>
            </div>
          </QuestionShell>
        )

      case "jobDates":
        return (
          <QuestionShell key={k} index={index} question={asks("q_dates")}>
            <div className="flex flex-col gap-3">
              <DateRange
                start={get(g, ":start")} end={get(g, ":end")}
                onStart={(v) => set(g, ":start", v)} onEnd={(v) => set(g, ":end", v)}
              />
              <Button className="w-full" onClick={() => answerDates(g)}
                disabled={!get(g, ":start").trim() && !get(g, ":end").trim()}>
                <Check aria-hidden /> {t("btn_save")}
              </Button>
            </div>
          </QuestionShell>
        )

      case "jobBullets": {
        // One path: the person's own words. The menu of role-typical duties that
        // used to sit here is gone on purpose — it handed someone pre-written
        // claims about themselves, which is the one thing this product does not
        // do, and because the source was the ROLE it gave two "Desarrollador
        // Web" jobs the same lines. What the model gets now is what actually
        // happened, so what it writes back is theirs.
        const about = jobLabel(g)
        // The endpoint caps `prompt` at 500 characters and the role goes in
        // front of the answer, so the box has to be smaller than the cap or the
        // request 422s on text the user was invited to write.
        const room = PROMPT_MAX - about.length - 2
        return (
          <QuestionShell key={k} index={index} question={asks("q_bullets")} ai>
            <div className="flex flex-col gap-2">
              <p className="text-[10.5px] leading-snug text-slate-500">{t("bullets_prompt_hint")}</p>
              <Textarea
                value={get(g)}
                onChange={(e) => set(g, "", e.target.value)}
                placeholder={t("ph_bullets")}
                maxLength={room}
                className="min-h-[84px] text-[12px]"
              />
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] text-muted-foreground">{t("bullets_hint")}</span>
                <Button size="sm" isLoading={working} onClick={() => answerBullets(g)}
                  disabled={get(g).trim().length < 10}>
                  {!working && <Sparkles aria-hidden />} {t("btn_write_bullets")}
                </Button>
              </div>
            </div>
          </QuestionShell>
        )
      }

      case "education":
        return (
          <QuestionShell key={k} index={index} question={t("q_education")}>
            <div className="flex flex-col gap-2.5">
              <Field id={`${k}-institution`} label={t("f_institution")} value={get(g, ":institution")} onChange={(v) => set(g, ":institution", v)} placeholder={t("ph_institution")} />
              <Field id={`${k}-degree`} label={t("f_degree")} value={get(g, ":degree")} onChange={(v) => set(g, ":degree", v)} placeholder={t("ph_degree")} />
              {/* Month AND year: every guide on the education section asks for
                  both, and a bare year cannot say whether a degree finished
                  before or after a job started. */}
              <MonthYearField
                id={`${k}-graduated`}
                label={t("f_graduated")}
                value={get(g, ":end") === STUDYING ? "" : get(g, ":end")}
                onChange={(v) => set(g, ":end", v)}
                disabled={get(g, ":end") === STUDYING}
              />
              <label className="flex cursor-pointer items-center gap-2 text-[11px] font-medium text-slate-600">
                <input
                  type="checkbox"
                  checked={get(g, ":end") === STUDYING}
                  onChange={(e) => set(g, ":end", e.target.checked ? STUDYING : "")}
                  className="h-4 w-4 cursor-pointer accent-[#00A8CC] outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                />
                {t("still_studying")}
              </label>
              <Button className="w-full" onClick={() => answerEducation(g)}
                disabled={!get(g, ":institution").trim() && !get(g, ":degree").trim()}>
                <Check aria-hidden /> {t("btn_save")}
              </Button>
            </div>
          </QuestionShell>
        )

      case "languages":
        return (
          <QuestionShell key={k} index={index} question={t("q_languages")}>
            <div className="flex flex-col gap-2.5">
              <Field id={`${k}-language`} label={t("f_language")} value={get(g, ":name")} onChange={(v) => set(g, ":name", v)} placeholder={t("ph_language")} />
              <div className="flex flex-col gap-1.5">
                <Label className="text-[11px] text-muted-foreground">{t("f_level")}</Label>
                <Select
                  value={get(g, ":level") || "b2"}
                  onValueChange={(v) => { if (v) set(g, ":level", String(v)) }}
                >
                  <SelectTrigger className="h-10 text-[12.5px]" aria-label={t("f_level")}>
                    {/* The label, rendered explicitly. Left to resolve on its
                        own the trigger showed the raw stored value — "b2"
                        instead of "B2 — Intermedio alto", which is what the
                        month select was doing when it displayed "04". */}
                    <SelectValue>{t(`level_${get(g, ":level") || "b2"}`)}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {CEFR.map((lv) => (
                      <SelectItem key={lv} value={lv} className="text-[12.5px]">{t(`level_${lv}`)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full" onClick={() => answerLanguage(g)} disabled={!get(g, ":name").trim()}>
                <Check aria-hidden /> {t("btn_save")}
              </Button>
            </div>
          </QuestionShell>
        )

      case "certifications": {
        const loadingCerts = busy === k
        return (
          <QuestionShell key={k} index={index} question={t("q_certs")} ai>
            {certs === null ? (
              <div className="flex flex-col gap-2">
                <p className="text-[10.5px] leading-snug text-slate-500">{t("certs_hint")}</p>
                <Button className="w-full" isLoading={loadingCerts} onClick={() => loadCerts(g)}>
                  {!loadingCerts && <Sparkles aria-hidden />} {loadingCerts ? t("certs_loading") : t("certs_btn")}
                </Button>
                <Button variant="ghost" size="sm" className="self-start" onClick={() => declineCerts(g)}>
                  {t("certs_none")}
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <p className="text-[10.5px] leading-snug text-slate-500">{t("certs_pick")}</p>
                <div className="flex flex-wrap gap-1.5">
                  {certs.map((c) => {
                    const on = heldCerts.has(c)
                    return (
                      <button key={c} type="button" aria-pressed={on}
                        onClick={() => setHeldCerts((prev) => { const n = new Set(prev); if (n.has(c)) n.delete(c); else n.add(c); return n })}
                        className={`cursor-pointer rounded-full border px-3 py-2 text-[11.5px] font-medium transition-colors duration-200 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 ${on ? "border-[#00A8CC] bg-cyan-50 text-[#0f4c75]" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"}`}>
                        {on ? "✓ " : ""}{c}
                      </button>
                    )
                  })}
                </div>
                <div className="flex items-center justify-between gap-2">
                  <Button variant="ghost" size="sm" onClick={() => declineCerts(g)}>
                    {t("certs_none")}
                  </Button>
                  <Button size="sm" onClick={() => applyCerts(g)} disabled={heldCerts.size === 0}>
                    <Check aria-hidden /> {t("certs_apply", { count: heldCerts.size })}
                  </Button>
                </div>
              </div>
            )}
          </QuestionShell>
        )
      }

      case "skills":
        // No input of its own: the assistant above already proposes skills for
        // the role, and a second place to type them would compete with it.
        return (
          <QuestionShell key={k} index={index} question={t("q_skills")}>
            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
              <ArrowRight className="h-3 w-3 shrink-0" /> {t("skills_hint")}
            </p>
          </QuestionShell>
        )

      case "summary":
        return (
          <QuestionShell key={k} index={index} question={t("q_summary")} ai>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] text-muted-foreground">{t("summary_hint")}</span>
              <Button size="sm" isLoading={working} onClick={() => answerSummary(g)}>
                {!working && <Sparkles aria-hidden />}
                {summaryVersions.length > 0 && summaryGap && keyOf(summaryGap) === keyOf(g)
                  ? t("btn_see_versions")
                  : t("btn_write_summary")}
              </Button>
            </div>
          </QuestionShell>
        )
    }
  }

  // One question on screen, not five. A wall of forms is the thing the user was
  // trying to escape by opening an assistant, and the research on these builders
  // is unambiguous: people move faster when they can see where they are and only
  // owe an answer to one thing. The rest stay as a progress bar.
  const total = gaps.length
  // A cursor, not always gaps[0]: a wizard with no way back is a trap, and a
  // question you cannot skip is worse — someone with no certifications had to
  // answer one to reach the next.
  const at = Math.min(cursor, Math.max(0, total - 1))
  const current = gaps[at]
  const answered = Math.max(0, totalAtStart - total)
  const pct = totalAtStart > 0 ? Math.round((answered / totalAtStart) * 100) : 0

  return (
    <div className="mt-4 flex flex-col gap-3 border-t border-slate-200/80 pt-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-[12.5px] font-bold tracking-tight text-[#1a2e4a]">{t("title", { count: total })}</p>
          <span className="shrink-0 text-[10.5px] font-semibold tabular-nums text-slate-400">
            {t("progress", { done: answered, total: totalAtStart })}
          </span>
        </div>
        <Progress value={pct} aria-label={t("title", { count: total })} />
        <p className="text-[10.5px] leading-snug text-slate-500">{t("subtitle")}</p>
      </div>
      {current && renderGap(current, answered + at + 1)}

      {total > 1 && (
        <div className="flex items-center justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={() => setCursor((c) => Math.max(0, c - 1))} disabled={at === 0}>
            <ArrowRight className="rotate-180" aria-hidden /> {t("back")}
          </Button>
          {/* No skipping the two questions a résumé cannot go without: a role
              with no description and a CV with no summary are the holes a
              recruiter notices first. Everything else — certifications,
              languages, one more job — is genuinely optional and keeps its
              skip. Describing the job in a line of your own words is a low bar
              to clear, and it is also the only thing the model has to work
              from — a skipped answer produces nothing to write. */}
          {current && !UNSKIPPABLE.has(current.kind) && (
            <Button variant="ghost" size="sm" onClick={() => setCursor((c) => Math.min(total - 1, c + 1))} disabled={at >= total - 1}>
              {t("skip")} <ArrowRight aria-hidden />
            </Button>
          )}
        </div>
      )}

      <SummaryVersionModal
        open={summaryOpen && summaryVersions.length > 0}
        versions={summaryVersions}
        onClose={() => setSummaryOpen(false)}
        onSelect={(text) => {
          const g = summaryGap
          setSummaryOpen(false); setSummaryVersions([]); setSummaryGap(null)
          if (!g) return
          commit(g, () => updateSectionData("summary", text))
          toast.success(t("summary_added"))
        }}
      />
    </div>
  )
}

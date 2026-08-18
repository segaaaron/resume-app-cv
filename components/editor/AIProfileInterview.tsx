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
import { useShallow } from "zustand/react/shallow"
import { nanoid } from "nanoid"
import { toast } from "sonner"
import { Loader2, Sparkles, Check, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { apiFetch } from "@/lib/apiFetch"
import { computeProfileGaps, type ProfileGap } from "@/lib/ats/profile-gaps"
import { useAICall } from "@/hooks/useAICall"
import { useUpgradeModal } from "@/contexts/UpgradeModalContext"
import { handleApiError } from "@/lib/upgrade-modal-handler"
import { useRouter } from "next/navigation"
import { useCvLanguage } from "./hooks/useCvLanguage"
import type { WorkExperienceItem, EducationItem, PersonalDetails } from "@/types/resume"

/** One text field inside a question. */
function Field({ label, value, onChange, placeholder }: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <label className="flex-1 min-w-[120px] flex flex-col gap-1">
      <span className="text-[10px] font-semibold text-muted-foreground">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-8 text-[12px] w-full rounded-md border border-border px-2 bg-background"
      />
    </label>
  )
}

function QuestionShell({ index, question, children }: {
  index: number
  question: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-lg border border-violet-200 bg-violet-50/40 p-3 space-y-2">
      <p className="text-[11px] font-semibold text-foreground flex gap-1.5">
        <span className="text-violet-500 tabular-nums">{index}.</span>
        <span>{question}</span>
      </p>
      {children}
    </div>
  )
}

export default function AIProfileInterview() {
  const t = useTranslations("editor.ai_profile_fill.interview")
  const locale = useLocale()
  const router = useRouter()
  const cvLanguage = useCvLanguage()
  const { open: openUpgradeModal } = useUpgradeModal()
  const { preCheck, onSuccess } = useAICall()
  const { sectionData, updateSectionData, save } = useResumeStore(
    useShallow((s) => ({ sectionData: s.sectionData, updateSectionData: s.updateSectionData, save: s.save }))
  )

  // Draft answers, keyed by gap. Cleared as each one lands in the CV.
  const [draft, setDraft] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState<string | null>(null)

  // Memoised against the CV, not the draft: typing an answer re-renders this
  // component on every keystroke, and without this each one re-scored the whole
  // resume to produce a list that had not changed.
  const gaps = useMemo(
    () => computeProfileGaps(sectionData as Record<string, unknown>),
    [sectionData]
  )
  if (gaps.length === 0) return null

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

  function answerJobTitle(g: ProfileGap) {
    const value = get(g).trim()
    if (!value) return
    commit(g, () => {
      const pd = (sectionData.personalDetails ?? {}) as PersonalDetails
      updateSectionData("personalDetails", { ...pd, jobTitle: value })
    })
  }

  function answerNewJob(g: ProfileGap) {
    const employer = get(g, ":employer").trim()
    const role = get(g, ":role").trim()
    if (!employer && !role) return
    commit(g, () => {
      const existing = (sectionData.workExperience ?? []) as WorkExperienceItem[]
      updateSectionData("workExperience", [...existing, {
        id: nanoid(), jobTitle: role, employer, city: "",
        startDate: "", endDate: "", currentlyWorking: false, description: "",
      }])
    })
  }

  function answerDates(g: ProfileGap) {
    const start = get(g, ":start").trim()
    const end = get(g, ":end").trim()
    if (!start && !end) return
    commit(g, () => {
      const jobs = (sectionData.workExperience ?? []) as WorkExperienceItem[]
      updateSectionData("workExperience", jobs.map((j) =>
        j.id === g.jobId ? { ...j, startDate: start || j.startDate, endDate: end || j.endDate } : j
      ))
    })
  }

  function answerEducation(g: ProfileGap) {
    const institution = get(g, ":institution").trim()
    const degree = get(g, ":degree").trim()
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
        startDate: "", endDate: "", currentlyStudying: false, description: "",
      }
      updateSectionData("education", [...existing, entry])
    })
  }

  // ── The two answers that need writing, not recording ──────────────────────

  /**
   * Plain speech in, bullets out. Routed through fill-profile rather than a new
   * endpoint: it already takes a description plus the CV and returns bullets for
   * an existing role, already refuses to invent, and already counts against the
   * user's quota under a name they can see in their usage.
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
      const job = ((sectionData.workExperience ?? []) as WorkExperienceItem[]).find((j) => j.id === g.jobId)
      const about = [job?.jobTitle, job?.employer].filter(Boolean).join(" — ")
      // Deliberately not a translated sentence: the UI language and the CV
      // language are independent here, and a Spanish answer wrapped in English
      // prose would hand the model two languages at once. A label and a colon
      // say which role this is about in any language.
      const prompt = about ? `${about}: ${told}` : told
      const res = await apiFetch("/api/ai/fill-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, sectionData, language: cvLanguage }),
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
      const data = await res.json().catch(() => ({})) as {
        workExperienceUpdates?: { id: string; description: string }[]
      }
      if (!res.ok) { toast.error(t("error_generic")); return }
      const written = (data.workExperienceUpdates ?? []).find((u) => u.id === g.jobId)
      if (!written?.description) { toast.info(t("bullets_no_result")); return }
      await onSuccess()
      commit(g, () => {
        const jobs = (sectionData.workExperience ?? []) as WorkExperienceItem[]
        updateSectionData("workExperience", jobs.map((j) =>
          j.id === g.jobId ? { ...j, description: written.description } : j
        ))
      })
      toast.success(t("bullets_added"))
    } catch {
      toast.error(t("error_generic"))
    } finally {
      setBusy(null)
    }
  }

  /**
   * Last on purpose. By the time this runs the roles, dates and studies are in,
   * so the summary is written from the real profile instead of from nothing —
   * which is how the assistant used to produce a paragraph that fit anyone.
   */
  async function answerSummary(g: ProfileGap) {
    setBusy(keyOf(g))
    preCheck("generate-summary")
    try {
      const res = await apiFetch("/api/ai/generate-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectionData, language: cvLanguage }),
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
      const data = await res.json().catch(() => ({})) as { versions?: string[] }
      const first = (data.versions ?? [])[0]
      if (!res.ok || !first) { toast.info(t("summary_no_result")); return }
      await onSuccess()
      commit(g, () => updateSectionData("summary", first))
      toast.success(t("summary_added"))
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

    switch (g.kind) {
      case "jobTitle":
        return (
          <QuestionShell key={k} index={index} question={t("q_job_title")}>
            <div className="flex gap-2 items-end">
              <Field label={t("f_job_title")} value={get(g)} onChange={(v) => set(g, "", v)} placeholder={t("ph_job_title")} />
              <Button size="sm" className="h-8 text-[11px]" onClick={() => answerJobTitle(g)} disabled={!get(g).trim()}>
                <Check className="h-3 w-3" /> {t("btn_save")}
              </Button>
            </div>
          </QuestionShell>
        )

      case "workExperience":
        return (
          <QuestionShell key={k} index={index} question={t("q_work")}>
            <div className="flex gap-2 flex-wrap items-end">
              <Field label={t("f_employer")} value={get(g, ":employer")} onChange={(v) => set(g, ":employer", v)} placeholder={t("ph_employer")} />
              <Field label={t("f_role")} value={get(g, ":role")} onChange={(v) => set(g, ":role", v)} placeholder={t("ph_role")} />
              <Button size="sm" className="h-8 text-[11px]" onClick={() => answerNewJob(g)}
                disabled={!get(g, ":employer").trim() && !get(g, ":role").trim()}>
                <Check className="h-3 w-3" /> {t("btn_save")}
              </Button>
            </div>
          </QuestionShell>
        )

      case "jobDates":
        return (
          <QuestionShell key={k} index={index} question={t("q_dates", { subject })}>
            <div className="flex gap-2 flex-wrap items-end">
              <Field label={t("f_from")} value={get(g, ":start")} onChange={(v) => set(g, ":start", v)} placeholder="05/2010" />
              <Field label={t("f_to")} value={get(g, ":end")} onChange={(v) => set(g, ":end", v)} placeholder="10/2015" />
              <Button size="sm" className="h-8 text-[11px]" onClick={() => answerDates(g)}
                disabled={!get(g, ":start").trim() && !get(g, ":end").trim()}>
                <Check className="h-3 w-3" /> {t("btn_save")}
              </Button>
            </div>
          </QuestionShell>
        )

      case "jobBullets":
        return (
          <QuestionShell key={k} index={index} question={t("q_bullets", { subject })}>
            <Textarea
              value={get(g)}
              onChange={(e) => set(g, "", e.target.value)}
              placeholder={t("ph_bullets")}
              maxLength={500}
              className="text-[12px] min-h-[70px]"
            />
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] text-muted-foreground">{t("bullets_hint")}</span>
              <Button size="sm" className="h-8 text-[11px]" onClick={() => answerBullets(g)}
                disabled={working || get(g).trim().length < 10}>
                {working ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                {t("btn_write_bullets")}
              </Button>
            </div>
          </QuestionShell>
        )

      case "education":
        return (
          <QuestionShell key={k} index={index} question={t("q_education")}>
            <div className="flex gap-2 flex-wrap items-end">
              <Field label={t("f_institution")} value={get(g, ":institution")} onChange={(v) => set(g, ":institution", v)} placeholder={t("ph_institution")} />
              <Field label={t("f_degree")} value={get(g, ":degree")} onChange={(v) => set(g, ":degree", v)} placeholder={t("ph_degree")} />
              <Button size="sm" className="h-8 text-[11px]" onClick={() => answerEducation(g)}
                disabled={!get(g, ":institution").trim() && !get(g, ":degree").trim()}>
                <Check className="h-3 w-3" /> {t("btn_save")}
              </Button>
            </div>
          </QuestionShell>
        )

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
          <QuestionShell key={k} index={index} question={t("q_summary")}>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] text-muted-foreground">{t("summary_hint")}</span>
              <Button size="sm" className="h-8 text-[11px]" onClick={() => answerSummary(g)} disabled={working}>
                {working ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                {t("btn_write_summary")}
              </Button>
            </div>
          </QuestionShell>
        )
    }
  }

  return (
    <div className="space-y-2" style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(139,92,246,0.15)' }}>
      <div>
        <p className="text-[12px] font-bold text-foreground">{t("title", { count: gaps.length })}</p>
        <p className="text-[10.5px] text-muted-foreground leading-snug">{t("subtitle")}</p>
      </div>
      {gaps.map((g, i) => renderGap(g, i + 1))}
    </div>
  )
}

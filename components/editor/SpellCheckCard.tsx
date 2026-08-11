"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { useTranslations } from "next-intl"
import { useResumeStore } from "@/stores/resumeStore"
import { useShallow } from "zustand/react/shallow"
import { apiFetch } from "@/lib/apiFetch"
import { collectSpellcheckText, collectProperNouns } from "@/lib/ats/spellcheck-collect"
import { applySpellingFix } from "@/lib/ats/apply-spelling"
import {
  dedupeFindings,
  mergeFindings,
  shouldAutoRun,
  stillPresent,
  verdictFor,
  type Finding,
  type RunMode,
  type Verdict,
} from "@/lib/ats/spellcheck-runs"
import { useCvLanguage } from "./hooks/useCvLanguage"
import { SpellCheck2, Check, Wand2, Loader2, ChevronRight, AlertTriangle } from "lucide-react"

type Issue = Finding

/**
 * Grammar pass — a model call, so the caller decides when it is worth one.
 *
 * Reports whether it ran, not just what it found, because those are different
 * facts and the card is only allowed to say "clean" on the strength of the first.
 * The endpoint is PRO-gated (403) and metered (429), so "no findings" and "never
 * checked" arrive looking identical unless this distinction is kept.
 */
type GrammarResult = { ran: true; findings: Issue[] } | { ran: false }

async function fetchGrammar(texts: string[], language: string): Promise<GrammarResult> {
  try {
    const res = await apiFetch("/api/ai/proofread", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texts, language }),
      silent: true,
    })
    if (!res.ok) return { ran: false }
    const data = await res.json().catch(() => null)
    if (!Array.isArray(data?.corrections)) return { ran: false }
    return {
      ran: true,
      findings: data.corrections.map(
        // `why` is the model's own justification, capped at 8 words server-side.
        // It was being discarded, which left the user staring at "architecture →
        // architectural" with no way to judge whether to trust it. A correction
        // you cannot evaluate is a correction you should not be asked to apply.
        (c: { wrong: string; correct: string; why?: string }) =>
          ({ typed: c.wrong, suggestions: [c.correct], why: c.why }),
      ),
    }
  } catch {
    return { ran: false }
  }
}


/** Below this the CV has nothing worth checking yet. */
const MIN_CHARS = 20
/** Quiet period after the last edit before the automatic re-check fires. */
const AUTO_CHECK_DELAY_MS = 4000
/**
 * Floor between two AUTOMATIC checks. The debounce alone fires once per editing
 * pause, and a real writing session has dozens of those — enough to walk into
 * the endpoint's hourly cap and start getting 429s the user never asked for.
 * Manual checks ignore this: the user pressing the button means now.
 */
const AUTO_CHECK_MIN_INTERVAL_MS = 90_000
/**
 * How soon the confirming run fires after the last finding is fixed, and how
 * often it retries while the verdict is still owed. Short: the user is looking at
 * the card waiting to be told their CV is clean.
 */
const VERIFY_RETRY_MS = 1500
/** Findings per page — the rest are one click away. */
const PAGE_SIZE = 5

/**
 * Spelling for the whole CV, in the Content tab where the writing happens.
 *
 * Free for every plan and outside the AI gate on purpose: the check is a
 * dictionary lookup on the server — no model, no tokens, no per-run cost — so
 * there is nothing to meter. The previous version was a hand-written list of ~80
 * misspellings living inside the PRO-only ATS panel, which meant most users
 * never saw it and the ones who did only got a hit if their typo happened to be
 * on the list.
 *
 * It runs BY ITSELF once the CV has content, and again a few seconds after the
 * user stops typing. A checker you have to remember to press is a checker nobody
 * presses — the whole complaint about the previous version was "I never see it".
 * The run costs a dictionary lookup, so there is nothing to save by waiting.
 */
export default function SpellCheckCard() {
  const t = useTranslations("editor.spellcheck")
  const language = useCvLanguage()
  const { sectionData, updateSectionData } = useResumeStore(
    useShallow((s) => ({ sectionData: s.sectionData, updateSectionData: s.updateSectionData }))
  )

  const [loading, setLoading] = useState(false)
  const [issues, setIssues] = useState<Issue[] | null>(null)
  const [fixed, setFixed] = useState<Set<string>>(new Set())
  /**
   * Rows shown at once. A CV can come back with a dozen findings, and a wall of
   * them reads as "your CV is broken" instead of a list to work through — the
   * user fixes a few, the list shrinks, the next batch appears.
   */
  const [shown, setShown] = useState(PAGE_SIZE)
  /**
   * The last finding was fixed and the confirming run has not come back yet. The
   * card says nothing during this gap: "no known mistakes" is a claim about the
   * CV, and clicking Fix on every visible row is not evidence for it.
   */
  const [awaitingVerify, setAwaitingVerify] = useState(false)
  /** What the last completed run entitles the card to say — see verdictFor. */
  const [verdict, setVerdict] = useState<Verdict>("unknown")

  /** Prose already sent — stops the auto-run from re-checking an unchanged CV. */
  const lastCheckedRef = useRef<string | null>(null)
  const lastAutoRunAtRef = useRef(0)
  const loadingRef = useRef(false)
  /**
   * The grammar pass costs a model call, so it does NOT ride the automatic
   * re-check the way the dictionary does: that fires every ~90s of editing, and
   * a half-hour session would spend twenty calls nobody asked for. It runs once
   * automatically — enough to surface a "more then" without the user knowing to
   * look — and then on a manual press or a verify run.
   */
  const grammarRanRef = useRef(false)
  /**
   * How many rows are on screen right now, readable from inside a timer that was
   * scheduled before the user started clicking Fix.
   */
  const pendingRef = useRef(0)
  /** Grammar findings the user has not resolved yet — see stillPresent. */
  const grammarKeptRef = useRef<Issue[]>([])

  const runCheck = useCallback(async (mode: RunMode = "auto") => {
    if (loadingRef.current) return
    const auto = mode !== "manual"
    const texts = collectSpellcheckText(sectionData)
    const joined = texts.join("\n")
    if (joined.trim().length < MIN_CHARS) {
      // Silent when the checker decided to run on its own: an empty CV is not a
      // user error, and a toast nobody asked for is noise.
      if (!auto) toast.info(t("empty"))
      return
    }
    // Guarded in lib/ats/spellcheck-runs so the rule is testable: while the user
    // has rows left to work through, nothing automatic replaces the list.
    const allowed = shouldAutoRun(mode, {
      pending: pendingRef.current,
      joined,
      lastChecked: lastCheckedRef.current,
      now: Date.now(),
      lastRunAt: lastAutoRunAtRef.current,
      minIntervalMs: AUTO_CHECK_MIN_INTERVAL_MS,
    })
    if (!allowed) return
    if (auto) lastAutoRunAtRef.current = Date.now()
    lastCheckedRef.current = joined
    loadingRef.current = true
    setLoading(true)
    try {
      const res = await apiFetch("/api/resumes/spellcheck", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texts, language, properNouns: collectProperNouns(sectionData) }),
        // We show a specific message below; without this a 5xx would fire the
        // generic server toast on top of ours (two toasts for one failure).
        silent: true,
      })
      // A 429 on the automatic pass is ours to absorb, not the user's to read.
      if (res.status === 429) { if (!auto) toast.warning(t("rate_limited")); return }
      if (!res.ok) { if (!auto) toast.error(t("error")); return }
      const data = await res.json().catch(() => null)
      const found = Array.isArray(data?.issues) ? (data.issues as Issue[]) : []

      // Second pass: GRAMMAR. The dictionary can only ask "is this a word?", so
      // "more then 7 years" reads as clean — both are words. Checking the words
      // is not checking the writing, and no list of curated pairs covers the
      // ways a sentence goes wrong. Runs after the free pass and never blocks
      // it: if the model call fails, the user still gets the dictionary result.
      //
      // Manual press and verify runs = always. A plain automatic re-check = only
      // the very first time, so a "more then" surfaces without the user knowing
      // to look, but a long editing session does not bill a call every 90s.
      const wantsGrammar = mode !== "auto" || !grammarRanRef.current
      let grammar = grammarKeptRef.current
      if (wantsGrammar) {
        const res = await fetchGrammar(texts, language)
        if (res.ran) { grammar = res.findings; grammarRanRef.current = true }
      }
      // Whether this result may be called clean. Either the pass just ran, or an
      // earlier one did and its unresolved findings have been carried forward
      // ever since — so an empty grammar list means fixed, not unchecked. When
      // neither holds (PRO gate, spent quota, failed call) the verdict below says
      // spelling only, because nothing has ever read this CV's grammar.
      const grammarKnown = grammarRanRef.current
      // Whether the model ran or not, a grammar finding survives while its words
      // are still in the CV. Skipping the pass must never mean discarding what it
      // found: that is how an unfixed "more then" used to disappear from the list
      // on the next automatic run, leaving a shorter list that looked finished.
      grammar = stillPresent(grammar, joined)
      grammarKeptRef.current = grammar

      const merged = mergeFindings(found, grammar)
      setIssues(merged)
      setVerdict(verdictFor(merged, grammarKnown))
      // The server result is the truth about what is left, so the per-row "you
      // already fixed this" marks start over against it. A fix that silently did
      // not reach every field comes back as a row instead of staying hidden.
      setFixed(new Set())
      // Pagination is the user's place in the list, not part of the result. Only
      // a run they asked for is allowed to send them back to the first page.
      if (mode === "manual") setShown(PAGE_SIZE)
      if (merged.length === 0 && !auto) {
        if (grammarKnown) toast.success(t("clean"))
        else toast.info(t("clean_spelling_only"))
      }
    } catch {
      if (!auto) toast.error(t("error"))
    } finally {
      // Cleared even when the run failed: leaving it on would hide both the
      // verdict and the reason it is missing.
      if (mode === "verify") setAwaitingVerify(false)
      loadingRef.current = false
      setLoading(false)
    }
  }, [sectionData, language, t])

  // Everything comes from the server now: a real dictionary for spelling and a
  // model for grammar. There is no local list to merge — a curated list of
  // "known" mistakes only ever finds the mistakes someone thought of first.
  const merged = dedupeFindings(issues ?? [])
  const pending = merged.filter((i) => !fixed.has(i.typed))
  // A verdict is shown only once the list is empty AND a run has confirmed it:
  // fixing the visible rows empties the list, which is not the same claim, and
  // that gap is what awaitingVerify holds open.
  const settled = pending.length === 0 && !awaitingVerify
  const allClean = settled && verdict === "clean"
  const spellingOnly = settled && verdict === "spelling-only"

  useEffect(() => { pendingRef.current = pending.length })

  // Auto-run: once on open, then a few seconds after the user stops editing.
  // Rescheduled on every edit, so it only ever fires on a pause. Stands down
  // while a verdict is owed — that run is stricter and about to happen anyway.
  useEffect(() => {
    if (awaitingVerify) return
    const id = setTimeout(() => { void runCheck("auto") }, AUTO_CHECK_DELAY_MS)
    return () => clearTimeout(id)
  }, [runCheck, awaitingVerify])

  // The confirming run, owned by its own timer because the user has stopped
  // editing: nothing else is going to reschedule it. It keeps trying while the
  // verdict is owed, so a run that collided with one already in flight is not
  // silently dropped — that would leave the card claiming to be checking forever.
  useEffect(() => {
    if (!awaitingVerify) return
    const id = setInterval(() => {
      if (!loadingRef.current) void runCheck("verify")
    }, VERIFY_RETRY_MS)
    return () => clearInterval(id)
  }, [runCheck, awaitingVerify])

  function applyFix(typed: string, correct: string) {
    const { patch, changed } = applySpellingFix(sectionData, typed, correct)
    if (!changed) { toast.info(t("not_found")); return }
    for (const [key, value] of Object.entries(patch)) {
      updateSectionData(key as Parameters<typeof updateSectionData>[0], value as never)
    }
    const nextFixed = new Set(fixed).add(typed)
    setFixed(nextFixed)
    // Last row gone: ask for a run that actually looks again, grammar included,
    // before the card tells the user their CV is clean.
    if (merged.every((i) => nextFixed.has(i.typed))) setAwaitingVerify(true)
    toast.success(t("fixed", { correct }))
  }

  return (
    <div className={`mb-3 rounded-2xl border px-3.5 py-3 shadow-sm transition-colors ${
      pending.length > 0
        ? "border-rose-200 bg-gradient-to-br from-rose-50/80 to-orange-50/50"
        : "border-slate-200 bg-gradient-to-br from-white to-slate-50/70"
    }`}>
      <div className="flex items-start gap-2.5">
        <span className={`flex h-7 w-7 items-center justify-center rounded-lg shadow-sm shrink-0 ${
          pending.length > 0
            ? "bg-gradient-to-br from-rose-500 to-orange-400"
            : "bg-gradient-to-br from-[#0077B6] to-[#00D4FF]"
        }`}>
          <SpellCheck2 className="h-3.5 w-3.5 text-white" />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-[11.5px] font-bold text-slate-800 leading-tight">
            {t("title")}
            {pending.length > 0 && (
              <span className="ml-1.5 inline-flex items-center rounded-full bg-rose-600 px-1.5 py-0.5 text-[9px] font-black text-white align-middle tabular-nums">
                {pending.length}
              </span>
            )}
          </p>
          <p className="mt-0.5 text-[10.5px] text-slate-500 leading-relaxed">
            {pending.length > 0 ? t("found", { count: pending.length }) : t("subtitle")}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void runCheck("manual")}
          disabled={loading}
          className="shrink-0 inline-flex items-center gap-1.5 rounded-full border border-[#0077B6]/30 bg-white px-3 py-1 text-[10.5px] font-bold text-[#0077B6] shadow-sm transition-all hover:bg-cyan-50 hover:shadow disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-cyan-300"
        >
          {loading
            ? <><Loader2 className="h-3 w-3 animate-spin" /> {t("checking")}</>
            : <><Wand2 className="h-3 w-3" /> {issues === null ? t("run") : t("rerun")}</>}
        </button>
      </div>

      {awaitingVerify && (
        <p className="mt-2.5 flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-[11px] font-semibold text-slate-600">
          <Loader2 className="h-3 w-3 shrink-0 animate-spin" /> {t("verifying")}
        </p>
      )}

      {allClean && (
        <p className="mt-2.5 flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50/70 px-3 py-2 text-[11px] font-semibold text-emerald-700">
          <Check className="h-3 w-3 shrink-0" /> {t("clean")}
        </p>
      )}

      {/* The dictionary came back empty but nothing read the grammar — the plan
          does not include it, the quota is spent, or the call failed. Saying so
          costs a line; saying "no known mistakes" costs the user an interview. */}
      {spellingOnly && (
        <p className="mt-2.5 flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50/70 px-3 py-2 text-[11px] font-semibold text-amber-800">
          <AlertTriangle className="h-3 w-3 shrink-0" /> {t("clean_spelling_only")}
        </p>
      )}

      {pending.length > 0 && (
        <>
          <ul className="mt-2.5 flex flex-col gap-1.5">
            {pending.slice(0, shown).map((issue) => (
              <li key={issue.typed} className="rounded-xl border border-rose-100 bg-white px-3 py-2 text-[11.5px]">
                {/* Wraps instead of truncating: a correction the user cannot read
                    is a button they cannot judge, and these are edits to their CV. */}
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-rose-700 line-through decoration-rose-300 break-words">{issue.typed}</span>
                    <ChevronRight className="inline h-3 w-3 text-slate-300 mx-1 align-[-1px]" />
                    <span className="font-bold text-emerald-700 break-words">{issue.suggestions[0]}</span>
                    {/* Grammar findings carry the reason; a dictionary typo is
                        its own reason. Without it, "architecture →
                        architectural" is a change the user cannot judge. */}
                    {issue.why && (
                      <span className="mt-0.5 block text-[10px] font-medium text-slate-400 break-words">{issue.why}</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => applyFix(issue.typed, issue.suggestions[0])}
                    className="shrink-0 inline-flex items-center gap-1 rounded-full border border-rose-300 bg-white px-2.5 py-0.5 text-[10px] font-bold text-rose-700 transition-all hover:bg-rose-100"
                  >
                    <Wand2 className="h-2.5 w-2.5" /> {t("fix")}
                  </button>
                </div>
              </li>
            ))}
          </ul>
          {pending.length > shown && (
            <button
              type="button"
              onClick={() => setShown((n) => n + PAGE_SIZE)}
              className="mt-2 w-full rounded-xl border border-rose-200 bg-white/70 py-1.5 text-[10.5px] font-bold text-rose-700 transition-all hover:bg-rose-50"
            >
              {t("show_more", { count: pending.length - shown })}
            </button>
          )}
        </>
      )}
    </div>
  )
}

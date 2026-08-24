"use client"

import { useState, useRef, useMemo, useId, type ReactNode } from "react"
import { useTranslations } from "next-intl"
import { filterSkills, type SkillOption } from "@/lib/ats/skill-catalog"
import { findDuplicateSkill, containsSkill } from "@/lib/ats/skill-dedup"
import { Z_DIALOG } from "@/lib/ui/z-layers"

interface Props {
  value: string
  onChange: (name: string) => void
  /** Called when the field loses focus (used for the duplicate-skill check). */
  onCommit?: () => void
  placeholder?: string
  /** Categories (from the user's field) to float to the top of suggestions. */
  boost?: readonly string[]
  /**
   * Skills the CV already lists. Suggesting one of these is offering the user a
   * duplicate — matched through the shared dedup engine, so "React.js" already
   * listed also hides "React", not just the identical string.
   */
  alreadyListed?: readonly string[]
}

/** Bold the part of `display` that matches `query` (case-insensitive). */
function highlight(display: string, query: string): ReactNode {
  const q = query.trim()
  if (!q) return display
  const i = display.toLowerCase().indexOf(q.toLowerCase())
  if (i < 0) return display
  return (
    <>
      {display.slice(0, i)}
      <span className="font-bold text-[#0077B6]">{display.slice(i, i + q.length)}</span>
      {display.slice(i + q.length)}
    </>
  )
}

/**
 * Premium skill combobox replacing the native <datalist>: filters as you type
 * (≤8 results), highlights the match, shows a category badge, offers a fuzzy
 * "did you mean" for typos, and is fully keyboard/screen-reader accessible.
 */
export default function SkillAutocompleteInput({ value, onChange, onCommit, placeholder, boost, alreadyListed }: Props) {
  const t = useTranslations("editor.sections_form")
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const listId = useId()
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const boostKey = (boost ?? []).join(",")

  const listedKey = (alreadyListed ?? []).join(",")
  const { matches, fuzzy } = useMemo(() => {
    // Ask for more than we show: dropping the already-listed ones from a list of
    // 8 could leave 2, and the user would think the catalog has nothing for them.
    const res = filterSkills(value, 16, boostKey ? boostKey.split(",") : [])
    const listed = listedKey ? listedKey.split(",").filter(Boolean) : []
    if (listed.length === 0) return { ...res, matches: res.matches.slice(0, 8).map((o) => ({ ...o, owned: false })) }
    // TWO engines, because neither covers the other. findDuplicateSkill knows
    // aliases, spacing and near-spellings ("React.js" hides "React"), while
    // termPresent reads the listed skills as text and catches a term contained
    // in a longer one — "Teamwork and communication" already covers
    // "communication", which the dedup alone returns as not-a-duplicate.
    //
    // MARKED, not removed. Hiding a skill the user already has produces the exact
    // complaint this dropdown was fixed for once before: type "swift", watch
    // SwiftUI not appear, conclude the catalogue does not have it. It does — you
    // already own it, and the list should say so instead of going quiet.
    return {
      ...res,
      matches: res.matches
        .map((o) => ({
          ...o,
          owned: !!findDuplicateSkill(o.display, listed) || listed.some((l) => containsSkill(o.display, l)),
        }))
        .slice(0, 8),
    }
  }, [value, boostKey, listedKey])
  const showList = open && matches.length > 0

  function commitSelect(o: SkillOption) {
    onChange(o.display)
    setOpen(false)
    setActive(-1)
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!showList) {
      if (e.key === "ArrowDown" && matches.length > 0) { setOpen(true); setActive(0); e.preventDefault() }
      return
    }
    // Arrow keys skip the ones already owned: they are shown for information, and
    // a keyboard user must never land on something Enter cannot select.
    const step = (from: number, dir: 1 | -1) => {
      let i = from
      for (let n = 0; n < matches.length; n++) {
        i += dir
        if (i < 0 || i > matches.length - 1) return from
        if (!matches[i].owned) return i
      }
      return from
    }
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => step(a, 1)) }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => step(a, -1)) }
    else if (e.key === "Enter" && active >= 0 && !matches[active]?.owned) { e.preventDefault(); commitSelect(matches[active]) }
    else if (e.key === "Escape") { setOpen(false); setActive(-1) }
  }

  return (
    <div className="relative min-w-0 flex-1">
      <input
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={active >= 0 ? `${listId}-opt-${active}` : undefined}
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true); setActive(-1) }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        onBlur={() => { blurTimer.current = setTimeout(() => { setOpen(false); onCommit?.() }, 120) }}
        placeholder={placeholder}
        title={value || undefined}
        autoComplete="off"
        className="w-full min-w-0 outline-none text-[12.5px] font-medium transition-all duration-200"
        style={{
          height: 40, paddingLeft: 14, paddingRight: 14, borderRadius: 20,
          background: "linear-gradient(135deg,rgba(240,248,255,0.85) 0%,rgba(232,244,251,0.65) 100%)",
          border: "1.5px solid rgba(0,212,255,0.2)",
          boxShadow: "inset 0 1px 3px rgba(0,0,0,0.03)", color: "#1a2e4a",
        }}
        onFocusCapture={(e) => { e.currentTarget.style.borderColor = "rgba(0,212,255,0.6)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(0,212,255,0.1)" }}
        onBlurCapture={(e) => { e.currentTarget.style.borderColor = "rgba(0,212,255,0.2)"; e.currentTarget.style.boxShadow = "inset 0 1px 3px rgba(0,0,0,0.03)" }}
      />
      {showList && (
        // Wrapper holds the (optional) "did you mean" heading OUTSIDE the listbox —
        // per the WAI-ARIA combobox pattern, a listbox's children must be options
        // (or groups), never a bare label li.
        <div style={{ zIndex: Z_DIALOG }} className="absolute left-0 right-0 top-[44px] rounded-2xl border border-slate-200 bg-white py-1 shadow-[0_20px_48px_-12px_rgba(26,46,74,0.35)] overflow-hidden">
          {fuzzy && (
            <p className="px-3 py-1.5 text-[10.5px] font-bold uppercase tracking-wide text-slate-600">{t("skills.did_you_mean")}</p>
          )}
          <ul role="listbox" id={listId} className="max-h-[240px] overflow-auto">
            {matches.map((o, i) => (
              <li
                key={o.norm}
                id={`${listId}-opt-${i}`}
                role="option"
                aria-selected={i === active}
                aria-disabled={o.owned || undefined}
                onMouseDown={(e) => { e.preventDefault(); if (!o.owned) commitSelect(o) }}
                onMouseEnter={() => { if (!o.owned) setActive(i) }}
                className={`flex flex-col gap-0.5 px-3 py-2.5 transition-colors ${
                  o.owned
                    ? "opacity-45 cursor-not-allowed"
                    : `cursor-pointer ${i === active ? "bg-cyan-50" : "hover:bg-slate-50"}`
                }`}
              >
                {/* The skill NAME owns the full width and wraps. It used to sit
                    next to a shrink-0 category pill, so in a ~340px panel the
                    pill kept its size and the name truncated to a letter ("T…").
                    The name is the thing being chosen; the category is context,
                    so it moves to a quiet second line and never competes. */}
                <span className="text-[13px] font-medium text-slate-800 leading-snug break-words">
                  {highlight(o.display, fuzzy ? "" : value)}
                </span>
                {/* Said in words, not by greying alone — the state has to survive a
                    user who cannot tell the two shades apart. */}
                <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  {o.owned ? t("skills.already_added") : o.categoryLabel}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

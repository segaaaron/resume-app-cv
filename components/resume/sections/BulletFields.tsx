"use client"

// One box per bullet, instead of one textarea for all of them.
//
// `WorkExperienceItem.description` is a single string; bullets live inside it as
// lines marked with "•" (lib/services/ai/shared/bullets.ts owns that
// convention). The editor used to hand that raw string to a textarea, which
// made the marker the user's problem: they typed "• " themselves, or forgot to,
// while every programmatic write — the AI assistant, the ATS panel, the CV
// import — already wrote it for them. Two ways to produce the same field, one
// of them wrong.
//
// So the string is parsed on the way in and re-marked on the way out. Nobody
// types a bullet character again.

import { useState, useRef, useEffect } from "react"
import { Plus, Trash2, FileText } from "lucide-react"
import { parseBullets, formatBullet } from "@/lib/services/ai/shared/bullets"

/**
 * Writes the boxes back into a `description`.
 *
 * Deliberately NOT `serializeBullets`: that one collapses identical lines, and
 * collapsing a line while someone is typing it fights them — its own file says
 * so ("free typing in the editor does NOT pass through here"). Marking is
 * shared; deduplication stays where it belongs, on the writes made on the
 * user's behalf.
 */
export function joinBullets(lines: string[]): string {
  return lines.map(formatBullet).filter(Boolean).join("\n")
}

interface Props {
  label: string
  value: string
  onChange: (description: string) => void
  addLabel: string
  placeholder: string
  /** Adding stops here. Existing bullets over the cap are never removed. */
  max: number
  maxHint: string
  removeLabel: string
}

export default function BulletFields({
  label, value, onChange, addLabel, placeholder, max, maxHint, removeLabel,
}: Props) {
  const [lines, setLines] = useState<string[]>(() => parseBullets(value))
  const commit = useRef(onChange)
  useEffect(() => { commit.current = onChange })

  // What this component last wrote. An incoming `value` that matches it is our
  // own echo and must not reset the boxes mid-edit; anything else is a real
  // outside write — the AI assistant, the ATS panel, a fresh import — and wins.
  //
  // Adjust-during-render (React docs) rather than an effect: the same pattern
  // the parent already uses to open the first job, and it renders the new
  // bullets in one pass instead of painting the stale ones first.
  const [mine, setMine] = useState(() => joinBullets(parseBullets(value)))
  if (value !== mine) {
    setMine(value)
    setLines(parseBullets(value))
  }

  function write(next: string[]) {
    setLines(next)
    const text = joinBullets(next)
    setMine(text)
    commit.current(text)
  }

  /** Typing does not commit on every keystroke; the blur below does. */
  function edit(index: number, text: string) {
    setLines((prev) => prev.map((l, i) => (i === index ? text : l)))
  }

  const atCap = lines.length >= max

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <FileText size={12} strokeWidth={2} style={{ color: "#5B8FBD" }} />
          {label}
        </div>
        <span className="text-[10px] font-semibold tabular-nums" style={{ color: atCap ? "#F59E0B" : "#94A3B8" }}>
          {lines.length}/{max}
        </span>
      </div>

      <div className="space-y-1.5">
        {lines.map((line, i) => (
          <div key={i} className="group relative flex items-start gap-2">
            <span
              aria-hidden
              className="mt-[11px] shrink-0 rounded-full"
              style={{ width: 5, height: 5, background: "linear-gradient(135deg, #00D4FF 0%, #00A8CC 100%)" }}
            />
            <textarea
              value={line}
              onChange={(e) => edit(i, e.target.value)}
              onBlur={() => write(lines)}
              placeholder={placeholder}
              rows={2}
              className="w-full resize-none text-[12.5px] leading-relaxed text-[#1a2e4a] placeholder:text-slate-400 outline-none transition-all duration-200"
              style={{
                background: "linear-gradient(135deg, rgba(240,248,255,0.8) 0%, rgba(232,244,251,0.6) 100%)",
                border: "1.5px solid rgba(0,212,255,0.2)",
                borderRadius: 10,
                padding: "8px 34px 8px 10px",
                boxShadow: "inset 0 2px 4px rgba(0,0,0,0.03)",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "rgba(0,212,255,0.5)"
                e.currentTarget.style.boxShadow = "inset 0 2px 4px rgba(0,0,0,0.03), 0 0 0 3px rgba(0,212,255,0.08)"
              }}
            />
            <button
              type="button"
              aria-label={removeLabel}
              onClick={() => write(lines.filter((_, j) => j !== i))}
              className="absolute top-1.5 right-1.5 cursor-pointer rounded-md p-1.5 text-slate-400 opacity-0 transition-all duration-200 group-focus-within:opacity-100 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 focus-visible:opacity-100 focus-visible:ring-3 focus-visible:ring-ring/50 outline-none"
            >
              <Trash2 size={13} strokeWidth={2} aria-hidden />
            </button>
          </div>
        ))}
      </div>

      {/* At the cap the button goes, and the reason takes its place. Bullets
          already on the CV are never trimmed to fit — an imported role with
          nine of them keeps all nine; what stops is adding a tenth. */}
      {atCap ? (
        <p className="text-[10.5px] leading-snug text-slate-500">{maxHint}</p>
      ) : (
        <button
          type="button"
          onClick={() => write([...lines, ""])}
          className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg py-2 text-[11.5px] font-semibold transition-all duration-200 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          style={{
            color: "#1a2e4a",
            background: "linear-gradient(135deg, rgba(0,212,255,0.06) 0%, rgba(26,46,74,0.04) 100%)",
            border: "1.5px dashed rgba(0,212,255,0.35)",
          }}
        >
          <Plus size={13} strokeWidth={2.5} aria-hidden />
          {addLabel}
        </button>
      )}
    </div>
  )
}

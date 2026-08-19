"use client"

import { useState, useEffect, useRef } from "react"
import type { LucideIcon } from "lucide-react"

// ── Shared CSS injected once ──────────────────────────────────────────────────


// ── PField — floating label input (controlled) ────────────────────────────────
export function PField({
  label, value, onChange, icon: Icon, span2, type = "text", autoComplete,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  icon?: LucideIcon
  span2?: boolean
  type?: string
  autoComplete?: string
}) {
  const [local, setLocal] = useState(value)
  // Latest-ref: the blur commits with the CURRENT onChange while the field keeps its own
  // draft state. Moving the assignment into an effect would commit a stale handler.
  const commitRef = useRef(onChange)
  // eslint-disable-next-line react-hooks/refs
  commitRef.current = onChange

  useEffect(() => { setLocal(value) }, [value])

  return (
    <div className={span2 ? "col-span-2" : ""}>
      <label
        style={{
          display: "flex", alignItems: "center", gap: 4,
          fontSize: 11, fontWeight: 600, color: "#7A9BB5",
          letterSpacing: "0.01em", textTransform: "capitalize",
          marginBottom: 6,
        }}
      >
        {Icon && <Icon size={12} strokeWidth={2} style={{ color: "#5B8FBD", flexShrink: 0 }} />}
        {label}
      </label>
      <input
        type={type}
        autoComplete={autoComplete}
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={() => commitRef.current(local)}
        className="pf-input h-9 text-sm w-full"
        style={{ paddingLeft: 12, paddingRight: 12, color: "#1a2e4a" }}
      />
    </div>
  )
}

// ── PTextarea — premium textarea ──────────────────────────────────────────────
export function PTextarea({
  label, value, onChange, rows = 4, span2 = true,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  rows?: number
  span2?: boolean
}) {
  const [focused, setFocused] = useState(false)
  return (
    <div className={span2 ? "col-span-2" : ""} style={{ position: "relative" }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: "#5B8FBD", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 6 }}>
        {label}
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="pf-textarea w-full resize-none outline-none transition-all duration-200"
        style={{
          fontSize: 12.5, lineHeight: 1.6, color: "#1a2e4a",
          background: "linear-gradient(135deg,rgba(240,248,255,0.8) 0%,rgba(232,244,251,0.6) 100%)",
          border: `1.5px solid ${focused ? "rgba(0,212,255,0.5)" : "rgba(0,212,255,0.18)"}`,
          borderRadius: 14,
          padding: "10px 14px",
          boxShadow: focused
            ? "0 0 0 3px rgba(0,212,255,0.08), inset 0 1px 3px rgba(0,0,0,0.03)"
            : "inset 0 1px 3px rgba(0,0,0,0.03)",
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </div>
  )
}

// ── DateField ────────────────────────────────────────────────────────────────
//
// Re-exported, not reimplemented. There used to be two hand-rolled month
// pickers — this one and a copy inside WorkExperience — and both stored dates as
// YYYY-MM, while `lib/ats/normalize-dates.ts` declares MM/YYYY canonical and the
// templates print the stored string straight into the PDF. So the editor showed
// "Sep 2010" and the exported CV said "2010-09".
export { default as DateField } from "@/components/editor/MonthYearField"

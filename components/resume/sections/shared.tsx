"use client"

import { useState, useEffect, useLayoutEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { useTranslations } from "next-intl"
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react"
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

// ── DateField — month/year picker via portal ──────────────────────────────────
const MONTHS_ES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"]

export function DateField({
  label, value, onChange, span2,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  span2?: boolean
}) {
  const t = useTranslations("editor.sections_form")
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0, width: 240 })

  const parsed = (() => {
    const m = value.match(/^(\d{4})-(\d{2})$/)
    if (m) return { year: parseInt(m[1]), month: parseInt(m[2]) - 1 }
    const y = value.match(/^(\d{4})$/)
    if (y) return { year: parseInt(y[1]), month: -1 }
    return { year: new Date().getFullYear(), month: -1 }
  })()

  const [viewYear, setViewYear] = useState(parsed.year)

  const displayValue = value
    ? parsed.month >= 0 ? `${MONTHS_ES[parsed.month]} ${parsed.year}` : `${parsed.year}`
    : ""

  useLayoutEffect(() => {
    if (open && triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect()
      const popW = 240
      const left = r.left + popW > window.innerWidth ? r.right - popW : r.left
      setPopoverPos({ top: r.bottom + 6, left, width: popW })
    }
  }, [open])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const t = e.target as Node
      if (
        triggerRef.current && !triggerRef.current.contains(t) &&
        popoverRef.current && !popoverRef.current.contains(t)
      ) setOpen(false)
    }
    if (open) document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [open])

  function selectMonth(idx: number) {
    onChange(`${viewYear}-${String(idx + 1).padStart(2, "0")}`)
    setOpen(false)
  }

  const hasFill = !!displayValue

  const popover = open ? (
    <div
      ref={popoverRef}
      style={{
        position: "fixed", zIndex: 9999,
        top: popoverPos.top, left: popoverPos.left, width: popoverPos.width,
        borderRadius: 16, overflow: "hidden",
        background: "linear-gradient(135deg,#0f1e3a 0%,#1a2e4a 100%)",
        border: "1px solid rgba(0,212,255,0.25)",
        boxShadow: "0 16px 48px rgba(0,0,0,0.45),0 0 0 1px rgba(0,212,255,0.1)",
      }}
    >
      <div style={{ position: "absolute", top: 0, left: "12.5%", width: "75%", height: 1,
        background: "linear-gradient(90deg,transparent,#00D4FF,transparent)", opacity: 0.55 }} />
      {/* Year nav */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px 10px" }}>
        <button type="button" onClick={(e) => { e.stopPropagation(); setViewYear((y) => y - 1) }}
          style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center",
            borderRadius: 8, cursor: "pointer",
            background: "rgba(0,212,255,0.12)", border: "1px solid rgba(0,212,255,0.25)", color: "#00D4FF" }}>
          <ChevronLeft size={14} strokeWidth={2.5} />
        </button>
        <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: "0.04em", color: "#fff" }}>{viewYear}</span>
        <button type="button" onClick={(e) => { e.stopPropagation(); setViewYear((y) => y + 1) }}
          style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center",
            borderRadius: 8, cursor: "pointer",
            background: "rgba(0,212,255,0.12)", border: "1px solid rgba(0,212,255,0.25)", color: "#00D4FF" }}>
          <ChevronRight size={14} strokeWidth={2.5} />
        </button>
      </div>
      {/* Month grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, padding: "0 12px 12px" }}>
        {MONTHS_ES.map((m, i) => {
          const sel = parsed.month === i && parsed.year === viewYear
          return (
            <button key={m} type="button" onClick={(e) => { e.stopPropagation(); selectMonth(i) }}
              style={{
                padding: "8px 0", borderRadius: 10, fontSize: 11, fontWeight: 700,
                cursor: "pointer", border: "none", transition: "all 0.15s ease",
                background: sel ? "linear-gradient(135deg,#00D4FF 0%,#00A8CC 100%)" : "rgba(255,255,255,0.06)",
                color: sel ? "#0a1a35" : "rgba(255,255,255,0.78)",
                boxShadow: sel ? "0 2px 10px rgba(0,212,255,0.4)" : "none",
              }}>
              {m}
            </button>
          )
        })}
      </div>
      {/* Footer */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.07)", padding: "10px 16px",
        display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button type="button" onClick={(e) => { e.stopPropagation(); onChange(""); setOpen(false) }}
          style={{ fontSize: 10.5, fontWeight: 500, cursor: "pointer", border: "none", background: "transparent", color: "rgba(255,255,255,0.38)" }}>
          {t("date.clear")}
        </button>
        <button type="button" onClick={(e) => { e.stopPropagation(); selectMonth(new Date().getMonth()) }}
          style={{ fontSize: 10.5, fontWeight: 700, cursor: "pointer", border: "none", background: "transparent", color: "#00D4FF" }}>
          {t("date.this_month")}
        </button>
      </div>
    </div>
  ) : null

  return (
    <div className={span2 ? "col-span-2" : ""}>
      <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: "#7A9BB5", letterSpacing: "0.01em", textTransform: "capitalize", marginBottom: 6 }}>
        <CalendarDays size={12} strokeWidth={2} style={{ color: "#5B8FBD", flexShrink: 0 }} />
        {label}
      </label>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => { setViewYear(parsed.year || new Date().getFullYear()); setOpen((o) => !o) }}
        style={{
          width: "100%", textAlign: "left", display: "flex", alignItems: "center",
          justifyContent: "space-between", cursor: "pointer",
          height: 36, paddingLeft: 12, paddingRight: 12,
          borderRadius: 6,
          background: "#ffffff",
          border: "1px solid #C8DCF0",
          color: hasFill ? "#1a2e4a" : "#94A3B8",
          fontSize: 13.5, fontWeight: 500,
        }}
      >
        <span>{displayValue || t("date.select")}</span>
        <CalendarDays size={11} style={{ color: "#5B8FBD", flexShrink: 0 }} />
      </button>
      {typeof document !== "undefined" && createPortal(popover, document.body)}
    </div>
  )
}

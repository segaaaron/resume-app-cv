"use client"

/**
 * Onyx Letter — faithful 1:1 port (cv-letters-c.jsx · 12). Black & gold, double
 * rule under the stacked name, solid-square icon trio, subject block. Figtree —
 * ATS-safe. Black is structural; the gold accent is the user-overridable
 * signature. The reference proof row and reference number are dropped.
 */

import type { TemplateProps } from "./types"
import { AHead, AIco } from "@/components/resume/templates/ats/atoms"
import { LTo, LBody, LSign, useLtrView, formatToday } from "./ltr/atoms"
import { designAccent } from "@/lib/resume/template-accent"

const FIGT = 'var(--font-figtree), Helvetica, Arial, sans-serif'
const INK = "#101114"

export default function LtrOnyx(props: TemplateProps) {
  const v = useLtrView(props)
  const c = designAccent(props.colorScheme, "#8a6a1f")
  const today = formatToday("es")
  const trio = (["mail", "phone", "pin"] as const).filter((k) => v.contacts.some(([ck]) => ck === k))
  const meta = [props.candidate.email, props.candidate.phone, props.candidate.linkedin].filter(Boolean).join(" · ")

  return (
    <div style={{ fontFamily: FIGT, minHeight: "297mm", display: "flex", flexDirection: "column", background: "#fdfdfc", color: "#1a1a1a" }}>
      <div style={{ padding: "38px 46px 18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 18, paddingBottom: 11, borderBottom: `3px double ${INK}` }}>
          <h1 style={{ margin: 0, fontSize: 37, fontWeight: 800, letterSpacing: "-0.035em", lineHeight: 0.95 }}>{v.first}<br />{v.last}</h1>
          <div style={{ textAlign: "right" }}>
            {v.jobTitle && <div style={{ fontSize: "10.5pt", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: c }}>{v.jobTitle}</div>}
            {trio.length > 0 && <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", marginTop: 7 }}>{trio.map((k) => <AIco key={k} k={k} c={INK} size={22} variant="solid" shape="square" />)}</div>}
          </div>
        </div>
        {(meta || today) && (
          <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", gap: 16, fontSize: "10.2pt", color: "#5b6068" }}>
            <span>{meta}</span><span style={{ fontWeight: 700, color: INK }}>{today}</span>
          </div>
        )}
      </div>
      <div style={{ padding: "10px 46px 36px", flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 22, paddingBottom: 14, marginBottom: 14, borderBottom: "1px solid #e6e5e0" }}>
          <LTo v={v} font={FIGT} color={c} />
          <div>
            <AHead icon="mail" color={c} font={FIGT} variant="split" size={11}>Subject</AHead>
            <div style={{ fontSize: "12.5pt", fontWeight: 700 }}>{v.subject || `Application for ${v.role}`}</div>
          </div>
        </div>
        <div style={{ fontSize: "11.5pt", fontWeight: 700, marginBottom: 9 }}>{v.greeting}</div>
        <LBody v={v} font={FIGT} fs={11} lh={1.68} />
        <div style={{ marginTop: "auto", paddingTop: 26 }}><LSign v={v} font={FIGT} color={c} /></div>
      </div>
    </div>
  )
}

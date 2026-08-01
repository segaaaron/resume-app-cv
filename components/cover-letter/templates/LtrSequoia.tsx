"use client"

/**
 * Sequoia Letter — faithful 1:1 port (cv-letters-b.jsx · 10). Rust numbered
 * section markers, Roboto Slab headings, soft-circle contact column. Lato body
 * chrome — ATS-safe. Rust is the user-overridable signature. The reference
 * "Highlights" section is dropped (we never invent metrics), so the section
 * markers run 1 (Addressed to) → 2 (Letter).
 */

import type { ReactNode } from "react"
import type { TemplateProps } from "./types"
import { AContact, AIco, aFade, type IconKey } from "@/components/resume/templates/ats/atoms"
import { LTo, LBody, LSign, useLtrView, formatToday } from "./ltr/atoms"
import { designAccent } from "@/lib/resume/template-accent"

const LATO = 'var(--font-lato), Helvetica, Arial, sans-serif'
const RSLAB = 'var(--font-roboto-slab), Georgia, serif'
const PCA = { WebkitPrintColorAdjust: "exact" as const, printColorAdjust: "exact" as const }

/** Numbered section marker — module-scoped so it never remounts on re-render. */
function Sec({ n, icon, children, color }: { n: string; icon: IconKey; children: ReactNode; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 9 }}>
      <span style={{ fontFamily: RSLAB, fontSize: 10.5, fontWeight: 700, color: "#fff", background: color, width: 21, height: 21, borderRadius: "50%", display: "grid", placeItems: "center", ...PCA }}>{n}</span>
      <AIco k={icon} c={color} variant="plain" size={14} />
      <span style={{ fontFamily: RSLAB, fontSize: 11.5, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}>{children}</span>
      <span style={{ flex: 1, height: 2, background: aFade(color, 0.2), ...PCA }} />
    </div>
  )
}

export default function LtrSequoia(props: TemplateProps) {
  const v = useLtrView(props)
  const c = designAccent(props.colorScheme, "#a1441f")
  const today = formatToday("es")

  return (
    <div style={{ fontFamily: LATO, minHeight: "297mm", display: "flex", flexDirection: "column", background: "#fffcfa", color: "#1a1a1a" }}>
      <div style={{ padding: "38px 48px 20px", borderBottom: "1px solid #e8e5e1", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontFamily: RSLAB, fontSize: 31, fontWeight: 700, letterSpacing: "-0.02em" }}>{v.name}</h1>
          {v.jobTitle && <div style={{ fontSize: "11.5pt", color: c, fontWeight: 700, marginTop: 4 }}>{v.jobTitle}</div>}
          <div style={{ fontSize: "10.2pt", color: "#6b7078", marginTop: 8 }}>{today}</div>
        </div>
        {v.contacts.length > 0 && <AContact items={v.contacts.slice(0, 3)} color={c} variant="soft" shape="circle" size={18} font={LATO} fs={9.8} dir="column" gap="7px" />}
      </div>
      <div style={{ padding: "20px 48px 34px", flex: 1, display: "flex", flexDirection: "column" }}>
        <Sec n="1" icon="user" color={c}>Addressed to</Sec>
        <div style={{ paddingLeft: 31, marginBottom: 16 }}><LTo v={v} font={LATO} color={c} /></div>
        <Sec n="2" icon="mail" color={c}>Letter</Sec>
        <div style={{ paddingLeft: 31 }}>
          <div style={{ fontFamily: RSLAB, fontSize: 12, fontWeight: 700, marginBottom: 8 }}>{v.greeting}</div>
          <LBody v={v} font={LATO} fs={10.9} lh={1.68} />
        </div>
        <div style={{ marginTop: "auto", paddingTop: 26, paddingLeft: 31 }}><LSign v={v} font={LATO} color={c} line={false} /></div>
      </div>
    </div>
  )
}

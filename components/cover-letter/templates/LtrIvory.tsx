"use client"

/**
 * Ivory Letter — faithful 1:1 port (cv-letters-c.jsx · 15). Cream page, wide
 * margins, light-caps name with a bold surname, calm tab heading, spark divider.
 * Lato — ATS-safe. Warm taupe is the user-overridable signature. The reference
 * proof row is dropped (we never invent metrics).
 */

import type { TemplateProps } from "./types"
import { AHead, AContact, AIco, aFade } from "@/components/resume/templates/ats/atoms"
import { LTo, LBody, LSign, useLtrView, formatToday } from "./ltr/atoms"
import { designAccent } from "@/lib/resume/template-accent"

const LATO = 'var(--font-lato), Helvetica, Arial, sans-serif'

export default function LtrIvory(props: TemplateProps) {
  const v = useLtrView(props)
  const c = designAccent(props.colorScheme, "#6b5844")
  const today = formatToday("es")
  const pca = { WebkitPrintColorAdjust: "exact" as const, printColorAdjust: "exact" as const }

  return (
    <div style={{ fontFamily: LATO, minHeight: "297mm", display: "flex", flexDirection: "column", background: "#fdfbf6", color: "#1a1a1a" }}>
      <div style={{ padding: "48px 58px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 30, fontWeight: 300, letterSpacing: "0.06em", textTransform: "uppercase" }}>{v.first} <strong style={{ fontWeight: 900 }}>{v.last}</strong></h1>
            {v.jobTitle && <div style={{ fontSize: "10.5pt", color: c, letterSpacing: "0.12em", textTransform: "uppercase", marginTop: 6, fontWeight: 700 }}>{v.jobTitle}</div>}
          </div>
          <AIco k="mail" c={c} size={38} variant="outline" shape="circle" />
        </div>
        <div style={{ height: 1, background: aFade(c, 0.3), margin: "16px 0 12px", ...pca }} />
        <div style={{ display: "flex", justifyContent: "space-between", gap: 20 }}>
          {v.contacts.length > 0 && <AContact items={v.contacts.slice(0, 3)} color={c} variant="plain" size={12} font={LATO} fs={10.1} gap="4px 16px" ink="#585c63" />}
          <div style={{ fontSize: "10.1pt", color: "#8b8f98" }}>{today}</div>
        </div>
      </div>
      <div style={{ padding: "22px 58px 38px", flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ marginBottom: 18 }}><LTo v={v} font={LATO} color={c} /></div>
        <AHead icon="brief" color={c} font={LATO} variant="tab" track="0.2em" size={11}>{v.subject || `Re: ${v.role}`}</AHead>
        <div style={{ fontSize: "11.5pt", fontWeight: 700, marginBottom: 10 }}>{v.greeting}</div>
        <LBody v={v} font={LATO} fs={11.1} lh={1.78} />
        <div style={{ marginTop: "auto", paddingTop: 26 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <span style={{ flex: 1, height: 1, background: "#e8e2d6" }} />
            <AIco k="spark" c={c} variant="plain" size={13} />
            <span style={{ flex: 1, height: 1, background: "#e8e2d6" }} />
          </div>
          <LSign v={v} font={LATO} color={c} line={false} />
        </div>
      </div>
    </div>
  )
}

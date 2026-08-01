"use client"

/**
 * Nordic Letter — faithful 1:1 port (cv-letters-c.jsx · 11). Centered rules,
 * airy uppercase name, soft-circle contact row, centered signature. Cabin —
 * ATS-safe. Ice blue is the user-overridable signature. The reference proof
 * band is dropped (we never invent metrics).
 */

import type { TemplateProps } from "./types"
import { AContact, aFade } from "@/components/resume/templates/ats/atoms"
import { LTo, LBody, LSign, useLtrView, formatToday } from "./ltr/atoms"
import { designAccent } from "@/lib/resume/template-accent"

const CABIN = 'var(--font-cabin), "Trebuchet MS", Arial, sans-serif'

export default function LtrNordic(props: TemplateProps) {
  const v = useLtrView(props)
  const c = designAccent(props.colorScheme, "#2d6ca2")
  const today = formatToday("es")
  const pca = { WebkitPrintColorAdjust: "exact" as const, printColorAdjust: "exact" as const }

  return (
    <div style={{ fontFamily: CABIN, minHeight: "297mm", display: "flex", flexDirection: "column", background: "#fdfeff", color: "#1a1a1a" }}>
      <div style={{ padding: "42px 54px 18px", textAlign: "center" }}>
        <h1 style={{ margin: 0, fontSize: 30, fontWeight: 700, letterSpacing: "0.02em", textTransform: "uppercase" }}>{v.name}</h1>
        {v.jobTitle && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginTop: 8 }}>
            <span style={{ width: 34, height: 1, background: aFade(c, 0.5), ...pca }} />
            <span style={{ fontSize: "10.5pt", letterSpacing: "0.2em", textTransform: "uppercase", color: c, fontWeight: 700 }}>{v.jobTitle}</span>
            <span style={{ width: 34, height: 1, background: aFade(c, 0.5), ...pca }} />
          </div>
        )}
        {v.contacts.length > 0 && (
          <div style={{ display: "flex", justifyContent: "center", marginTop: 13 }}>
            <AContact items={v.contacts.slice(0, 3)} color={c} variant="soft" shape="circle" size={19} font={CABIN} fs={10.2} gap="6px 14px" />
          </div>
        )}
      </div>
      <div style={{ padding: "12px 54px 36px", flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 20, padding: "13px 0", borderTop: `1px solid ${aFade(c, 0.25)}`, borderBottom: `1px solid ${aFade(c, 0.25)}`, marginBottom: 18 }}>
          <LTo v={v} font={CABIN} color={c} />
          <div style={{ fontSize: "10.2pt", color: "#6b7078", textAlign: "right" }}>{today}</div>
        </div>
        <div style={{ fontSize: "12pt", fontWeight: 700, marginBottom: 10 }}>{v.greeting}</div>
        <LBody v={v} font={CABIN} fs={11} lh={1.72} />
        <div style={{ marginTop: "auto", paddingTop: 26, textAlign: "center" }}><LSign v={v} font={CABIN} color={c} centered /></div>
      </div>
    </div>
  )
}

"use client"

/**
 * Harbor Letter — faithful 1:1 port (cv-letters-b.jsx · 08). Teal ribbon header
 * with a solid mail badge, two-column soft contact grid, bar heading. Libre
 * Franklin — ATS-safe. Teal is the user-overridable signature. The reference
 * "Proof points" highlight rail is dropped (we never invent metrics).
 */

import type { TemplateProps } from "./types"
import { AHead, AContact, AIco, aFade, aMix } from "@/components/resume/templates/ats/atoms"
import { LTo, LBody, LSign, useLtrView, formatToday } from "./ltr/atoms"
import { designAccent } from "@/lib/resume/template-accent"

const FRANK = 'var(--font-libre-franklin), Helvetica, Arial, sans-serif'

export default function LtrHarbor(props: TemplateProps) {
  const v = useLtrView(props)
  const c = designAccent(props.colorScheme, "#0f6b73")
  const today = formatToday("es")
  const pca = { WebkitPrintColorAdjust: "exact" as const, printColorAdjust: "exact" as const }
  const colA = v.contacts.filter(([k]) => k === "mail" || k === "phone")
  const colB = v.contacts.filter(([k]) => k === "link" || k === "globe")

  return (
    <div style={{ fontFamily: FRANK, minHeight: "297mm", display: "flex", flexDirection: "column", color: "#1a1a1a" }}>
      <div style={{ background: aFade(c, 0.07), padding: "32px 46px 20px", borderBottom: `4px solid ${c}`, ...pca }}>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <AIco k="mail" c={c} size={48} variant="solid" />
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0, fontSize: 30, fontWeight: 700, letterSpacing: "-0.02em" }}>{v.name}</h1>
            {v.jobTitle && <div style={{ fontSize: "11.5pt", color: aMix(c, 0.1), fontWeight: 600, marginTop: 3 }}>{v.jobTitle}</div>}
          </div>
          <div style={{ textAlign: "right", fontSize: "10pt", color: "#5b6068", lineHeight: 1.6 }}>{today}{props.candidate.address && <><br />{props.candidate.address}</>}</div>
        </div>
        {(colA.length > 0 || colB.length > 0) && (
          <div style={{ marginTop: 13, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 14px" }}>
            {colA.length > 0 && <AContact items={colA} color={c} variant="soft" size={18} font={FRANK} fs={10} dir="column" gap="7px" />}
            {colB.length > 0 && <AContact items={colB} color={c} variant="soft" size={18} font={FRANK} fs={10} dir="column" gap="7px" />}
          </div>
        )}
      </div>
      <div style={{ padding: "20px 46px 34px", flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ marginBottom: 16 }}><LTo v={v} font={FRANK} color={c} /></div>
        <AHead icon="brief" color={c} font={FRANK} variant="bar">{v.subject || `Application — ${v.role}`}</AHead>
        <div style={{ fontSize: "11.5pt", fontWeight: 700, marginBottom: 9 }}>{v.greeting}</div>
        <LBody v={v} font={FRANK} fs={10.9} lh={1.68} />
        <div style={{ marginTop: "auto", paddingTop: 26 }}><LSign v={v} font={FRANK} color={c} line={false} /></div>
      </div>
    </div>
  )
}

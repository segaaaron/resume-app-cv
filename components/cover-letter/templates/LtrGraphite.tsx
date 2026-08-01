"use client"

/**
 * Graphite Letter — faithful 1:1 port (cv-letters-b.jsx · 09). Charcoal header
 * with a red spine, badge title, solid-square contact chips. Nunito Sans —
 * ATS-safe. Charcoal is structural; the red accent is the user-overridable
 * signature. The reference hardcoded editorial pull line ("Seven years… 1.2M
 * users") and proof row are dropped (we never fabricate claims).
 */

import type { TemplateProps } from "./types"
import { AContact, aFade } from "@/components/resume/templates/ats/atoms"
import { LTo, LBody, LSign, useLtrView, formatToday } from "./ltr/atoms"
import { designAccent } from "@/lib/resume/template-accent"

const NUNI = 'var(--font-nunito-sans), "Segoe UI", Arial, sans-serif'
const INK = "#22262c"

export default function LtrGraphite(props: TemplateProps) {
  const v = useLtrView(props)
  const a = designAccent(props.colorScheme, "#b3261e")
  const today = formatToday("es")
  const pca = { WebkitPrintColorAdjust: "exact" as const, printColorAdjust: "exact" as const }

  return (
    <div style={{ fontFamily: NUNI, minHeight: "297mm", display: "flex", flexDirection: "column", color: "#1a1a1a" }}>
      <div style={{ background: INK, color: "#fff", padding: "30px 46px 22px", position: "relative", ...pca }}>
        <span style={{ position: "absolute", top: 0, left: 0, width: 6, height: "100%", background: a, ...pca }} />
        <h1 style={{ margin: 0, fontSize: 33, fontWeight: 900, letterSpacing: "-0.03em" }}>{v.name}</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 7 }}>
          {v.jobTitle && <span style={{ background: a, fontSize: 9.5, fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", padding: "4px 9px", borderRadius: 2, ...pca }}>{v.jobTitle}</span>}
          <span style={{ fontSize: 10, color: "#a9adb5" }}>{today}</span>
        </div>
        {v.contacts.length > 0 && (
          <div style={{ marginTop: 14 }}><AContact items={v.contacts} color={a} variant="solid" shape="square" size={17} font={NUNI} fs={10} ink="#fff" gap="7px 15px" /></div>
        )}
      </div>
      <div style={{ padding: "22px 46px 34px", flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 20, marginBottom: 16 }}>
          <LTo v={v} font={NUNI} color={a} />
          {v.recipient.company && <div style={{ fontSize: 22, fontWeight: 900, color: aFade(a, 0.18), letterSpacing: "-0.03em", whiteSpace: "nowrap" }}>{v.recipient.company}</div>}
        </div>
        <div style={{ fontSize: "11.5pt", fontWeight: 800, marginBottom: 8 }}>{v.greeting}</div>
        <LBody v={v} font={NUNI} fs={10.9} lh={1.66} />
        <div style={{ marginTop: "auto", paddingTop: 26 }}><LSign v={v} font={NUNI} color={a} /></div>
      </div>
    </div>
  )
}

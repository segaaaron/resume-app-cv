"use client"

/**
 * Verdant Letter — faithful 1:1 port (cv-letters-a.jsx · 02). Forest initial-tile
 * header, rule heading, clean body + signature. Source Sans 3 — ATS-safe.
 */

import type { TemplateProps } from "./types"
import { AHead } from "@/components/resume/templates/ats/atoms"
import { LETTER_BODY_PT, LETTER_BODY_LH } from "./_metrics"
import { LTo, LBody, LSign, useLtrView, formatToday } from "./ltr/atoms"
import { designAccent } from "@/lib/resume/template-accent"
import { useLocale } from "next-intl"

const SSANS = 'var(--font-source-sans), Calibri, Arial, sans-serif'

export default function LtrVerdant(props: TemplateProps) {
  const loc = useLocale() === "en" ? "en" : "es"
  const v = useLtrView(props, loc)
  const c = designAccent(props.colorScheme, "#1e5c3d")
  const today = formatToday(loc)
  const pca = { WebkitPrintColorAdjust: "exact" as const, printColorAdjust: "exact" as const }

  return (
    <div style={{ fontFamily: SSANS, minHeight: "297mm", display: "flex", flexDirection: "column", color: "#1a1a1a" }}>
      <div style={{ padding: "38px 48px 18px", borderBottom: `3px solid ${c}`, display: "flex", alignItems: "center", gap: 16, ...pca }}>
        <div style={{ width: 54, height: 54, borderRadius: 8, background: c, color: "#fff", display: "grid", placeItems: "center", fontSize: 20, fontWeight: 700, flexShrink: 0, ...pca }}>{v.initials}</div>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: 30, fontWeight: 700, letterSpacing: "-0.015em" }}>{v.name}</h1>
          {v.jobTitle && <div style={{ fontSize: 12, color: c, fontWeight: 600 }}>{v.jobTitle}</div>}
        </div>
        <div style={{ textAlign: "right", fontSize: "10.2pt", color: "#6b7078", lineHeight: 1.6 }}>
          {props.candidate.email && <>{props.candidate.email}<br /></>}
          {props.candidate.phone && <>{props.candidate.phone}<br /></>}
          {props.candidate.address}
        </div>
      </div>
      <div style={{ padding: "22px 48px 34px", flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 20, marginBottom: 18 }}>
          <LTo v={v} font={SSANS} color={c} />
          <div style={{ fontSize: "10.2pt", color: "#6b7078", textAlign: "right" }}>{today}{v.recipient.company && <div style={{ color: c, fontWeight: 700, marginTop: 4 }}>{v.recipient.company}</div>}</div>
        </div>
        <AHead icon="target" color={c} font={SSANS} variant="rule">{v.subject || `Application — ${v.role}`}</AHead>
        <div style={{ fontSize: "12pt", fontWeight: 700, marginBottom: 9 }}>{v.greeting}</div>
        <LBody v={v} font={SSANS} fs={LETTER_BODY_PT} lh={LETTER_BODY_LH} />
        <div style={{ marginTop: "auto", paddingTop: 26 }}><LSign v={v} font={SSANS} color={c} line={false} /></div>
      </div>
    </div>
  )
}

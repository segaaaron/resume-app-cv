"use client"

/**
 * Sable Letter — faithful 1:1 port (cv-letters-c.jsx · 13). Deep-green header
 * band with an initial ring, Spectral serif body, quiet-luxury spacing. Source
 * Sans 3 body chrome — ATS-safe. Deep green is the user-overridable signature.
 * The reference proof row is dropped (we never invent metrics).
 */

import type { TemplateProps } from "./types"
import { AHead, AContact } from "@/components/resume/templates/ats/atoms"
import { LETTER_BODY_PT, LETTER_BODY_LH } from "./_metrics"
import { LTo, LBody, LSign, useLtrView, formatToday } from "./ltr/atoms"
import { designAccent } from "@/lib/resume/template-accent"
import { useLocale } from "next-intl"

const SSANS = 'var(--font-source-sans), Calibri, Arial, sans-serif'
const SPEC = 'var(--font-spectral), Georgia, serif'

export default function LtrSable(props: TemplateProps) {
  const loc = useLocale() === "en" ? "en" : "es"
  const v = useLtrView(props, loc)
  const c = designAccent(props.colorScheme, "#14453d")
  const today = formatToday(loc)
  const pca = { WebkitPrintColorAdjust: "exact" as const, printColorAdjust: "exact" as const }
  const headContacts = v.contacts.filter(([k]) => k === "mail" || k === "phone")

  return (
    <div style={{ fontFamily: SSANS, minHeight: "297mm", display: "flex", flexDirection: "column", background: "#fcfdfc", color: "#1a1a1a" }}>
      <div style={{ background: c, color: "#fff", padding: "28px 46px 20px", display: "flex", alignItems: "center", gap: 16, ...pca }}>
        <div style={{ width: 54, height: 54, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.4)", display: "grid", placeItems: "center", fontFamily: SPEC, fontSize: 19, fontWeight: 600, flexShrink: 0 }}>{v.initials}</div>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontFamily: SPEC, fontSize: 28, fontWeight: 600 }}>{v.name}</h1>
          {v.jobTitle && <div style={{ fontSize: "10.2pt", letterSpacing: "0.22em", textTransform: "uppercase", color: "#9dc4b8", marginTop: 4 }}>{v.jobTitle}</div>}
        </div>
        {headContacts.length > 0 && <AContact items={headContacts} color="#ffffff" variant="plain" size={12} font={SSANS} fs={9.6} ink="#d5e5df" dir="column" gap="6px" />}
      </div>
      <div style={{ padding: "22px 46px 36px", flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 20, marginBottom: 16 }}>
          <LTo v={v} font={SSANS} color={c} />
          <div style={{ fontFamily: SPEC, fontSize: "11.5pt", fontStyle: "italic", color: "#6b7078" }}>{today}</div>
        </div>
        <AHead icon="mail" color={c} font={SSANS} variant="rule">{v.subject || "Letter of Introduction"}</AHead>
        <div style={{ fontFamily: SPEC, fontSize: "13pt", fontWeight: 600, marginBottom: 9 }}>{v.greeting}</div>
        <LBody v={v} font={SPEC} fs={LETTER_BODY_PT} lh={LETTER_BODY_LH} />
        <div style={{ marginTop: "auto", paddingTop: 26, display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 20 }}>
          <LSign v={v} font={SSANS} color={c} />
          {(v.recipient.company || v.role) && <div style={{ fontFamily: SPEC, fontSize: 11, fontStyle: "italic", color: c, textAlign: "right" }}>{v.recipient.company}{v.recipient.company && <br />}{v.role}</div>}
        </div>
      </div>
    </div>
  )
}

"use client"

/**
 * Cardinal Letter — faithful 1:1 port (cv-letters-a.jsx · 03). Centered crest,
 * Merriweather serif body, classic block. Burgundy signature (user-overridable) — ATS-safe.
 */

import type { TemplateProps } from "./types"
import { AContact, AIco, aFade } from "@/components/resume/templates/ats/atoms"
import { LETTER_BODY_PT, LETTER_BODY_LH } from "./_metrics"
import { LTo, LBody, LSign, useLtrView, formatToday } from "./ltr/atoms"
import { designAccent } from "@/lib/resume/template-accent"
import { useLocale } from "next-intl"

const LATO = 'var(--font-lato), Helvetica, Arial, sans-serif'
const MERRI = 'var(--font-merriweather), Georgia, serif'

export default function LtrCardinal(props: TemplateProps) {
  const loc = useLocale() === "en" ? "en" : "es"
  const v = useLtrView(props, loc)
  const c = designAccent(props.colorScheme, "#7a2230")
  const today = formatToday(loc)

  return (
    <div style={{ fontFamily: LATO, minHeight: "297mm", display: "flex", flexDirection: "column", background: "#fffdfc", color: "#1a1a1a" }}>
      <div style={{ padding: "42px 56px 20px", textAlign: "center", borderBottom: `1px solid ${aFade(c, 0.3)}` }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 11 }}><AIco k="shield" c={c} size={34} variant="solid" shape="circle" /></div>
        <h1 style={{ margin: 0, fontFamily: MERRI, fontSize: 29, fontWeight: 700 }}>{v.name}</h1>
        {v.jobTitle && <div style={{ fontSize: "10.5pt", letterSpacing: "0.28em", textTransform: "uppercase", color: c, marginTop: 7, fontWeight: 700 }}>{v.jobTitle}</div>}
        {v.contacts.length > 0 && <div style={{ display: "flex", justifyContent: "center", marginTop: 12 }}><AContact items={v.contacts.slice(0, 3)} color={c} variant="plain" size={12} font={LATO} fs={10.2} gap="4px 16px" /></div>}
      </div>
      <div style={{ padding: "24px 56px 36px", flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: "10.4pt", color: "#6b7078", marginBottom: 14 }}>{today}</div>
        <div style={{ marginBottom: 16 }}><LTo v={v} font={LATO} color={c} /></div>
        <div style={{ fontFamily: MERRI, fontSize: "12.5pt", fontWeight: 700, marginBottom: 11 }}>{v.greeting}</div>
        <LBody v={v} font={MERRI} fs={LETTER_BODY_PT} lh={LETTER_BODY_LH} indent={22} />
        <div style={{ marginTop: "auto", paddingTop: 26, borderTop: `1px solid ${aFade(c, 0.25)}` }}><LSign v={v} font={LATO} color={c} line={false} /></div>
      </div>
    </div>
  )
}

"use client"

/**
 * Copper Letter — faithful 1:1 port (cv-letters-b.jsx · 07). Framed contact
 * strip, PT Serif headings, Karla body chrome over a warm page. Bronze is the
 * user-overridable signature — ATS-safe. The reference numbered-timeline points
 * and "proof" row are dropped: the body is the user's real HTML, not a fabricated
 * array of numbers.
 */

import type { TemplateProps } from "./types"
import { AHead, AContact, aFade } from "@/components/resume/templates/ats/atoms"
import { LTo, LBody, LSign, useLtrView, formatToday } from "./ltr/atoms"
import { designAccent } from "@/lib/resume/template-accent"

const KARLA = 'var(--font-karla), Helvetica, Arial, sans-serif'
const PTS = 'var(--font-pt-serif), Georgia, serif'

export default function LtrCopper(props: TemplateProps) {
  const v = useLtrView(props)
  const c = designAccent(props.colorScheme, "#8a5426")
  const today = formatToday("es")

  return (
    <div style={{ fontFamily: KARLA, minHeight: "297mm", display: "flex", flexDirection: "column", background: "#fffdfa", color: "#1a1a1a" }}>
      <div style={{ padding: "38px 48px 0", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 18 }}>
        <div>
          <h1 style={{ margin: 0, fontFamily: PTS, fontSize: 33, fontWeight: 700 }}>{v.name}</h1>
          {v.jobTitle && <div style={{ fontSize: "11.5pt", color: c, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 5 }}>{v.jobTitle}</div>}
        </div>
        <div style={{ fontFamily: PTS, fontSize: "11.5pt", color: "#6b7078" }}>{today}</div>
      </div>
      {v.contacts.length > 0 && (
        <div style={{ margin: "16px 48px 0", border: `1px solid ${aFade(c, 0.35)}`, background: aFade(c, 0.05), borderRadius: 4, padding: "10px 15px" }}>
          <AContact items={v.contacts} color={c} variant="plain" size={12.5} font={KARLA} fs={10.2} gap="5px 15px" />
        </div>
      )}
      <div style={{ padding: "18px 48px 34px", flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ marginBottom: 15 }}><LTo v={v} font={KARLA} color={c} /></div>
        <AHead icon="mail" color={c} font={PTS} variant="tab" track="0.06em">{v.subject || `Re: ${v.role}`}</AHead>
        <div style={{ fontFamily: PTS, fontSize: "12.5pt", fontWeight: 700, marginBottom: 9 }}>{v.greeting}</div>
        <LBody v={v} font={KARLA} fs={11} lh={1.7} />
        <div style={{ marginTop: "auto", paddingTop: 26 }}><LSign v={v} font={KARLA} color={c} /></div>
      </div>
    </div>
  )
}

"use client"

/**
 * Cobalt Letter — faithful 1:1 port (cv-letters-a.jsx · 04). Side contact panel,
 * tab heading, block body + signature. IBM Plex Sans — ATS-safe.
 */

import type { TemplateProps } from "./types"
import { AHead, AContact } from "@/components/resume/templates/ats/atoms"
import { LTo, LBody, LSign, useLtrView, formatToday } from "./ltr/atoms"
import { designAccent } from "@/lib/resume/template-accent"
import { useLocale } from "next-intl"

const PLEX = 'var(--font-plex), Tahoma, Arial, sans-serif'

export default function LtrCobalt(props: TemplateProps) {
  const loc = useLocale() === "en" ? "en" : "es"
  const v = useLtrView(props, loc)
  const c = designAccent(props.colorScheme, "#14509e")
  const today = formatToday(loc)
  const pca = { WebkitPrintColorAdjust: "exact" as const, printColorAdjust: "exact" as const }

  return (
    <div style={{ fontFamily: PLEX, minHeight: "297mm", display: "flex", flexDirection: "column", color: "#1a1a1a" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 210px" }}>
        <div style={{ padding: "34px 26px 24px 46px" }}>
          <h1 style={{ margin: 0, fontSize: 31, fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.05 }}>{v.first}<br /><span style={{ color: c }}>{v.last}</span></h1>
          {v.jobTitle && <div style={{ fontSize: "11.5pt", color: "#43474f", marginTop: 7, fontWeight: 500 }}>{v.jobTitle}</div>}
        </div>
        {v.contacts.length > 0 && (
          <div style={{ background: c, color: "#fff", padding: "28px 22px", ...pca }}>
            <AContact items={v.contacts} color="#ffffff" variant="plain" size={13} font={PLEX} fs={9.5} ink="#e2ecf9" dir="column" gap="9px" />
          </div>
        )}
      </div>
      <div style={{ padding: "8px 46px 34px", flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20, marginBottom: 18 }}>
          <LTo v={v} font={PLEX} color={c} />
          <div style={{ fontSize: "10.2pt", color: "#8b8f98" }}>{today}</div>
        </div>
        <AHead icon="brief" color={c} font={PLEX} variant="tab">{v.subject || `Application for ${v.role}`}</AHead>
        <div style={{ fontSize: "11.5pt", fontWeight: 600, marginBottom: 9 }}>{v.greeting}</div>
        <LBody v={v} font={PLEX} fs={10.9} lh={1.7} />
        <div style={{ marginTop: "auto", paddingTop: 26 }}><LSign v={v} font={PLEX} color={c} /></div>
      </div>
    </div>
  )
}

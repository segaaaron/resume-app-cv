"use client"

/**
 * Slate Letter — faithful 1:1 port (cv-letters-a.jsx · 05). Graphite letterhead
 * rule, split heading, block body + signature. Work Sans — ATS-safe. Graphite is
 * structural; the amber accent is the user-overridable signature.
 */

import type { TemplateProps } from "./types"
import { AHead, AContact } from "@/components/resume/templates/ats/atoms"
import { LTo, LBody, LSign, useLtrView, formatToday } from "./ltr/atoms"
import { designAccent } from "@/lib/resume/template-accent"
import { useLocale } from "next-intl"

const WORKS = 'var(--font-work-sans), Helvetica, Arial, sans-serif'
const C = "#37474f"

export default function LtrSlate(props: TemplateProps) {
  const loc = useLocale() === "en" ? "en" : "es"
  const v = useLtrView(props, loc)
  const a = designAccent(props.colorScheme, "#b06f16")
  const today = formatToday(loc)
  const pca = { WebkitPrintColorAdjust: "exact" as const, printColorAdjust: "exact" as const }

  return (
    <div style={{ fontFamily: WORKS, minHeight: "297mm", display: "flex", flexDirection: "column", background: "#fcfcfb", color: "#1a1a1a" }}>
      <div style={{ padding: "38px 48px 18px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20, borderBottom: "1px solid #e3e4e7" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 32, fontWeight: 700, letterSpacing: "-0.03em" }}>{v.name}</h1>
          {v.jobTitle && (
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 6 }}>
              <span style={{ width: 24, height: 3, background: a, ...pca }} />
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.13em", textTransform: "uppercase", color: C }}>{v.jobTitle}</span>
            </div>
          )}
        </div>
        {v.contacts.length > 0 && <AContact items={v.contacts.slice(0, 3)} color={a} variant="plain" size={12.5} font={WORKS} fs={10} dir="column" gap="5px" />}
      </div>
      <div style={{ padding: "20px 48px 34px", flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 20, marginBottom: 16 }}>
          <LTo v={v} font={WORKS} color={a} />
          <div style={{ fontSize: "10pt", color: "#8b8f98", letterSpacing: "0.06em", textTransform: "uppercase" }}>{today}</div>
        </div>
        <AHead icon="mail" color={C} font={WORKS} variant="split" sub={v.role}>{v.subject || "Cover Letter"}</AHead>
        <div style={{ fontSize: "11.5pt", fontWeight: 700, marginBottom: 9 }}>{v.greeting}</div>
        <LBody v={v} font={WORKS} fs={10.9} lh={1.68} />
        <div style={{ marginTop: "auto", paddingTop: 26 }}><LSign v={v} font={WORKS} color={a} /></div>
      </div>
    </div>
  )
}

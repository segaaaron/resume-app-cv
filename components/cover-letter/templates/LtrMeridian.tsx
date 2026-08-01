"use client"

/**
 * Meridian Letter — faithful 1:1 port (cv-letters-a.jsx · 01). Navy band header
 * mirroring the Meridian CV, badge heading, clean block body + signature.
 * Lato — ATS-safe. Navy is the user-overridable signature.
 */

import type { TemplateProps } from "./types"
import { AHead, AContact, AIco } from "@/components/resume/templates/ats/atoms"
import { LTo, LBody, LSign, useLtrView, formatToday } from "./ltr/atoms"
import { designAccent } from "@/lib/resume/template-accent"
import { useLocale } from "next-intl"

const LATO = 'var(--font-lato), Helvetica, Arial, sans-serif'

export default function LtrMeridian(props: TemplateProps) {
  const loc = useLocale() === "en" ? "en" : "es"
  const v = useLtrView(props, loc)
  const c = designAccent(props.colorScheme, "#1f3a5f")
  const today = formatToday(loc)
  const pca = { WebkitPrintColorAdjust: "exact" as const, printColorAdjust: "exact" as const }

  return (
    <div style={{ fontFamily: LATO, minHeight: "297mm", display: "flex", flexDirection: "column", color: "#1a1a1a" }}>
      <div style={{ background: c, color: "#fff", padding: "28px 46px 22px", ...pca }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 18 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 32, fontWeight: 900, letterSpacing: "-0.02em" }}>{v.name}</h1>
            {v.jobTitle && <div style={{ fontSize: 11, letterSpacing: "0.24em", textTransform: "uppercase", color: "#a9c2e0", marginTop: 6 }}>{v.jobTitle}</div>}
          </div>
          <AIco k="mail" c="#fff" variant="outline" size={42} style={{ borderColor: "rgba(255,255,255,0.4)" }} />
        </div>
        {v.contacts.length > 0 && (
          <>
            <div style={{ height: 1, background: "rgba(255,255,255,0.2)", margin: "15px 0 12px", ...pca }} />
            <AContact items={v.contacts} color="#ffffff" variant="plain" size={13} font={LATO} fs={10.2} ink="#dbe6f3" gap="6px 18px" />
          </>
        )}
      </div>
      <div style={{ padding: "26px 46px 34px", flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20, marginBottom: 20 }}>
          <LTo v={v} font={LATO} color={c} />
          <div style={{ fontSize: "10.4pt", color: "#6b7078" }}>{today}</div>
        </div>
        <AHead icon="mail" color={c} font={LATO} variant="badge">{v.subject || "Cover Letter"}</AHead>
        <div style={{ fontSize: "12pt", fontWeight: 700, marginBottom: 10 }}>{v.greeting}</div>
        <LBody v={v} font={LATO} />
        <div style={{ marginTop: "auto", paddingTop: 26 }}><LSign v={v} font={LATO} color={c} /></div>
      </div>
    </div>
  )
}

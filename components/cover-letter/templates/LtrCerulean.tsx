"use client"

/**
 * Cerulean Letter — faithful 1:1 port (cv-letters-c.jsx · 14). Accent spine name,
 * solid blue contact bar, badge heading. Asap — ATS-safe. Blue is the
 * user-overridable signature. The reference right-hand "Snapshot" column is
 * dropped: it rendered demo metrics we don't have (we never invent numbers), so
 * the letter runs as a single clean column.
 */

import type { TemplateProps } from "./types"
import { AHead, AContact } from "@/components/resume/templates/ats/atoms"
import { LTo, LBody, LSign, useLtrView, formatToday } from "./ltr/atoms"
import { designAccent } from "@/lib/resume/template-accent"

const ASAP = 'var(--font-asap), Verdana, Arial, sans-serif'

export default function LtrCerulean(props: TemplateProps) {
  const v = useLtrView(props)
  const c = designAccent(props.colorScheme, "#1565a0")
  const today = formatToday("es")
  const pca = { WebkitPrintColorAdjust: "exact" as const, printColorAdjust: "exact" as const }

  return (
    <div style={{ fontFamily: ASAP, minHeight: "297mm", display: "flex", flexDirection: "column", color: "#1a1a1a" }}>
      <div style={{ padding: "34px 46px 0", display: "flex", alignItems: "center", gap: 14 }}>
        <span style={{ width: 5, height: 50, background: c, borderRadius: 3, ...pca }} />
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: 31, fontWeight: 700, letterSpacing: "-0.02em" }}>{v.name}</h1>
          {v.jobTitle && <div style={{ fontSize: "11.5pt", color: c, fontWeight: 600 }}>{v.jobTitle}</div>}
        </div>
        <div style={{ fontSize: "10.2pt", color: "#6b7078" }}>{today}</div>
      </div>
      {v.contacts.length > 0 && (
        <div style={{ margin: "16px 46px 0", background: c, borderRadius: 5, padding: "11px 17px", ...pca }}>
          <AContact items={v.contacts} color="#ffffff" variant="plain" size={12.5} font={ASAP} fs={10.1} ink="#eaf3fa" gap="5px 15px" />
        </div>
      )}
      <div style={{ padding: "18px 46px 34px", flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ marginBottom: 14 }}><LTo v={v} font={ASAP} color={c} /></div>
        <AHead icon="mail" color={c} font={ASAP} variant="badge" size={11.5}>{v.subject || "Cover Letter"}</AHead>
        <div style={{ fontSize: "11.5pt", fontWeight: 700, marginBottom: 8 }}>{v.greeting}</div>
        <LBody v={v} font={ASAP} fs={10.8} lh={1.68} />
        <div style={{ marginTop: "auto", paddingTop: 26 }}><LSign v={v} font={ASAP} color={c} line={false} /></div>
      </div>
    </div>
  )
}

"use client"

import { useTranslations, useLocale } from "next-intl"
import LetterBody from "./LetterBody"
import type { TemplateProps } from "./types"
import { FF, formatDate } from "./_shared"

/** Fortis — Ejecutivo. Right-aligned contact, thick+thin black rules. */
export default function FortisTemplate({ content, candidate }: TemplateProps) {
  const t = useTranslations("cover_letter_editor")
  const locale = useLocale()
  const today = formatDate(locale)

  const rightLines = [candidate.email, candidate.phone, candidate.address, candidate.linkedin].filter(Boolean)

  return (
    <div style={{
      background: "#fff",
      fontFamily: FF.systemSans,
      fontSize: "10.5pt",
      lineHeight: 1.5,
      color: "#1e293b",
      minHeight: "297mm",
      padding: "48px 80px 48px",
      WebkitPrintColorAdjust: "exact",
      printColorAdjust: "exact",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <div>
          {candidate.name && (
            <div style={{ fontSize: 28, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.025em", marginBottom: 5 }}>
              {candidate.name}
            </div>
          )}
          {candidate.jobTitle && (
            <div style={{ fontSize: 10, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 500 }}>
              {candidate.jobTitle}
            </div>
          )}
        </div>
        <div style={{ textAlign: "right", fontSize: 9.5, color: "#64748B", lineHeight: 1.5, paddingTop: 4 }}>
          {rightLines.map((c, i) => <div key={i}>{c}</div>)}
        </div>
      </div>
      <div style={{ height: 3, background: "#0f172a" }} />
      <div style={{ height: 1, background: "#e2e8f0", marginBottom: 24, marginTop: 4 }} />

      <div style={{ fontSize: 10, color: "#94A3B8", marginBottom: 18, letterSpacing: "0.03em" }}>{today}</div>
      {(content.recipientName || content.company) && (
        <div style={{ fontSize: "10.5pt", marginBottom: 24, lineHeight: 1.5, color: "#475569" }}>
          {content.recipientName}{content.recipientName && content.company && <br />}{content.company}
        </div>
      )}
      <p style={{ fontSize: "10.5pt", marginBottom: 18, color: "#1e293b" }}>
        {content.recipientName
          ? t("salutation_named", { name: content.recipientName })
          : t("salutation_generic")}
      </p>
      {content.body ? (
        <LetterBody html={content.body} style={{ color: "#1e293b" }} />
      ) : (
        <p style={{ fontSize: "10.5pt", color: "#cccccc", fontStyle: "italic" }}>{t("body_placeholder_template")}</p>
      )}
      <div style={{ marginTop: 24 }}>
        {content.closing && <p style={{ fontSize: "10.5pt", marginBottom: 24 }}>{content.closing},</p>}
        {candidate.name && (
          <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.01em" }}>
            {candidate.name}
          </div>
        )}
      </div>
    </div>
  )
}

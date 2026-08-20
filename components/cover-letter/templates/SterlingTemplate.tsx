"use client"

import { useTranslations, useLocale } from "next-intl"
import LetterBody from "./LetterBody"
import type { TemplateProps } from "./types"
import { FF, formatDate } from "./_shared"

/** Sterling — Ejecutivo. Dark gradient header w/ radial glow + gold rule, centered. */
export default function SterlingTemplate({ content, candidate }: TemplateProps) {
  const t = useTranslations("cover_letter_editor")
  const locale = useLocale()
  const today = formatDate(locale)

  const contacts = [candidate.email, candidate.phone, candidate.address].filter(Boolean)

  return (
    <div style={{
      background: "#fff",
      fontFamily: FF.systemSans,
      fontSize: "10.5pt",
      lineHeight: 1.5,
      color: "#1a1a1a",
      minHeight: "297mm",
      WebkitPrintColorAdjust: "exact",
      printColorAdjust: "exact",
    }}>
      <div style={{
        background: "linear-gradient(135deg, #1E293B 0%, #0F172A 100%)",
        padding: "48px 80px",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse at 70% 50%, rgba(99,102,241,0.12) 0%, transparent 60%)",
          pointerEvents: "none",
        }} />
        {candidate.name && (
          <div style={{
            fontSize: 32,
            fontWeight: 300,
            color: "#F8FAFC",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            marginBottom: 8,
            position: "relative",
          }}>{candidate.name}</div>
        )}
        {candidate.jobTitle && (
          <div style={{
            fontSize: 9.5,
            color: "#94A3B8",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            position: "relative",
          }}>{candidate.jobTitle}</div>
        )}
      </div>
      <div style={{ height: 2, background: "linear-gradient(90deg, transparent 0%, #C9A84C 30%, #e8d090 50%, #C9A84C 70%, transparent 100%)" }} />
      <div style={{
        background: "#F8FAFC",
        borderBottom: "1px solid #E2E8F0",
        padding: "12px 80px",
        display: "flex",
        justifyContent: "center",
        gap: 40,
        flexWrap: "wrap",
      }}>
        {contacts.map((c, i) => (
          <div key={i} style={{ fontSize: 9.5, color: "#64748B", letterSpacing: "0.03em", display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 3, height: 3, borderRadius: "50%", background: "#C9A84C", flexShrink: 0 }} />
            {c}
          </div>
        ))}
      </div>

      <div style={{ padding: "48px 80px 48px" }}>
        <div style={{ fontSize: 10, color: "#94A3B8", marginBottom: 18, letterSpacing: "0.04em" }}>{today}</div>
        {(content.recipientName || content.company) && (
          <div style={{ fontSize: "10.5pt", marginBottom: 24, lineHeight: 1.5, color: "#475569" }}>
            {content.recipientName}{content.recipientName && content.company && <br />}{content.company}
          </div>
        )}
        <p style={{ fontSize: "10.5pt", marginBottom: 20 }}>
          {content.recipientName
            ? t("salutation_named", { name: content.recipientName })
            : t("salutation_generic")}
        </p>
        {content.body ? (
          <LetterBody html={content.body} />
        ) : (
          <p style={{ fontSize: "10.5pt", color: "#cccccc", fontStyle: "italic" }}>{t("body_placeholder_template")}</p>
        )}
        <div style={{ marginTop: 24 }}>
          {content.closing && <p style={{ fontSize: "10.5pt", marginBottom: 20 }}>{content.closing},</p>}
          {candidate.name && (
            <div style={{ marginTop: 24, fontSize: 14, fontWeight: 600, color: "#0F172A", letterSpacing: "0.06em", textTransform: "uppercase" }}>
              {candidate.name}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

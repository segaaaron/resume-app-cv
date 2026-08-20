"use client"

import { useTranslations, useLocale } from "next-intl"
import LetterBody from "./LetterBody"
import type { TemplateProps } from "./types"
import { FF, formatDate } from "./_shared"

/** Prism — Creativo. Coral #FF6B6B clip-path polygon header + pink contact strip. */
export default function PrismTemplate({ content, candidate }: TemplateProps) {
  const t = useTranslations("cover_letter_editor")
  const locale = useLocale()
  const today = formatDate(locale)

  const contacts = [candidate.email, candidate.phone, candidate.address, candidate.linkedin].filter(Boolean)

  return (
    <div style={{
      background: "#fff",
      fontFamily: FF.systemSans,
      fontSize: "10.5pt",
      lineHeight: 1.5,
      color: "#1a1a1a",
      minHeight: "297mm",
      display: "flex",
      flexDirection: "column",
      WebkitPrintColorAdjust: "exact",
      printColorAdjust: "exact",
    }}>
      <div style={{ position: "relative", height: 200, flexShrink: 0, overflow: "hidden" }}>
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "60%",
          height: "100%",
          background: "#FF6B6B",
          clipPath: "polygon(0 0, 100% 0, 85% 100%, 0 100%)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "40px 52px",
        }}>
          {candidate.name && (
            <div style={{ fontSize: 32, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", lineHeight: 1.1, marginBottom: 6 }}>
              {candidate.name}
            </div>
          )}
          {candidate.jobTitle && (
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.75)", textTransform: "uppercase", letterSpacing: "0.14em", fontWeight: 500 }}>
              {candidate.jobTitle}
            </div>
          )}
        </div>
        <div style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: "50%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-end",
          padding: "40px 48px",
          gap: 6,
        }}>
          <div style={{ fontSize: 9, color: "#FF6B6B", letterSpacing: "0.03em", textAlign: "right" }}>{today}</div>
          {content.company && <div style={{ fontSize: 9, color: "#FF6B6B", letterSpacing: "0.03em", textAlign: "right" }}>{content.company}</div>}
        </div>
      </div>
      <div style={{
        background: "#fff5f5",
        borderTop: "2px solid #FF6B6B",
        borderBottom: "1px solid #ffd5d5",
        padding: "10px 48px",
        display: "flex",
        gap: 24,
        flexWrap: "wrap",
        flexShrink: 0,
      }}>
        {contacts.map((c, i) => (
          <span key={i} style={{ fontSize: 9, color: "#cc3333", letterSpacing: "0.02em" }}>{c}</span>
        ))}
      </div>
      <div style={{ padding: "44px 48px 48px", flex: 1 }}>
        {(content.recipientName || content.company) && (
          <div style={{ fontSize: "10.5pt", marginBottom: 24, lineHeight: 1.5, color: "#555" }}>
            {content.recipientName}{content.recipientName && content.company && <br />}{content.company}
          </div>
        )}
        <p style={{ fontSize: "10.5pt", marginBottom: 18 }}>
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
            <div style={{ marginTop: 20, fontSize: 14, fontWeight: 800, color: "#FF6B6B", letterSpacing: "-0.01em" }}>
              {candidate.name}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

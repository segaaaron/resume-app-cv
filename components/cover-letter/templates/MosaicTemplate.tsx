"use client"

import { useTranslations, useLocale } from "next-intl"
import LetterBody from "./LetterBody"
import type { TemplateProps } from "./types"
import { FF, formatDate } from "./_shared"

/** Mosaic — Creativo. Polka-dot purple bg + accent-quote first paragraph. */
export default function MosaicTemplate({ content, candidate }: TemplateProps) {
  const t = useTranslations("cover_letter_editor")
  const locale = useLocale()
  const today = formatDate(locale)

  const contacts = [candidate.email, candidate.phone, candidate.address].filter(Boolean)

  return (
    <div style={{
      background: "#FAF5FF",
      fontFamily: FF.systemSans,
      fontSize: "10.5pt",
      lineHeight: 1.5,
      color: "#1e1b4b",
      minHeight: "297mm",
      WebkitPrintColorAdjust: "exact",
      printColorAdjust: "exact",
    }}>
      <div style={{
        padding: "28px 72px 28px",
        backgroundImage: "radial-gradient(circle, rgba(124,58,237,0.13) 1px, transparent 1px)",
        backgroundSize: "18px 18px",
        backgroundColor: "#FAF5FF",
        borderBottom: "2px solid #7C3AED",
        position: "relative",
      }}>
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontSize: 9,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.14em",
          color: "#7C3AED",
          background: "#EDE9FE",
          padding: "5px 12px",
          borderRadius: 4,
          marginBottom: 16,
          border: "1px solid #C4B5FD",
        }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#7C3AED" }} />
          Cover Letter
        </div>
        {candidate.name && (
          <div style={{ fontSize: 32, fontWeight: 800, color: "#1E1B4B", letterSpacing: "-0.025em", marginBottom: 5, lineHeight: 1.1 }}>
            {candidate.name}
          </div>
        )}
        {candidate.jobTitle && (
          <div style={{ fontSize: 11, color: "#7C3AED", fontWeight: 600, marginBottom: 16, letterSpacing: "0.02em" }}>
            {candidate.jobTitle}
          </div>
        )}
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          {contacts.map((c, i) => (
            <div key={i} style={{ fontSize: 9.5, color: "#6D28D9", display: "flex", alignItems: "center", gap: 5 }}>{c}</div>
          ))}
        </div>
      </div>
      <div style={{ padding: "28px 72px 28px", background: "#fff" }}>
        <div style={{ fontSize: 10, color: "#94A3B8", marginBottom: 16 }}>{today}</div>
        {(content.recipientName || content.company) && (
          <div style={{ fontSize: "10.5pt", marginBottom: 16, lineHeight: 1.5, color: "#4C1D95" }}>
            {content.recipientName}{content.recipientName && content.company && <br />}{content.company}
          </div>
        )}
        <p style={{ fontSize: "10.5pt", marginBottom: 16, color: "#1E1B4B" }}>
          {content.recipientName
            ? t("salutation_named", { name: content.recipientName })
            : t("salutation_generic")}
        </p>
        {content.body ? (
          <LetterBody html={content.body} style={{
              color: "#1E1B4B",
              borderLeft: "3px solid #7C3AED",
              paddingLeft: 16,
              paddingTop: 4,
              paddingBottom: 4,
              background: "rgba(124,58,237,0.03)",
              marginBottom: 16 }} />
        ) : (
          <p style={{ fontSize: "10.5pt", color: "#cccccc", fontStyle: "italic" }}>{t("body_placeholder_template")}</p>
        )}
        <div style={{ marginTop: 16 }}>
          {content.closing && <p style={{ fontSize: "10.5pt", marginBottom: 16 }}>{content.closing},</p>}
          {candidate.name && (
            <div style={{ marginTop: 16, fontSize: 14, fontWeight: 800, color: "#7C3AED" }}>
              {candidate.name}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

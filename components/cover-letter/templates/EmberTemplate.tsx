"use client"

import { useTranslations, useLocale } from "next-intl"
import LetterBody from "./LetterBody"
import type { TemplateProps } from "./types"
import { FF, formatDate, initials } from "./_shared"

/** Ember — Creativo. Orange→red gradient header + initials avatar. */
export default function EmberTemplate({ content, candidate }: TemplateProps) {
  const t = useTranslations("cover_letter_editor")
  const locale = useLocale()
  const today = formatDate(locale)
  const mono = initials(candidate.name) || "AC"

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
        background: "linear-gradient(135deg, #F97316 0%, #EA580C 60%, #DC2626 100%)",
        padding: "44px 72px",
        display: "flex",
        alignItems: "center",
        gap: 28,
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{
          position: "absolute",
          right: -40,
          top: -40,
          width: 200,
          height: 200,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.06)",
        }} />
        <div style={{
          width: 84,
          height: 84,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.15)",
          border: "2.5px solid rgba(255,255,255,0.6)",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 28,
          fontWeight: 700,
          color: "#fff",
          fontFamily: FF.elegantSerif,
          letterSpacing: "0.04em",
          position: "relative",
        }}>{mono}</div>
        <div style={{ position: "relative" }}>
          {candidate.name && (
            <div style={{ fontSize: 26, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", marginBottom: 5, lineHeight: 1.1 }}>
              {candidate.name}
            </div>
          )}
          {candidate.jobTitle && (
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.72)", textTransform: "uppercase", letterSpacing: "0.15em" }}>
              {candidate.jobTitle}
            </div>
          )}
        </div>
      </div>

      <div style={{
        background: "#FFF7ED",
        borderBottom: "1px solid #FED7AA",
        padding: "10px 72px",
        display: "flex",
        gap: 28,
        alignItems: "center",
        flexWrap: "wrap",
      }}>
        {contacts.map((c, i) => (
          <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 28 }}>
            {i > 0 && <span style={{ color: "#FED7AA", fontSize: 14 }}>·</span>}
            <span style={{ fontSize: 9.5, color: "#C2410C", letterSpacing: "0.02em" }}>{c}</span>
          </span>
        ))}
      </div>

      <div style={{ padding: "44px 72px 48px" }}>
        <div style={{ fontSize: 10, color: "#94A3B8", marginBottom: 18 }}>{today}</div>
        {(content.recipientName || content.company) && (
          <div style={{ fontSize: "10.5pt", marginBottom: 24, lineHeight: 1.5, color: "#475569" }}>
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
            <div style={{ marginTop: 20, fontSize: 14, fontWeight: 800, color: "#EA580C", letterSpacing: "-0.01em" }}>
              {candidate.name}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

"use client"

import { useTranslations, useLocale } from "next-intl"
import LetterBody from "./LetterBody"
import type { TemplateProps } from "./types"
import { FF, formatDate } from "./_shared"

/** Velvet — Lujo. Burgundy ribbons top/bottom. */
export default function VelvetTemplate({ content, candidate }: TemplateProps) {
  const t = useTranslations("cover_letter_editor")
  const locale = useLocale()
  const today = formatDate(locale)

  const contacts = [candidate.email, candidate.phone, candidate.address].filter(Boolean)

  return (
    <div style={{
      background: "#F9F4EF",
      fontFamily: FF.elegantSerif,
      fontSize: "10.5pt",
      lineHeight: 1.5,
      color: "#2c1810",
      minHeight: "297mm",
      display: "flex",
      flexDirection: "column",
      WebkitPrintColorAdjust: "exact",
      printColorAdjust: "exact",
    }}>
      <div style={{
        height: 8,
        background: "linear-gradient(90deg, #7C2D3E, #9B3A50, #C05068, #9B3A50, #7C2D3E)",
        position: "relative",
      }}>
        <div style={{ height: 2, background: "rgba(255,255,255,0.25)", marginTop: 2 }} />
      </div>
      <div style={{ padding: "44px 80px 36px", background: "#F9F4EF", borderBottom: "1px solid #D9C4B8" }}>
        {candidate.name && (
          <div style={{ fontSize: 28, fontWeight: 400, letterSpacing: "0.05em", color: "#1a0a08", marginBottom: 7, fontFamily: FF.elegantSerif }}>
            {candidate.name}
          </div>
        )}
        {candidate.jobTitle && (
          <div style={{
            fontSize: 9.5,
            color: "#7C2D3E",
            textTransform: "uppercase",
            letterSpacing: "0.18em",
            fontFamily: FF.systemSans,
            marginBottom: 22,
            fontWeight: 500,
          }}>{candidate.jobTitle}</div>
        )}
        {contacts.length > 0 && (
          <div style={{ display: "flex", gap: 22, fontSize: 9.5, color: "#8a6858", fontFamily: FF.systemSans, flexWrap: "wrap" }}>
            {contacts.map((c, i) => (
              <span key={i} style={{ display: "inline-flex", gap: 22 }}>
                {i > 0 && <span style={{ color: "#C4A090" }}>·</span>}
                <span>{c}</span>
              </span>
            ))}
          </div>
        )}
      </div>
      <div style={{ padding: "44px 80px 0", flex: 1 }}>
        <div style={{ fontSize: 10, color: "#B0907A", fontFamily: FF.systemSans, marginBottom: 16, letterSpacing: "0.04em" }}>{today}</div>
        {(content.recipientName || content.company) && (
          <div style={{ fontSize: "10.5pt", marginBottom: 24, lineHeight: 1.5, color: "#5a3828" }}>
            {content.recipientName}{content.recipientName && content.company && <br />}{content.company}
          </div>
        )}
        <p style={{ fontSize: "10.5pt", marginBottom: 22 }}>
          {content.recipientName
            ? t("salutation_named", { name: content.recipientName })
            : t("salutation_generic")}
        </p>
        {content.body ? (
          <LetterBody html={content.body} />
        ) : (
          <p style={{ fontSize: "10.5pt", color: "#cccccc", fontStyle: "italic" }}>{t("body_placeholder_template")}</p>
        )}
        {content.closing && (
          <div style={{ marginTop: 24, fontStyle: "italic", color: "#7C2D3E", fontSize: 11 }}>
            {content.closing},
          </div>
        )}
        {candidate.name && (
          <div style={{ fontStyle: "normal", fontWeight: 700, fontSize: 14, marginTop: 12, color: "#1a0a08", letterSpacing: "0.04em" }}>
            {candidate.name}
          </div>
        )}
      </div>
      <div style={{
        height: 8,
        background: "linear-gradient(90deg, #7C2D3E, #9B3A50, #C05068, #9B3A50, #7C2D3E)",
        marginTop: 24,
        position: "relative",
      }}>
        <div style={{ height: 2, background: "rgba(255,255,255,0.25)", marginBottom: 2 }} />
      </div>
    </div>
  )
}

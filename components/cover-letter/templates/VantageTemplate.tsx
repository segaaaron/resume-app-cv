"use client"

import { useTranslations, useLocale } from "next-intl"
import LetterBody from "./LetterBody"
import type { TemplateProps } from "./types"
import { FF, formatDate, firstInitial } from "./_shared"

/** Vantage — Creativo. Cyan sidebar #0E7490 w/ giant ghost letter. */
export default function VantageTemplate({ content, candidate }: TemplateProps) {
  const t = useTranslations("cover_letter_editor")
  const locale = useLocale()
  const today = formatDate(locale)
  const ghost = firstInitial(candidate.name) || "A"

  return (
    <div style={{
      background: "#fff",
      fontFamily: FF.systemSans,
      fontSize: "10.5pt",
      lineHeight: 1.5,
      color: "#1a1a1a",
      minHeight: "297mm",
      display: "flex",
      WebkitPrintColorAdjust: "exact",
      printColorAdjust: "exact",
    }}>
      <div style={{
        width: 220,
        flexShrink: 0,
        background: "#0E7490",
        display: "flex",
        flexDirection: "column",
        padding: "48px 24px",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{
          fontSize: 180,
          fontWeight: 900,
          color: "rgba(255,255,255,0.07)",
          position: "absolute",
          top: -10,
          left: -18,
          lineHeight: 1,
          fontFamily: FF.elegantSerif,
          pointerEvents: "none",
          userSelect: "none",
        }}>{ghost}</div>
        {candidate.name && (
          <div style={{ fontSize: 14, fontWeight: 700, color: "#F0FDFA", letterSpacing: "0.02em", position: "relative", zIndex: 1, marginTop: 24, lineHeight: 1.35 }}>
            {candidate.name}
          </div>
        )}
        {candidate.jobTitle && (
          <div style={{ fontSize: 8.5, color: "#67E8F9", textTransform: "uppercase", letterSpacing: "0.14em", position: "relative", zIndex: 1, marginTop: 8, lineHeight: 1.5 }}>
            {candidate.jobTitle}
          </div>
        )}
        <div style={{ height: 1, background: "rgba(255,255,255,0.15)", margin: "20px 0", position: "relative", zIndex: 1 }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          {[
            ["Email", candidate.email],
            ["Phone", candidate.phone],
            ["Location", candidate.address],
            ["LinkedIn", candidate.linkedin],
          ].filter(([, v]) => Boolean(v)).map(([label, value], i) => (
            <div key={i}>
              <div style={{ fontSize: 7.5, color: "rgba(103,232,249,0.7)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 2 }}>{label}</div>
              <div style={{ fontSize: 8.5, color: "#A5F3FC", marginBottom: 12, wordBreak: "break-all", lineHeight: 1.4 }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, padding: "48px 44px 48px 48px" }}>
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
            <div style={{ marginTop: 20, fontSize: 14, fontWeight: 700, color: "#0E7490", letterSpacing: "-0.01em" }}>
              {candidate.name}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

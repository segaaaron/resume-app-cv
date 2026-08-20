"use client"

import { useTranslations, useLocale } from "next-intl"
import LetterBody from "./LetterBody"
import type { TemplateProps } from "./types"
import { FF, formatDate } from "./_shared"

/** Consul — Ejecutivo. 280px dark sidebar + cyan→blue→purple accent bar. */
export default function ConsulTemplate({ content, candidate }: TemplateProps) {
  const t = useTranslations("cover_letter_editor")
  const locale = useLocale()
  const today = formatDate(locale)

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
      {/* Sidebar */}
      <div style={{
        width: 280,
        flexShrink: 0,
        background: "#0F172A",
        color: "#fff",
        padding: "48px 28px 48px 32px",
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}>
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 4,
          height: "100%",
          background: "linear-gradient(180deg, #06B6D4, #3B82F6, #8B5CF6)",
        }} />
        {candidate.name && (
          <div style={{ fontSize: 14, fontWeight: 700, color: "#F1F5F9", letterSpacing: "-0.01em", marginBottom: 4, lineHeight: 1.25 }}>
            {candidate.name}
          </div>
        )}
        {candidate.jobTitle && (
          <div style={{ fontSize: 9, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 24 }}>
            {candidate.jobTitle}
          </div>
        )}
        <div style={{ height: 1, background: "#1E293B", marginBottom: 24 }} />
        <div style={{ fontSize: 8.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: "#334155", marginBottom: 14 }}>
          Contact
        </div>
        {[candidate.email, candidate.phone, candidate.address, candidate.linkedin].filter(Boolean).map((c, i) => (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 10 }}>
            <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#06B6D4", flexShrink: 0, marginTop: 4 }} />
            <div style={{ fontSize: 9, color: "#94A3B8", lineHeight: 1.5, wordBreak: "break-all" }}>{c}</div>
          </div>
        ))}
        <div style={{ height: 1, background: "#1E293B", marginTop: 20 }} />
        <div style={{ fontSize: 8.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: "#334155", marginBottom: 14, marginTop: 24 }}>
          Date
        </div>
        <div style={{ fontSize: 9, color: "#94A3B8", marginBottom: 4 }}>{today}</div>
        {content.company && (
          <>
            <div style={{ height: 1, background: "#1E293B", marginTop: 20 }} />
            <div style={{ fontSize: 8.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: "#334155", marginBottom: 14, marginTop: 24 }}>
              Applying to
            </div>
            <div style={{ fontSize: 9, color: "#94A3B8", marginBottom: 4 }}>{content.company}</div>
          </>
        )}
      </div>

      {/* Main */}
      <div style={{ flex: 1, padding: "48px 44px 48px 48px" }}>
        {(content.recipientName || content.company) && (
          <div style={{ fontSize: "10.5pt", marginBottom: 24, lineHeight: 1.5, color: "#475569" }}>
            {content.recipientName}{content.recipientName && content.company && <br />}{content.company}
          </div>
        )}
        <p style={{ fontSize: "10.5pt", marginBottom: 18, color: "#1E293B" }}>
          {content.recipientName
            ? t("salutation_named", { name: content.recipientName })
            : t("salutation_generic")}
        </p>
        {content.body ? (
          <LetterBody html={content.body} style={{ color: "#1E293B" }} />
        ) : (
          <p style={{ fontSize: "10.5pt", color: "#cccccc", fontStyle: "italic" }}>{t("body_placeholder_template")}</p>
        )}
        <div style={{ marginTop: 24 }}>
          {content.closing && <p style={{ fontSize: "10.5pt", color: "#1E293B" }}>{content.closing},</p>}
          {candidate.name && (
            <div style={{ marginTop: 20, fontSize: 14, fontWeight: 700, color: "#0F172A", letterSpacing: "-0.01em" }}>
              {candidate.name}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

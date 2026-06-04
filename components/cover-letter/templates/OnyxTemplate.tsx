"use client"

import { useTranslations, useLocale } from "next-intl"
import DOMPurify from "isomorphic-dompurify"
import type { TemplateProps } from "./types"
import { FF, formatDate } from "./_shared"

/** Onyx — Lujo. Dark + gold rule. Softened bg #0a0a0a → #1a1a1a per user spec. */
export default function OnyxTemplate({ content, candidate }: TemplateProps) {
  const t = useTranslations("cover_letter_editor")
  const locale = useLocale()
  const today = formatDate(locale)

  const contacts = [candidate.email, candidate.phone, candidate.address].filter(Boolean)

  return (
    <div style={{
      background: "#1a1a1a",
      fontFamily: FF.systemSans,
      fontSize: "10.5pt",
      lineHeight: 1.85,
      color: "#fff",
      minHeight: "297mm",
      padding: "80px 88px",
      position: "relative",
      WebkitPrintColorAdjust: "exact",
      printColorAdjust: "exact",
    }}>
      {candidate.name && (
        <div style={{
          fontSize: 40,
          fontWeight: 200,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "#fff",
          marginBottom: 6,
          lineHeight: 0.95,
        }}>{candidate.name}</div>
      )}
      {candidate.jobTitle && (
        <div style={{
          fontSize: 9.5,
          color: "#777",
          textTransform: "uppercase",
          letterSpacing: "0.22em",
          marginBottom: 20,
          fontWeight: 300,
        }}>{candidate.jobTitle}</div>
      )}
      <div style={{ height: 1, background: "#C9A84C", marginBottom: 20 }} />
      <div style={{ fontSize: 9, color: "#888", lineHeight: 2, marginBottom: 52, display: "flex", flexDirection: "column" }}>
        {contacts.map((c, i) => <span key={i}>{c}</span>)}
      </div>
      <div style={{ fontSize: 10, color: "#888", marginBottom: 16, letterSpacing: "0.06em", textTransform: "uppercase" }}>
        {today}
      </div>
      {(content.recipientName || content.company) && (
        <div style={{ fontSize: "10.5pt", marginBottom: 30, lineHeight: 1.65, color: "#aaa" }}>
          {content.recipientName}{content.recipientName && content.company && <br />}{content.company}
        </div>
      )}
      <p style={{ fontSize: "10.5pt", marginBottom: 20, color: "#DDD" }}>
        {content.recipientName
          ? t("salutation_named", { name: content.recipientName })
          : t("salutation_generic")}
      </p>
      {content.body ? (
        <div
          style={{ fontSize: "10.5pt", lineHeight: 1.9, color: "#DDD" }}
          className="[&>p]:mb-[20px] [&>ul]:mb-[20px] [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:mb-[20px] [&>ol]:list-decimal [&>ol]:pl-5"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content.body) }}
        />
      ) : (
        <p style={{ fontSize: "10.5pt", color: "#666", fontStyle: "italic" }}>{t("body_placeholder_template")}</p>
      )}
      {content.closing && (
        <div style={{ marginTop: 56, color: "#888" }}>{content.closing},</div>
      )}
      {candidate.name && (
        <div style={{ marginTop: 24, fontSize: 18, fontWeight: 700, color: "#fff", letterSpacing: "0.06em", textTransform: "uppercase" }}>
          {candidate.name}
        </div>
      )}
    </div>
  )
}

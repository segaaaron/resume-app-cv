"use client"

import { useTranslations, useLocale } from "next-intl"
import DOMPurify from "isomorphic-dompurify"
import type { TemplateProps } from "./types"
import { FF, formatDate } from "./_shared"

/** Verso — Editorial. Cream + italic Georgia + ✦ ornaments. */
export default function VersoTemplate({ content, candidate }: TemplateProps) {
  const t = useTranslations("cover_letter_editor")
  const locale = useLocale()
  const today = formatDate(locale)

  const contacts = [candidate.email, candidate.phone, candidate.address].filter(Boolean)

  return (
    <div style={{
      background: "#FDFAF5",
      fontFamily: FF.elegantSerif,
      fontSize: "10.5pt",
      lineHeight: 2.05,
      color: "#2c2c2c",
      minHeight: "297mm",
      padding: "96px 128px",
      WebkitPrintColorAdjust: "exact",
      printColorAdjust: "exact",
    }}>
      <div style={{ textAlign: "center", fontSize: 22, color: "#c8b8a0", marginBottom: 44, letterSpacing: "0.4em" }}>
        — ✦ —
      </div>
      {candidate.name && (
        <div style={{
          fontSize: 24,
          fontStyle: "italic",
          fontWeight: 400,
          textAlign: "center",
          letterSpacing: "0.06em",
          marginBottom: 5,
          color: "#1a1a1a",
        }}>{candidate.name}</div>
      )}
      {candidate.jobTitle && (
        <div style={{
          fontSize: 10,
          textAlign: "center",
          color: "#a08878",
          fontStyle: "italic",
          letterSpacing: "0.1em",
          marginBottom: 10,
        }}>{candidate.jobTitle}</div>
      )}
      {contacts.length > 0 && (
        <div style={{
          textAlign: "center",
          fontSize: 9,
          color: "#b8a898",
          letterSpacing: "0.06em",
          marginBottom: 56,
          fontStyle: "italic",
        }}>{contacts.join("  ·  ")}</div>
      )}

      <p style={{ fontSize: "10.5pt", lineHeight: 2.1, marginBottom: 26, textAlign: "left" }}>
        {content.recipientName
          ? t("salutation_named", { name: content.recipientName })
          : t("salutation_generic")}
      </p>
      {content.body ? (
        <div
          style={{ fontSize: "10.5pt", lineHeight: 2.1, fontStyle: "italic", color: "#333" }}
          className="[&>p]:mb-[26px] [&>p]:text-justify [&>ul]:mb-[26px] [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:mb-[26px] [&>ol]:list-decimal [&>ol]:pl-5 prose max-w-none"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content.body) }}
        />
      ) : (
        <p style={{ fontSize: "10.5pt", color: "#cccccc", fontStyle: "italic" }}>{t("body_placeholder_template")}</p>
      )}

      <div style={{ fontSize: 10, marginTop: 60, textAlign: "right", fontStyle: "italic", color: "#7a6858" }}>
        {today}
      </div>
      {content.closing && (
        <div style={{ marginTop: 4, textAlign: "right", fontStyle: "italic", color: "#7a6858", fontSize: "10.5pt" }}>
          {content.closing},
        </div>
      )}
      {candidate.name && (
        <div style={{ fontStyle: "normal", fontSize: 13, fontWeight: 600, textAlign: "right", marginTop: 10, color: "#1a1a1a", letterSpacing: "0.05em" }}>
          {candidate.name}
        </div>
      )}
      <div style={{ textAlign: "center", fontSize: 13, color: "#c8b8a0", marginTop: 56, letterSpacing: "0.3em" }}>
        · · ·
      </div>
    </div>
  )
}

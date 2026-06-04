"use client"

import { useTranslations, useLocale } from "next-intl"
import DOMPurify from "isomorphic-dompurify"
import type { TemplateProps } from "./types"
import { FF, formatDate, firstInitial } from "./_shared"

/** Aurum — Lujo. Cream + gold initial + gold gradient rules. */
export default function AurumTemplate({ content, candidate }: TemplateProps) {
  const t = useTranslations("cover_letter_editor")
  const locale = useLocale()
  const today = formatDate(locale)
  const initial = firstInitial(candidate.name) || "A"

  const contacts = [candidate.email, candidate.phone, candidate.address].filter(Boolean)

  return (
    <div style={{
      background: "#FAF7F0",
      fontFamily: FF.elegantSerif,
      fontSize: "10.5pt",
      lineHeight: 1.95,
      color: "#2a2218",
      minHeight: "297mm",
      padding: "72px 88px",
      WebkitPrintColorAdjust: "exact",
      printColorAdjust: "exact",
    }}>
      <div style={{ height: 1, background: "linear-gradient(90deg, transparent 0%, #C9A84C 20%, #e8d090 50%, #C9A84C 80%, transparent 100%)", marginBottom: 44 }} />
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 6 }}>
        <div style={{
          fontSize: 52,
          fontWeight: 700,
          color: "#C9A84C",
          lineHeight: 0.9,
          flexShrink: 0,
          marginTop: 2,
          fontFamily: FF.elegantSerif,
        }}>{initial}</div>
        <div>
          {candidate.name && (
            <div style={{ fontSize: 30, fontWeight: 400, letterSpacing: "0.06em", color: "#1a140a", lineHeight: 1.1 }}>
              {candidate.name}
            </div>
          )}
          {candidate.jobTitle && (
            <div style={{ fontSize: 9.5, color: "#C9A84C", textTransform: "uppercase", letterSpacing: "0.18em", marginTop: 6, fontFamily: FF.systemSans }}>
              {candidate.jobTitle}
            </div>
          )}
        </div>
      </div>
      {contacts.length > 0 && (
        <div style={{ fontSize: 9.5, color: "#8a7455", marginBottom: 36, display: "flex", gap: 24, paddingTop: 6, fontFamily: FF.systemSans, flexWrap: "wrap" }}>
          {contacts.map((c, i) => <span key={i}>{c}</span>)}
        </div>
      )}
      <div style={{ height: 1, background: "linear-gradient(90deg, #C9A84C 0%, #e8d090 40%, transparent 80%)", marginBottom: 40 }} />
      <div style={{ fontSize: 10, color: "#B8986A", fontFamily: FF.systemSans, marginBottom: 16, letterSpacing: "0.04em" }}>{today}</div>
      {(content.recipientName || content.company) && (
        <div style={{ fontSize: "10.5pt", marginBottom: 30, lineHeight: 1.75, color: "#5a4830" }}>
          {content.recipientName}{content.recipientName && content.company && <br />}{content.company}
        </div>
      )}
      <p style={{ fontSize: "10.5pt", marginBottom: 22 }}>
        {content.recipientName
          ? t("salutation_named", { name: content.recipientName })
          : t("salutation_generic")}
      </p>
      {content.body ? (
        <div
          style={{ fontSize: "10.5pt", lineHeight: 2 }}
          className="[&>p]:mb-[22px] [&>ul]:mb-[22px] [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:mb-[22px] [&>ol]:list-decimal [&>ol]:pl-5 prose max-w-none"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content.body) }}
        />
      ) : (
        <p style={{ fontSize: "10.5pt", color: "#cccccc", fontStyle: "italic" }}>{t("body_placeholder_template")}</p>
      )}
      {content.closing && (
        <div style={{ marginTop: 56, fontStyle: "italic", color: "#6a5840" }}>{content.closing},</div>
      )}
      {candidate.name && (
        <div style={{ fontStyle: "normal", fontWeight: 700, fontSize: 14, marginTop: 12, letterSpacing: "0.05em", color: "#1a140a" }}>
          {candidate.name}
        </div>
      )}
      <div style={{ height: 1, background: "linear-gradient(90deg, transparent 0%, #C9A84C 20%, #e8d090 50%, #C9A84C 80%, transparent 100%)", marginTop: 56 }} />
    </div>
  )
}

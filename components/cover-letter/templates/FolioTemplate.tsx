"use client"

import { useTranslations, useLocale } from "next-intl"
import DOMPurify from "isomorphic-dompurify"
import type { TemplateProps } from "./types"
import { FF, formatDate } from "./_shared"

/** Folio — Editorial. Masthead + drop-cap first paragraph. */
export default function FolioTemplate({ content, candidate }: TemplateProps) {
  const t = useTranslations("cover_letter_editor")
  const locale = useLocale()
  const today = formatDate(locale)

  const contacts = [candidate.email, candidate.phone, candidate.address].filter(Boolean)

  return (
    <div style={{
      background: "#FFFDF8",
      fontFamily: FF.elegantSerif,
      fontSize: "10.5pt",
      lineHeight: 1.95,
      color: "#2a2a2a",
      minHeight: "297mm",
      padding: "68px 84px",
      WebkitPrintColorAdjust: "exact",
      printColorAdjust: "exact",
    }}>
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <div style={{ height: 2, background: "#2a2a2a", marginBottom: 18 }} />
        {candidate.name && (
          <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 5, color: "#111" }}>
            {candidate.name}
          </div>
        )}
        {candidate.jobTitle && (
          <div style={{ fontSize: 11, fontStyle: "italic", color: "#666", marginBottom: 10, letterSpacing: "0.02em" }}>
            {candidate.jobTitle}
          </div>
        )}
        {contacts.length > 0 && (
          <div style={{ fontSize: 9, color: "#999", letterSpacing: "0.08em", marginBottom: 6 }}>
            {contacts.join("  ·  ")}
          </div>
        )}
        <div style={{ height: 1, background: "#2a2a2a", marginTop: 16 }} />
      </div>

      <div style={{ marginTop: 44 }}>
        <div style={{ fontSize: 10, color: "#aaa", marginBottom: 16, fontStyle: "italic" }}>{today}</div>
        {(content.recipientName || content.company) && (
          <div style={{ fontSize: "10.5pt", marginBottom: 28, lineHeight: 1.65, color: "#444" }}>
            {content.recipientName}{content.recipientName && content.company && <br />}{content.company}
          </div>
        )}
        <p style={{ fontSize: "10.5pt", marginBottom: 22, textAlign: "justify" }}>
          {content.recipientName
            ? t("salutation_named", { name: content.recipientName })
            : t("salutation_generic")}
        </p>
        {content.body ? (
          <div
            style={{ fontSize: "10.5pt", lineHeight: 2 }}
            className="[&>p]:mb-[22px] [&>p]:text-justify [&>p:first-of-type:first-letter]:text-[52px] [&>p:first-of-type:first-letter]:font-bold [&>p:first-of-type:first-letter]:float-left [&>p:first-of-type:first-letter]:leading-[0.82] [&>p:first-of-type:first-letter]:mr-[6px] [&>p:first-of-type:first-letter]:pt-[6px] [&>p:first-of-type:first-letter]:text-[#111] [&>ul]:mb-[22px] [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:mb-[22px] [&>ol]:list-decimal [&>ol]:pl-5 prose max-w-none"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content.body) }}
          />
        ) : (
          <p style={{ fontSize: "10.5pt", color: "#cccccc", fontStyle: "italic" }}>{t("body_placeholder_template")}</p>
        )}

        <div style={{ marginTop: 56, fontStyle: "italic", color: "#555" }}>
          {content.closing && <p style={{ fontSize: "10.5pt" }}>{content.closing},</p>}
          {candidate.name && (
            <div style={{ fontStyle: "normal", fontWeight: 700, marginTop: 10, fontSize: 13, letterSpacing: "0.04em", color: "#111" }}>
              {candidate.name}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

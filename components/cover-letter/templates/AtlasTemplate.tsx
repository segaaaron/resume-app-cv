"use client"

import { useTranslations, useLocale } from "next-intl"
import DOMPurify from "isomorphic-dompurify"
import type { TemplateProps } from "./types"
import { FF, formatDate } from "./_shared"

/** Atlas — Ejecutivo. Black header band + gold gradient rule. Serif body. */
export default function AtlasTemplate({ content, candidate }: TemplateProps) {
  const t = useTranslations("cover_letter_editor")
  const locale = useLocale()
  const today = formatDate(locale)

  const contacts = [candidate.email, candidate.phone, candidate.address, candidate.linkedin].filter(Boolean)

  return (
    <div style={{
      background: "#fff",
      fontFamily: FF.elegantSerif,
      fontSize: "10.5pt",
      lineHeight: 1.85,
      color: "#1a1a1a",
      minHeight: "297mm",
      WebkitPrintColorAdjust: "exact",
      printColorAdjust: "exact",
    }}>
      <div style={{ background: "#111", padding: "44px 80px" }}>
        {candidate.name && (
          <div style={{ fontSize: 44, fontWeight: 400, color: "#fff", letterSpacing: "0.01em", lineHeight: 1, marginBottom: 10 }}>
            {candidate.name}
          </div>
        )}
        {candidate.jobTitle && (
          <div style={{ fontSize: 11, color: "#aaa", letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: FF.systemSans }}>
            {candidate.jobTitle}
          </div>
        )}
      </div>
      <div style={{ height: 2, background: "linear-gradient(90deg, #C9A84C, #e8d090, #C9A84C)" }} />
      <div style={{
        background: "#f4f4f4",
        borderBottom: "1px solid #e0e0e0",
        padding: "10px 80px",
        display: "flex",
        gap: 32,
        flexWrap: "wrap",
      }}>
        {contacts.map((c, i) => (
          <span key={i} style={{ fontSize: 9.5, color: "#666", letterSpacing: "0.02em", fontFamily: FF.systemSans }}>{c}</span>
        ))}
      </div>
      <div style={{ padding: "48px 80px 72px" }}>
        <div style={{ fontSize: 10, color: "#aaa", marginBottom: 18, fontFamily: FF.systemSans, letterSpacing: "0.04em" }}>
          {today}
        </div>
        {(content.recipientName || content.company) && (
          <div style={{ fontSize: "10.5pt", marginBottom: 30, lineHeight: 1.7, color: "#444" }}>
            {content.recipientName}{content.recipientName && content.company && <br />}{content.company}
          </div>
        )}
        <p style={{ fontSize: "10.5pt", marginBottom: 20 }}>
          {content.recipientName
            ? t("salutation_named", { name: content.recipientName })
            : t("salutation_generic")}
        </p>
        {content.body ? (
          <div
            style={{ fontSize: "10.5pt", lineHeight: 1.9 }}
            className="[&>p]:mb-[20px] [&>ul]:mb-[20px] [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:mb-[20px] [&>ol]:list-decimal [&>ol]:pl-5 prose max-w-none"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content.body) }}
          />
        ) : (
          <p style={{ fontSize: "10.5pt", color: "#cccccc", fontStyle: "italic" }}>{t("body_placeholder_template")}</p>
        )}
        <div style={{ marginTop: 56 }}>
          {content.closing && <p style={{ fontSize: "10.5pt", marginBottom: 20 }}>{content.closing},</p>}
          {candidate.name && (
            <div style={{ marginTop: 32, fontSize: 20, fontWeight: 400, letterSpacing: "0.06em", color: "#111", fontFamily: FF.elegantSerif }}>
              {candidate.name}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

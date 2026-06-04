"use client"

import { useTranslations, useLocale } from "next-intl"
import DOMPurify from "isomorphic-dompurify"
import type { TemplateProps } from "./types"
import { FF, formatDate } from "./_shared"

/**
 * Echo — Minimalista. Source font: Helvetica Neue + Courier mono.
 * Falls back to system sans + system mono.
 */
export default function EchoTemplate({ content, candidate }: TemplateProps) {
  const t = useTranslations("cover_letter_editor")
  const locale = useLocale()
  const today = formatDate(locale)

  const contacts = [candidate.email, candidate.phone, candidate.address, candidate.linkedin].filter(Boolean)

  return (
    <div style={{
      background: "#fff",
      fontFamily: FF.systemSans,
      fontSize: "10pt",
      lineHeight: 1.9,
      color: "#111",
      minHeight: "297mm",
      padding: "88px 96px 88px 96px",
      position: "relative",
      WebkitPrintColorAdjust: "exact",
      printColorAdjust: "exact",
    }}>
      {candidate.name && (
        <div style={{
          fontSize: 80,
          fontWeight: 200,
          letterSpacing: "-0.02em",
          lineHeight: 0.9,
          marginBottom: 22,
          color: "#0a0a0a",
        }}>
          {candidate.name}
        </div>
      )}
      {candidate.jobTitle && (
        <div style={{
          fontSize: 10,
          color: "#bbb",
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          marginBottom: 32,
          fontWeight: 300,
        }}>
          {candidate.jobTitle}
        </div>
      )}
      <hr style={{ border: "none", borderTop: "1px solid #111", marginBottom: 28 }} />
      <div style={{
        fontSize: 9,
        color: "#aaa",
        display: "flex",
        gap: 28,
        flexWrap: "wrap",
        marginBottom: 64,
        letterSpacing: "0.05em",
        fontFamily: FF.systemMono,
      }}>
        {contacts.map((c, i) => <span key={i}>{c}</span>)}
      </div>

      <div style={{ fontSize: 9, color: "#ccc", letterSpacing: "0.08em", marginBottom: 10, fontFamily: FF.systemMono }}>
        {today}
      </div>
      {(content.recipientName || content.company) && (
        <div style={{ fontSize: 10, color: "#555", marginBottom: 28, lineHeight: 1.6, letterSpacing: "0.01em" }}>
          {[content.recipientName, content.company].filter(Boolean).join(" / ")}
        </div>
      )}

      <div style={{ fontSize: 10, color: "#1a1a1a", marginBottom: 20 }}>
        {content.recipientName
          ? t("salutation_named", { name: content.recipientName })
          : t("salutation_generic")}
      </div>

      {content.body ? (
        <div
          style={{ fontSize: 10, lineHeight: 1.95, color: "#1a1a1a", maxWidth: 520 }}
          className="[&>p]:mb-[20px] [&>ul]:mb-[20px] [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:mb-[20px] [&>ol]:list-decimal [&>ol]:pl-5 prose max-w-none"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content.body) }}
        />
      ) : (
        <p style={{ fontSize: 10, color: "#cccccc", fontStyle: "italic" }}>{t("body_placeholder_template")}</p>
      )}

      <div style={{ marginTop: 64 }}>
        {content.closing && (
          <div style={{ fontSize: 10, color: "#999", letterSpacing: "0.08em", marginBottom: 6 }}>
            {content.closing}
          </div>
        )}
        {candidate.name && (
          <div style={{ fontWeight: 300, fontSize: 18, letterSpacing: "0.06em", color: "#0a0a0a" }}>
            {candidate.name}
          </div>
        )}
      </div>
      <div style={{
        position: "absolute",
        bottom: 40,
        right: 96,
        fontSize: 9,
        color: "#ddd",
        letterSpacing: "0.1em",
        fontFamily: FF.systemMono,
      }}>
        01
      </div>
    </div>
  )
}

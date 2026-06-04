"use client"

import { useTranslations, useLocale } from "next-intl"
import DOMPurify from "isomorphic-dompurify"
import type { TemplateProps } from "./types"
import { FF, formatDate, initials } from "./_shared"

/**
 * Lumen — Minimalista. Source: Georgia serif w/ gold monogram (#C9A84C). Falls back to Playfair/Georgia.
 */
export default function LumenTemplate({ content, candidate }: TemplateProps) {
  const t = useTranslations("cover_letter_editor")
  const locale = useLocale()
  const today = formatDate(locale)
  const mono = initials(candidate.name) || "AC"

  const contacts = [candidate.email, candidate.phone, candidate.address].filter(Boolean)

  return (
    <div style={{
      background: "#fff",
      fontFamily: FF.elegantSerif,
      fontSize: "10.5pt",
      lineHeight: 1.95,
      color: "#2c2c2c",
      minHeight: "297mm",
      padding: "72px 100px",
      WebkitPrintColorAdjust: "exact",
      printColorAdjust: "exact",
    }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 32 }}>
        <div style={{
          width: 88,
          height: 88,
          borderRadius: "50%",
          background: "radial-gradient(circle at 40% 35%, #e8c97a, #C9A84C 55%, #a07828)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 28,
          fontWeight: 400,
          color: "#fff",
          letterSpacing: "0.06em",
          fontFamily: FF.elegantSerif,
          boxShadow: "0 4px 24px rgba(201,168,76,0.35)",
        }}>{mono}</div>
      </div>
      {candidate.name && (
        <div style={{
          fontSize: 20,
          fontWeight: 400,
          letterSpacing: "0.1em",
          textAlign: "center",
          marginBottom: 4,
          color: "#1a1a1a",
          fontVariant: "small-caps",
        }}>{candidate.name}</div>
      )}
      {candidate.jobTitle && (
        <div style={{
          fontSize: 9.5,
          color: "#c8b060",
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          textAlign: "center",
          marginBottom: 16,
          fontFamily: FF.systemSans,
        }}>{candidate.jobTitle}</div>
      )}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        marginBottom: 16,
        color: "#d4b870",
        fontSize: 14,
        letterSpacing: "0.3em",
      }}>
        <span style={{ fontSize: 20 }}>·</span>
        <span>✦</span>
        <span style={{ fontSize: 20 }}>·</span>
      </div>
      <div style={{
        display: "flex",
        justifyContent: "center",
        fontSize: 9,
        color: "#b0a080",
        marginBottom: 52,
        letterSpacing: "0.04em",
      }}>
        {contacts.map((c, i) => (
          <span key={i}>
            {i > 0 && <span style={{ color: "#d4c090", whiteSpace: "pre" }}>{"  ·  "}</span>}
            {c}
          </span>
        ))}
      </div>

      <div style={{
        textAlign: "center",
        fontSize: 10,
        color: "#aaa",
        marginBottom: 36,
        lineHeight: 1.7,
        fontStyle: "italic",
      }}>
        {today} {content.recipientName || content.company ? ` |  ${[content.recipientName, content.company].filter(Boolean).join(", ")}` : ""}
      </div>

      <div style={{ fontSize: "10.5pt", marginBottom: 22, textAlign: "justify" }}>
        {content.recipientName
          ? t("salutation_named", { name: content.recipientName })
          : t("salutation_generic")}
      </div>

      {content.body ? (
        <div
          style={{ fontSize: "10.5pt", lineHeight: 2, color: "#333" }}
          className="[&>p]:mb-[22px] [&>p]:text-justify [&>ul]:mb-[22px] [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:mb-[22px] [&>ol]:list-decimal [&>ol]:pl-5 prose max-w-none"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content.body) }}
        />
      ) : (
        <p style={{ fontSize: "10.5pt", color: "#cccccc", fontStyle: "italic" }}>{t("body_placeholder_template")}</p>
      )}

      <div style={{ marginTop: 56, textAlign: "center" }}>
        {content.closing && (
          <div style={{ fontStyle: "italic", fontSize: 11, color: "#8a7860", marginBottom: 8 }}>
            {content.closing},
          </div>
        )}
        {candidate.name && (
          <div style={{
            fontSize: 14,
            fontWeight: 400,
            letterSpacing: "0.1em",
            color: "#1a1a1a",
            fontVariant: "small-caps",
          }}>{candidate.name}</div>
        )}
      </div>
    </div>
  )
}

"use client"

import { useTranslations, useLocale } from "next-intl"
import DOMPurify from "isomorphic-dompurify"
import type { TemplateProps } from "./types"
import { FF, formatDate } from "./_shared"

/** Gazette — Editorial. Newspaper masthead + 1fr/gutter/220px columns. */
export default function GazetteTemplate({ content, candidate }: TemplateProps) {
  const t = useTranslations("cover_letter_editor")
  const locale = useLocale()
  const today = formatDate(locale)

  return (
    <div style={{
      background: "#fff",
      fontFamily: FF.elegantSerif,
      fontSize: 10,
      lineHeight: 1.82,
      color: "#111",
      minHeight: "297mm",
      padding: "52px 68px",
      WebkitPrintColorAdjust: "exact",
      printColorAdjust: "exact",
    }}>
      <div style={{ borderTop: "4px solid #111", borderBottom: "4px solid #111", padding: "14px 0", textAlign: "center" }}>
        <div style={{ fontSize: 8, letterSpacing: "0.22em", textTransform: "uppercase", color: "#777", fontFamily: FF.systemSans, marginBottom: 6 }}>
          Application for Employment
        </div>
        {candidate.name && (
          <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", fontFamily: FF.elegantSerif, lineHeight: 1 }}>
            {candidate.name}
          </div>
        )}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 8.5,
          color: "#666",
          borderTop: "1px solid #111",
          padding: "5px 0",
          marginTop: 8,
          fontFamily: FF.systemSans,
        }}>
          <span>{candidate.address || ""}</span>
          <span>{candidate.jobTitle || ""}</span>
          <span>{today}</span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 20px 220px", gap: 0, marginTop: 28 }}>
        <div>
          {(content.recipientName || content.company) && (
            <div style={{ fontSize: 10, marginBottom: 18, color: "#555", fontStyle: "italic" }}>
              To: {[content.recipientName, content.company].filter(Boolean).join(", ")}
            </div>
          )}
          <p style={{ fontSize: 9.5, lineHeight: 1.88, marginBottom: 15, textAlign: "justify" }}>
            {content.recipientName
              ? t("salutation_named", { name: content.recipientName })
              : t("salutation_generic")}
          </p>
          {content.body ? (
            <div
              style={{ fontSize: 9.5, lineHeight: 1.88 }}
              className="[&>p]:mb-[15px] [&>p]:text-justify [&>ul]:mb-[15px] [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:mb-[15px] [&>ol]:list-decimal [&>ol]:pl-5 prose max-w-none"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content.body) }}
            />
          ) : (
            <p style={{ fontSize: 9.5, color: "#cccccc", fontStyle: "italic" }}>{t("body_placeholder_template")}</p>
          )}
          <div style={{ marginTop: 28, borderTop: "1px solid #aaa", paddingTop: 12 }}>
            {content.closing && (
              <div style={{ fontSize: 10, fontStyle: "italic", marginBottom: 4, color: "#555" }}>{content.closing},</div>
            )}
            {candidate.name && (
              <div style={{ fontWeight: 700, fontSize: 11, letterSpacing: "0.02em" }}>{candidate.name}</div>
            )}
          </div>
        </div>
        <div style={{ borderLeft: "1px solid #ddd", margin: "0 10px" }} />
        <div>
          <div style={{
            fontSize: 8.5,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            borderBottom: "1px solid #111",
            paddingBottom: 5,
            marginBottom: 14,
            fontFamily: FF.systemSans,
          }}>Contact</div>
          {[
            ["Email", candidate.email],
            ["Phone", candidate.phone],
            ["Location", candidate.address],
            ["LinkedIn", candidate.linkedin],
          ].filter(([_, v]) => Boolean(v)).map(([label, v], i) => (
            <div key={i}>
              <div style={{ fontSize: 8, textTransform: "uppercase", letterSpacing: "0.1em", color: "#999", marginBottom: 2, fontFamily: FF.systemSans }}>
                {label}
              </div>
              <div style={{ fontSize: 9, color: "#333", marginBottom: 10, wordBreak: "break-all" }}>{v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

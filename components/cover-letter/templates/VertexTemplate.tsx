"use client"

import { useTranslations, useLocale } from "next-intl"
import DOMPurify from "isomorphic-dompurify"
import type { TemplateProps } from "./types"
import { FF, formatDate } from "./_shared"

/** Vertex — Tech. Navy #0A2248 w/ grid pattern bg + blue accent line. */
export default function VertexTemplate({ content, candidate }: TemplateProps) {
  const t = useTranslations("cover_letter_editor")
  const locale = useLocale()
  const today = formatDate(locale)

  const contacts = [candidate.email, candidate.phone, candidate.address, candidate.linkedin].filter(Boolean)

  return (
    <div style={{
      background: "#fff",
      fontFamily: FF.systemSans,
      fontSize: "10.5pt",
      lineHeight: 1.75,
      color: "#1e293b",
      minHeight: "297mm",
      WebkitPrintColorAdjust: "exact",
      printColorAdjust: "exact",
    }}>
      <div style={{
        background: "#0A2248",
        padding: "48px 64px 0",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          pointerEvents: "none",
        }} />
        <div style={{ position: "relative", zIndex: 1, paddingBottom: 36 }}>
          {candidate.name && (
            <div style={{ fontSize: 28, fontWeight: 700, color: "#F0F7FF", letterSpacing: "-0.02em", marginBottom: 5 }}>
              {candidate.name}
            </div>
          )}
          {candidate.jobTitle && (
            <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "#60A5FA" }}>
              {candidate.jobTitle}
            </div>
          )}
          <div style={{
            height: 3,
            background: "linear-gradient(90deg, #2563EB 0%, #60A5FA 50%, transparent 100%)",
            borderRadius: 2,
            marginTop: 20,
          }} />
        </div>
      </div>
      <div style={{
        background: "#F0F7FF",
        borderBottom: "1px solid #BFDBFE",
        padding: "11px 64px",
        display: "flex",
        gap: 32,
        flexWrap: "wrap",
      }}>
        {contacts.map((c, i) => (
          <div key={i} style={{ fontSize: 9.5, color: "#1D4ED8", letterSpacing: "0.02em", display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 3, height: 3, borderRadius: "50%", background: "#2563EB", flexShrink: 0 }} />
            {c}
          </div>
        ))}
      </div>
      <div style={{ padding: "40px 64px 60px" }}>
        <div style={{ fontSize: 10, color: "#94A3B8", marginBottom: 10 }}>{today}</div>
        {(content.recipientName || content.company) && (
          <div style={{ fontSize: "10.5pt", color: "#475569", marginBottom: 28, lineHeight: 1.65 }}>
            {content.recipientName}{content.recipientName && content.company && <br />}{content.company}
          </div>
        )}
        <p style={{ fontSize: "10.5pt", color: "#334155", marginBottom: 18 }}>
          {content.recipientName
            ? t("salutation_named", { name: content.recipientName })
            : t("salutation_generic")}
        </p>
        {content.body ? (
          <div
            style={{ fontSize: "10.5pt", lineHeight: 1.85, color: "#334155" }}
            className="[&>p]:mb-[18px] [&>ul]:mb-[18px] [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:mb-[18px] [&>ol]:list-decimal [&>ol]:pl-5 prose max-w-none"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content.body) }}
          />
        ) : (
          <p style={{ fontSize: "10.5pt", color: "#cccccc", fontStyle: "italic" }}>{t("body_placeholder_template")}</p>
        )}
        {content.closing && (
          <div style={{ marginTop: 48, color: "#94A3B8", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            {content.closing}
          </div>
        )}
        {candidate.name && (
          <div style={{ marginTop: 20, fontSize: 15, fontWeight: 700, color: "#2563EB" }}>{candidate.name}</div>
        )}
      </div>
    </div>
  )
}

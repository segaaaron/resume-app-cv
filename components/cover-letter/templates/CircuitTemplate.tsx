"use client"

import { useTranslations, useLocale } from "next-intl"
import DOMPurify from "isomorphic-dompurify"
import type { TemplateProps } from "./types"
import { FF, formatDate } from "./_shared"

/** Circuit — Tech (GitHub-dark look). Softened: #0D1117 → #1A1F2A. */
export default function CircuitTemplate({ content, candidate }: TemplateProps) {
  const t = useTranslations("cover_letter_editor")
  const locale = useLocale()
  const today = formatDate(locale)

  const BG = "#1A1F2A"
  const PANEL = "#21262E"
  const BORDER = "#30363D"

  return (
    <div style={{
      background: BG,
      fontFamily: FF.systemMono,
      fontSize: 10,
      lineHeight: 1.75,
      color: "#C9D1D9",
      minHeight: "297mm",
      padding: "52px 64px",
      WebkitPrintColorAdjust: "exact",
      printColorAdjust: "exact",
    }}>
      <div style={{
        height: 2,
        background: "linear-gradient(90deg, #3DD68C 0%, #1a6e40 80%, transparent 100%)",
        marginBottom: 36,
        borderRadius: 2,
      }} />
      {candidate.name && (
        <div style={{ fontSize: 24, fontWeight: 700, color: "#3DD68C", letterSpacing: "0.03em", lineHeight: 1 }}>
          {candidate.name}
        </div>
      )}
      {candidate.jobTitle && (
        <div style={{ fontSize: 9.5, color: "#8B949E", marginBottom: 24, marginTop: 6, letterSpacing: "0.02em" }}>
          // {candidate.jobTitle}
        </div>
      )}

      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "5px 48px",
        marginBottom: 40,
        padding: "18px 20px",
        background: PANEL,
        border: `1px solid ${BORDER}`,
        borderRadius: 6,
      }}>
        {[
          ["email", candidate.email],
          ["phone", candidate.phone],
          ["location", candidate.address],
          ["date", today],
        ].filter(([_, v]) => Boolean(v)).map(([k, v], i) => (
          <div key={i} style={{ fontSize: 9, color: "#8B949E" }}>
            <span style={{ color: "#79C0FF" }}>{k}</span>: <span style={{ color: "#3DD68C" }}>{`"${v}"`}</span>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 9, color: "#6E7681", margin: "24px 0 10px", letterSpacing: "0.02em" }}>
        {`/* ${content.recipientName
          ? t("salutation_named", { name: content.recipientName })
          : t("salutation_generic")}${content.company ? ` @ ${content.company}` : ""} */`}
      </div>

      {content.body ? (
        <div
          style={{ fontSize: 10, lineHeight: 1.85, color: "#C9D1D9" }}
          className="[&>p]:mb-[18px] [&>ul]:mb-[18px] [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:mb-[18px] [&>ol]:list-decimal [&>ol]:pl-5"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content.body) }}
        />
      ) : (
        <div style={{ fontSize: 10, color: "#6E7681", fontStyle: "italic" }}>{t("body_placeholder_template")}</div>
      )}

      <div style={{ marginTop: 44, borderTop: `1px solid ${BORDER}`, paddingTop: 18 }}>
        {content.closing && (
          <div style={{ fontSize: 9, color: "#6E7681", marginBottom: 8 }}>// {content.closing}</div>
        )}
        {candidate.name && (
          <div style={{ fontSize: 13, fontWeight: 700, color: "#3DD68C", letterSpacing: "0.02em", marginTop: 6 }}>
            {candidate.name}
          </div>
        )}
      </div>
      <div style={{
        height: 2,
        background: "linear-gradient(90deg, #3DD68C, transparent)",
        marginTop: 44,
        borderRadius: 2,
      }} />
    </div>
  )
}

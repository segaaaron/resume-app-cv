"use client"

import { useTranslations, useLocale } from "next-intl"
import DOMPurify from "isomorphic-dompurify"
import type { TemplateProps } from "./types"
import { FF, formatDate } from "./_shared"

/** Velvet — Lujo. Burgundy ribbons top/bottom. */
export default function VelvetTemplate({ content, candidate }: TemplateProps) {
  const t = useTranslations("cover_letter_editor")
  const locale = useLocale()
  const today = formatDate(locale)

  const contacts = [candidate.email, candidate.phone, candidate.address].filter(Boolean)

  return (
    <div style={{
      background: "#F9F4EF",
      fontFamily: FF.elegantSerif,
      fontSize: "10.5pt",
      lineHeight: 1.95,
      color: "#2c1810",
      minHeight: "297mm",
      display: "flex",
      flexDirection: "column",
      WebkitPrintColorAdjust: "exact",
      printColorAdjust: "exact",
    }}>
      <div style={{
        height: 8,
        background: "linear-gradient(90deg, #7C2D3E, #9B3A50, #C05068, #9B3A50, #7C2D3E)",
        position: "relative",
      }}>
        <div style={{ height: 2, background: "rgba(255,255,255,0.25)", marginTop: 2 }} />
      </div>
      <div style={{ padding: "44px 80px 36px", background: "#F9F4EF", borderBottom: "1px solid #D9C4B8" }}>
        {candidate.name && (
          <div style={{ fontSize: 28, fontWeight: 400, letterSpacing: "0.05em", color: "#1a0a08", marginBottom: 7, fontFamily: FF.elegantSerif }}>
            {candidate.name}
          </div>
        )}
        {candidate.jobTitle && (
          <div style={{
            fontSize: 9.5,
            color: "#7C2D3E",
            textTransform: "uppercase",
            letterSpacing: "0.18em",
            fontFamily: FF.systemSans,
            marginBottom: 22,
            fontWeight: 500,
          }}>{candidate.jobTitle}</div>
        )}
        {contacts.length > 0 && (
          <div style={{ display: "flex", gap: 22, fontSize: 9.5, color: "#8a6858", fontFamily: FF.systemSans, flexWrap: "wrap" }}>
            {contacts.map((c, i) => (
              <span key={i} style={{ display: "inline-flex", gap: 22 }}>
                {i > 0 && <span style={{ color: "#C4A090" }}>·</span>}
                <span>{c}</span>
              </span>
            ))}
          </div>
        )}
      </div>
      <div style={{ padding: "44px 80px 0", flex: 1 }}>
        <div style={{ fontSize: 10, color: "#B0907A", fontFamily: FF.systemSans, marginBottom: 16, letterSpacing: "0.04em" }}>{today}</div>
        {(content.recipientName || content.company) && (
          <div style={{ fontSize: "10.5pt", marginBottom: 30, lineHeight: 1.75, color: "#5a3828" }}>
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
            className="[&>p]:mb-[22px] [&>p:nth-of-type(2)]:border-l-[3px] [&>p:nth-of-type(2)]:border-[#7C2D3E] [&>p:nth-of-type(2)]:pl-[18px] [&>p:nth-of-type(2)]:py-[10px] [&>p:nth-of-type(2)]:my-[22px] [&>p:nth-of-type(2)]:italic [&>p:nth-of-type(2)]:bg-[rgba(124,45,62,0.045)] [&>p:nth-of-type(2)]:text-[#5a3828] [&>ul]:mb-[22px] [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:mb-[22px] [&>ol]:list-decimal [&>ol]:pl-5 prose max-w-none"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content.body) }}
          />
        ) : (
          <p style={{ fontSize: "10.5pt", color: "#cccccc", fontStyle: "italic" }}>{t("body_placeholder_template")}</p>
        )}
        {content.closing && (
          <div style={{ marginTop: 52, fontStyle: "italic", color: "#7C2D3E", fontSize: 11 }}>
            {content.closing},
          </div>
        )}
        {candidate.name && (
          <div style={{ fontStyle: "normal", fontWeight: 700, fontSize: 15, marginTop: 12, color: "#1a0a08", letterSpacing: "0.04em" }}>
            {candidate.name}
          </div>
        )}
      </div>
      <div style={{
        height: 8,
        background: "linear-gradient(90deg, #7C2D3E, #9B3A50, #C05068, #9B3A50, #7C2D3E)",
        marginTop: 44,
        position: "relative",
      }}>
        <div style={{ height: 2, background: "rgba(255,255,255,0.25)", marginBottom: 2 }} />
      </div>
    </div>
  )
}

"use client"

import { useTranslations, useLocale } from "next-intl"
import LetterBody from "./LetterBody"
import type { TemplateProps } from "./types"
import { FF, formatDate } from "./_shared"

/** Meridian — Lujo. Cream w/ compass watermark SVG. Cormorant Garamond → Playfair fallback. */
export default function MeridianTemplate({ content, candidate }: TemplateProps) {
  const t = useTranslations("cover_letter_editor")
  const locale = useLocale()
  const today = formatDate(locale)

  const contacts = [candidate.email, candidate.phone, candidate.address].filter(Boolean)

  const ORN = (
    <svg width={80} height={24} viewBox="0 0 80 24">
      <line x1="0" y1="12" x2="30" y2="12" stroke="#c9a96e" strokeWidth="1" />
      <polygon points="35,12 40,6 45,12 40,18" fill="none" stroke="#c9a96e" strokeWidth="1" />
      <line x1="50" y1="12" x2="80" y2="12" stroke="#c9a96e" strokeWidth="1" />
    </svg>
  )

  return (
    <div style={{
      background: "#fdf9f3",
      fontFamily: FF.systemSans,
      color: "#2a1f0e",
      fontSize: 13.5,
      lineHeight: 1.5,
      minHeight: "297mm",
      position: "relative",
      WebkitPrintColorAdjust: "exact",
      printColorAdjust: "exact",
    }}>
      <svg
        style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", opacity: 0.04, pointerEvents: "none", zIndex: 0 }}
        width={420}
        height={420}
        viewBox="0 0 420 420"
        fill="none"
      >
        <circle cx="210" cy="210" r="180" stroke="#8a6d3b" strokeWidth="1" />
        <circle cx="210" cy="210" r="140" stroke="#8a6d3b" strokeWidth="0.5" />
        <circle cx="210" cy="210" r="8" fill="#8a6d3b" />
        <line x1="210" y1="30" x2="210" y2="390" stroke="#8a6d3b" strokeWidth="0.5" />
        <line x1="30" y1="210" x2="390" y2="210" stroke="#8a6d3b" strokeWidth="0.5" />
        <line x1="83" y1="83" x2="337" y2="337" stroke="#8a6d3b" strokeWidth="0.5" />
        <line x1="337" y1="83" x2="83" y2="337" stroke="#8a6d3b" strokeWidth="0.5" />
        <polygon points="210,30 218,58 210,54 202,58" fill="#8a6d3b" />
        <polygon points="210,390 218,362 210,366 202,362" fill="#8a6d3b" />
        <polygon points="30,210 58,202 54,210 58,218" fill="#8a6d3b" />
        <polygon points="390,210 362,218 366,210 362,202" fill="#8a6d3b" />
        <text x="210" y="200" textAnchor="middle" fontSize="9" fill="#8a6d3b" letterSpacing="4" fontFamily="serif">MERIDIAN</text>
      </svg>

      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", justifyContent: "center", padding: "28px 0 0" }}>{ORN}</div>
        <div style={{ textAlign: "center", padding: "16px 60px 28px", borderBottom: "1px solid #c9a96e" }}>
          {candidate.name && (
            <div style={{ fontFamily: FF.elegantSerif, fontSize: 32, fontWeight: 600, color: "#1a1208", letterSpacing: 3 }}>
              {candidate.name}
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginTop: 8 }}>
            <div style={{ width: 40, height: 1, background: "#c9a96e" }} />
            {candidate.jobTitle && (
              <div style={{ fontSize: 11, letterSpacing: 4, textTransform: "uppercase", color: "#8a6d3b" }}>{candidate.jobTitle}</div>
            )}
            <div style={{ width: 40, height: 1, background: "#c9a96e" }} />
          </div>
          {contacts.length > 0 && (
            <div style={{ display: "flex", justifyContent: "center", gap: 32, marginTop: 16, fontSize: 11, color: "#5c4a2a", letterSpacing: "0.5px", flexWrap: "wrap" }}>
              {contacts.map((c, i) => (
                <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  {i > 0 && <span style={{ color: "#c9a96e" }}>◆</span>}
                  <span>{c}</span>
                </span>
              ))}
            </div>
          )}
        </div>

        <div style={{ padding: "28px 68px" }}>
          <div style={{ fontSize: 11, color: "#8a6d3b", letterSpacing: 1, textTransform: "uppercase", marginBottom: 16 }}>{today}</div>
          {(content.recipientName || content.company) && (
            <div style={{ marginBottom: 16, fontSize: 13 }}>
              {content.recipientName && (
                <strong style={{ fontFamily: FF.elegantSerif, fontSize: 14, display: "block", color: "#1a1208" }}>{content.recipientName}</strong>
              )}
              {content.company}
            </div>
          )}
          <div style={{ fontFamily: FF.elegantSerif, fontSize: 14, fontStyle: "italic", color: "#1a1208", marginBottom: 16 }}>
            {content.recipientName
              ? t("salutation_named", { name: content.recipientName })
              : t("salutation_generic")}
          </div>
          {content.body ? (
            <LetterBody html={content.body} style={{ color: "#3a2e1a", fontWeight: 300 }} />
          ) : (
            <p style={{ color: "#cccccc", fontStyle: "italic" }}>{t("body_placeholder_template")}</p>
          )}
          <div style={{ marginTop: 16 }}>
            {content.closing && (
              <div style={{ fontSize: 12, fontFamily: FF.elegantSerif, fontStyle: "italic", color: "#5c4a2a" }}>{content.closing},</div>
            )}
            {candidate.name && (
              <div style={{ fontFamily: FF.elegantSerif, fontSize: 28, color: "#1a1208", marginTop: 2 }}>{candidate.name}</div>
            )}
          </div>
        </div>

        <div style={{ textAlign: "center", padding: "20px 0 28px", borderTop: "1px solid #c9a96e", marginTop: 16 }}>{ORN}</div>
      </div>
    </div>
  )
}

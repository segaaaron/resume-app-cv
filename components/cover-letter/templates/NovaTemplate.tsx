"use client"

import { useTranslations, useLocale } from "next-intl"
import LetterBody from "./LetterBody"
import type { TemplateProps } from "./types"
import { FF, formatDate } from "./_shared"

/** Nova — Creativo. Hero gradient + starburst SVG + 200px sidebar. */
export default function NovaTemplate({ content, candidate }: TemplateProps) {
  const t = useTranslations("cover_letter_editor")
  const locale = useLocale()
  const today = formatDate(locale)

  return (
    <div style={{
      background: "#fafafa",
      fontFamily: FF.systemSans,
      color: "#1a1a2e",
      fontSize: 13.5,
      lineHeight: 1.5,
      minHeight: "297mm",
      WebkitPrintColorAdjust: "exact",
      printColorAdjust: "exact",
    }}>
      <div style={{
        position: "relative",
        background: "linear-gradient(135deg, #16213e 0%, #0f3460 60%, #533483 100%)",
        padding: "48px 56px 44px",
        overflow: "hidden",
        minHeight: 200,
      }}>
        <svg style={{ position: "absolute", top: -20, right: -20, opacity: 0.6 }} width={280} height={280} viewBox="0 0 280 280" fill="none">
          <defs>
            <linearGradient id="nova-ng1" x1="0" y1="0" x2="280" y2="280" gradientUnits="userSpaceOnUse">
              <stop stopColor="#ff57ba" />
              <stop offset="0.5" stopColor="#a855f7" />
              <stop offset="1" stopColor="#06b6d4" />
            </linearGradient>
          </defs>
          <g opacity="0.7">
            <line x1="140" y1="0" x2="140" y2="280" stroke="url(#nova-ng1)" strokeWidth="1" />
            <line x1="0" y1="140" x2="280" y2="140" stroke="url(#nova-ng1)" strokeWidth="1" />
            <line x1="40" y1="40" x2="240" y2="240" stroke="url(#nova-ng1)" strokeWidth="1" />
            <line x1="240" y1="40" x2="40" y2="240" stroke="url(#nova-ng1)" strokeWidth="1" />
            <line x1="20" y1="90" x2="260" y2="190" stroke="url(#nova-ng1)" strokeWidth="0.5" />
            <line x1="90" y1="20" x2="190" y2="260" stroke="url(#nova-ng1)" strokeWidth="0.5" />
            <line x1="260" y1="90" x2="20" y2="190" stroke="url(#nova-ng1)" strokeWidth="0.5" />
            <line x1="190" y1="20" x2="90" y2="260" stroke="url(#nova-ng1)" strokeWidth="0.5" />
            <circle cx="140" cy="140" r="60" stroke="#a855f7" strokeWidth="0.5" fill="none" />
            <circle cx="140" cy="140" r="100" stroke="#06b6d4" strokeWidth="0.5" fill="none" />
            <circle cx="140" cy="140" r="8" fill="#ff57ba" />
          </g>
        </svg>
        <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 4, background: "linear-gradient(180deg, #ff57ba, #a855f7, #06b6d4)" }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          {candidate.jobTitle && (
            <div style={{
              display: "inline-block",
              background: "rgba(255,87,186,0.2)",
              border: "1px solid rgba(255,87,186,0.5)",
              color: "#ff57ba",
              fontSize: 10,
              letterSpacing: 3,
              textTransform: "uppercase",
              padding: "4px 12px",
              borderRadius: 20,
              marginBottom: 16,
            }}>{candidate.jobTitle}</div>
          )}
          {candidate.name && (
            <div style={{ fontSize: 32, fontWeight: 700, color: "#fff", lineHeight: 1.1 }}>{candidate.name}</div>
          )}
          <div style={{ display: "flex", gap: 20, marginTop: 20, flexWrap: "wrap" }}>
            {candidate.email && <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 11.5 }}>{candidate.email}</div>}
            {candidate.phone && <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 11.5 }}>{candidate.phone}</div>}
            {candidate.address && <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 11.5 }}>{candidate.address}</div>}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 0 }}>
        <div style={{ background: "#f0f0f7", padding: "36px 24px", borderRight: "2px solid #e0e0ee" }}>
          {(candidate.email || candidate.phone || candidate.address || candidate.linkedin) && (
            <>
              <div style={{ fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: "#7c3aed", fontWeight: 600, marginBottom: 12 }}>Contact</div>
              {candidate.email && <div style={{ fontSize: 12, color: "#3a3a5c", marginBottom: 6, lineHeight: 1.5 }}>{candidate.email}</div>}
              {candidate.phone && <div style={{ fontSize: 12, color: "#3a3a5c", marginBottom: 6, lineHeight: 1.5 }}>{candidate.phone}</div>}
              {candidate.address && <div style={{ fontSize: 12, color: "#3a3a5c", marginBottom: 6, lineHeight: 1.5 }}>{candidate.address}</div>}
              {candidate.linkedin && <div style={{ fontSize: 12, color: "#3a3a5c", marginBottom: 6, lineHeight: 1.5 }}>{candidate.linkedin}</div>}
            </>
          )}
          {candidate.jobTitle && (
            <>
              <div style={{ fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: "#7c3aed", fontWeight: 600, marginBottom: 12, marginTop: 24 }}>Position</div>
              <div style={{ fontSize: 12, color: "#3a3a5c", marginBottom: 6 }}>{candidate.jobTitle}</div>
            </>
          )}
          {content.company && (
            <>
              <div style={{ fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: "#7c3aed", fontWeight: 600, marginBottom: 12, marginTop: 24 }}>Company</div>
              <div style={{ fontSize: 12, color: "#3a3a5c", marginBottom: 6 }}>{content.company}</div>
            </>
          )}
          <div style={{ fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: "#7c3aed", fontWeight: 600, marginBottom: 12, marginTop: 24 }}>Date</div>
          <div style={{ fontSize: 12, color: "#3a3a5c", marginBottom: 6 }}>{today}</div>
        </div>
        <div style={{ padding: "36px 40px" }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#0f3460", marginBottom: 16 }}>
            {content.recipientName
              ? t("salutation_named", { name: content.recipientName })
              : t("salutation_generic")}
          </div>
          {content.body ? (
            <LetterBody html={content.body} style={{ color: "#2c2c4a" }} />
          ) : (
            <p style={{ color: "#cccccc", fontStyle: "italic" }}>{t("body_placeholder_template")}</p>
          )}
          {content.closing && (
            <div style={{ color: "#7c3aed", fontWeight: 500, marginTop: 24 }}>{content.closing},</div>
          )}
          {candidate.name && (
            <div style={{ fontSize: 14, fontWeight: 700, color: "#1a1a2e", marginTop: 4 }}>{candidate.name}</div>
          )}
        </div>
      </div>
    </div>
  )
}

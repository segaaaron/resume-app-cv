"use client"

import { useTranslations, useLocale } from "next-intl"
import LetterBody from "./LetterBody"
import type { TemplateProps } from "./types"
import { FF, formatDate } from "./_shared"

/** Bloom — Editorial. Pink florals on left/right margins. */
export default function BloomTemplate({ content, candidate }: TemplateProps) {
  const t = useTranslations("cover_letter_editor")
  const locale = useLocale()
  const today = formatDate(locale)

  const FLORAL_G = (mirror = false) => (
    <g opacity="0.35" transform={mirror ? "scale(-1,1) translate(-80,0)" : undefined}>
      <circle cx="40" cy="50" r="16" fill="#f090b0" />
      <ellipse cx="24" cy="50" rx="10" ry="6" fill="#f0a0c0" transform="rotate(-30 24 50)" />
      <ellipse cx="56" cy="50" rx="10" ry="6" fill="#f0a0c0" transform="rotate(30 56 50)" />
      <ellipse cx="40" cy="34" rx="6" ry="10" fill="#f0a0c0" />
      <ellipse cx="40" cy="66" rx="6" ry="10" fill="#f0a0c0" />
      <circle cx="40" cy="50" r="6" fill="#fff0f5" />
      <line x1="40" y1="66" x2="40" y2="110" stroke="#c06080" strokeWidth="1.5" />
      <ellipse cx="28" cy="90" rx="14" ry="7" fill="#f0c0d0" transform="rotate(-25 28 90)" opacity="0.7" />
      <ellipse cx="52" cy="100" rx="14" ry="7" fill="#f0c0d0" transform="rotate(20 52 100)" opacity="0.7" />
      <line x1="40" y1="110" x2="40" y2="170" stroke="#c06080" strokeWidth="1.5" />
      <circle cx="40" cy="140" r="12" fill="#f090b0" opacity="0.5" />
      <line x1="40" y1="170" x2="40" y2="260" stroke="#c06080" strokeWidth="1.5" />
      <ellipse cx="25" cy="200" rx="18" ry="8" fill="#f0c0d0" transform="rotate(-35 25 200)" opacity="0.5" />
    </g>
  )

  const ICON = (
    <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#c06080" strokeWidth="2">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
    </svg>
  )

  return (
    <div style={{
      background: "#fef8f8",
      fontFamily: FF.systemSans,
      color: "#2a1820",
      fontSize: 13.5,
      lineHeight: 1.5,
      minHeight: "297mm",
      WebkitPrintColorAdjust: "exact",
      printColorAdjust: "exact",
    }}>
      <div style={{
        background: "linear-gradient(160deg, #fff0f5 0%, #fde8ef 50%, #fff0f5 100%)",
        padding: "44px 60px 36px",
        borderBottom: "2px solid #f0c0d0",
        position: "relative",
        overflow: "hidden",
      }}>
        <svg style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 80 }} viewBox="0 0 80 260" fill="none" preserveAspectRatio="xMidYMid meet">
          {FLORAL_G(false)}
        </svg>
        <svg style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 80 }} viewBox="0 0 80 260" fill="none" preserveAspectRatio="xMidYMid meet">
          {FLORAL_G(true)}
        </svg>
        <div style={{ paddingLeft: 16, position: "relative" }}>
          {candidate.name && (
            <div style={{ fontFamily: FF.elegantSerif, fontSize: 32, fontWeight: 600, color: "#5a1a2e", letterSpacing: "0.5px", lineHeight: 1.1 }}>
              {candidate.name}
            </div>
          )}
          {candidate.jobTitle && (
            <div style={{ fontSize: 12, letterSpacing: 3, textTransform: "uppercase", color: "#c06080", marginTop: 8, fontWeight: 500 }}>
              {candidate.jobTitle}
            </div>
          )}
          <div style={{ display: "flex", gap: 22, marginTop: 16, flexWrap: "wrap" }}>
            {[candidate.email, candidate.phone, candidate.address].filter(Boolean).map((c, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "#7a4a5a" }}>
                {ICON}
                {c}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding: "40px 60px 40px 76px" }}>
        <div style={{ fontSize: 11.5, color: "#c06080", marginBottom: 22, fontStyle: "italic" }}>{today}</div>
        {(content.recipientName || content.company) && (
          <div style={{ marginBottom: 16 }}>
            {content.recipientName && (
              <strong style={{ fontFamily: FF.elegantSerif, fontSize: 14, fontWeight: 600, color: "#2a1820", display: "block" }}>{content.recipientName}</strong>
            )}
            {content.company && <span style={{ fontSize: 12, color: "#8a6070" }}>{content.company}</span>}
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "16px 0" }}>
          <div style={{ flex: 1, height: 1, background: "#f0c0d0" }} />
          <svg width={20} height={20} viewBox="0 0 20 20" fill="none">
            <ellipse cx="10" cy="5" rx="3" ry="5" fill="#f0c0d0" />
            <ellipse cx="15" cy="10" rx="5" ry="3" fill="#f0c0d0" />
            <ellipse cx="10" cy="15" rx="3" ry="5" fill="#f0c0d0" />
            <ellipse cx="5" cy="10" rx="5" ry="3" fill="#f0c0d0" />
            <circle cx="10" cy="10" r="2.5" fill="#c06080" />
          </svg>
          <div style={{ flex: 1, height: 1, background: "#f0c0d0" }} />
        </div>
        <div style={{ fontFamily: FF.elegantSerif, fontSize: 14, fontStyle: "italic", color: "#2a1820", marginBottom: 16 }}>
          {content.recipientName
            ? t("salutation_named", { name: content.recipientName })
            : t("salutation_generic")}
        </div>
        {content.body ? (
          <LetterBody html={content.body} style={{ color: "#2a1820", fontWeight: 300 }} />
        ) : (
          <p style={{ color: "#cccccc", fontStyle: "italic" }}>{t("body_placeholder_template")}</p>
        )}
        <div style={{ marginTop: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            {content.closing && (
              <div style={{ fontFamily: FF.elegantSerif, fontStyle: "italic", color: "#8a6070", fontSize: 14 }}>{content.closing},</div>
            )}
            {candidate.name && (
              <div style={{ fontFamily: FF.elegantSerif, fontSize: 28, fontWeight: 600, color: "#5a1a2e", marginTop: 4 }}>{candidate.name}</div>
            )}
          </div>
          <svg width={60} height={60} viewBox="0 0 60 60" fill="none" opacity="0.2">
            <ellipse cx="30" cy="10" rx="8" ry="12" fill="#f090b0" />
            <ellipse cx="50" cy="30" rx="12" ry="8" fill="#f090b0" />
            <ellipse cx="30" cy="50" rx="8" ry="12" fill="#f090b0" />
            <ellipse cx="10" cy="30" rx="12" ry="8" fill="#f090b0" />
            <circle cx="30" cy="30" r="7" fill="#c06080" />
          </svg>
        </div>
      </div>
    </div>
  )
}

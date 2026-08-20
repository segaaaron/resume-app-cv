"use client"

import { useTranslations, useLocale } from "next-intl"
import LetterBody from "./LetterBody"
import type { TemplateProps } from "./types"
import { FF, formatDate } from "./_shared"

/** Herald — Ejecutivo. Purple #3d1a5c + heraldic crest SVG. */
export default function HeraldTemplate({ content, candidate }: TemplateProps) {
  const t = useTranslations("cover_letter_editor")
  const locale = useLocale()
  const today = formatDate(locale)

  const contacts = [
    { v: candidate.email, icon: (
      <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
      </svg>
    )},
    { v: candidate.phone, icon: (
      <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.63A2 2 0 012 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 8.91A16 16 0 0015.09 17.09l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
      </svg>
    )},
    { v: candidate.address, icon: (
      <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
      </svg>
    )},
  ].filter(c => c.v)

  return (
    <div style={{
      background: "#fff",
      fontFamily: FF.systemSans,
      color: "#1a1025",
      fontSize: 13.5,
      lineHeight: 1.5,
      minHeight: "297mm",
      WebkitPrintColorAdjust: "exact",
      printColorAdjust: "exact",
    }}>
      <div style={{ background: "#3d1a5c", height: 6 }} />
      <div style={{ display: "flex", alignItems: "center", gap: 36, padding: "40px 56px 32px", borderBottom: "1px solid #e8e0f0" }}>
        <div style={{ flexShrink: 0 }}>
          <svg width={80} height={96} viewBox="0 0 80 96" fill="none">
            <path d="M40 4 L72 16 L72 52 C72 70 56 84 40 92 C24 84 8 70 8 52 L8 16 Z" fill="#f5f0fa" stroke="#3d1a5c" strokeWidth="1.5" />
            <path d="M40 12 L64 22 L64 52 C64 66 52 78 40 84 C28 78 16 66 16 52 L16 22 Z" fill="none" stroke="#8a5aaa" strokeWidth="0.8" />
            <line x1="40" y1="12" x2="40" y2="84" stroke="#3d1a5c" strokeWidth="0.5" />
            <line x1="16" y1="48" x2="64" y2="48" stroke="#3d1a5c" strokeWidth="0.5" />
            <path d="M24 30 C24 24 32 20 40 20 C48 20 56 24 56 30 L56 44 L40 50 L24 44 Z" fill="#3d1a5c" opacity="0.15" />
            <circle cx="40" cy="35" r="6" fill="none" stroke="#8a5aaa" strokeWidth="1" />
            <path d="M40 29 L41.5 33 L46 33 L42.5 35.5 L43.5 40 L40 37 L36.5 40 L37.5 35.5 L34 33 L38.5 33 Z" fill="#8a5aaa" opacity="0.7" />
            <path d="M28 55 L36 68 L44 55" fill="none" stroke="#3d1a5c" strokeWidth="1" opacity="0.5" />
            <path d="M52 55 L44 68 L36 55" fill="none" stroke="#3d1a5c" strokeWidth="1" opacity="0.5" />
          </svg>
        </div>
        <div style={{ flex: 1 }}>
          {candidate.name && (
            <div style={{ fontFamily: FF.elegantSerif, fontSize: 32, fontWeight: 600, color: "#1a1025", letterSpacing: "0.5px" }}>
              {candidate.name}
            </div>
          )}
          {candidate.jobTitle && (
            <div style={{ fontSize: 12, letterSpacing: 3, textTransform: "uppercase", color: "#8a5aaa", marginTop: 4, fontWeight: 500 }}>
              {candidate.jobTitle}
            </div>
          )}
          <div style={{ display: "flex", gap: 20, marginTop: 14, flexWrap: "wrap" }}>
            {contacts.map((c, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "#5a4a6a" }}>
                <span style={{ color: "#8a5aaa", display: "inline-flex" }}>{c.icon}</span>
                {c.v}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding: "36px 56px" }}>
        <div style={{ fontSize: 11.5, color: "#9a8aaa", marginBottom: 22, letterSpacing: "0.5px" }}>{today}</div>
        {(content.recipientName || content.company) && (
          <div style={{ marginBottom: 18 }}>
            {content.recipientName && (
              <strong style={{ fontFamily: FF.elegantSerif, fontSize: 14, fontWeight: 600, color: "#1a1025" }}>{content.recipientName}</strong>
            )}
            {content.company && <span style={{ fontSize: 12, color: "#7a6a8a", display: "block" }}>{content.company}</span>}
          </div>
        )}
        <div style={{ width: 48, height: 2, background: "linear-gradient(90deg, #3d1a5c, #8a5aaa)", margin: "18px 0" }} />
        <div style={{ fontFamily: FF.elegantSerif, fontSize: 14, color: "#1a1025", marginBottom: 16 }}>
          {content.recipientName
            ? t("salutation_named", { name: content.recipientName })
            : t("salutation_generic")}
        </div>
        {content.body ? (
          <LetterBody html={content.body} style={{ color: "#2a1a35", fontWeight: 300 }} />
        ) : (
          <p style={{ color: "#cccccc", fontStyle: "italic" }}>{t("body_placeholder_template")}</p>
        )}
        <div style={{ marginTop: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            {content.closing && (
              <div style={{ color: "#7a6a8a", fontSize: 13, fontStyle: "italic", fontFamily: FF.elegantSerif, marginBottom: 4 }}>
                {content.closing},
              </div>
            )}
            {candidate.name && (
              <div style={{ fontFamily: FF.elegantSerif, fontSize: 28, fontWeight: 600, color: "#1a1025" }}>{candidate.name}</div>
            )}
            {candidate.jobTitle && (
              <div style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: "#8a5aaa", marginTop: 2 }}>{candidate.jobTitle}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

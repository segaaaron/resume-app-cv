"use client"

import { useTranslations, useLocale } from "next-intl"
import DOMPurify from "isomorphic-dompurify"
import type { TemplateProps } from "./types"
import { FF, formatDate } from "./_shared"

/** Obsidian — Lujo. Dark + gold #f0c040 + corner brackets + compass SVG.
 *  Softened bg #0a0a0a → #1a1a1a per user spec. */
export default function ObsidianTemplate({ content, candidate }: TemplateProps) {
  const t = useTranslations("cover_letter_editor")
  const locale = useLocale()
  const today = formatDate(locale)

  const BG = "#1a1a1a"
  const PANEL = "#222222"
  const GOLD_RULE = (
    <div style={{ height: 1, background: "linear-gradient(90deg, transparent, #b8960c, #f0c040, #b8960c, transparent)" }} />
  )

  const contacts = [candidate.email, candidate.phone, candidate.address].filter(Boolean)

  return (
    <div style={{
      background: BG,
      fontFamily: FF.systemSans,
      color: "#e8dcc8",
      fontSize: 13,
      lineHeight: 1.7,
      minHeight: "297mm",
      WebkitPrintColorAdjust: "exact",
      printColorAdjust: "exact",
    }}>
      <div style={{ border: "1px solid #2a2a2a", minHeight: "297mm", display: "flex", flexDirection: "column" }}>
        {GOLD_RULE}
        <div style={{ padding: "52px 64px 40px", background: PANEL, textAlign: "center", position: "relative" }}>
          <svg style={{ position: "absolute", top: 20, left: 20 }} width={60} height={60} viewBox="0 0 60 60" fill="none">
            <path d="M5 5 L25 5 L5 25" stroke="#b8960c" strokeWidth="1" fill="none" />
            <path d="M5 5 L5 15" stroke="#f0c040" strokeWidth="1.5" />
            <path d="M5 5 L15 5" stroke="#f0c040" strokeWidth="1.5" />
          </svg>
          <svg style={{ position: "absolute", top: 20, right: 20 }} width={60} height={60} viewBox="0 0 60 60" fill="none">
            <path d="M55 5 L35 5 L55 25" stroke="#b8960c" strokeWidth="1" fill="none" />
            <path d="M55 5 L55 15" stroke="#f0c040" strokeWidth="1.5" />
            <path d="M55 5 L45 5" stroke="#f0c040" strokeWidth="1.5" />
          </svg>
          {candidate.name && (
            <div style={{ fontFamily: FF.elegantSerif, fontSize: 44, fontWeight: 700, color: "#f0c040", letterSpacing: 2, lineHeight: 1.1 }}>
              {candidate.name}
            </div>
          )}
          {candidate.jobTitle && (
            <div style={{ fontSize: 11, letterSpacing: 5, textTransform: "uppercase", color: "#8a7a5a", marginTop: 10 }}>
              {candidate.jobTitle}
            </div>
          )}
          {contacts.length > 0 && (
            <div style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 22, fontSize: 11, color: "#6a6040", flexWrap: "wrap" }}>
              {contacts.map((c, i) => (
                <span key={i} style={{ display: "inline-flex", gap: 12 }}>
                  {i > 0 && <span style={{ color: "#b8960c" }}>·</span>}
                  <span>{c}</span>
                </span>
              ))}
            </div>
          )}
        </div>
        {GOLD_RULE}
        <div style={{ padding: "40px 64px", flex: 1 }}>
          <div style={{ fontSize: 11, color: "#5a5030", letterSpacing: 1, marginBottom: 26, textTransform: "uppercase" }}>{today}</div>
          {(content.recipientName || content.company) && (
            <div style={{ marginBottom: 20 }}>
              {content.recipientName && (
                <strong style={{ fontFamily: FF.elegantSerif, fontSize: 17, color: "#f0c040", display: "block" }}>{content.recipientName}</strong>
              )}
              {content.company && <span style={{ color: "#8a7a5a", fontSize: 12 }}>{content.company}</span>}
            </div>
          )}
          <div style={{ fontFamily: FF.elegantSerif, fontSize: 19, fontStyle: "italic", color: "#e8dcc8", marginBottom: 20 }}>
            {content.recipientName
              ? t("salutation_named", { name: content.recipientName })
              : t("salutation_generic")}
          </div>
          {content.body ? (
            <div
              style={{ color: "#c8b898", fontWeight: 300 }}
              className="[&>p]:mb-[16px] [&>ul]:mb-[16px] [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:mb-[16px] [&>ol]:list-decimal [&>ol]:pl-5"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content.body) }}
            />
          ) : (
            <p style={{ color: "#5a5030", fontStyle: "italic" }}>{t("body_placeholder_template")}</p>
          )}
          <div style={{ marginTop: 40, borderTop: "1px solid #2a2a2a", paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div>
              {content.closing && (
                <div style={{ fontFamily: FF.elegantSerif, fontStyle: "italic", color: "#8a7a5a", fontSize: 14 }}>{content.closing},</div>
              )}
              {candidate.name && (
                <div style={{ fontFamily: FF.elegantSerif, fontSize: 26, color: "#f0c040" }}>{candidate.name}</div>
              )}
            </div>
            <svg width={80} height={80} viewBox="0 0 80 80" fill="none">
              <circle cx="40" cy="40" r="35" stroke="#b8960c" strokeWidth="0.5" />
              <circle cx="40" cy="40" r="25" stroke="#b8960c" strokeWidth="0.5" />
              <polygon points="40,10 43,28 40,25 37,28" fill="#f0c040" />
              <polygon points="40,70 43,52 40,55 37,52" fill="#f0c040" />
              <polygon points="10,40 28,37 25,40 28,43" fill="#f0c040" />
              <polygon points="70,40 52,43 55,40 52,37" fill="#f0c040" />
              <circle cx="40" cy="40" r="4" fill="#f0c040" />
            </svg>
          </div>
        </div>
        {GOLD_RULE}
        <div style={{ padding: "20px 64px", background: PANEL, textAlign: "center" }}>
          <svg width={120} height={16} viewBox="0 0 120 16">
            <line x1="0" y1="8" x2="48" y2="8" stroke="#2a2a2a" strokeWidth="1" />
            <circle cx="60" cy="8" r="3" fill="#b8960c" />
            <line x1="72" y1="8" x2="120" y2="8" stroke="#2a2a2a" strokeWidth="1" />
          </svg>
        </div>
      </div>
    </div>
  )
}

"use client"

import { useTranslations, useLocale } from "next-intl"
import DOMPurify from "isomorphic-dompurify"
import type { TemplateProps } from "./types"
import { FF, formatDate } from "./_shared"

/** Codex — Editorial. Cream + full-page ornate frame SVG + EX LIBRIS bookplate. */
export default function CodexTemplate({ content, candidate }: TemplateProps) {
  const t = useTranslations("cover_letter_editor")
  const locale = useLocale()
  const today = formatDate(locale)

  const contacts = [candidate.email, candidate.phone, candidate.address].filter(Boolean)

  return (
    <div style={{
      background: "#f8f5ee",
      fontFamily: FF.elegantSerif,
      color: "#2c1f0e",
      fontSize: 14,
      lineHeight: 1.75,
      minHeight: "297mm",
      WebkitPrintColorAdjust: "exact",
      printColorAdjust: "exact",
    }}>
      <div style={{ padding: 60, position: "relative", minHeight: "297mm" }}>
        <svg
          style={{ position: "absolute", top: 20, left: 20, right: 20, bottom: 20, pointerEvents: "none", width: "calc(100% - 40px)", height: "calc(100% - 40px)" }}
          viewBox="0 0 754 1083"
          fill="none"
          preserveAspectRatio="none"
        >
          <rect x="2" y="2" width="750" height="1079" stroke="#8b6340" strokeWidth="1.5" fill="none" />
          <rect x="8" y="8" width="738" height="1067" stroke="#c9a96e" strokeWidth="0.5" fill="none" />
          <path d="M2 2 L30 2 L2 30" stroke="#8b6340" strokeWidth="1" fill="none" />
          <path d="M752 2 L724 2 L752 30" stroke="#8b6340" strokeWidth="1" fill="none" />
          <path d="M2 1081 L30 1081 L2 1053" stroke="#8b6340" strokeWidth="1" fill="none" />
          <path d="M752 1081 L724 1081 L752 1053" stroke="#8b6340" strokeWidth="1" fill="none" />
          <circle cx="377" cy="8" r="3" fill="#c9a96e" />
          <circle cx="377" cy="1075" r="3" fill="#c9a96e" />
          <circle cx="8" cy="541" r="3" fill="#c9a96e" />
          <circle cx="746" cy="541" r="3" fill="#c9a96e" />
        </svg>

        <div style={{ textAlign: "center", paddingBottom: 28, position: "relative" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
            <svg width={100} height={60} viewBox="0 0 100 60" fill="none">
              <path d="M10 50 C10 20 30 5 50 5 C70 5 90 20 90 50 Z" stroke="#8b6340" strokeWidth="1" fill="none" />
              <path d="M25 50 C25 28 36 16 50 15 C64 16 75 28 75 50 Z" stroke="#c9a96e" strokeWidth="0.7" fill="rgba(139,99,64,0.05)" />
              <line x1="50" y1="5" x2="50" y2="50" stroke="#c9a96e" strokeWidth="0.5" />
              <line x1="10" y1="32" x2="90" y2="32" stroke="#c9a96e" strokeWidth="0.5" />
              <circle cx="50" cy="30" r="4" fill="none" stroke="#8b6340" strokeWidth="1" />
              <text x="50" y="58" textAnchor="middle" fontSize="7" fill="#8b6340" fontFamily="serif" letterSpacing="2">EX LIBRIS</text>
            </svg>
          </div>
          {candidate.name && (
            <div style={{ fontFamily: FF.elegantSerif, fontSize: 32, fontWeight: 700, color: "#2c1f0e", letterSpacing: 1 }}>
              {candidate.name}
            </div>
          )}
          <div style={{ margin: "12px auto", width: 200, display: "flex", flexDirection: "column", gap: 3 }}>
            <div style={{ height: 2, background: "#8b6340" }} />
            <div style={{ height: 1, background: "#8b6340" }} />
          </div>
          {candidate.jobTitle && (
            <div style={{ fontFamily: FF.elegantSerif, fontStyle: "italic", fontSize: 16, color: "#6b4a25", margin: "6px 0" }}>
              {candidate.jobTitle}
            </div>
          )}
          {contacts.length > 0 && (
            <div style={{ display: "flex", justifyContent: "center", gap: 20, fontSize: 12, color: "#8b6340", marginTop: 10, flexWrap: "wrap" }}>
              {contacts.map((c, i) => (
                <span key={i} style={{ display: "inline-flex", gap: 8 }}>
                  {i > 0 && <span style={{ color: "#c9a96e" }}> · </span>}
                  <span>{c}</span>
                </span>
              ))}
            </div>
          )}
        </div>

        <div style={{ paddingTop: 28 }}>
          <div style={{ fontSize: 12, color: "#8b6340", marginBottom: 22, fontStyle: "italic" }}>{today}</div>
          {(content.recipientName || content.company) && (
            <div style={{ marginBottom: 18 }}>
              {content.recipientName && (
                <strong style={{ fontFamily: FF.elegantSerif, fontSize: 15, color: "#2c1f0e" }}>{content.recipientName}</strong>
              )}
              {content.company && <span style={{ display: "block", fontSize: 13, color: "#6b4a25" }}>{content.company}</span>}
            </div>
          )}
          <div style={{ fontStyle: "italic", fontSize: 16, color: "#2c1f0e", marginBottom: 18 }}>
            {content.recipientName
              ? t("salutation_named", { name: content.recipientName })
              : t("salutation_generic")}
          </div>
          {content.body ? (
            <div
              style={{ color: "#2c1f0e" }}
              className="[&>p]:mb-[16px] [&>p]:text-justify [&>p:first-of-type:first-letter]:float-left [&>p:first-of-type:first-letter]:text-[52px] [&>p:first-of-type:first-letter]:leading-[0.8] [&>p:first-of-type:first-letter]:mr-[6px] [&>p:first-of-type:first-letter]:mt-[6px] [&>p:first-of-type:first-letter]:font-bold [&>p:first-of-type:first-letter]:text-[#8b6340] [&>ul]:mb-[16px] [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:mb-[16px] [&>ol]:list-decimal [&>ol]:pl-5 prose max-w-none"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content.body) }}
            />
          ) : (
            <p style={{ color: "#cccccc", fontStyle: "italic" }}>{t("body_placeholder_template")}</p>
          )}
          <div style={{ marginTop: 32, display: "flex", justifyContent: "flex-end" }}>
            <div style={{ textAlign: "right" }}>
              {content.closing && (
                <div style={{ fontStyle: "italic", color: "#6b4a25", fontSize: 14 }}>{content.closing},</div>
              )}
              {candidate.name && (
                <div style={{ fontFamily: FF.elegantSerif, fontSize: 22, color: "#2c1f0e", marginTop: 4 }}>{candidate.name}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

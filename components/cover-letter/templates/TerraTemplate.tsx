"use client"

import { useTranslations, useLocale } from "next-intl"
import DOMPurify from "isomorphic-dompurify"
import type { TemplateProps } from "./types"
import { FF, formatDate } from "./_shared"

/** Terra — Minimalista. 220px dark sidebar + leaf SVG. */
export default function TerraTemplate({ content, candidate }: TemplateProps) {
  const t = useTranslations("cover_letter_editor")
  const locale = useLocale()
  const today = formatDate(locale)

  return (
    <div style={{
      background: "#f7f4ef",
      fontFamily: FF.systemSans,
      color: "#2a2418",
      fontSize: 13.5,
      lineHeight: 1.7,
      minHeight: "297mm",
      display: "grid",
      gridTemplateColumns: "220px 1fr",
      WebkitPrintColorAdjust: "exact",
      printColorAdjust: "exact",
    }}>
      <div style={{ background: "#2a2418", padding: "48px 28px", display: "flex", flexDirection: "column" }}>
        <div style={{ marginBottom: 32 }}>
          <svg width={64} height={64} viewBox="0 0 64 64" fill="none">
            <path d="M32 56 C32 56 8 40 8 20 C8 10 18 4 28 6 C20 16 20 32 32 40 C44 32 44 16 36 6 C46 4 56 10 56 20 C56 40 32 56 32 56Z" fill="#6b8f4e" opacity="0.8" />
            <path d="M32 56 L32 30" stroke="#4a6b30" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M20 24 C24 28 28 32 32 36" stroke="#4a6b30" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
            <path d="M44 24 C40 28 36 32 32 36" stroke="#4a6b30" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
          </svg>
        </div>
        {candidate.name && (
          <div style={{ fontFamily: FF.elegantSerif, fontSize: 22, color: "#f7f4ef", lineHeight: 1.2, marginBottom: 4 }}>
            {candidate.name}
          </div>
        )}
        {candidate.jobTitle && (
          <div style={{ fontSize: 11, color: "#8a7a5a", letterSpacing: 2, textTransform: "uppercase", marginBottom: 28 }}>
            {candidate.jobTitle}
          </div>
        )}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 9, letterSpacing: 3, textTransform: "uppercase", color: "#5a5030", marginBottom: 8 }}>Contact</div>
          {candidate.email && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 7, marginBottom: 6, fontSize: 11.5, color: "#c8b898" }}>
              <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="#6b8f4e" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1, opacity: 0.7 }}>
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
              </svg>
              {candidate.email}
            </div>
          )}
          {candidate.phone && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 7, marginBottom: 6, fontSize: 11.5, color: "#c8b898" }}>
              <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="#6b8f4e" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1, opacity: 0.7 }}>
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.63A2 2 0 012 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 8.91A16 16 0 0015.09 17.09l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
              </svg>
              {candidate.phone}
            </div>
          )}
          {candidate.address && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 7, marginBottom: 6, fontSize: 11.5, color: "#c8b898" }}>
              <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="#6b8f4e" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1, opacity: 0.7 }}>
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
              </svg>
              {candidate.address}
            </div>
          )}
        </div>
        {(candidate.jobTitle || content.company) && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 9, letterSpacing: 3, textTransform: "uppercase", color: "#5a5030", marginBottom: 8 }}>Applying for</div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
              {candidate.jobTitle && <span style={{ color: "#f7f4ef", fontSize: 12 }}>{candidate.jobTitle}</span>}
              {content.company && <span style={{ color: "#6a5a3a", fontSize: 11, marginTop: 2 }}>{content.company}</span>}
            </div>
          </div>
        )}
      </div>

      <div style={{ background: "#f7f4ef", padding: "48px 48px" }}>
        <div style={{ fontSize: 11.5, color: "#8a7a5a", marginBottom: 22, fontStyle: "italic" }}>{today}</div>
        {(content.recipientName || content.company) && (
          <div style={{ marginBottom: 16 }}>
            {content.recipientName && (
              <strong style={{ fontFamily: FF.elegantSerif, fontSize: 17, color: "#2a2418", display: "block" }}>{content.recipientName}</strong>
            )}
            {content.company && <span style={{ fontSize: 12, color: "#6a5a3a" }}>{content.company}</span>}
          </div>
        )}
        <div style={{ width: 32, height: 2, background: "#6b8f4e", margin: "20px 0" }} />
        <div style={{ fontFamily: FF.elegantSerif, fontSize: 20, fontStyle: "italic", color: "#2a2418", marginBottom: 18, marginTop: 16 }}>
          {content.recipientName
            ? t("salutation_named", { name: content.recipientName })
            : t("salutation_generic")}
        </div>
        {content.body ? (
          <div
            style={{ color: "#3a3020", fontWeight: 300 }}
            className="[&>p]:mb-[15px] [&>ul]:mb-[15px] [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:mb-[15px] [&>ol]:list-decimal [&>ol]:pl-5 prose max-w-none"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content.body) }}
          />
        ) : (
          <p style={{ color: "#cccccc", fontStyle: "italic" }}>{t("body_placeholder_template")}</p>
        )}
        {content.closing && (
          <div style={{ color: "#6a5a3a", fontStyle: "italic", marginTop: 30 }}>{content.closing},</div>
        )}
        {candidate.name && (
          <div style={{ fontFamily: FF.elegantSerif, fontSize: 26, color: "#2a2418", marginTop: 4 }}>{candidate.name}</div>
        )}
      </div>
    </div>
  )
}

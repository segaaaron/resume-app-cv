"use client"

import { useTranslations, useLocale } from "next-intl"
import DOMPurify from "isomorphic-dompurify"
import type { TemplateProps } from "./types"
import { FF, formatDate } from "./_shared"

/** Signal — Ejecutivo. Dark navy #0f2240 + teal #00b8c4 + inline SVG icons. */
export default function SignalTemplate({ content, candidate }: TemplateProps) {
  const t = useTranslations("cover_letter_editor")
  const locale = useLocale()
  const today = formatDate(locale)

  const ICON_MAIL = (
    <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#00b8c4" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  )
  const ICON_PHONE = (
    <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#00b8c4" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.63A2 2 0 012 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 8.91A16 16 0 0015.09 17.09l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
    </svg>
  )
  const ICON_PIN = (
    <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#00b8c4" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
  const ICON_LN = (
    <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#00b8c4" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  )

  const items: { icon: React.ReactNode; v: string }[] = []
  if (candidate.email) items.push({ icon: ICON_MAIL, v: candidate.email })
  if (candidate.phone) items.push({ icon: ICON_PHONE, v: candidate.phone })
  if (candidate.address) items.push({ icon: ICON_PIN, v: candidate.address })
  if (candidate.linkedin) items.push({ icon: ICON_LN, v: candidate.linkedin })

  return (
    <div style={{
      background: "#fff",
      fontFamily: FF.systemSans,
      width: "100%",
      color: "#1a2332",
      fontSize: 14,
      lineHeight: 1.6,
      minHeight: "297mm",
      display: "flex",
      flexDirection: "column",
      WebkitPrintColorAdjust: "exact",
      printColorAdjust: "exact",
    }}>
      <div style={{ background: "#0f2240", padding: "44px 52px 36px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -40, right: -40, width: 200, height: 200, borderRadius: "50%", background: "rgba(0,184,196,0.12)" }} />
        <div style={{ position: "absolute", bottom: -30, right: 60, width: 120, height: 120, borderRadius: "50%", background: "rgba(0,184,196,0.07)" }} />
        <div style={{ position: "relative" }}>
          {candidate.name && (
            <div style={{ fontSize: 34, fontWeight: 700, color: "#fff", letterSpacing: "-0.5px" }}>{candidate.name}</div>
          )}
          {candidate.jobTitle && (
            <div style={{ fontSize: 14, fontWeight: 400, color: "#00b8c4", letterSpacing: 2, textTransform: "uppercase", marginTop: 4 }}>
              {candidate.jobTitle}
            </div>
          )}
          <div style={{ display: "flex", gap: 28, marginTop: 24, flexWrap: "wrap" }}>
            {items.map((it, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, color: "#c8d8e8", fontSize: 12 }}>
                <span style={{ opacity: 0.85, display: "inline-flex" }}>{it.icon}</span>
                {it.v}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding: "44px 52px", flex: 1 }}>
        <div style={{ fontSize: 12, color: "#7a8a9a", marginBottom: 28, letterSpacing: "0.5px" }}>{today}</div>
        {(content.recipientName || content.company) && (
          <div style={{ marginBottom: 28 }}>
            {content.recipientName && <strong style={{ display: "block", fontWeight: 600, color: "#0f2240" }}>{content.recipientName}</strong>}
            {content.company}
          </div>
        )}
        <div style={{ width: 48, height: 3, background: "#00b8c4", margin: "20px 0" }} />
        <div style={{ fontWeight: 600, color: "#0f2240", marginBottom: 16 }}>
          {content.recipientName
            ? t("salutation_named", { name: content.recipientName })
            : t("salutation_generic")}
        </div>
        {content.body ? (
          <div
            style={{ color: "#2c3e50", fontSize: 13.5 }}
            className="[&>p]:mb-[16px] [&>ul]:mb-[16px] [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:mb-[16px] [&>ol]:list-decimal [&>ol]:pl-5 prose max-w-none"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content.body) }}
          />
        ) : (
          <p style={{ color: "#cccccc", fontStyle: "italic" }}>{t("body_placeholder_template")}</p>
        )}
        <div style={{ marginTop: 36 }}>
          {content.closing && <div style={{ fontSize: 13, color: "#2c3e50", marginBottom: 6 }}>{content.closing},</div>}
          {candidate.name && <div style={{ fontSize: 18, fontWeight: 700, color: "#0f2240", marginTop: 4 }}>{candidate.name}</div>}
          {candidate.jobTitle && (
            <div style={{ fontSize: 12, color: "#00b8c4", letterSpacing: 1, textTransform: "uppercase" }}>{candidate.jobTitle}</div>
          )}
        </div>
      </div>

      <div style={{ background: "#0f2240", height: 5, marginTop: "auto" }} />
    </div>
  )
}

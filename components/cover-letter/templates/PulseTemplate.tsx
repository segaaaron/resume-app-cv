"use client"

import { useTranslations, useLocale } from "next-intl"
import DOMPurify from "isomorphic-dompurify"
import type { TemplateProps } from "./types"
import { FF, formatDate } from "./_shared"

/** Pulse — Tech. Sky-blue + hardcoded expertise bars (per user spec). */
export default function PulseTemplate({ content, candidate }: TemplateProps) {
  const t = useTranslations("cover_letter_editor")
  const locale = useLocale()
  const today = formatDate(locale)

  // NOTE: Skill bar labels and percentages are hardcoded by design decision (user-confirmed).
  // They are a decorative/visual identity element of this template.
  const SKILLS: { label: string; pct: number }[] = [
    { label: "Product Design", pct: 95 },
    { label: "UX Research", pct: 88 },
    { label: "Design Systems", pct: 84 },
    { label: "Prototyping", pct: 92 },
  ]

  const contacts = [candidate.email, candidate.phone, candidate.address].filter(Boolean)

  return (
    <div style={{
      background: "#F0F9FF",
      fontFamily: FF.systemSans,
      fontSize: "10.5pt",
      lineHeight: 1.75,
      color: "#0c4a6e",
      minHeight: "297mm",
      padding: "56px 72px",
      WebkitPrintColorAdjust: "exact",
      printColorAdjust: "exact",
    }}>
      {candidate.name && (
        <div style={{ fontSize: 26, fontWeight: 700, color: "#0C4A6E", letterSpacing: "-0.02em", marginBottom: 3 }}>
          {candidate.name}
        </div>
      )}
      {candidate.jobTitle && (
        <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#0EA5E9", marginBottom: 24 }}>
          {candidate.jobTitle}
        </div>
      )}

      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.14em", color: "#7DD3FC", marginBottom: 12 }}>
          Expertise
        </div>
        {SKILLS.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <span style={{ fontSize: 9, letterSpacing: "0.04em", color: "#0369A1", width: 120, flexShrink: 0, fontWeight: 500 }}>
              {s.label}
            </span>
            <div style={{ flex: 1, height: 4, background: "#BAE6FD", borderRadius: 4, overflow: "hidden" }}>
              <div style={{ width: `${s.pct}%`, height: "100%", background: "linear-gradient(90deg, #0EA5E9, #38BDF8)", borderRadius: 4 }} />
            </div>
            <span style={{ fontSize: 8, color: "#7DD3FC", width: 28, textAlign: "right", flexShrink: 0, fontFamily: FF.systemMono }}>
              {s.pct}%
            </span>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
        {contacts.map((c, i) => (
          <span key={i} style={{
            background: "#E0F2FE",
            border: "1px solid #BAE6FD",
            borderRadius: 20,
            padding: "4px 12px",
            fontSize: 9,
            color: "#0369A1",
            fontWeight: 500,
          }}>{c}</span>
        ))}
      </div>

      <hr style={{ border: "none", borderTop: "1px solid #BAE6FD", margin: "16px 0" }} />
      <div style={{ fontSize: 10, color: "#7DD3FC", marginBottom: 8, fontFamily: FF.systemMono }}>{today}</div>
      {(content.recipientName || content.company) && (
        <div style={{ fontSize: "10.5pt", color: "#0369A1", marginBottom: 22, lineHeight: 1.65 }}>
          {content.recipientName}{content.recipientName && content.company && <br />}{content.company}
        </div>
      )}
      <p style={{ fontSize: "10.5pt", marginBottom: 16, color: "#0C4A6E" }}>
        {content.recipientName
          ? t("salutation_named", { name: content.recipientName })
          : t("salutation_generic")}
      </p>
      {content.body ? (
        <div
          style={{ fontSize: "10.5pt", lineHeight: 1.87, color: "#0C4A6E" }}
          className="[&>p]:mb-[16px] [&>ul]:mb-[16px] [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:mb-[16px] [&>ol]:list-decimal [&>ol]:pl-5 prose max-w-none"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content.body) }}
        />
      ) : (
        <p style={{ fontSize: "10.5pt", color: "#cccccc", fontStyle: "italic" }}>{t("body_placeholder_template")}</p>
      )}
      {content.closing && (
        <div style={{ marginTop: 44, fontSize: 10, color: "#7DD3FC", letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: FF.systemMono }}>
          {content.closing}
        </div>
      )}
      {candidate.name && (
        <div style={{ marginTop: 16, fontSize: 15, fontWeight: 700, color: "#0EA5E9" }}>{candidate.name}</div>
      )}
    </div>
  )
}

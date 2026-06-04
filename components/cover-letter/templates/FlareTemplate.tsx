"use client"

import { useTranslations, useLocale } from "next-intl"
import DOMPurify from "isomorphic-dompurify"
import type { TemplateProps } from "./types"
import { FF, formatDate } from "./_shared"

/** Flare — Creativo. Orange/yellow gradient + starburst + zigzag divider. */
export default function FlareTemplate({ content, candidate }: TemplateProps) {
  const t = useTranslations("cover_letter_editor")
  const locale = useLocale()
  const today = formatDate(locale)

  return (
    <div style={{
      background: "#fff",
      fontFamily: FF.systemSans,
      color: "#1a0a2e",
      fontSize: 13.5,
      lineHeight: 1.65,
      minHeight: "297mm",
      WebkitPrintColorAdjust: "exact",
      printColorAdjust: "exact",
    }}>
      <div style={{
        background: "linear-gradient(135deg, #ff6b35 0%, #f7c948 50%, #ff6b35 100%)",
        padding: "50px 56px 42px",
        position: "relative",
        overflow: "hidden",
      }}>
        <svg style={{ position: "absolute", right: -30, top: -30, opacity: 0.25 }} width={280} height={280} viewBox="0 0 280 280" fill="none">
          <g>
            <polygon points="140,0 148,100 140,110 132,100" fill="#1a0a2e" />
            <polygon points="140,280 148,180 140,170 132,180" fill="#1a0a2e" />
            <polygon points="0,140 100,148 110,140 100,132" fill="#1a0a2e" />
            <polygon points="280,140 180,132 170,140 180,148" fill="#1a0a2e" />
            <polygon points="197,42 164,134 155,138 156,128" fill="#1a0a2e" opacity="0.6" />
            <polygon points="238,83 146,116 142,125 151,122" fill="#1a0a2e" opacity="0.6" />
            <polygon points="238,197 146,164 142,155 151,158" fill="#1a0a2e" opacity="0.6" />
            <polygon points="197,238 164,146 155,142 156,152" fill="#1a0a2e" opacity="0.6" />
            <polygon points="83,238 116,146 125,142 122,151" fill="#1a0a2e" opacity="0.6" />
            <polygon points="42,197 134,164 138,155 128,158" fill="#1a0a2e" opacity="0.6" />
            <polygon points="42,83 134,116 138,125 128,122" fill="#1a0a2e" opacity="0.6" />
            <polygon points="83,42 116,134 125,138 122,128" fill="#1a0a2e" opacity="0.6" />
            <circle cx="140" cy="140" r="20" fill="#1a0a2e" opacity="0.3" />
          </g>
        </svg>
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ fontFamily: FF.elegantSerif, fontSize: 10, letterSpacing: 4, textTransform: "uppercase", color: "rgba(26,10,46,0.6)", marginBottom: 8 }}>
            Cover Letter
          </div>
          {candidate.name && (
            <div style={{ fontFamily: FF.elegantSerif, fontSize: 42, fontWeight: 800, color: "#1a0a2e", lineHeight: 1, letterSpacing: "-1px" }}>
              {candidate.name}
            </div>
          )}
          {candidate.jobTitle && (
            <div style={{ fontFamily: FF.elegantSerif, fontSize: 14, fontWeight: 500, color: "rgba(26,10,46,0.7)", marginTop: 6 }}>{candidate.jobTitle}</div>
          )}
          <div style={{ display: "flex", gap: 10, marginTop: 20, flexWrap: "wrap" }}>
            {[candidate.email, candidate.phone, candidate.address].filter(Boolean).map((c, i) => (
              <div key={i} style={{
                background: "rgba(26,10,46,0.12)",
                borderRadius: 20,
                padding: "5px 14px",
                fontSize: 11.5,
                color: "#1a0a2e",
                fontWeight: 600,
              }}>{c}</div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding: "40px 56px" }}>
        <svg style={{ height: 24, marginBottom: 28, width: "100%" }} viewBox="0 0 682 24" preserveAspectRatio="none">
          <polyline
            points="0,0 34,24 68,0 102,24 136,0 170,24 204,0 238,24 272,0 306,24 340,0 374,24 408,0 442,24 476,0 510,24 544,0 578,24 612,0 646,24 682,0"
            fill="none"
            stroke="#f7c948"
            strokeWidth="2"
          />
        </svg>
        <div style={{ fontSize: 11.5, color: "#8a7a9a", marginBottom: 20 }}>{today}</div>
        {(content.recipientName || content.company) && (
          <div style={{ marginBottom: 16 }}>
            {content.recipientName && (
              <strong style={{ fontFamily: FF.elegantSerif, fontSize: 16, fontWeight: 700, color: "#1a0a2e" }}>{content.recipientName}</strong>
            )}
            {content.company && <span style={{ display: "block", fontSize: 12, color: "#6a5a7a" }}>{content.company}</span>}
          </div>
        )}
        <div style={{ fontFamily: FF.elegantSerif, fontSize: 18, fontWeight: 600, color: "#ff6b35", marginBottom: 16 }}>
          {content.recipientName
            ? t("salutation_named", { name: content.recipientName })
            : t("salutation_generic")}
        </div>
        {content.body ? (
          <div
            style={{ color: "#2a1a3e", fontWeight: 300 }}
            className="[&>p]:mb-[15px] [&>ul]:mb-[15px] [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:mb-[15px] [&>ol]:list-decimal [&>ol]:pl-5 prose max-w-none"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content.body) }}
          />
        ) : (
          <p style={{ color: "#cccccc", fontStyle: "italic" }}>{t("body_placeholder_template")}</p>
        )}
        <div style={{ marginTop: 36, display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div>
            {content.closing && <div style={{ color: "#8a7a9a", fontSize: 12 }}>{content.closing},</div>}
            {candidate.name && (
              <div style={{ fontFamily: FF.elegantSerif, fontSize: 26, fontWeight: 800, color: "#1a0a2e" }}>{candidate.name}</div>
            )}
          </div>
          <svg style={{ opacity: 0.15 }} width={80} height={80} viewBox="0 0 80 80">
            <polygon points="40,5 46,28 68,28 51,42 57,65 40,52 23,65 29,42 12,28 34,28" fill="#ff6b35" />
          </svg>
        </div>
      </div>
    </div>
  )
}

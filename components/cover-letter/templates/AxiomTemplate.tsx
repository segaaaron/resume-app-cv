"use client"

import { useTranslations, useLocale } from "next-intl"
import DOMPurify from "isomorphic-dompurify"
import type { TemplateProps } from "./types"
import { FF, formatDate } from "./_shared"

/** Axiom — Tech. Softened GitHub dark + circuit SVG bg. */
export default function AxiomTemplate({ content, candidate }: TemplateProps) {
  const t = useTranslations("cover_letter_editor")
  const locale = useLocale()
  const today = formatDate(locale)

  const BG = "#1a1f2a"
  const PANEL = "#222831"
  const BORDER = "#30363D"

  return (
    <div style={{
      background: BG,
      fontFamily: FF.systemSans,
      color: "#c9d1d9",
      fontSize: 13,
      lineHeight: 1.6,
      minHeight: "297mm",
      WebkitPrintColorAdjust: "exact",
      printColorAdjust: "exact",
    }}>
      <div style={{ background: BG, borderBottom: `1px solid ${BORDER}`, padding: "40px 52px 32px", position: "relative", overflow: "hidden" }}>
        <svg style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: 320, opacity: 0.15 }} viewBox="0 0 320 240" fill="none">
          <line x1="0" y1="40" x2="80" y2="40" stroke="#58a6ff" strokeWidth="1" />
          <line x1="80" y1="40" x2="80" y2="80" stroke="#58a6ff" strokeWidth="1" />
          <line x1="80" y1="80" x2="160" y2="80" stroke="#58a6ff" strokeWidth="1" />
          <line x1="160" y1="80" x2="160" y2="20" stroke="#58a6ff" strokeWidth="1" />
          <line x1="160" y1="20" x2="260" y2="20" stroke="#58a6ff" strokeWidth="1" />
          <line x1="200" y1="80" x2="200" y2="140" stroke="#3fb950" strokeWidth="1" />
          <line x1="200" y1="140" x2="320" y2="140" stroke="#3fb950" strokeWidth="1" />
          <line x1="120" y1="80" x2="120" y2="160" stroke="#a371f7" strokeWidth="1" />
          <line x1="120" y1="160" x2="280" y2="160" stroke="#a371f7" strokeWidth="1" />
          <line x1="40" y1="40" x2="40" y2="180" stroke="#58a6ff" strokeWidth="0.5" />
          <line x1="40" y1="180" x2="240" y2="180" stroke="#58a6ff" strokeWidth="0.5" />
          <circle cx="80" cy="40" r="3" fill="#58a6ff" />
          <circle cx="80" cy="80" r="3" fill="#58a6ff" />
          <circle cx="160" cy="80" r="3" fill="#58a6ff" />
          <circle cx="200" cy="140" r="3" fill="#3fb950" />
          <circle cx="120" cy="160" r="3" fill="#a371f7" />
          <rect x="155" y="15" width="10" height="10" stroke="#58a6ff" strokeWidth="1" fill={BG} />
          <rect x="195" y="75" width="10" height="10" stroke="#3fb950" strokeWidth="1" fill={BG} />
          <rect x="115" y="155" width="10" height="10" stroke="#a371f7" strokeWidth="1" fill={BG} />
        </svg>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#3fb950" }} />
          <div style={{ fontFamily: FF.systemMono, fontSize: 10, color: "#3fb950", letterSpacing: 1 }}>READY // COVER_LETTER.md</div>
        </div>
        {candidate.name && (
          <div style={{ fontSize: 36, fontWeight: 700, color: "#f0f6fc", letterSpacing: "-0.5px" }}>{candidate.name}</div>
        )}
        {candidate.jobTitle && (
          <div style={{
            display: "inline-block",
            background: PANEL,
            border: `1px solid ${BORDER}`,
            color: "#58a6ff",
            fontFamily: FF.systemMono,
            fontSize: 11,
            padding: "3px 10px",
            borderRadius: 4,
            marginTop: 8,
          }}>{"// "}{candidate.jobTitle}</div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 8, marginTop: 20, maxWidth: 480 }}>
          {candidate.email && <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: FF.systemMono, fontSize: 11, color: "#8b949e" }}><span style={{ color: "#3fb950", marginRight: 2 }}>@</span>{candidate.email}</div>}
          {candidate.phone && <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: FF.systemMono, fontSize: 11, color: "#8b949e" }}><span style={{ color: "#3fb950", marginRight: 2 }}>tel:</span>{candidate.phone}</div>}
          {candidate.address && <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: FF.systemMono, fontSize: 11, color: "#8b949e" }}><span style={{ color: "#3fb950", marginRight: 2 }}>loc:</span>{candidate.address}</div>}
          {candidate.linkedin && <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: FF.systemMono, fontSize: 11, color: "#8b949e" }}><span style={{ color: "#3fb950", marginRight: 2 }}>ln:</span>{candidate.linkedin}</div>}
        </div>
      </div>

      <div style={{ padding: "36px 52px" }}>
        <div style={{
          background: PANEL,
          border: `1px solid ${BORDER}`,
          borderRadius: 6,
          padding: "16px 20px",
          marginBottom: 24,
          fontFamily: FF.systemMono,
          fontSize: 11,
        }}>
          <div style={{ color: "#8b949e", marginBottom: 4 }}>{"/* Application Metadata */"}</div>
          {content.recipientName && <div style={{ marginBottom: 4 }}><span style={{ color: "#79c0ff" }}>to: </span><span style={{ color: "#a8d5a2" }}>{`"${content.recipientName}"`}</span></div>}
          {content.company && <div style={{ marginBottom: 4 }}><span style={{ color: "#79c0ff" }}>company: </span><span style={{ color: "#a8d5a2" }}>{`"${content.company}"`}</span></div>}
          {candidate.jobTitle && <div style={{ marginBottom: 4 }}><span style={{ color: "#79c0ff" }}>role: </span><span style={{ color: "#a8d5a2" }}>{`"${candidate.jobTitle}"`}</span></div>}
          <div style={{ marginBottom: 4 }}><span style={{ color: "#79c0ff" }}>date: </span><span style={{ color: "#a5d6ff" }}>{today}</span></div>
        </div>
        <div style={{
          fontFamily: FF.systemMono,
          fontSize: 10,
          color: "#3fb950",
          letterSpacing: 2,
          textTransform: "uppercase",
          marginBottom: 14,
          borderBottom: `1px solid ${BORDER}`,
          paddingBottom: 6,
        }}>{"// message"}</div>
        <p style={{ marginBottom: 14, color: "#c9d1d9", fontSize: 13 }}>
          {content.recipientName
            ? t("salutation_named", { name: content.recipientName })
            : t("salutation_generic")}
        </p>
        {content.body ? (
          <div
            style={{ color: "#c9d1d9", fontSize: 13 }}
            className="[&>p]:mb-[14px] [&>ul]:mb-[14px] [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:mb-[14px] [&>ol]:list-decimal [&>ol]:pl-5"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content.body) }}
          />
        ) : (
          <p style={{ color: "#6E7681", fontStyle: "italic" }}>{t("body_placeholder_template")}</p>
        )}
        <div style={{ marginTop: 32, paddingTop: 20, borderTop: `1px solid ${BORDER}`, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            {content.closing && (
              <div style={{ color: "#8b949e", fontSize: 12, marginBottom: 6 }}>{content.closing},</div>
            )}
            {candidate.name && (
              <div style={{ fontSize: 20, fontWeight: 700, color: "#f0f6fc" }}>{candidate.name}</div>
            )}
            {candidate.jobTitle && (
              <div style={{ fontFamily: FF.systemMono, fontSize: 11, color: "#58a6ff", marginTop: 2 }}>{"// "}{candidate.jobTitle}</div>
            )}
          </div>
          <div style={{ fontFamily: FF.systemMono, fontSize: 10, color: "#3a4048", textAlign: "right" }}>SHA: a4f7c2b1</div>
        </div>
      </div>
    </div>
  )
}

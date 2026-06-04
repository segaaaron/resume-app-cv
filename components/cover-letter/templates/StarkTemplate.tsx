"use client"

import { useTranslations, useLocale } from "next-intl"
import DOMPurify from "isomorphic-dompurify"
import type { TemplateProps } from "./types"
import { FF, formatDate } from "./_shared"

/**
 * Stark — Minimalista (code-editor look). Source: Catppuccin palette w/ Courier mono.
 * Dark-bg softened per spec: #1E1E2E → #2A2A3A.
 */
export default function StarkTemplate({ content, candidate }: TemplateProps) {
  const t = useTranslations("cover_letter_editor")
  const locale = useLocale()
  const today = formatDate(locale)

  const BG = "#2A2A3A"
  const PANEL = "#22222F"
  const BORDER = "#3D3D52"

  const greeting = content.recipientName
    ? t("salutation_named", { name: content.recipientName })
    : t("salutation_generic")

  return (
    <div style={{
      background: BG,
      fontFamily: FF.systemMono,
      fontSize: 10,
      lineHeight: 1.75,
      color: "#CDD6F4",
      minHeight: "297mm",
      display: "flex",
      flexDirection: "column",
      WebkitPrintColorAdjust: "exact",
      printColorAdjust: "exact",
    }}>
      {/* Titlebar */}
      <div style={{
        background: PANEL,
        display: "flex",
        alignItems: "center",
        flexShrink: 0,
        borderBottom: `1px solid ${BORDER}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 14px" }}>
          <div style={{ width: 11, height: 11, borderRadius: "50%", background: "#FF5F57" }} />
          <div style={{ width: 11, height: 11, borderRadius: "50%", background: "#FFBD2E" }} />
          <div style={{ width: 11, height: 11, borderRadius: "50%", background: "#28C941" }} />
        </div>
        <div style={{
          background: BG,
          borderTop: "1px solid #CBA6F7",
          padding: "8px 20px",
          fontSize: 9,
          color: "#CDD6F4",
          letterSpacing: "0.04em",
        }}>cover_letter.txt</div>
        <div style={{ flex: 1, background: PANEL }} />
      </div>

      {/* Editor */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Gutter */}
        <div style={{
          width: 44,
          flexShrink: 0,
          background: PANEL,
          borderRight: `1px solid ${BORDER}`,
          display: "flex",
          flexDirection: "column",
          padding: "16px 0",
          color: "#45475A",
          fontSize: 8.5,
          textAlign: "right",
          lineHeight: 1.75,
        }}>
          {Array.from({ length: 30 }, (_, i) => (
            <span key={i} style={{ display: "block", paddingRight: 10 }}>{i + 1}</span>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: "16px 28px", overflow: "hidden" }}>
          {candidate.name && (
            <div style={{ color: "#CBA6F7", fontSize: 16, fontWeight: "bold", letterSpacing: "0.02em", marginBottom: 2 }}>
              {candidate.name}
            </div>
          )}
          {candidate.jobTitle && (
            <div style={{ color: "#89DCEB", fontSize: 9.5, marginBottom: 6 }}>// {candidate.jobTitle}</div>
          )}
          <div style={{ color: "#6C7086", fontSize: 9, margin: "8px 0 2px" }}>/* contact */</div>
          {candidate.email && (
            <div style={{ color: "#A6E3A1", fontSize: 9, marginBottom: 2 }}>
              <span style={{ color: "#89B4FA" }}>email</span>: <span style={{ color: "#FAB387" }}>{`"${candidate.email}"`}</span>
            </div>
          )}
          {candidate.phone && (
            <div style={{ color: "#A6E3A1", fontSize: 9, marginBottom: 2 }}>
              <span style={{ color: "#89B4FA" }}>phone</span>: <span style={{ color: "#FAB387" }}>{`"${candidate.phone}"`}</span>
            </div>
          )}
          {candidate.address && (
            <div style={{ color: "#A6E3A1", fontSize: 9, marginBottom: 2 }}>
              <span style={{ color: "#89B4FA" }}>location</span>: <span style={{ color: "#FAB387" }}>{`"${candidate.address}"`}</span>
            </div>
          )}
          <div style={{ color: "#6C7086", fontSize: 9, margin: "8px 0 2px" }}>
            {`/* ${today}${content.recipientName ? ` — to: ${content.recipientName}` : ""}${content.company ? ` @ ${content.company}` : ""} */`}
          </div>
          <br />
          <div style={{ color: "#6C7086", fontSize: 9, margin: "8px 0 2px" }}>/* greeting */</div>
          <div style={{ color: "#CDD6F4", fontSize: 9.5, lineHeight: 1.8, marginBottom: 8 }}>{greeting}</div>
          <br />
          <div style={{ color: "#6C7086", fontSize: 9, margin: "8px 0 2px" }}>/* body */</div>
          {content.body ? (
            <div
              style={{ color: "#CDD6F4", fontSize: 9.5, lineHeight: 1.8 }}
              className="[&>p]:mb-[8px] [&>ul]:mb-[8px] [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:mb-[8px] [&>ol]:list-decimal [&>ol]:pl-5"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content.body) }}
            />
          ) : (
            <div style={{ color: "#6C7086", fontSize: 9.5, fontStyle: "italic" }}>{t("body_placeholder_template")}</div>
          )}
          <br />
          <div style={{ color: "#6C7086", fontSize: 9, margin: "8px 0 2px" }}>/* closing */</div>
          {content.closing && (
            <div style={{ color: "#CDD6F4", fontSize: 9.5, lineHeight: 1.8, marginBottom: 8 }}>{content.closing},</div>
          )}
          {candidate.name && (
            <div style={{ color: "#CBA6F7", fontSize: 11, fontWeight: "bold", marginTop: 4 }}>{candidate.name}</div>
          )}
        </div>
      </div>

      {/* Status bar */}
      <div style={{
        background: "#89B4FA",
        height: 20,
        display: "flex",
        alignItems: "center",
        padding: "0 14px",
        gap: 20,
        flexShrink: 0,
        marginTop: "auto",
      }}>
        <span style={{ fontSize: 8, color: BG, letterSpacing: "0.04em", fontWeight: 600 }}>NORMAL</span>
        <span style={{ fontSize: 8, color: BG, letterSpacing: "0.04em", fontWeight: 600 }}>cover_letter.txt</span>
        <span style={{ fontSize: 8, color: BG, letterSpacing: "0.04em", fontWeight: 600 }}>UTF-8</span>
        {content.company && <span style={{ fontSize: 8, color: BG, letterSpacing: "0.04em", fontWeight: 600 }}>{content.company}</span>}
      </div>
    </div>
  )
}

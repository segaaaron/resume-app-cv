"use client"

import { useTranslations } from "next-intl"
import LetterBody from "./LetterBody"
import type { TemplateProps } from "./types"

export default function ElegantTemplate({ content, colorScheme, candidate }: TemplateProps) {
  const t = useTranslations("cover_letter_editor")
  const today = new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })

  const contacts = [
    candidate.email,
    candidate.phone,
    candidate.linkedin,
    candidate.website,
    candidate.address,
  ].filter(Boolean)

  const hex = colorScheme ?? "#2a72d7"
  // Lateral padding matches DOCX BODY_INDENT: 1.1in = 27.94mm
  const PAD_H = "27.94mm"

  return (
    <div style={{
      fontFamily: "Calibri, 'Segoe UI', Arial, sans-serif",
      minHeight: "297mm",
      display: "flex",
      flexDirection: "column",
      fontSize: "11pt",
      color: "#1a1a1a",
    }}>

      {/* ── HEADER — full-width color block ── */}
      <div style={{
        background: hex,
        padding: `0.2in ${PAD_H} 0.2in`,
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {candidate.photo && (
            <img
              src={candidate.photo}
              alt={candidate.name}
              style={{
                width: 56, height: 56, borderRadius: "50%",
                objectFit: "cover", flexShrink: 0,
                border: "2px solid rgba(255,255,255,0.45)",
                objectPosition: `center ${candidate.photoPosition ?? 50}%`,
              }}
            />
          )}
          <div style={{ flex: 1 }}>
            {candidate.name && (
              <div style={{
                fontSize: "16pt", fontWeight: 700, color: "#FFFFFF",
                letterSpacing: "0.01em", lineHeight: 1.15, marginBottom: 2,
              }}>
                {candidate.name.toUpperCase()}
              </div>
            )}
            {candidate.jobTitle && (
              <div style={{
                fontSize: "10pt", color: "rgba(255,255,255,0.8)",
                letterSpacing: "0.08em", textTransform: "uppercase",
                marginBottom: contacts.length ? 8 : 0,
              }}>
                {candidate.jobTitle}
              </div>
            )}
            {contacts.length > 0 && (
              <div style={{
                fontSize: "9pt", color: "rgba(255,255,255,0.7)",
                display: "flex", flexWrap: "wrap", gap: "2px 0",
                lineHeight: 1.5,
              }}>
                {contacts.map((c, i) => (
                  <span key={i}>
                    {c}
                    {i < contacts.length - 1 && (
                      <span style={{ color: "rgba(255,255,255,0.35)", margin: "0 8px" }}>|</span>
                    )}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Accent divider ── */}
      <div style={{ height: 3, background: hex, flexShrink: 0, opacity: 0.85 }} />

      {/* ── BODY — flex column, signature pinned to bottom ── */}
      <div style={{
        padding: `12pt ${PAD_H} 0`,
        flex: 1,
        display: "flex",
        flexDirection: "column",
      }}>
        <div style={{ flex: 1 }}>

          {/* Date — right-aligned, italic, standard */}
          <div style={{
            textAlign: "right",
            fontSize: "10pt",
            color: "#666666",
            fontStyle: "italic",
            marginBottom: "12pt",
            lineHeight: 1,
          }}>
            {today}
          </div>

          {/* Recipient block */}
          {(content.recipientName || content.recipientTitle || content.company) && (
            <div style={{ marginBottom: "12pt", lineHeight: 1.4 }}>
              {content.recipientName && (
                <div style={{ fontSize: "11pt", fontWeight: 700 }}>{content.recipientName}</div>
              )}
              {content.recipientTitle && (
                <div style={{ fontSize: "11pt", color: "#444444" }}>{content.recipientTitle}</div>
              )}
              {content.company && (
                <div style={{ fontSize: "11pt", color: "#444444" }}>{content.company}</div>
              )}
            </div>
          )}

          {/* Subject line — bold, colored label, standard ES format */}
          {content.subject && (
            <div style={{ fontSize: "11pt", fontWeight: 700, marginBottom: "12pt", lineHeight: 1.4 }}>
              <span style={{ color: hex }}>Asunto: </span>
              <span>{content.subject}</span>
            </div>
          )}

          {/* Salutation — colon (ES standard) */}
          <div style={{ fontSize: "11pt", marginBottom: "10pt", lineHeight: 1.4 }}>
            {content.recipientName
              ? t("salutation_named", { name: content.recipientName })
              : t("salutation_generic")}
          </div>

          {/* Body — LEFT aligned, NO indent, single line spacing (ES standard) */}
          {content.body ? (
            <LetterBody html={content.body ?? ""} style={{ color: "#1a1a1a", marginBottom: "10pt" }} />
          ) : (
            <p style={{ fontSize: "11pt", color: "#cccccc", fontStyle: "italic", marginBottom: "10pt" }}>
              {t("body_placeholder_template")}
            </p>
          )}

          {/* Complimentary close */}
          {content.closing && (
            <div style={{ fontSize: "11pt", lineHeight: 1.4 }}>
              {content.closing},
            </div>
          )}
        </div>

        {/* ── SIGNATURE — always pinned to bottom ── */}
        <div style={{ marginTop: "auto", paddingTop: "28pt", paddingBottom: "0.75in" }}>
          {/* Short accent line above name */}
          <div style={{
            height: "1.5px",
            width: 100,
            background: hex,
            marginBottom: "6pt",
            opacity: 0.8,
          }} />
          {candidate.name && (
            <div style={{ fontSize: "11pt", fontWeight: 700, color: hex, lineHeight: 1.3 }}>
              {candidate.name}
            </div>
          )}
          {candidate.jobTitle && (
            <div style={{ fontSize: "10pt", color: "#666666", marginTop: 2 }}>
              {candidate.jobTitle}
            </div>
          )}
          {candidate.phone && (
            <div style={{ fontSize: "9pt", color: "#888888", marginTop: 1 }}>
              {candidate.phone}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

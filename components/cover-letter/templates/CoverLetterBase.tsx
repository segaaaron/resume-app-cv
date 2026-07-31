"use client"

/**
 * CoverLetterBase — one engine, 15 letter looks.
 *
 * Ported from the ReadyCV premium letter set (ltr-*). Every variant differs by
 * header treatment, typography and accent — NOT by colour: the accent is always
 * `colorScheme` so the user keeps their palette across every letter. System fonts
 * only (serif/sans) so the PDF microservice never depends on a CDN font.
 *
 * Structure mirrors the existing letter templates (ElegantTemplate): header →
 * accent → date/recipient/subject/salutation → body (sanitised HTML) → signature
 * pinned to the bottom. i18n salutations come from cover_letter_editor.
 */
import { useTranslations } from "next-intl"
import DOMPurify from "isomorphic-dompurify"
import type { TemplateProps } from "./types"

type HeaderStyle = "band" | "rule" | "minimal" | "centered" | "rail"

export interface LetterVariant {
  header: HeaderStyle
  serif?: boolean
}

export const LETTER_VARIANTS: Record<string, LetterVariant> = {
  meridian: { header: "band" },
  verdant: { header: "rail" },
  cardinal: { header: "rule", serif: true },
  cobalt: { header: "rail" },
  slate: { header: "minimal" },
  nordic: { header: "centered" },
  onyx: { header: "minimal" },
  sable: { header: "band", serif: true },
  cerulean: { header: "band" },
  ivory: { header: "minimal" },
  garnet: { header: "rule", serif: true },
  copper: { header: "band", serif: true },
  harbor: { header: "rule" },
  graphite: { header: "band" },
  sequoia: { header: "rule", serif: true },
}

const SERIF = 'Georgia, "Times New Roman", Times, serif'
const SANS = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, system-ui, sans-serif'
const PAD_H = "27.94mm" // = DOCX BODY_INDENT 1.1in

export default function CoverLetterBase({ content, candidate, colorScheme, variant }: TemplateProps & { variant: LetterVariant }) {
  const t = useTranslations("cover_letter_editor")
  const today = new Date().toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" })
  const hex = colorScheme ?? "#2a72d7"
  const font = variant.serif ? SERIF : SANS
  const contacts = [candidate.email, candidate.phone, candidate.linkedin, candidate.website, candidate.address].filter(Boolean)
  const centered = variant.header === "centered"

  return (
    <div style={{ fontFamily: font, minHeight: "297mm", display: "flex", flexDirection: "column", fontSize: "11pt", color: "#1a1a1a" }}>
      <Header style={variant.header} hex={hex} candidate={candidate} contacts={contacts} serif={variant.serif} />

      {/* Body — signature pinned to bottom. A left rail variant draws the accent here. */}
      <div style={{
        padding: variant.header === "band" ? `18pt ${PAD_H} 0` : `10pt ${PAD_H} 0`,
        flex: 1, display: "flex", flexDirection: "column",
        ...(variant.header === "rail" ? { borderLeft: `4px solid ${hex}` } : {}),
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ textAlign: "right", fontSize: "10pt", color: "#666", fontStyle: "italic", marginBottom: "12pt", lineHeight: 1 }}>{today}</div>

          {(content.recipientName || content.recipientTitle || content.company) && (
            <div style={{ marginBottom: "12pt", lineHeight: 1.4 }}>
              {content.recipientName && <div style={{ fontSize: "11pt", fontWeight: 700 }}>{content.recipientName}</div>}
              {content.recipientTitle && <div style={{ fontSize: "11pt", color: "#444" }}>{content.recipientTitle}</div>}
              {content.company && <div style={{ fontSize: "11pt", color: "#444" }}>{content.company}</div>}
            </div>
          )}

          {content.subject && (
            <div style={{ fontSize: "11pt", fontWeight: 700, marginBottom: "12pt", lineHeight: 1.4 }}>
              <span style={{ color: hex }}>Asunto: </span><span>{content.subject}</span>
            </div>
          )}

          <div style={{ fontSize: "11pt", marginBottom: "10pt", lineHeight: 1.4 }}>
            {content.recipientName ? t("salutation_named", { name: content.recipientName }) : t("salutation_generic")}
          </div>

          {content.body ? (
            <div
              style={{ fontSize: "11pt", color: "#1a1a1a", lineHeight: 1.45, marginBottom: "10pt" }}
              className="[&>p]:mb-[10pt] [&>p]:text-left [&>p]:indent-0 [&>ul]:mb-[10pt] [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:mb-[10pt] [&>ol]:list-decimal [&>ol]:pl-5 prose max-w-none"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content.body ?? "") }}
            />
          ) : (
            <p style={{ fontSize: "11pt", color: "#ccc", fontStyle: "italic", marginBottom: "10pt" }}>{t("body_placeholder_template")}</p>
          )}

          {content.closing && <div style={{ fontSize: "11pt", lineHeight: 1.4 }}>{content.closing},</div>}
        </div>

        <div style={{ marginTop: "auto", paddingTop: "28pt", paddingBottom: "0.75in", textAlign: centered ? "center" : "left" }}>
          <div style={{ height: "1.5px", width: 100, background: hex, marginBottom: "6pt", opacity: 0.8, marginLeft: centered ? "auto" : 0, marginRight: centered ? "auto" : 0 }} />
          {candidate.name && <div style={{ fontSize: "11pt", fontWeight: 700, color: hex, lineHeight: 1.3 }}>{candidate.name}</div>}
          {candidate.jobTitle && <div style={{ fontSize: "10pt", color: "#666", marginTop: 2 }}>{candidate.jobTitle}</div>}
          {candidate.phone && <div style={{ fontSize: "9pt", color: "#888", marginTop: 1 }}>{candidate.phone}</div>}
        </div>
      </div>
    </div>
  )
}

function Header({ style, hex, candidate, contacts, serif }: {
  style: HeaderStyle; hex: string; candidate: TemplateProps["candidate"]; contacts: string[]; serif?: boolean
}) {
  const photo = candidate.photo ? (
    <img src={candidate.photo} alt={candidate.name} style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", flexShrink: 0, objectPosition: `center ${candidate.photoPosition ?? 50}%` }} />
  ) : null

  if (style === "band") {
    return (
      <>
        <div style={{ background: hex, padding: `0.3in ${PAD_H}`, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {photo && <div style={{ border: "2px solid rgba(255,255,255,0.45)", borderRadius: "50%" }}>{photo}</div>}
            <div style={{ flex: 1 }}>
              {candidate.name && <div style={{ fontSize: "16pt", fontWeight: 700, color: "#fff", lineHeight: 1.15 }}>{candidate.name.toUpperCase()}</div>}
              {candidate.jobTitle && <div style={{ fontSize: "10pt", color: "rgba(255,255,255,0.8)", letterSpacing: "0.08em", textTransform: "uppercase", marginTop: 2 }}>{candidate.jobTitle}</div>}
              {contacts.length > 0 && <ContactRow contacts={contacts} color="rgba(255,255,255,0.75)" sep="rgba(255,255,255,0.35)" />}
            </div>
          </div>
        </div>
        <div style={{ height: 3, background: hex, opacity: 0.85, flexShrink: 0 }} />
      </>
    )
  }

  const centered = style === "centered"
  return (
    <div style={{ padding: `0.42in ${PAD_H} 0`, textAlign: centered ? "center" : "left" }}>
      {candidate.name && <div style={{ fontSize: "19pt", fontWeight: 800, lineHeight: 1.1, color: style === "minimal" ? "#111" : hex, fontFamily: serif ? SERIF : undefined }}>{candidate.name}</div>}
      {candidate.jobTitle && <div style={{ fontSize: "10.5pt", color: "#555", letterSpacing: "0.06em", textTransform: "uppercase", marginTop: 4 }}>{candidate.jobTitle}</div>}
      <div style={{ height: style === "rule" ? 3 : 1, background: style === "minimal" ? "#e5e7eb" : hex, margin: centered ? "12px auto 0" : "12px 0 0", width: centered ? 120 : "100%" }} />
      {contacts.length > 0 && (
        <div style={{ marginTop: 8, display: "flex", justifyContent: centered ? "center" : "flex-start" }}>
          <ContactRow contacts={contacts} color="#666" sep="#cbd5e1" />
        </div>
      )}
    </div>
  )
}

function ContactRow({ contacts, color, sep }: { contacts: string[]; color: string; sep: string }) {
  return (
    <div style={{ fontSize: "9pt", color, display: "flex", flexWrap: "wrap", gap: "2px 0", lineHeight: 1.6, marginTop: 8 }}>
      {contacts.map((c, i) => (
        <span key={i}>{c}{i < contacts.length - 1 && <span style={{ color: sep, margin: "0 8px" }}>|</span>}</span>
      ))}
    </div>
  )
}

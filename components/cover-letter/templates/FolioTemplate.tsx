"use client"

import { useTranslations, useLocale } from "next-intl"
import LetterBody from "./LetterBody"
import type { TemplateProps } from "./types"
import { FF, formatDate } from "./_shared"

/** Folio — Editorial. Masthead + drop-cap first paragraph.
 * CONTRASTE (reporte del CEO, 2026-08-19): los textos secundarios —el cargo, los
 * contactos, la fecha— estaban en grises tan claros que sobre la hoja blanca
 * DESAPARECÍAN. En pantalla grande casi se adivinan; impresos o en un PDF que el
 * recruiter abre al vuelo, no están. Un dato de contacto ilegible es un dato que
 * no existe. Los grises subieron al rango que sí se lee sobre blanco; el peso y
 * el tamaño no se tocaron, así que la jerarquía visual del diseño es la misma.
 */
export default function FolioTemplate({ content, candidate }: TemplateProps) {
  const t = useTranslations("cover_letter_editor")
  const locale = useLocale()
  const today = formatDate(locale)

  const contacts = [candidate.email, candidate.phone, candidate.address].filter(Boolean)

  return (
    <div style={{
      background: "#FFFDF8",
      fontFamily: FF.elegantSerif,
      fontSize: "10.5pt",
      lineHeight: 1.5,
      color: "#2a2a2a",
      minHeight: "297mm",
      padding: "48px 84px",
      WebkitPrintColorAdjust: "exact",
      printColorAdjust: "exact",
    }}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ height: 2, background: "#2a2a2a", marginBottom: 18 }} />
        {candidate.name && (
          <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 5, color: "#111" }}>
            {candidate.name}
          </div>
        )}
        {candidate.jobTitle && (
          <div style={{ fontSize: 11, fontStyle: "italic", color: "#666", marginBottom: 10, letterSpacing: "0.02em" }}>
            {candidate.jobTitle}
          </div>
        )}
        {contacts.length > 0 && (
          <div style={{ fontSize: 9, color: "#5f5f5f", letterSpacing: "0.08em", marginBottom: 6 }}>
            {contacts.join("  ·  ")}
          </div>
        )}
        <div style={{ height: 1, background: "#2a2a2a", marginTop: 16 }} />
      </div>

      <div style={{ marginTop: 24 }}>
        <div style={{ fontSize: 10, color: "#5f5f5f", marginBottom: 16, fontStyle: "italic" }}>{today}</div>
        {(content.recipientName || content.company) && (
          <div style={{ fontSize: "10.5pt", marginBottom: 24, lineHeight: 1.5, color: "#444" }}>
            {content.recipientName}{content.recipientName && content.company && <br />}{content.company}
          </div>
        )}
        <p style={{ fontSize: "10.5pt", marginBottom: 22, textAlign: "justify" }}>
          {content.recipientName
            ? t("salutation_named", { name: content.recipientName })
            : t("salutation_generic")}
        </p>
        {content.body ? (
          <LetterBody html={content.body} />
        ) : (
          <p style={{ fontSize: "10.5pt", color: "#cccccc", fontStyle: "italic" }}>{t("body_placeholder_template")}</p>
        )}

        <div style={{ marginTop: 24, fontStyle: "italic", color: "#555" }}>
          {content.closing && <p style={{ fontSize: "10.5pt" }}>{content.closing},</p>}
          {candidate.name && (
            <div style={{ fontStyle: "normal", fontWeight: 700, marginTop: 10, fontSize: 13, letterSpacing: "0.04em", color: "#111" }}>
              {candidate.name}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

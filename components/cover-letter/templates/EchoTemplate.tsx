"use client"

import { useTranslations, useLocale } from "next-intl"
import LetterBody from "./LetterBody"
import type { TemplateProps } from "./types"
import { FF, formatDate } from "./_shared"

/**
 * Echo — Minimalista. Source font: Helvetica Neue + Courier mono.
 * Falls back to system sans + system mono.

 * CONTRASTE (reporte del CEO, 2026-08-19): los textos secundarios —el cargo, los
 * contactos, la fecha— estaban en grises tan claros que sobre la hoja blanca
 * DESAPARECÍAN. En pantalla grande casi se adivinan; impresos o en un PDF que el
 * recruiter abre al vuelo, no están. Un dato de contacto ilegible es un dato que
 * no existe. Los grises subieron al rango que sí se lee sobre blanco; el peso y
 * el tamaño no se tocaron, así que la jerarquía visual del diseño es la misma.
 */
export default function EchoTemplate({ content, candidate }: TemplateProps) {
  const t = useTranslations("cover_letter_editor")
  const locale = useLocale()
  const today = formatDate(locale)

  const contacts = [candidate.email, candidate.phone, candidate.address, candidate.linkedin].filter(Boolean)

  return (
    <div style={{
      background: "#fff",
      fontFamily: FF.systemSans,
      fontSize: "10pt",
      lineHeight: 1.5,
      color: "#111",
      minHeight: "297mm",
      padding: "28px 80px 28px 80px",
      position: "relative",
      WebkitPrintColorAdjust: "exact",
      printColorAdjust: "exact",
    }}>
      {candidate.name && (
        <div style={{
          fontSize: 80,
          fontWeight: 200,
          letterSpacing: "-0.02em",
          lineHeight: 0.9,
          marginBottom: 16,
          color: "#0a0a0a",
        }}>
          {candidate.name}
        </div>
      )}
      {candidate.jobTitle && (
        <div style={{
          fontSize: 10,
          color: "#6b6b6b",
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          marginBottom: 16,
          fontWeight: 300,
        }}>
          {candidate.jobTitle}
        </div>
      )}
      <hr style={{ border: "none", borderTop: "1px solid #111", marginBottom: 16 }} />
      <div style={{
        fontSize: 9,
        color: "#6b6b6b",
        display: "flex",
        gap: 28,
        flexWrap: "wrap",
        marginBottom: 16,
        letterSpacing: "0.05em",
        fontFamily: FF.systemMono,
      }}>
        {contacts.map((c, i) => <span key={i}>{c}</span>)}
      </div>

      <div style={{ fontSize: 9, color: "#767676", letterSpacing: "0.08em", marginBottom: 10, fontFamily: FF.systemMono }}>
        {today}
      </div>
      {(content.recipientName || content.company) && (
        <div style={{ fontSize: 10, color: "#555", marginBottom: 16, lineHeight: 1.5, letterSpacing: "0.01em" }}>
          {[content.recipientName, content.company].filter(Boolean).join(" / ")}
        </div>
      )}

      <div style={{ fontSize: 10, color: "#1a1a1a", marginBottom: 16 }}>
        {content.recipientName
          ? t("salutation_named", { name: content.recipientName })
          : t("salutation_generic")}
      </div>

      {content.body ? (
        <LetterBody html={content.body} style={{ color: "#1a1a1a", maxWidth: 520 }} />
      ) : (
        <p style={{ fontSize: 10, color: "#cccccc", fontStyle: "italic" }}>{t("body_placeholder_template")}</p>
      )}

      <div style={{ marginTop: 16 }}>
        {content.closing && (
          <div style={{ fontSize: 10, color: "#5f5f5f", letterSpacing: "0.08em", marginBottom: 6 }}>
            {content.closing}
          </div>
        )}
        {candidate.name && (
          <div style={{ fontWeight: 300, fontSize: 18, letterSpacing: "0.06em", color: "#0a0a0a" }}>
            {candidate.name}
          </div>
        )}
      </div>
      <div style={{
        position: "absolute",
        bottom: 40,
        right: 96,
        fontSize: 9,
        color: "#8a8a8a",
        letterSpacing: "0.1em",
        fontFamily: FF.systemMono,
      }}>
        01
      </div>
    </div>
  )
}
